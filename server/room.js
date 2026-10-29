// Room: pemain, host, state, dan pengiriman aksi ke mesin game.
// Semua keputusan (kunci jawaban, skor, reveal) diambil di server (PRD 7.5).
import crypto from 'node:crypto';
import { GAMES, MAX_PLAYERS, NICK_MAX } from '../shared/games.js';
import { ENGINES } from './engine/index.js';

const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // tanpa I, L, O supaya tidak membingungkan
export const ROOM_TTL_MS = 3 * 60 * 60 * 1000; // room kedaluwarsa 3 jam setelah aktivitas terakhir
export const ORPHAN_TTL_MS = 10 * 60 * 1000; // semua pemain putus lebih dari 10 menit

export function makeCode() {
  let s = '';
  for (let i = 0; i < 4; i++) s += LETTERS[crypto.randomInt(LETTERS.length)];
  return s + '-' + String(crypto.randomInt(100)).padStart(2, '0');
}

export const normalizeCode = (raw) => String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export function cleanNick(raw) {
  const s = String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NICK_MAX)
    .trim();
  return s || 'Pemain';
}

const sha = (t) => crypto.createHash('sha256').update(t).digest();

export class Room {
  constructor({ code, game, rng = Math.random, now = Date.now }) {
    this.code = code;
    this.game = game;
    this.phase = 'lobby'; // lobby | playing | completed | closed
    this.players = [];
    this.hostId = null;
    this.settings = { rounds: null, mode: 'kumpul' };
    this.session = null;
    this.nicks = new Map(); // id -> nick, tetap tersimpan setelah pemain keluar (untuk ringkasan)
    this.version = 0;
    this.rng = rng;
    this.now = now;
    this.createdAt = now();
    this.lastActive = now();
    this.outbox = []; // pesan khusus untuk hub (mis. pemain dikeluarkan)
  }

  get engine() {
    return ENGINES[this.game];
  }

  touch() {
    this.lastActive = this.now();
  }

  bump() {
    this.version += 1;
    this.touch();
  }

  uniqueNick(nick) {
    let n = cleanNick(nick);
    const taken = new Set(this.players.map((p) => p.nick.toLowerCase()));
    if (!taken.has(n.toLowerCase())) return n;
    for (let i = 2; i < 100; i++) {
      const suffix = ' ' + i;
      const cand = n.slice(0, NICK_MAX - suffix.length) + suffix;
      if (!taken.has(cand.toLowerCase())) return cand;
    }
    return n;
  }

  addPlayer(nick) {
    if (this.phase === 'closed') throw new RoomError('room_closed');
    if (this.players.length >= MAX_PLAYERS) throw new RoomError('room_full');
    const token = crypto.randomBytes(24).toString('hex');
    const player = {
      id: crypto.randomBytes(4).toString('hex'),
      nick: this.uniqueNick(nick),
      connected: true,
      joinedAt: this.now(),
      lastSeen: this.now(),
      tokenHash: sha(token),
    };
    this.players.push(player);
    this.nicks.set(player.id, player.nick);
    if (!this.hostId) this.hostId = player.id;
    this.afterPlayersChanged();
    this.bump();
    return { player, token };
  }

  findByToken(token) {
    if (typeof token !== 'string' || token.length < 16) return null;
    const h = sha(token);
    return this.players.find((p) => crypto.timingSafeEqual(p.tokenHash, h)) || null;
  }

  setConnected(id, connected) {
    const p = this.players.find((x) => x.id === id);
    if (!p || p.connected === connected) return;
    p.connected = connected;
    p.lastSeen = this.now();
    this.afterPlayersChanged();
    this.bump();
  }

  removePlayer(id, reason = 'left') {
    const idx = this.players.findIndex((p) => p.id === id);
    if (idx < 0) return;
    this.players.splice(idx, 1);
    this.outbox.push({ to: id, msg: { t: 'removed', reason } });
    if (this.hostId === id) {
      // Host keluar: host berpindah ke pemain terhubung berikutnya agar sesi tidak menggantung.
      const next = this.players.find((p) => p.connected) || this.players[0];
      this.hostId = next ? next.id : null;
    }
    if (!this.players.length) {
      this.close();
      return;
    }
    this.afterPlayersChanged();
    this.bump();
  }

