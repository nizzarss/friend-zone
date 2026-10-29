// Tes Kepekaan: tema radar hijau-hitam. Hasil memakai radar, sinyal, dan blip.
import { h, s, icon, avatar, emblem, fresh, nameIn } from '../lib.js';
import { api } from '../net.js';
import { roomSig, playTop, progress, waitPill } from './frame.js';
import { resultFooter } from './footer.js';
import { sfx, countUp, burst } from '../fx.js';
import { state, set } from '../store.js';

const ui = { k: '', sel: null };

export const kepPlay = (room) => ({ key: 'kep:' + room.code, sig: roomSig(room, ui.k + ui.sel), theme: 'kepekaan', build: () => build(room) });

function scanner(player, players, label) {
  return h('div', { class: 'scanner' }, h('div', { class: 'scan-rings' }, h('i'), h('i'), h('i'), h('b', { class: 'scan-sweep' })), h('div', { class: 'scan-av' }, avatar(player, players, 56)), label ? h('span', { class: 'scan-l' }, label) : null);
}

function options(card, { chosen, locked, onPick }) {
  return h(
    'div',
    { class: 'opts' },
    card.options.map((o, i) =>
      h(
        'button',
        { class: 'opt' + (chosen === i ? ' sel' : ''), disabled: locked, onclick: () => (sfx.tap(), onPick(i)), style: { '--i': i } },
        h('span', { class: 'ol' }, String.fromCharCode(65 + i)),
        h('span', { class: 'ot' }, o)
      )
    )
  );
}

function build(room) {
  const sn = room.session;
  const r = sn.round;
  const youId = room.you.id;
  const host = room.you.isHost;
  const ans = room.players.find((p) => p.id === r.answererId);
  const gs = room.players.find((p) => p.id === r.guesserId);
  const isAns = youId === r.answererId;
  const isGs = youId === r.guesserId;
  const part = isAns || isGs;
  const key = sn.rid + ':' + sn.phase;
  if (ui.k !== key) ui.k = key, (ui.sel = null);
  const act = (a, extra = {}) => api.act({ a, r: sn.rid, ...extra });

  const root = h('div', { class: 'screen play kep', 'data-g': 'kepekaan' }, playTop(room), progress(sn.index, sn.total));
  root.append(
    h(
      'div',
      { class: 'duo' },
      h('div', { class: 'duo-p' }, avatar(ans, room.players, 48), h('span', { class: 'role' }, icon(sn.phase === 'answer' ? 'lock' : 'lock', 14))),
      h('div', { class: 'duo-line' + (sn.phase === 'guess' ? ' live' : '') }, h('i')),
      h('div', { class: 'duo-p' }, avatar(gs, room.players, 48), h('span', { class: 'role' }, icon('radar', 14)))
    ),
    h('article', { class: 'qcard' }, h('span', { class: 'topic' }, r.card.topic), h('p', {}, r.card.text))
  );

  if (sn.phase === 'answer') {
    if (isAns) {
      root.append(options(r.card, { chosen: ui.sel, onPick: (i) => ((ui.sel = i), set({})) }), h('button', { class: 'btn with-chip block', disabled: ui.sel === null, onclick: () => (sfx.lock(), act('lock_answer', { opt: ui.sel })) }, 'Kunci', h('span', { class: 'chip' }, icon('lock', 18))), h('p', { class: 'hint' }, icon('eyeoff', 16)));
    } else root.append(scanner(ans, room.players), waitPill());
  } else if (sn.phase === 'guess') {
    if (isGs) {
      root.append(options(r.card, { chosen: ui.sel, onPick: (i) => ((ui.sel = i), set({})) }), h('button', { class: 'btn with-chip block', disabled: ui.sel === null, onclick: () => (sfx.lock(), act('lock_guess', { opt: ui.sel })) }, 'Tebak', h('span', { class: 'chip' }, icon('radar', 18))));
    } else {
      root.append(scanner(gs, room.players), isAns ? h('p', { class: 'mine-ans' }, icon('lock', 16), r.card.options[r.myAnswer]) : null, waitPill());
    }
  } else {
    const rv = r.reveal;
    const ok = rv.correct;
    const anim = fresh('kep:rv:' + room.code + ':' + sn.rid);
    const box = h(
      'div',
      { class: 'rv ' + (rv.skipped ? 'skip' : ok ? 'ok' : 'miss') + (anim ? ' anim' : '') },
      h('div', { class: 'rv-scope' }, h('i', { class: 'ping p1' }), h('i', { class: 'ping p2' }), h('i', { class: 'ping p3' }), h('span', { class: 'rv-ic' }, icon(rv.skipped ? 'skip' : ok ? 'check' : 'x', 44)))
    );
    if (anim && !rv.skipped) {
      ok ? sfx.ping() : sfx.miss();
      setTimeout(() => ok && burst(box, { count: 16, colors: ['#3dff9a', '#d9ffe9', '#ffb020'], spread: 110 }), 300);
    }
    root.append(box);
    if (part && !rv.skipped) {
      root.append(h('div', { class: 'cmp' }, h('div', { class: 'cmp-r' }, avatar(ans, room.players, 30), h('span', {}, r.card.options[rv.answer])), h('div', { class: 'cmp-r g' + (ok ? ' ok' : ' miss') }, avatar(gs, room.players, 30), h('span', {}, r.card.options[rv.guess]))));
    }
    if (part || host) root.append(h('button', { class: 'btn with-chip block', onclick: () => act('next') }, sn.index + 1 >= sn.total ? 'Lihat Hasil' : 'Lanjut', h('span', { class: 'chip' }, icon('arrow', 18))));
    else root.append(waitPill());
  }
  if (sn.phase !== 'reveal' && (part || host)) root.append(h('button', { class: 'skip', onclick: () => act('skip') }, icon('skip', 18), 'Skip'));
  return root;
}

