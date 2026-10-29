// Deep Talk dan Relationship Talk: satu kartu untuk semua, jawab bergantian, tanpa skor.
import { h, icon, avatar, fresh } from '../lib.js';
import { api } from '../net.js';
import { roomSig, playTop, strip, waitPill, progress } from './frame.js';
import { sfx } from '../fx.js';

export const deepPlay = (room) => ({ key: 'deep:' + room.code, sig: roomSig(room), theme: 'deep', build: () => build(room) });
export const relPlay = (room) => ({ key: 'rel:' + room.code, sig: roomSig(room), theme: 'rel', build: () => build(room) });

function build(room) {
  const s = room.session;
  const g = room.game;
  const host = room.you.isHost;
  const youId = room.you.id;
  const act = (a) => api.act({ a, r: s.rid });
  const anim = fresh(g + ':card:' + room.code + ':' + s.rid);
  const current = room.players.find((p) => p.id === s.current);
  const mine = s.current === youId;
  const tierIdx = s.card.tier ? ['Ringan', 'Personal', 'Lebih Dalam'].indexOf(s.card.tier) : -1;

  const card = h(
    'article',
    { class: 'talkcard ' + g + (anim ? ' rise' : '') },
    g === 'deep' && tierIdx >= 0 ? h('div', { class: 'tier', 'aria-label': s.card.tier }, [0, 1, 2].map((i) => h('i', { class: i <= tierIdx ? 'on' : '' })), h('span', {}, s.card.tier)) : h('div', { class: 'tier rel-i' }, icon('chat', 20)),
    h('p', { class: 'tk-text' }, s.card.text)
  );

  const root = h('div', { class: 'screen play talk', 'data-g': g }, playTop(room), progress(s.index, s.total), card);
  const done = s.queue.slice(0, s.pos);
  const order = s.queue.map((id) => room.players.find((p) => p.id === id)).filter(Boolean);
  root.append(h('div', { class: 'speakers' }, strip({ ...room, players: order }, { activeId: s.current, doneIds: done, size: 46 })));

  if (!s.allSpoken) {
    if (mine || host) root.append(h('button', { class: 'btn with-chip block', onclick: () => (sfx.lock(), act('next_speaker')) }, mine ? 'Selesai' : 'Lanjut', h('span', { class: 'chip' }, icon('check', 18))));
    else root.append(waitPill());
    if (current && !mine) root.append(h('div', { class: 'now' }, avatar(current, room.players, 28), h('span', {}, current.nick)));
    else if (mine) root.append(h('div', { class: 'now you' }, icon('sparkle', 18), h('span', {}, 'Giliranmu')));
  } else if (host) {
    root.append(
      h(
        'div',
        { class: 'row-actions' },
        g === 'rel' ? h('button', { class: 'ibtn', 'aria-label': 'Bahas lagi', onclick: () => act('again') }, icon('refresh')) : null,
        h('button', { class: 'btn with-chip grow', onclick: () => (sfx.flip(), act('next_card')) }, 'Kartu Berikut', h('span', { class: 'chip' }, icon('arrow', 18)))
      )
    );
  } else root.append(waitPill());
  if (host && !s.allSpoken) root.append(h('button', { class: 'skip', onclick: () => act('skip_card') }, icon('skip', 18), 'Ganti kartu'));
  return root;
}
