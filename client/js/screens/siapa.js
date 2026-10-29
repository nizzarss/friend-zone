// Siapa yang Paling...: voting rahasia, hasil dibuka serentak.
import { h, icon, avatar, emblem, fresh, nameIn } from '../lib.js';
import { api } from '../net.js';
import { roomSig, playTop, progress, waitPill } from './frame.js';
import { resultFooter } from './footer.js';
import { sfx, burst, animated } from '../fx.js';
import { set } from '../store.js';

const ui = { k: '', sel: null };

export const siapaPlay = (room) => ({ key: 'siapa:' + room.code, sig: roomSig(room, ui.k + ui.sel), theme: 'siapa', build: () => build(room) });

function fxLayer(fx) {
  const map = { zzz: () => h('b', {}, 'Z'), chat: () => icon('chat', 22), energy: () => icon('flame', 22), laugh: () => icon('sparkle', 22), burst: () => icon('sparkle', 20) };
  const mk = map[fx] || map.burst;
  return h('span', { class: 'fxl fx-' + fx, 'aria-hidden': 'true' }, Array.from({ length: 7 }, (_, i) => h('i', { style: { '--i': i } }, mk())));
}

function build(room) {
  const sn = room.session;
  const youId = room.you.id;
  const host = room.you.isHost;
  const key = sn.rid + ':' + sn.phase;
  if (ui.k !== key) (ui.k = key), (ui.sel = null);
  const act = (a, extra = {}) => api.act({ a, r: sn.rid, ...extra });
  const root = h('div', { class: 'screen play siapa', 'data-g': 'siapa' }, playTop(room), progress(sn.index, sn.total), h('article', { class: 'bigq' }, h('p', {}, sn.card.text)));

  if (sn.phase === 'voting') {
    const voted = sn.myVote !== null;
    const chosen = voted ? sn.myVote : ui.sel;
    root.append(
      h('div', { class: 'vgrid' }, room.players.map((p, i) => h('button', { class: 'vtile' + (chosen === p.id ? ' sel' : ''), disabled: voted || !p.connected && false, style: { '--i': i }, onclick: () => (sfx.tap(), (ui.sel = p.id), set({})) }, avatar(p, room.players, 56), h('span', { class: 'vn' }, p.nick), chosen === p.id ? h('span', { class: 'vchk' }, icon('check', 14)) : null))),
      h('div', { class: 'need-pips big', 'aria-label': 'Suara masuk' }, room.players.map((p) => h('i', { class: sn.voted.includes(p.id) ? 'on' : '' }, sn.voted.includes(p.id) ? icon('check', 14) : null))),
      voted ? waitPill() : h('button', { class: 'btn with-chip block', disabled: !ui.sel, onclick: () => (sfx.lock(), act('lock', { target: ui.sel })) }, 'Kunci', h('span', { class: 'chip' }, icon('lock', 18)))
    );
    if (host) root.append(h('div', { class: 'row-actions' }, h('button', { class: 'skip', onclick: () => act('skip_card') }, icon('skip', 18), 'Ganti'), h('button', { class: 'skip', onclick: () => act('close') }, icon('lock', 18), 'Tutup voting')));
  } else {
    const rs = sn.result;
    const anim = fresh('siapa:rv:' + room.code + ':' + sn.rid);
    const winners = rs.winners.map((id) => room.players.find((p) => p.id === id)).filter(Boolean);
    const max = Math.max(1, ...Object.values(rs.counts));
    const sorted = [...room.players].sort((a, b) => (rs.counts[b.id] || 0) - (rs.counts[a.id] || 0));
    if (rs.skipped || !rs.enough) root.append(h('div', { class: 'rv skip' }, h('span', { class: 'rv-ic' }, icon(rs.skipped ? 'skip' : 'people', 40))));
    else {
      const stage = h('div', { class: 'podium' + (anim ? ' anim' : '') + (rs.tie ? ' tie' : '') }, h('div', { class: 'winners' }, winners.map((w, i) => h('div', { class: 'win', style: { '--i': i } }, icon('crown', 28, 'crown'), avatar(w, room.players, rs.tie ? 72 : 96, 'winav'), h('b', {}, w.nick)))), h('h2', { class: 'tier-name stampbox' + (anim ? ' stamp' : '') }, rs.title), anim && animated() ? fxLayer(rs.fx) : null);
      root.append(stage);
      if (anim) { sfx.win(); setTimeout(() => burst(stage, { count: 26, colors: ['#c6ff3d', '#ff4fb8', '#6ee7ff', '#fff'], shape: 'bit', spread: 150 }), 450); }
      root.append(h('ul', { class: 'votebars' }, sorted.map((p, i) => h('li', { style: { '--i': i } }, avatar(p, room.players, 28), h('div', { class: 'bar' }, h('i', { style: { '--w': ((rs.counts[p.id] || 0) / max) * 100 + '%' } })), h('b', {}, rs.counts[p.id] || 0)))));
    }
    root.append(host ? h('button', { class: 'btn with-chip block', onclick: () => act('next') }, sn.index + 1 >= sn.total ? 'Selesai' : 'Lanjut', h('span', { class: 'chip' }, icon('arrow', 18))) : waitPill());
  }
  return root;
}

export const siapaResult = (room) => ({ key: 'siaparesult:' + room.code, sig: JSON.stringify(room.summary), theme: 'siapa', build: () => buildResult(room) });

function buildResult(room) {
  const sm = room.summary;
  const root = h('div', { class: 'screen result siapa-res' }, h('header', { class: 'res-head' }, emblem('siapa', 44), h('h1', {}, 'Siapa yang Paling')));
  const anim = fresh('siaparesult:' + room.code);
  const list = h('ul', { class: 'roundlist' }, sm.rounds.map((r, i) => h('li', { class: 'panel' + (anim ? ' anim' : ''), style: { '--i': i } }, h('b', { class: 'rt' }, r.title), h('span', { class: 'rw' }, r.winners.length ? r.winners.map((id) => avatar({ id, nick: nameIn(sm.names, id) }, room.players, 30)) : icon('people', 18)))));
  if (!sm.rounds.length) root.append(h('p', { class: 'empty' }, icon('people', 26), 'Belum ada ronde'));
  root.append(list, resultFooter(room, null));
  return root;
}
