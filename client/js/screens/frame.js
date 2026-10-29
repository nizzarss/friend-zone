// Komponen bersama layar bermain.
import { h, icon, avatar } from '../lib.js';
import { GAMES } from '/shared/games.js';
import { set } from '../store.js';

export const roomSig = (room, extra = '') => JSON.stringify({ ...room, v: 0 }) + extra;

export function playTop(room) {
  return h(
    'header',
    { class: 'topbar play-top' },
    h('button', { class: 'ibtn', 'aria-label': 'Menu sesi', onclick: () => set({ sheet: { type: 'menu' } }) }, icon('more')),
    h('div', { class: 'title' }, GAMES[room.game].short),
    h('button', { class: 'ibtn', 'aria-label': 'Info', onclick: () => set({ sheet: { type: 'info', game: room.game } }) }, icon('info'))
  );
}

/** Penanda progres: titik untuk <= 12 ronde, bar untuk lebih banyak. */
export function progress(index, total) {
  if (total <= 12) {
    return h('div', { class: 'pips', role: 'progressbar', 'aria-valuenow': index + 1, 'aria-valuemax': total }, Array.from({ length: total }, (_, i) => h('i', { class: i < index ? 'done' : i === index ? 'cur' : '' })));
  }
  return h('div', { class: 'bar slim', role: 'progressbar' }, h('i', { style: { '--w': ((index + 1) / total) * 100 + '%' } }));
}

/** Barisan pemain: cincin untuk yang sedang bertugas, centang untuk yang sudah selesai/terkunci. */
export function strip(room, { activeId = null, doneIds = [], size = 46, names = false } = {}) {
  return h(
    'div',
    { class: 'strip' },
    room.players.map((p) =>
      h(
        'div',
        { class: 'sp' + (p.id === activeId ? ' active' : '') + (doneIds.includes(p.id) ? ' done' : '') + (p.connected ? '' : ' away') },
        avatar(p, room.players, size),
        doneIds.includes(p.id) ? h('span', { class: 'tick' }, icon('check', 12)) : null,
        names ? h('span', { class: 'sn' }, p.nick) : null
      )
    )
  );
}

export function dots() {
  return h('span', { class: 'wait-dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'));
}

export function waitPill(label) {
  return h('div', { class: 'wait-pill' }, dots(), label ? h('span', {}, label) : null);
}

export const me = (room) => room.you?.id;
export const isHost = (room) => !!room.you?.isHost;
