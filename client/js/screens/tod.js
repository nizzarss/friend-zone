// Truth or Dare. Aturan Dare tidak ditampilkan di kartu; tersedia lewat ikon info.
import { h, icon, avatar, fresh } from '../lib.js';
import { api } from '../net.js';
import { roomSig, playTop, strip, waitPill } from './frame.js';
import { sfx, burst } from '../fx.js';

export function todPlay(room) {
  return { key: 'tod:' + room.code, sig: roomSig(room), theme: 'tod', build: () => build(room) };
}

function build(room) {
  const s = room.session;
  const youId = room.you.id;
  const host = room.you.isHost;
  const active = room.players.find((p) => p.id === s.activeId);
  const mine = s.activeId === youId;
  const act = (a, extra = {}) => api.act({ a, r: s.round, ...extra });
  const root = h('div', { class: 'screen play tod', 'data-g': 'tod' }, playTop(room));

  root.append(h('div', { class: 'round-no' }, h('span', {}, 'Ronde'), h('b', {}, s.round)));

  if (s.phase === 'choose') {
    const anim = fresh('tod:turn:' + room.code + ':' + s.round);
    root.append(
      h('div', { class: 'turn' + (anim ? ' anim' : '') }, h('div', { class: 'turn-ring' }, avatar(active, room.players, 84)), h('div', { class: 'turn-name' }, mine ? 'Giliranmu' : active?.nick || '')),
      h(
        'div',
        { class: 'tod-tiles' + (mine ? '' : ' dim') },
        h('button', { class: 'tod-tile truth', disabled: !mine, onclick: () => (sfx.flip(), act('choose', { kind: 'truth' })) }, icon('chat', 40), h('span', {}, 'Truth')),
        h('button', { class: 'tod-tile dare', disabled: !mine, onclick: () => (sfx.flip(), act('choose', { kind: 'dare' })) }, icon('flame', 40), h('span', {}, 'Dare'))
      ),
      mine ? null : waitPill()
    );
  } else {
    const dare = s.kind === 'dare';
    const anim = fresh('tod:card:' + room.code + ':' + s.round);
    if (anim) sfx.flip();
    const confirmed = s.confirms.includes(youId);
    const card = h(
      'article',
      { class: 'todcard ' + s.kind + (anim ? ' flip' : '') },
      h('div', { class: 'tc-top' }, h('span', { class: 'tc-kind' }, icon(dare ? 'flame' : 'chat', 20), dare ? 'Dare' : 'Truth'), avatar(active, room.players, 34)),
      h('p', { class: 'tc-text' }, s.card.text)
    );
    root.append(card);
    if (anim) setTimeout(() => burst(card, { count: 14, colors: dare ? ['#ff5a1f', '#ffc61a', '#fff'] : ['#ffc61a', '#fff4d6'], shape: 'bit', spread: 130 }), 450);

    if (dare) {
      root.append(
        h(
          'div',
          { class: 'confirm-block' },
          h('div', { class: 'need-pips big', 'aria-label': `${s.confirms.length} dari ${s.need} konfirmasi` }, Array.from({ length: s.need }, (_, i) => h('i', { class: i < s.confirms.length ? 'on' : '' }, i < s.confirms.length ? icon('check', 14) : null))),
          strip(room, { doneIds: s.confirms, activeId: s.activeId, size: 40 })
        )
      );
      if (!mine) root.append(h('button', { class: 'btn block', disabled: confirmed, onclick: () => (sfx.lock(), act('confirm')) }, icon('check', 22), confirmed ? 'Terkirim' : 'Sudah Dilakukan'));
      else root.append(waitPill());
    } else if (mine || host) {
      root.append(h('button', { class: 'btn block with-chip', onclick: () => (sfx.lock(), act('done')) }, 'Selesai', h('span', { class: 'chip' }, icon('check', 18))));
    } else root.append(waitPill());

    if (mine || host) root.append(h('button', { class: 'skip', onclick: () => act('skip') }, icon('skip', 18), 'Skip'));
    if (dare && host && !mine) root.append(h('button', { class: 'skip', onclick: () => act('done') }, icon('arrow', 18), 'Lanjut'));
  }
  if (s.phase === 'choose') root.append(strip(room, { activeId: s.activeId, size: 38 }));
  return root;
}
