// Koneksi WebSocket dengan sambung ulang otomatis dan resume memakai token.
import { state, set, toast, readSession, writeSession } from './store.js';

let ws = null;
let nextId = 1;
const pending = new Map();
let retry = 0;
let pingTimer = null;
let closedByUs = false;

export const ERRORS = {
  room_not_found: 'Room tidak ditemukan. Cek kodenya lagi.',
  room_full: 'Room sudah penuh.',
  room_closed: 'Room sudah ditutup.',
  rate_limited: 'Terlalu banyak percobaan. Tunggu sebentar.',
  min_players: 'Pemain belum cukup.',
  not_allowed: 'Aksi ini hanya untuk host atau pemain yang bertugas.',
  not_your_turn: 'Belum giliranmu.',
  resume_failed: 'Sesi lama tidak bisa dilanjutkan.',
  bad_request: 'Permintaan tidak valid.',
  server_error: 'Server bermasalah. Coba lagi.',
  not_in_room: 'Kamu tidak ada di room.',
  min_locked: 'Minimal dua profil harus terkunci.',
};

function url() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/ws`;
}

export function connect() {
  closedByUs = false;
  set({ conn: 'connecting' });
  ws = new WebSocket(url());
  ws.onopen = () => {
    retry = 0;
    set({ conn: 'open' });
    clearInterval(pingTimer);
    pingTimer = setInterval(() => raw({ t: 'ping' }), 20000);
    const sess = readSession();
    if (sess && (state.screen === 'room' || state.screen === 'resuming')) resume(sess);
  };
  ws.onmessage = (e) => {
    let m;
    try {
      m = JSON.parse(e.data);
    } catch {
      return;
    }
    onMessage(m);
  };
  ws.onclose = () => {
    clearInterval(pingTimer);
    if (closedByUs) return;
    set({ conn: 'closed' });
    for (const [, p] of pending) p.reject({ code: 'offline' });
    pending.clear();
    const wait = Math.min(8000, 600 * 2 ** retry++);
    setTimeout(connect, wait);
  };
  ws.onerror = () => {};
}

function raw(obj) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
}

function request(msg) {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== 1) return reject({ code: 'offline' });
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ ...msg, id }));
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject({ code: 'timeout' });
      }
    }, 10000);
  });
}

function onMessage(m) {
  switch (m.t) {
    case 'joined': {
      const me = { playerId: m.playerId, code: m.code, token: m.token };
      writeSession({ code: m.code, token: m.token });
      set({ me, room: m.view, screen: 'room', error: null });
      pending.get(m.id)?.resolve(m);
      pending.delete(m.id);
      break;
    }
    case 'state':
      set({ room: m.view });
      break;
    case 'error': {
      const p = pending.get(m.id);
      if (p) {
        pending.delete(m.id);
        p.reject({ code: m.code });
      } else if (m.code !== 'stale') toast(ERRORS[m.code] || 'Terjadi kesalahan.', 'warn');
      break;
    }
    case 'closed':
      leaveLocal(m.reason === 'host_closed' ? 'Host menutup room.' : m.reason === 'expired' ? 'Room sudah kedaluwarsa.' : 'Room ditutup.');
      break;
    case 'removed':
      leaveLocal(m.reason === 'kicked' ? 'Kamu dikeluarkan dari room.' : null);
      break;
    case 'replaced':
      leaveLocal('Dibuka di tab lain.', true);
      break;
    default:
  }
}

export function leaveLocal(message, keepSession = false) {
  if (!keepSession) writeSession(null);
  set({ room: null, me: null, screen: 'home', sheet: null, joinCode: '' });
  history.replaceState(null, '', '/');
  if (message) toast(message);
}

function resume(sess) {
  request({ t: 'resume', code: sess.code, token: sess.token }).catch((e) => {
    if (e.code === 'resume_failed' || e.code === 'room_not_found') leaveLocal('Sesi sebelumnya sudah berakhir.');
  });
}

export const api = {
  create: (game, nick) => request({ t: 'create', game, nick }),
  join: (code, nick) => request({ t: 'join', code, nick }),
  resume,
  send: (msg) => raw(msg),
  act: (msg) => raw({ t: 'act', ...msg }),
  leave() {
    raw({ t: 'leave' });
    leaveLocal();
  },
  closeRoom() {
    raw({ t: 'close' });
  },
};
