// Seberapa Cocok: tema merah hati. Hasil: hati terbelah lalu menyatu.
import { h, s, icon, avatar, emblem, fresh, nameIn } from '../lib.js';
import { api } from '../net.js';
import { roomSig, playTop, waitPill } from './frame.js';
import { resultFooter } from './footer.js';
import { sfx, countUp, burst } from '../fx.js';
import { set } from '../store.js';

const ui = { i: null, local: {}, code: '', pair: 0 };

export const cocokPlay = (room) => ({ key: 'cocok:' + room.code, sig: roomSig(room, ui.i + JSON.stringify(ui.local)), theme: 'cocok', build: () => buildPlay(room) });

function buildPlay(room) {
  const sn = room.session;
  if (ui.code !== room.code) Object.assign(ui, { code: room.code, local: {}, i: null, pair: 0 });
  const mine = { ...sn.mine, ...ui.local };
  const total = sn.total;
  if (ui.i === null) {
    const first = sn.cards.findIndex((_, q) => !(q in mine));
    ui.i = first < 0 ? total : first;
  }
  const youLocked = sn.locked.includes(room.you.id);
  const host = room.you.isHost;
  const root = h('div', { class: 'screen play cocok-play', 'data-g': 'cocok' }, playTop(room));

  if (youLocked) {
    root.append(
      h('div', { class: 'lock-stage' }, h('div', { class: 'big-heart beat' }, emblem('cocok', 120)), h('div', { class: 'strip' }, room.players.map((p) => h('div', { class: 'sp' + (sn.locked.includes(p.id) ? ' done' : '') + (p.connected ? '' : ' away') }, avatar(p, room.players, 48), h('span', { class: 'tick heart' }, icon(sn.locked.includes(p.id) ? 'heart' : 'lock', 12)))))),
      host && sn.locked.length >= 2 && sn.locked.length < room.players.filter((p) => p.connected).length ? h('button', { class: 'btn with-chip block', onclick: () => api.act({ a: 'reveal' }) }, 'Buka Hasil', h('span', { class: 'chip' }, icon('heart', 18))) : waitPill()
    );
    return root;
  }

  const pips = h('div', { class: 'heart-pips' }, Array.from({ length: total }, (_, q) => h('button', { class: 'hp' + (q in mine ? ' on' : '') + (q === ui.i ? ' cur' : ''), 'aria-label': 'Pertanyaan ' + (q + 1), onclick: () => ((ui.i = q), set({})) }, icon('heart', 14))));
  root.append(pips);

  if (ui.i >= total) {
    const answered = Object.keys(mine).length;
    root.append(h('div', { class: 'review' }, h('div', { class: 'review-heart' }, emblem('cocok', 110), h('b', {}, answered + '/' + total))), h('button', { class: 'btn with-chip block', onclick: () => (sfx.lock(), api.act({ a: 'lock' })) }, 'Kunci Profil', h('span', { class: 'chip' }, icon('lock', 18))), h('button', { class: 'skip', onclick: () => ((ui.i = 0), set({})) }, icon('back', 18), 'Ubah jawaban'));
    return root;
  }

  const c = sn.cards[ui.i];
  const pick = (opt) => {
    sfx.tap();
    ui.local[ui.i] = opt;
    api.act({ a: 'answer', q: ui.i, opt });
    const to = ui.i + 1;
    setTimeout(() => {
      if (ui.i === to - 1) {
        ui.i = to;
        set({});
      }
    }, 240);
    set({});
  };
  root.append(
    h('article', { class: 'qcard' }, h('span', { class: 'topic' }, c.topic), h('p', {}, c.text)),
    h('div', { class: 'opts' }, c.options.map((o, i) => h('button', { class: 'opt' + (mine[ui.i] === i ? ' sel' : ''), onclick: () => pick(i), style: { '--i': i } }, h('span', { class: 'ol' }, icon('heart', 14)), h('span', { class: 'ot' }, o)))),
    h('div', { class: 'row-actions' }, h('button', { class: 'ibtn', 'aria-label': 'Sebelumnya', disabled: ui.i === 0, onclick: () => ((ui.i -= 1), set({})) }, icon('back')), h('button', { class: 'skip', onclick: () => pick(-1) }, icon('skip', 18), 'Lewati'))
  );
  return root;
}

// ---------------- Hasil ----------------
const HEART = 'M100 172C28 116 8 80 8 52 8 24 30 8 54 8c20 0 38 12 46 32 8-20 26-32 46-32 24 0 46 16 46 44 0 28-20 64-92 120z';

