// Seberapa Kenal Kalian: tema biru-kuning, kartu profil yang terisi.
import { h, icon, avatar, emblem, fresh, nameIn } from '../lib.js';
import { api } from '../net.js';
import { roomSig, playTop, progress, waitPill } from './frame.js';
import { resultFooter } from './footer.js';
import { sfx, countUp, burst } from '../fx.js';
import { set } from '../store.js';

const ui = { k: '', sel: null };

export const kenalPlay = (room) => ({ key: 'kenal:' + room.code, sig: roomSig(room, ui.k + ui.sel), theme: 'kenal', build: () => build(room) });

function opts(card, chosen, locked, onPick) {
  return h('div', { class: 'opts' }, card.options.map((o, i) => h('button', { class: 'opt' + (chosen === i ? ' sel' : ''), disabled: locked, style: { '--i': i }, onclick: () => (sfx.tap(), onPick(i)) }, h('span', { class: 'ol' }, String.fromCharCode(65 + i)), h('span', { class: 'ot' }, o))));
}

function build(room) {
  const sn = room.session;
  const r = sn.round;
  const youId = room.you.id;
  const host = room.you.isHost;
  const target = room.players.find((p) => p.id === r.targetId);
  const isT = youId === r.targetId;
  const key = sn.rid + ':' + sn.phase;
  if (ui.k !== key) (ui.k = key), (ui.sel = null);
  const act = (a, extra = {}) => api.act({ a, r: sn.rid, ...extra });
  const root = h('div', { class: 'screen play kenal', 'data-g': 'kenal' }, playTop(room), progress(sn.index, sn.total));
  const locked = r.lockedGuessers;
  const pf = h('div', { class: 'idcard' }, avatar(target, room.players, 64), h('div', { class: 'idl' }, h('i'), h('i'), h('i')), h('span', { class: 'id-topic' }, r.card.topic));
  root.append(pf, h('article', { class: 'qcard' }, h('p', {}, r.card.text)));

  if (sn.phase === 'answer') {
    if (isT) root.append(opts(r.card, ui.sel, false, (i) => ((ui.sel = i), set({}))), h('button', { class: 'btn with-chip block', disabled: ui.sel === null, onclick: () => (sfx.lock(), act('lock_answer', { opt: ui.sel })) }, 'Kunci', h('span', { class: 'chip' }, icon('lock', 18))));
    else root.append(waitPill());
  } else if (sn.phase === 'guess') {
    const iLocked = locked.includes(youId);
    if (!isT) {
      root.append(opts(r.card, iLocked ? r.myGuess : ui.sel, iLocked, (i) => ((ui.sel = i), set({}))));
      root.append(iLocked ? waitPill() : h('button', { class: 'btn with-chip block', disabled: ui.sel === null, onclick: () => (sfx.lock(), act('lock_guess', { opt: ui.sel })) }, 'Tebak', h('span', { class: 'chip' }, icon('lock', 18))));
    } else root.append(waitPill());
    root.append(h('div', { class: 'need-pips big' }, r.guessers.map((g) => h('i', { class: locked.includes(g) ? 'on' : '' }, locked.includes(g) ? icon('check', 14) : null))));
    if (host) root.append(h('button', { class: 'skip', onclick: () => act('close_guessing') }, icon('lock', 18), 'Tutup tebakan'));
  } else {
    const rv = r.reveal;
    const anim = fresh('kenal:rv:' + room.code + ':' + sn.rid);
    if (rv.skipped) root.append(h('div', { class: 'rv skip' }, h('span', { class: 'rv-ic' }, icon('skip', 40))));
    else {
      const box = h('div', { class: 'kv' + (anim ? ' anim' : '') }, h('div', { class: 'kv-ans' }, icon('check', 20), h('b', {}, r.card.options[rv.answer])), h('ul', { class: 'kv-list' }, Object.entries(rv.guesses).map(([gid, g], i) => { const p = room.players.find((x) => x.id === gid) || { id: gid, nick: '?' }; const ok = rv.results[gid]; return h('li', { class: ok ? 'ok' : 'miss', style: { '--i': i } }, avatar(p, room.players, 32), h('span', { class: 'kn' }, r.card.options[g]), h('span', { class: 'kmark' }, icon(ok ? 'check' : 'x', 16))); })));
      root.append(box);
      if (anim) { sfx.ping(); setTimeout(() => burst(box, { count: 14, colors: ['#ffd23f', '#ff7eb6', '#7fe3c4'], spread: 110 }), 350); }
    }
    if (isT || host) root.append(h('button', { class: 'btn with-chip block', onclick: () => act('next') }, sn.index + 1 >= sn.total ? 'Lihat Hasil' : 'Lanjut', h('span', { class: 'chip' }, icon('arrow', 18))));
    else root.append(waitPill());
  }
  if (sn.phase !== 'reveal' && (isT || host)) root.append(h('button', { class: 'skip', onclick: () => act('skip') }, icon('skip', 18), 'Skip'));
  return root;
}

export const kenalResult = (room) => ({ key: 'kenalres:' + room.code, sig: JSON.stringify(room.summary) + room.you.id, theme: 'kenal', build: () => buildResult(room) });

function buildResult(room) {
  const sm = room.summary;
  const root = h('div', { class: 'screen result kenal-res' }, h('header', { class: 'res-head' }, emblem('kenal', 44), h('h1', {}, 'Seberapa Kenal')));
  const list = h('div', { class: 'dirs' });
  let shareArg = null;
  const targets = [...sm.targets].sort((a, b) => (b.targetId === room.you.id) - (a.targetId === room.you.id));
  if (!targets.length) list.append(h('p', { class: 'empty' }, icon('cards', 26), 'Belum cukup jawaban'));
  targets.forEach((t, i) => {
    const anim = fresh('kenalres:' + room.code + ':' + t.targetId);
    const tn = nameIn(sm.names, t.targetId);
    const tp = { id: t.targetId, nick: tn };
    const slots = 10;
    const fill = t.pct === null ? 0 : Math.round((t.pct / 100) * slots);
    if (!shareArg) shareArg = { game: 'kenal', title: 'Seberapa Kenal ' + tn, big: t.pct === null ? '–' : t.pct + '%', sub: t.tier.label, names: [tn] };
    const num = h('b', { class: 'idpct' }, '0%');
    countUp(num, t.pct ?? 0, { delay: 300 + i * 100, dur: 1200 });
    if (t.pct === null) num.textContent = '–';
    const rows = sm.directions.filter((d) => d.targetId === t.targetId).map((d, j) => h('li', {}, avatar({ id: d.guesserId, nick: nameIn(sm.names, d.guesserId) }, room.players, 28), h('div', { class: 'bar' }, h('i', { style: { '--w': (d.pct ?? 0) + '%', '--dl': 500 + j * 120 + 'ms' } })), h('small', {}, d.pct === null ? '–' : d.pct + '%')));
    list.append(
      h('article', { class: 'dir idres panel' + (anim ? ' anim' : ''), style: { '--i': i } },
        h('div', { class: 'idres-top' }, avatar(tp, room.players, 56), h('div', { class: 'idres-n' }, h('b', {}, tn), num)),
        h('div', { class: 'slots' }, Array.from({ length: slots }, (_, k) => h('i', { class: k < fill ? 'on' : '', style: { '--k': k } }))),
        h('div', { class: 'stamp-wrap' }, h('h2', { class: 'tier-name stampbox' + (anim ? ' stamp' : '') }, t.tier.label)),
        rows.length ? h('ul', { class: 'dirrows' }, rows) : null)
    );
  });
  root.append(list, resultFooter(room, shareArg));
  return root;
}
