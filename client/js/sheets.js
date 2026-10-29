// Bottom sheet: detail game, pengaturan, QR, info aturan, menu sesi.
import { h, s, icon, emblem, avatar } from './lib.js';
import { GAMES, DARE_RULES } from '/shared/games.js';
import { state, set, toast } from './store.js';
import { api } from './net.js';
import { createRoom } from './screens/home.js';

export const close = () => set({ sheet: null });

function frame(theme, ...kids) {
  const sheet = h('div', { class: 'sheet', 'data-theme': theme, role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'grab' }), h('button', { class: 'ibtn sm sheet-x', 'aria-label': 'Tutup', onclick: close }, icon('x', 18)), ...kids);
  const scrim = h('div', { class: 'scrim', onclick: (e) => e.target === scrim && close() }, sheet);
  return scrim;
}

export const roomLink = (code) => `${location.origin}/?room=${code}`;

export async function copyLink(code) {
  const url = roomLink(code);
  try {
    await navigator.clipboard.writeText(url);
    toast('Tautan disalin');
  } catch {
    toast(url);
  }
}

function detail(game) {
  const g = GAMES[game];
  const nick = h('input', { maxlength: 14, placeholder: 'Nama panggilan', autocomplete: 'nickname', 'aria-label': 'Nama panggilan', value: state.nick });
  const btn = h('button', { class: 'btn with-chip block', disabled: !state.nick.trim(), onclick: () => createRoom(game, nick.value.trim()) }, 'Buat Room', h('span', { class: 'chip' }, icon('plus', 18)));
  nick.addEventListener('input', () => {
    state.nick = nick.value;
    btn.disabled = !nick.value.trim();
  });
  nick.addEventListener('keydown', (e) => e.key === 'Enter' && !btn.disabled && btn.click());
  return frame(
    game,
    h('div', { class: 'detail-hero' }, h('div', { class: 'detail-em' }, emblem(game, 96)), h('h2', {}, g.name), h('p', { class: 'goal' }, g.goal)),
    h('div', { class: 'detail-meta' }, h('span', { class: 'pill' }, icon('people', 16), g.min + '+ pemain'), g.rounds ? h('span', { class: 'pill' }, icon('cards', 16), g.rounds.options.join(' / ')) : null),
    h('label', { class: 'field' }, icon('user', 20), nick),
    btn
  );
}

function settings() {
  const seg = (val, label) => h('button', { class: 'pill' + (state.motion === val ? ' sel' : ''), onclick: () => set({ motion: val, sheet: { type: 'settings' } }) }, label);
  return frame(
    'shell',
    h('h2', { class: 'sheet-title' }, 'Pengaturan'),
    h('div', { class: 'setrow' }, h('span', { class: 'setic' }, icon(state.sound ? 'sound' : 'mute', 22)), h('button', { class: 'switch' + (state.sound ? ' on' : ''), role: 'switch', 'aria-checked': state.sound, 'aria-label': 'Suara', onclick: () => set({ sound: !state.sound, sheet: { type: 'settings' } }) }, h('i'))),
    h('div', { class: 'setrow' }, h('span', { class: 'setic' }, icon('sparkle', 22)), h('div', { class: 'segs' }, seg('auto', 'Auto'), seg('full', 'Penuh'), seg('off', 'Hemat')))
  );
}

function qr(code) {
  const url = roomLink(code);
  let svg;
  try {
    const q = window.QRCode.create(url);
    const n = q.moduleCount;
    const cells = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) cells.push(`M${c} ${r}h1v1h-1z`);
    svg = h('div', { class: 'qr', html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${cells.join('')}" fill="#14080b"/></svg>` });
  } catch {
    svg = h('p', {}, url);
  }
  return frame('shell', h('div', { class: 'qr-wrap' }, svg, h('div', { class: 'code-big' }, code)), h('button', { class: 'btn block ghost', onclick: () => copyLink(code) }, icon('copy', 20), 'Salin tautan'));
}

function info(game) {
  const g = GAMES[game];
  return frame(
    game,
    h('div', { class: 'detail-hero' }, h('div', { class: 'detail-em' }, emblem(game, 72)), h('h2', {}, g.name), h('p', { class: 'goal' }, g.goal)),
    game === 'tod'
      ? h('ul', { class: 'rules' }, DARE_RULES.map((r, i) => h('li', { style: { '--i': i } }, h('span', { class: 'rule-ic' }, icon(i === 3 ? 'skip' : 'flag', 18)), h('span', {}, r))))
      : null
  );
}

function menu() {
  const room = state.room;
  const host = room?.you?.isHost;
  return frame(
    room?.game || 'shell',
    h('h2', { class: 'sheet-title' }, 'Sesi'),
    h('ul', { class: 'plist' }, room.players.map((p) => h('li', {}, avatar(p, room.players, 38), h('span', { class: 'pn' }, p.nick, p.id === room.you.id ? ' ·' : ''), p.isHost ? icon('crown', 18, 'host') : null, h('i', { class: 'dot' + (p.connected ? '' : ' off') })))),
    h(
      'div',
      { class: 'stack' },
      host && room.phase === 'playing' ? h('button', { class: 'btn block', onclick: () => (api.send({ t: 'end' }), close()) }, icon('flag', 20), 'Akhiri sesi') : null,
      h('button', { class: 'btn block ghost', onclick: () => (close(), api.leave()) }, icon('exit', 20), 'Keluar'),
      host ? h('button', { class: 'btn block ghost danger', onclick: () => (close(), api.closeRoom()) }, icon('trash', 20), 'Tutup room') : null
    )
  );
}

export function buildSheet(sh) {
  switch (sh.type) {
    case 'detail':
      return detail(sh.game);
    case 'settings':
      return settings();
    case 'qr':
      return qr(sh.code);
    case 'info':
      return info(sh.game);
    case 'menu':
      return state.room ? menu() : null;
    default:
      return null;
  }
}
