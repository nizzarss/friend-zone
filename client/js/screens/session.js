// Ringkasan sesi untuk game tanpa skor: Truth or Dare, Deep Talk, Relationship Talk.
import { h, icon, emblem, avatar, fresh } from '../lib.js';
import { countUp, burst, sfx } from '../fx.js';
import { resultFooter } from './footer.js';
import { GAMES } from '/shared/games.js';

export const sessionResult = (room) => ({ key: 'sess:' + room.code, sig: JSON.stringify(room.summary) + room.players.length, theme: room.game, build: () => build(room) });

function build(room) {
  const g = room.game;
  const sm = room.summary;
  const anim = fresh('sess:' + room.code);
  const num = h('b', { class: 'sess-n' }, '0');
  countUp(num, sm.rounds, { suffix: '', dur: 900, delay: 400 });
  const stage = h('div', { class: 'sess-stage ' + g + (anim ? ' anim' : '') }, h('i', { class: 'orb o1' }), h('i', { class: 'orb o2' }), h('i', { class: 'orb o3' }), h('div', { class: 'sess-em' }, emblem(g, 120)));
  if (anim) {
    sfx.win();
    setTimeout(() => burst(stage, { count: 20, colors: g === 'tod' ? ['#ffc61a', '#ff5a1f', '#fff'] : g === 'deep' ? ['#c9b2f0', '#f4e9dc', '#fff'] : ['#f2a58e', '#ffd9a8', '#fff'], shape: g === 'rel' ? 'heart' : 'dot', spread: 130 }), 500);
  }
  return h('div', { class: 'screen result sess', 'data-g': g }, h('header', { class: 'res-head' }, h('h1', {}, GAMES[g].name)), stage, h('div', { class: 'sess-count' }, icon('cards', 24), num), h('div', { class: 'strip center' }, room.players.map((p) => h('div', { class: 'sp' + (p.connected ? '' : ' away') }, avatar(p, room.players, 44)))), h('div', { class: 'grow' }), resultFooter(room, { game: g, title: GAMES[g].name, big: String(sm.rounds), sub: 'kartu dibahas', names: room.players.map((p) => p.nick).slice(0, 6) }));
}
