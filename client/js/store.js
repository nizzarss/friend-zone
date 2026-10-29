// State aplikasi sederhana dengan pub/sub. Satu-satunya sumber kebenaran di klien.
const KEY = 'fz.v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
function save(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj));
  } catch {
    /* penyimpanan bisa diblokir; aplikasi tetap jalan */
  }
}

const persisted = load();

export const state = {
  conn: 'connecting', // connecting | open | closed
  screen: 'home', // home | join | room
  room: null, // view dari server
  me: null, // { playerId, code, token }
  joinCode: '',
  nick: persisted.nick || '',
  sound: persisted.sound !== false,
  motion: persisted.motion || 'auto', // auto | full | off
  sheet: null, // { type, ... }
  toast: null,
  busy: false,
  error: null,
};

const subs = new Set();
export const subscribe = (fn) => (subs.add(fn), () => subs.delete(fn));
export function set(patch) {
  Object.assign(state, patch);
  if ('nick' in patch || 'sound' in patch || 'motion' in patch) save({ nick: state.nick, sound: state.sound, motion: state.motion });
  for (const fn of subs) fn(state);
}

export function readSession() {
  try {
    return JSON.parse(localStorage.getItem('fz.session'));
  } catch {
    return null;
  }
}
export function writeSession(s) {
  try {
    if (s) localStorage.setItem('fz.session', JSON.stringify(s));
    else localStorage.removeItem('fz.session');
  } catch {
    /* abaikan */
  }
}

let toastTimer;
export function toast(text, kind = 'info') {
  set({ toast: { text, kind, id: Date.now() } });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => set({ toast: null }), 3200);
}
