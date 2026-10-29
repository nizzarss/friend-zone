// Hub: menghubungkan koneksi WebSocket dengan Room.
// Protokol JSON. Server selalu mengirim view yang sudah disaring per pemain (jawaban rahasia tidak ikut).
import { WebSocketServer } from 'ws';
import { GAMES } from '../shared/games.js';
import { Room, RoomError, makeCode, normalizeCode } from './room.js';

class RateLimiter {
  constructor(windowMs, max) {
    this.windowMs = windowMs;
    this.max = max;
    this.hits = new Map();
  }
  allow(key, now = Date.now()) {
    const arr = (this.hits.get(key) || []).filter((t) => now - t < this.windowMs);
    if (arr.length >= this.max) {
      this.hits.set(key, arr);
      return false;
    }
    arr.push(now);
    this.hits.set(key, arr);
    return true;
  }
  sweep(now = Date.now()) {
    for (const [k, arr] of this.hits) {
      const kept = arr.filter((t) => now - t < this.windowMs);
      if (kept.length) this.hits.set(k, kept);
      else this.hits.delete(k);
    }
  }
}

const send = (ws, obj) => {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
};

export class Hub {
  constructor({ trustProxy = false, allowedOrigins = [], now = Date.now } = {}) {
    this.rooms = new Map(); // kode tanpa strip -> Room
    this.sockets = new Map(); // kode tanpa strip -> Map(playerId -> ws)
    this.trustProxy = trustProxy;
    this.allowedOrigins = allowedOrigins;
    this.now = now;
    // Pembatasan untuk menahan penebakan kode room dan spam join (PRD 8.3).
    this.createLimit = new RateLimiter(60_000, 10);
    this.joinLimit = new RateLimiter(60_000, 20);
    this.timers = [];
  }

  attach(server) {
    const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
    server.on('upgrade', (req, socket, head) => {
      const url = new URL(req.url, 'http://x');
      if (url.pathname !== '/ws' || !this.originOk(req)) {
        socket.destroy();
        return;
      }
      wss.handleUpgrade(req, socket, head, (ws) => this.onConnection(ws, req));
    });
    this.wss = wss;
    this.timers.push(
      setInterval(() => this.heartbeat(), 25_000),
      setInterval(() => this.sweep(), 60_000)
    );
    for (const t of this.timers) t.unref?.();
    return wss;
  }

  originOk(req) {
    const origin = req.headers.origin;
    if (!origin) return true; // klien non-browser (mis. uji otomatis)
    if (this.allowedOrigins.includes(origin)) return true;
    try {
      return new URL(origin).host === req.headers.host;
    } catch {
      return false;
    }
  }

  ipOf(req) {
    if (this.trustProxy) {
      const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
      if (xf) return xf;
    }
    return req.socket.remoteAddress || 'unknown';
  }

  onConnection(ws, req) {
    ws.ctx = { ip: this.ipOf(req), code: null, playerId: null, msgTimes: [] };
    ws.isAlive = true;
    ws.on('pong', () => (ws.isAlive = true));
    ws.on('message', (raw) => this.onMessage(ws, raw));
    ws.on('close', () => this.onClose(ws));
    ws.on('error', () => {});
  }