  afterPlayersChanged() {
    if (this.session && this.phase === 'playing') this.engine.onPlayersChanged?.(this);
  }

  complete() {
    this.phase = 'completed';
  }

  close() {
    this.phase = 'closed';
    this.session = null; // jawaban dan suara mentah dibuang
    this.bump();
  }

  isExpired() {
    const t = this.now();
    if (t - this.lastActive > ROOM_TTL_MS) return true;
    return this.players.length > 0 && this.players.every((p) => !p.connected && t - p.lastSeen > ORPHAN_TTL_MS);
  }

  isHostPlayer(p) {
    return this.hostId === p.id;
  }

  /** Aksi dari pemain. Mengembalikan kode error (string) atau undefined bila berhasil. */
  dispatch(playerId, msg) {
    const p = this.players.find((x) => x.id === playerId);
    if (!p) return 'not_in_room';
    if (this.phase === 'closed') return 'room_closed';
    const host = this.isHostPlayer(p);
    this.touch();
    let err;
    switch (msg.t) {
      case 'start': {
        if (!host) return 'not_allowed';
        if (this.phase !== 'lobby') return; // idempotent
        const min = GAMES[this.game].min;
        if (this.players.filter((x) => x.connected).length < min) return 'min_players';
        this.engine.start(this);
        this.phase = 'playing';
        break;
      }
      case 'set_game': {
        if (!host || this.phase !== 'lobby') return 'not_allowed';
        if (!GAMES[msg.game]) return 'bad_request';
        this.game = msg.game;
        this.settings.rounds = null;
        break;
      }
      case 'set_rounds': {
        const cfg = GAMES[this.game].rounds;
        if (!host || this.phase !== 'lobby') return 'not_allowed';
        if (!cfg || !cfg.options.includes(Number(msg.rounds))) return 'bad_request';
        this.settings.rounds = Number(msg.rounds);
        break;
      }
      case 'set_mode': {
        if (!host || this.phase !== 'lobby') return 'not_allowed';
        if (msg.mode !== 'kumpul' && msg.mode !== 'jauh') return 'bad_request';
        this.settings.mode = msg.mode;
        break;
      }
      case 'kick': {
        if (!host) return 'not_allowed';
        const target = this.players.find((x) => x.id === msg.id);
        if (!target || target.id === p.id) return 'bad_request';
        this.removePlayer(target.id, 'kicked');
        return;
      }
      case 'end': {
        if (!host) return 'not_allowed';
        if (this.phase === 'playing') this.complete();
        break;
      }
      case 'to_lobby': {
        if (!host) return 'not_allowed';
        if (this.phase !== 'completed') return;
        this.session = null;
        this.phase = 'lobby';
        break;
      }
      case 'act': {
        if (this.phase !== 'playing') return 'not_allowed';
        err = this.engine.act(this, p, msg);
        if (err) return err;
        break;
      }
      default:
        return 'bad_request';
    }
    this.bump();
  }

  view(playerId) {
    const me = this.players.find((p) => p.id === playerId);
    const cfg = GAMES[this.game].rounds;
    const out = {
      v: this.version,
      code: this.code,
      game: this.game,
      phase: this.phase,
      minPlayers: GAMES[this.game].min,
      maxPlayers: MAX_PLAYERS,
      hostId: this.hostId,
      hostConnected: !!this.players.find((p) => p.id === this.hostId)?.connected,
      settings: {
        mode: this.settings.mode,
        rounds: cfg ? this.settings.rounds || cfg.def : null,
        roundOptions: cfg ? cfg.options : null,
      },
      players: this.players.map((p) => ({ id: p.id, nick: p.nick, connected: p.connected, isHost: p.id === this.hostId })),
      you: me ? { id: me.id, nick: me.nick, isHost: me.id === this.hostId } : null,
      session: null,
      summary: null,
    };
    if (me && this.session && (this.phase === 'playing' || this.phase === 'completed')) {
      if (this.phase === 'playing') out.session = this.engine.view(this, me);
      if (this.phase === 'completed') out.summary = this.engine.summary(this, me);
    }
    return out;
  }
}

export class RoomError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
