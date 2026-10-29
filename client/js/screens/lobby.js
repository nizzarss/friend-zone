import { h, icon, emblem, avatar } from '../lib.js';
import { GAMES } from '/shared/games.js';
import { state, set } from '../store.js';
import { api } from '../net.js';
import { copyLink, roomLink } from '../sheets.js';
import { roomSig, waitPill } from './frame.js';
import { sfx } from '../fx.js';

export function lobby(room) {
  return { key: 'lobby:' + room.code, sig: roomSig(room), theme: room.game, build: () => build(room) };
}

function build(room) {
  const g = GAMES[room.game];
  const host = room.you.isHost;
  const connected = room.players.filter((p) => p.connected).length;
  const ready = connected >= room.minPlayers;
  const chars = [...room.code.replace('-', '')];
  const tiles = chars.map((c, i) => h('span', { class: 'ctile', style: { '--i': i } }, c));
  tiles.splice(4, 0, h('span', { class: 'cdash' }, '–'));

  const share = async () => {
    const url = roomLink(room.code);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Friend Zone', text: g.name, url });
        return;
      } catch (e) {
        if (e?.name === 'AbortError') return;
      }
    }
    copyLink(room.code);
  };

  const modeBtn = (mode, ic, label) =>
    h(
      'button',
      {
        class: 'pill' + (room.settings.mode === mode ? ' sel' : ''),
        disabled: !host,
        'aria-pressed': room.settings.mode === mode,
        onclick: () => api.send({ t: 'set_mode', mode }),
      },
      icon(ic, 16),
      label
    );

  const players = h(
    'ul',
    { class: 'plist' },
    room.players.map((p, i) =>
      h(
        'li',
        { style: { '--i': i } },
        avatar(p, room.players, 42),
        h('span', { class: 'pn' }, p.nick, p.id === room.you.id ? h('small', {}, ' kamu') : null),
        p.isHost ? h('span', { class: 'host-b', title: 'Host' }, icon('crown', 16)) : null,
        h('i', { class: 'dot' + (p.connected ? '' : ' off') }),
        host && p.id !== room.you.id ? h('button', { class: 'ibtn sm', 'aria-label': 'Keluarkan ' + p.nick, onclick: () => api.send({ t: 'kick', id: p.id }) }, icon('x', 16)) : null
      )
    )
  );

  const need = Array.from({ length: Math.max(room.minPlayers, 1) }, (_, i) => h('i', { class: i < connected ? 'on' : '' }));

  return h(
    'div',
    { class: 'screen lobby', 'data-g': room.game },
    h(
      'header',
      { class: 'topbar' },
      h('button', { class: 'ibtn', 'aria-label': 'Keluar', onclick: () => api.leave() }, icon('back')),
      h('div', { class: 'title' }, g.short),
      h('button', { class: 'ibtn', 'aria-label': 'Info', onclick: () => set({ sheet: { type: 'info', game: room.game } }) }, icon('info'))
    ),
    h(
      'section',
      { class: 'codecard panel' },
      h('div', { class: 'cc-em' }, emblem(room.game, 70)),
      h('div', { class: 'code-tiles' }, tiles),
      h('div', { class: 'cc-actions' }, h('button', { class: 'ibtn', 'aria-label': 'Salin tautan', onclick: () => (sfx.tap(), copyLink(room.code)) }, icon('copy')), h('button', { class: 'ibtn', 'aria-label': 'Bagikan', onclick: share }, icon('share')), h('button', { class: 'ibtn', 'aria-label': 'Kode QR', onclick: () => set({ sheet: { type: 'qr', code: room.code } }) }, icon('qr')))
    ),
    h('div', { class: 'row-between' }, h('div', { class: 'modes' }, modeBtn('kumpul', 'people', 'Kumpul'), modeBtn('jauh', 'wifi', 'Jauh')), h('div', { class: 'need', title: `${connected}/${room.minPlayers}+`, 'aria-label': `${connected} dari minimal ${room.minPlayers} pemain` }, icon('people', 16), h('span', { class: 'need-pips' }, need), h('b', {}, connected + '/' + room.maxPlayers))),
    room.settings.roundOptions
      ? h(
          'div',
          { class: 'rounds' },
          icon('cards', 18),
          room.settings.roundOptions.map((n) => h('button', { class: 'pill' + (room.settings.rounds === n ? ' sel' : ''), disabled: !host, onclick: () => api.send({ t: 'set_rounds', rounds: n }) }, n))
        )
      : null,
    players,
    h('div', { class: 'grow' }),
    host
      ? h('button', { class: 'btn with-chip block start', disabled: !ready, onclick: () => (sfx.lock(), api.send({ t: 'start' })) }, ready ? 'Mulai' : 'Tunggu pemain', h('span', { class: 'chip' }, icon(ready ? 'play' : 'lock', 18)))
      : waitPill('Menunggu host')
  );
}