  heartbeat() {
    if (!this.wss) return;
    for (const ws of this.wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }

  sweep() {
    this.createLimit.sweep();
    this.joinLimit.sweep();
    for (const [key, room] of this.rooms) {
      if (room.isExpired()) this.closeRoom(key, 'expired');
    }
  }

  closeRoom(key, reason) {
    const room = this.rooms.get(key);
    if (!room) return;
    const socks = this.sockets.get(key);
    room.close();
    if (socks) {
      for (const [, ws] of socks) {
        send(ws, { t: 'closed', reason });
        ws.ctx.code = null;
        ws.ctx.playerId = null;
      }
    }
    this.sockets.delete(key);
    this.rooms.delete(key);
  }

  bind(ws, key, playerId) {
    if (!this.sockets.has(key)) this.sockets.set(key, new Map());
    const map = this.sockets.get(key);
    const old = map.get(playerId);
    if (old && old !== ws) {
      old.ctx.code = null;
      old.ctx.playerId = null;
      send(old, { t: 'replaced' });
      old.close(4000, 'replaced');
    }
    map.set(playerId, ws);
    ws.ctx.code = key;
    ws.ctx.playerId = playerId;
  }

  broadcast(key) {
    const room = this.rooms.get(key);
    const map = this.sockets.get(key);
    if (!room || !map) return;
    this.flushOutbox(key, room);
    for (const [pid, ws] of map) send(ws, { t: 'state', view: room.view(pid) });
  }

  flushOutbox(key, room) {
    const map = this.sockets.get(key);
    while (room.outbox.length) {
      const { to, msg } = room.outbox.shift();
      const ws = map?.get(to);
      if (ws) {
        send(ws, msg);
        map.delete(to);
        ws.ctx.code = null;
        ws.ctx.playerId = null;
      }
    }
  }

  fail(ws, id, code) {
    send(ws, { t: 'error', id, code });
  }

  onMessage(ws, raw) {
    const now = this.now();
    const times = ws.ctx.msgTimes;
    times.push(now);
    while (times.length && now - times[0] > 10_000) times.shift();
    if (times.length > 60) {
      ws.close(1008, 'rate');
      return;
    }
    let m;
    try {
      m = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
    const id = m.id;
    try {
      switch (m.t) {
        case 'ping':
          return send(ws, { t: 'pong' });
        case 'create':
          return this.create(ws, m);
        case 'join':
          return this.join(ws, m);
        case 'resume':
          return this.resume(ws, m);
        case 'leave':
          return this.leave(ws);
        case 'close':
          return this.hostClose(ws);
        default:
          return this.dispatch(ws, m);
      }
    } catch (e) {
      if (e instanceof RoomError) return this.fail(ws, id, e.code);
      console.error('Kesalahan penanganan pesan:', e);
      this.fail(ws, id, 'server_error');
    }
  }

  create(ws, m) {
    if (!this.createLimit.allow(ws.ctx.ip, this.now())) return this.fail(ws, m.id, 'rate_limited');
    if (!GAMES[m.game]) return this.fail(ws, m.id, 'bad_request');
    let code;
    do code = makeCode();
    while (this.rooms.has(normalizeCode(code)));
    const room = new Room({ code, game: m.game, now: this.now });
    const { player, token } = room.addPlayer(m.nick);
    const key = normalizeCode(code);
    this.rooms.set(key, room);
    this.bind(ws, key, player.id);
    send(ws, { t: 'joined', id: m.id, code, token, playerId: player.id, view: room.view(player.id) });
  }

  join(ws, m) {
    if (!this.joinLimit.allow(ws.ctx.ip, this.now())) return this.fail(ws, m.id, 'rate_limited');
    const key = normalizeCode(m.code);
    const room = this.rooms.get(key);
    if (!room || room.phase === 'closed') return this.fail(ws, m.id, 'room_not_found');
    const { player, token } = room.addPlayer(m.nick);
    this.bind(ws, key, player.id);
    send(ws, { t: 'joined', id: m.id, code: room.code, token, playerId: player.id, view: room.view(player.id) });
    this.broadcast(key);
  }

  resume(ws, m) {
    if (!this.joinLimit.allow(ws.ctx.ip, this.now())) return this.fail(ws, m.id, 'rate_limited');
    const key = normalizeCode(m.code);
    const room = this.rooms.get(key);
    const player = room?.findByToken(m.token);
    if (!room || !player) return this.fail(ws, m.id, 'resume_failed');
    this.bind(ws, key, player.id);
    room.setConnected(player.id, true);
    send(ws, { t: 'joined', id: m.id, code: room.code, token: m.token, playerId: player.id, view: room.view(player.id) });
    this.broadcast(key);
  }

  dispatch(ws, m) {
    const { code: key, playerId } = ws.ctx;
    const room = key && this.rooms.get(key);
    if (!room || !playerId) return this.fail(ws, m.id, 'not_in_room');
    const err = room.dispatch(playerId, m);
    if (err) {
      // 'stale' berarti pesan terlambat (ronde sudah berpindah): abaikan tanpa mengganggu pemain.
      if (err !== 'stale') this.fail(ws, m.id, err);
      return this.broadcast(key);
    }
    if (room.phase === 'closed') return this.closeRoom(key, 'closed');
    this.broadcast(key);
  }

  leave(ws) {
    const { code: key, playerId } = ws.ctx;
    const room = key && this.rooms.get(key);
    if (!room || !playerId) return;
    this.sockets.get(key)?.delete(playerId);
    ws.ctx.code = null;
    ws.ctx.playerId = null;
    room.removePlayer(playerId, 'left');
    room.outbox.length = 0;
    if (room.phase === 'closed') return this.closeRoom(key, 'empty');
    this.broadcast(key);
  }

  hostClose(ws) {
    const { code: key, playerId } = ws.ctx;
    const room = key && this.rooms.get(key);
    if (!room || room.hostId !== playerId) return;
    this.closeRoom(key, 'host_closed');
  }

  onClose(ws) {
    const { code: key, playerId } = ws.ctx;
    if (!key || !playerId) return;
    const map = this.sockets.get(key);
    if (map?.get(playerId) !== ws) return; // soket lama yang sudah digantikan
    map.delete(playerId);
    const room = this.rooms.get(key);
    if (!room) return;
    room.setConnected(playerId, false); // pemain tetap di room agar bisa menyambung kembali
    this.broadcast(key);
  }

  shutdown() {
    for (const t of this.timers) clearInterval(t);
    for (const c of this.wss?.clients || []) c.terminate();
    this.wss?.close();
  }
}