// ---------------- Hasil ----------------
const RING = [28, 52, 76, 98];
function blipPos(i) {
  const a = ((i * 137.5 + 20) * Math.PI) / 180;
  const r = 22 + ((i * 41) % 66);
  return [110 + Math.cos(a) * r, 110 + Math.sin(a) * r];
}

function scope(d, anim, delayBase) {
  const C = 2 * Math.PI * 106;
  const pct = d.pct ?? 0;
  const wrong = d.valid - d.correct;
  const svg = s(
    'svg',
    { viewBox: '0 0 220 220', class: 'scope-svg', 'aria-hidden': 'true' },
    s('defs', {}, s('radialGradient', { id: 'sw' + delayBase, cx: '0', cy: '0', r: '1' }, s('stop', { offset: '0', 'stop-color': '#3dff9a', 'stop-opacity': '0.55' }), s('stop', { offset: '1', 'stop-color': '#3dff9a', 'stop-opacity': '0' }))),
    s('circle', { cx: 110, cy: 110, r: 106, class: 'gauge-bg' }),
    s('circle', { cx: 110, cy: 110, r: 106, class: 'gauge', style: { '--c': C, '--off': C * (1 - pct / 100), '--dl': delayBase + 'ms' }, transform: 'rotate(-90 110 110)' }),
    RING.map((r) => s('circle', { cx: 110, cy: 110, r, class: 'ring' })),
    s('path', { d: 'M110 4V216M4 110H216', class: 'axis' }),
    s('g', { class: 'sweep' }, s('path', { d: 'M110 110 L110 12 A98 98 0 0 1 178 40 Z', fill: `url(#sw${delayBase})` }), s('path', { d: 'M110 110 L110 12', class: 'sweep-line' })),
    Array.from({ length: d.correct }, (_, i) => {
      const [x, y] = blipPos(i);
      return s('g', { class: 'blip ok', style: { '--dl': delayBase + 700 + i * 260 + 'ms' }, transform: `translate(${x} ${y})` }, s('circle', { r: 11, class: 'blip-ping' }), s('circle', { r: 4.5 }));
    }),
    Array.from({ length: wrong }, (_, i) => {
      const [x, y] = blipPos(d.correct + i + 3);
      return s('g', { class: 'blip miss', style: { '--dl': delayBase + 900 + (d.correct + i) * 260 + 'ms' }, transform: `translate(${x} ${y})` }, s('path', { d: 'M-5 -5L5 5M5 -5L-5 5' }));
    })
  );
  const num = h('b', { class: 'scope-pct' }, '0%');
  countUp(num, d.pct ?? 0, { delay: delayBase + 300, dur: 1400 });
  if (d.pct === null) num.textContent = '–';
  return h('div', { class: 'scope' + (anim ? ' anim' : ''), 'data-lvl': d.tier.level }, svg, h('div', { class: 'scope-mid' }, num), d.tier.level >= 4 ? h('span', { class: 'big-ping' }) : null);
}

function bars(level) {
  return h('div', { class: 'sigbars lv' + level, 'aria-label': 'Level sinyal ' + level + ' dari 5' }, [1, 2, 3, 4, 5].map((n) => h('i', { class: n <= level ? 'on' : '', style: { '--n': n } })));
}

export const kepResult = (room) => ({ key: 'kepres:' + room.code, sig: JSON.stringify(room.summary) + room.you.id, theme: 'kepekaan', build: () => buildResult(room) });

function buildResult(room) {
  const sm = room.summary;
  const youId = room.you.id;
  const dirs = [...sm.directions].sort((a, b) => (b.guesserId === youId || b.answererId === youId) - (a.guesserId === youId || a.answererId === youId));
  const root = h('div', { class: 'screen result kep-res' }, h('header', { class: 'res-head' }, emblem('kepekaan', 44), h('h1', {}, 'Tes Kepekaan')));
  const list = h('div', { class: 'dirs' });
  let shareArg = null;
  if (!dirs.length) list.append(h('p', { class: 'empty' }, icon('radar', 26), 'Belum cukup jawaban'));
  dirs.forEach((d, i) => {
    const anim = fresh('kepres:' + room.code + ':' + i);
    const gn = nameIn(sm.names, d.guesserId);
    const an = nameIn(sm.names, d.answererId);
    const gp = { id: d.guesserId, nick: gn };
    const ap = { id: d.answererId, nick: an };
    if (!shareArg && (d.guesserId === youId || i === 0)) shareArg = { game: 'kepekaan', title: 'Tes Kepekaan', big: d.pct === null ? '–' : d.pct + '%', sub: d.tier.label, names: [gn, an] };
    const card = h(
      'article',
      { class: 'dir panel lvl-' + d.tier.level, style: { '--i': i } },
      h('div', { class: 'dir-who' }, avatar(gp, room.players, 34), icon('radar', 18), avatar(ap, room.players, 34), h('span', { class: 'dir-n' }, gn, h('em', {}, ' → '), an)),
      scope(d, anim, 200 + i * 120),
      bars(d.tier.level),
      h('h2', { class: 'tier-name' + (anim ? ' stamp' : '') }, d.tier.label),
      d.good.length || d.learn.length
        ? h('div', { class: 'tags' }, d.good.map((t) => h('span', { class: 'tag ok' }, icon('check', 13), t)), d.learn.map((t) => h('span', { class: 'tag' }, icon('radar', 13), t)))
        : null
    );
    list.append(card);
  });
  root.append(list, resultFooter(room, shareArg));
  return root;
}
