// Titik masuk: routing antar layar, tema, sheet, toast.
import { h, icon } from './lib.js';
import { state, set, subscribe, readSession } from './store.js';
import { connect, api } from './net.js';
import { buildSheet } from './sheets.js';
import { motionMode } from './fx.js';
import { home, join, resuming, normCode } from './screens/home.js';
import { lobby } from './screens/lobby.js';
import { todPlay } from './screens/tod.js';
import { deepPlay, relPlay } from './screens/talk.js';
import { kepPlay, kepResult } from './screens/kepekaan.js';
import { cocokPlay, cocokResult } from './screens/cocok.js';
import { kenalPlay, kenalResult } from './screens/kenal.js';
import { siapaPlay, siapaResult } from './screens/siapa.js';
import { sessionResult } from './screens/session.js';

const PLAY = { tod: todPlay, deep: deepPlay, rel: relPlay, kepekaan: kepPlay, cocok: cocokPlay, kenal: kenalPlay, siapa: siapaPlay };
const RESULT = { tod: sessionResult, deep: sessionResult, rel: sessionResult, kepekaan: kepResult, cocok: cocokResult, kenal: kenalResult, siapa: siapaResult };

const app = document.getElementById('app');
const layer = document.getElementById('layer');
let lastKey = null;
let lastSig = null;
let lastSheet = null;
let lastToast = null;
let lastConn = null;

function pick() {
  if (state.screen === 'resuming') return resuming();
  if (state.screen === 'join') return join();
  if (state.screen === 'room' && state.room) {
    const r = state.room;
    if (r.phase === 'lobby') return lobby(r);
    if (r.phase === 'playing' && r.session) return PLAY[r.game](r);
    if (r.phase === 'completed' && r.summary) return RESULT[r.game](r);
    return resuming();
  }
  return home();
}

function render() {
  document.documentElement.dataset.motion = state.motion === 'auto' ? (motionMode() === 'off' ? 'off' : 'full') : state.motion;
  const scr = pick();
  if (scr.key !== lastKey || scr.sig !== lastSig) {
    const sameKey = scr.key === lastKey;
    const scrollY = window.scrollY;
    const el = scr.build();
    if (sameKey) el.classList.add('still');
    app.replaceChildren(el);
    window.scrollTo(0, sameKey ? scrollY : 0);
    document.documentElement.dataset.theme = scr.theme;
    lastKey = scr.key;
    lastSig = scr.sig;
  }
  if (state.sheet !== lastSheet) {
    lastSheet = state.sheet;
    layer.replaceChildren(...[state.sheet && buildSheet(state.sheet)].filter(Boolean));
    document.body.style.overflow = state.sheet ? 'hidden' : '';
  }
  if (state.toast !== lastToast || state.conn !== lastConn) {
    lastToast = state.toast;
    lastConn = state.conn;
    const items = [];
    if (state.conn === 'closed') items.push(h('div', { class: 'offline', role: 'status' }, icon('wifi', 18), 'Menyambung ulang...'));
    if (state.toast) items.push(h('div', { class: 'toast ' + state.toast.kind, role: 'status' }, state.toast.text));
    document.getElementById('toasts')?.remove();
    const box = h('div', { id: 'toasts' }, ...items);
    document.body.append(box);
  }
}

subscribe(render);

// Tautan undangan /?room=KODE
const params = new URLSearchParams(location.search);
const invite = normCode(params.get('room'));
const sess = readSession();
if (invite.replace('-', '').length === 6 && !(sess && normCode(sess.code) === invite)) {
  state.joinCode = invite;
  state.screen = 'join';
} else if (sess) {
  state.screen = 'resuming';
}
connect();
render();
window.addEventListener('keydown', (e) => e.key === 'Escape' && state.sheet && set({ sheet: null }));
window.__fz = { state, api };