function heart(pair, anim, uid) {
  const pct = pair.pct;
  const gap = pct === null ? 14 : Math.round((100 - pct) * 0.3);
  const lvl = pair.tier.level;
  const svg = s(
    'svg',
    { viewBox: '-20 -10 240 200', class: 'heart-svg', 'aria-hidden': 'true' },
    s(
      'defs',
      {},
      s('clipPath', { id: 'hl' + uid }, s('rect', { x: -40, y: -20, width: 140, height: 220 })),
      s('clipPath', { id: 'hr' + uid }, s('rect', { x: 100, y: -20, width: 140, height: 220 })),
      s('linearGradient', { id: 'gl' + uid, x1: 0, y1: 0, x2: 1, y2: 1 }, s('stop', { offset: 0, 'stop-color': '#ff9aa6' }), s('stop', { offset: 1, 'stop-color': '#e0364f' })),
      s('linearGradient', { id: 'gr' + uid, x1: 0, y1: 0, x2: 1, y2: 1 }, s('stop', { offset: 0, 'stop-color': '#b9f5e2' }), s('stop', { offset: 1, 'stop-color': '#3fbf9b' }))
    ),
    s('g', { class: 'half L', style: { '--gap': gap + 'px' } }, s('path', { d: HEART, fill: `url(#gl${uid})`, 'clip-path': `url(#hl${uid})` })),
    s('g', { class: 'half R', style: { '--gap': gap + 'px' } }, s('path', { d: HEART, fill: `url(#gr${uid})`, 'clip-path': `url(#hr${uid})` })),
    s('path', { class: 'crack', d: 'M100 12L93 46L107 80L94 112L106 142L100 170', pathLength: 100 })
  );
  const num = h('b', { class: 'heart-pct' }, pct === null ? '–' : '0%');
  if (pct !== null) countUp(num, pct, { delay: 1750, dur: 1300 });
  const stage = h('div', { class: 'heart' + (anim ? ' anim' : '') + ' lv' + lvl, style: { '--gap': gap + 'px' } }, h('i', { class: 'merge-ring' }), h('i', { class: 'merge-ring r2' }), svg, num);
  if (anim) {
    setTimeout(() => sfx.merge(), 1700);
    setTimeout(() => burst(stage, { count: 6 + lvl * 4, colors: ['#ff6b7d', '#7fe3c4', '#ffe3d6'], shape: 'heart', spread: 120 }), 1800);
  }
  return stage;
}

export const cocokResult = (room) => ({ key: 'cocokres:' + room.code, sig: JSON.stringify(room.summary) + ui.pair, theme: 'cocok', build: () => buildResult(room) });

function buildResult(room) {
  const sm = room.summary;
  const youId = room.you.id;
  const mineFirst = [...sm.pairs].sort((a, b) => (b.aId === youId || b.bId === youId) - (a.aId === youId || a.bId === youId));
  const root = h('div', { class: 'screen result cocok-res' }, h('header', { class: 'res-head' }, emblem('cocok', 44), h('h1', {}, 'Seberapa Cocok')));
  if (!mineFirst.length) {
    root.append(h('p', { class: 'empty' }, icon('heart', 26), 'Belum cukup jawaban'), resultFooter(room, null));
    return root;
  }
  const idx = Math.min(ui.pair, mineFirst.length - 1);
  const p = mineFirst[idx];
  const an = nameIn(sm.names, p.aId);
  const bn = nameIn(sm.names, p.bId);
  const A = { id: p.aId, nick: an };
  const B = { id: p.bId, nick: bn };
  const anim = fresh('cocokres:' + room.code + ':' + p.aId + p.bId);
  if (mineFirst.length > 1) {
    root.append(
      h(
        'div',
        { class: 'pair-tabs' },
        mineFirst.map((q, i) => h('button', { class: 'ptab' + (i === idx ? ' sel' : ''), 'aria-label': nameIn(sm.names, q.aId) + ' dan ' + nameIn(sm.names, q.bId), onclick: () => ((ui.pair = i), set({})) }, avatar({ id: q.aId, nick: nameIn(sm.names, q.aId) }, room.players, 26), avatar({ id: q.bId, nick: nameIn(sm.names, q.bId) }, room.players, 26), h('small', {}, q.pct === null ? '–' : q.pct + '%')))
      )
    );
  }
  root.append(
    h('div', { class: 'pair-head' }, avatar(A, room.players, 42), h('span', { class: 'amp' }, icon('heart', 16)), avatar(B, room.players, 42)),
    heart(p, anim, idx),
    h('h2', { class: 'tier-name' + (anim ? ' stamp' : '') }, p.tier.label)
  );
  if (p.same.length || p.diff.length) {
    root.append(
      h(
        'div',
        { class: 'detail' },
        p.same.length ? h('div', { class: 'dblock' }, h('div', { class: 'block-h ok' }, icon('check', 16), h('b', {}, p.same.length)), h('div', { class: 'tags' }, p.same.map((x) => h('span', { class: 'tag ok' }, x.topic + ': ', h('b', {}, x.label))))) : null,
        p.diff.length ? h('div', { class: 'dblock' }, h('div', { class: 'block-h' }, icon('sparkle', 16), h('b', {}, p.diff.length)), h('ul', { class: 'diffs' }, p.diff.map((x) => h('li', {}, h('span', { class: 'dt' }, x.topic), h('span', { class: 'dv' }, avatar(A, room.players, 20), x.aLabel), h('span', { class: 'dv' }, avatar(B, room.players, 20), x.bLabel))))) : null,
        p.talk.length ? h('div', { class: 'dblock' }, h('div', { class: 'block-h' }, icon('chat', 16)), p.talk.map((t) => h('p', { class: 'talk' }, t))) : null
      )
    );
  }
  root.append(resultFooter(room, { game: 'cocok', title: 'Seberapa Cocok', big: p.pct === null ? '–' : p.pct + '%', sub: p.tier.label, names: [an, bn] }));
  return root;
}
