import { h, icon, emblem } from '../lib.js';
import { GAMES, GAME_ORDER } from '/shared/games.js';
import { state, set, toast } from '../store.js';
import { api, ERRORS } from '../net.js';
import { sfx } from '../fx.js';

const ui = { filter: 'semua', shake: 0 };

export function normCode(raw) {
  const a = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return a.length > 4 ? a.slice(0, 4) + '-' + a.slice(4) : a;
}

const CATS = [
  ['semua', 'Semua', 'grid'],
  ['seru', 'Seru', 'flame'],
  ['tebak', 'Tebak', 'radar'],
  ['ngobrol', 'Ngobrol', 'chat'],
];

function logo() {
  return h('div', { class: 'logo' }, emblem('cocok', 34), h('span', {}, 'Friend Zone'));
}

function tile(id, featured) {
  const g = GAMES[id];
  return h(
    'button',
    {
      class: 'tile' + (featured ? ' featured' : ''),
      'data-g': id,
      'aria-label': g.name,
      onclick: () => {
        sfx.tap();
        set({ sheet: { type: 'detail', game: id } });
      },
    },
    h('span', { class: 'tile-glow' }),
    emblem(id, featured ? 92 : 68),
    h('span', { class: 'tile-name' }, g.name),
    h('span', { class: 'tile-meta' }, icon('people', 15), g.min + '+')
  );
}

export function home() {
  return { key: 'home', sig: 'home:' + ui.filter + ':' + ui.shake + ':' + state.sound, theme: 'shell', build };
}

function build() {
  const root = h('div', { class: 'screen home' });
  const input = h('input', {
    inputmode: 'text',
    autocapitalize: 'characters',
    autocomplete: 'off',
    spellcheck: 'false',
    maxlength: 7,
    placeholder: 'KMPL-48',
    'aria-label': 'Kode room',
    value: state.joinCode || '',
  });
  input.addEventListener('input', () => {
    input.value = normCode(input.value);
    state.joinCode = input.value;
  });
  const go = () => {
    const c = normCode(input.value);
    if (c.replace('-', '').length < 6) {
      ui.shake++;
      field.classList.add('err', 'shake');
      setTimeout(() => field.classList.remove('shake'), 500);
      return;
    }
    set({ joinCode: c, screen: 'join', error: null });
  };
  input.addEventListener('keydown', (e) => e.key === 'Enter' && go());
  const field = h('label', { class: 'field join-field' }, icon('people', 20), input, h('button', { class: 'ibtn sm on', 'aria-label': 'Gabung', onclick: go }, icon('arrow', 18)));

  const games = h('section', { class: 'games', id: 'games' });
  const list = ui.filter === 'semua' ? GAME_ORDER : GAME_ORDER.filter((id) => GAMES[id].cat === ui.filter);
  const grid = h('div', { class: 'grid' });
  list.forEach((id, i) => {
    const t = tile(id, ui.filter === 'semua' && i === 0);
    t.style.setProperty('--i', i);
    grid.append(t);
  });
  games.append(
    h(
      'div',
      { class: 'chips', role: 'tablist' },
      CATS.map(([k, label, ic]) =>
        h(
          'button',
          {
            class: 'pill' + (ui.filter === k ? ' sel' : ''),
            role: 'tab',
            'aria-selected': ui.filter === k,
            onclick: () => {
              ui.filter = k;
              set({});
            },
          },
          icon(ic, 15),
          label
        )
      )
    ),
    grid
  );

  const start = h('button', { class: 'btn with-chip block cta', onclick: () => games.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 'Mulai Main', h('span', { class: 'chip' }, icon('play', 18)));

  root.append(
    h(
      'header',
      { class: 'topbar' },
      logo(),
      h('span', { class: 'grow' }),
      h('button', { class: 'ibtn', 'aria-label': state.sound ? 'Matikan suara' : 'Nyalakan suara', onclick: () => set({ sound: !state.sound }) }, icon(state.sound ? 'sound' : 'mute')),
      h('button', { class: 'ibtn', 'aria-label': 'Pengaturan', onclick: () => set({ sheet: { type: 'settings' } }) }, icon('gear'))
    ),
    h(
      'section',
      { class: 'hero' },
      h(
        'div',
        { class: 'fan', 'aria-hidden': 'true' },
        h('div', { class: 'fan-card c1', 'data-g': 'kepekaan' }, emblem('kepekaan', 64)),
        h('div', { class: 'fan-card c3', 'data-g': 'cocok' }, emblem('cocok', 64)),
        h('div', { class: 'fan-card c2', 'data-g': 'tod' }, emblem('tod', 76))
      ),
      h('h1', {}, 'Kumpul jadi ', h('em', {}, 'lebih seru.')),
      h(
        'div',
        { class: 'flow', role: 'img', 'aria-label': 'Buat room, bagikan tautan, main bareng' },
        h('span', { class: 'node' }, icon('phone', 24)),
        h('span', { class: 'wire' }),
        h('span', { class: 'node' }, icon('link', 24)),
        h('span', { class: 'wire' }),
        h('span', { class: 'node' }, icon('cards', 24))
      ),
      start
    ),
    field,
    games,
    h(
      'nav',
      { class: 'nav', 'aria-label': 'Navigasi' },
      h('button', { class: 'nav-i on', 'aria-label': 'Beranda', onclick: () => root.scrollIntoView({ behavior: 'smooth' }) }, icon('home', 24)),
      h('button', { class: 'nav-c', 'aria-label': 'Pilih game', onclick: () => games.scrollIntoView({ behavior: 'smooth' }) }, icon('play', 26)),
      h('button', { class: 'nav-i', 'aria-label': 'Masukkan kode', onclick: () => (input.focus(), field.scrollIntoView({ behavior: 'smooth', block: 'center' })) }, icon('people', 24))
    )
  );
  return root;
}

// ---------- Halaman gabung (dari tautan atau kode) ----------
export function join() {
  return { key: 'join', sig: 'join:' + state.joinCode + ':' + state.error + ':' + state.busy, theme: 'shell', build: buildJoin };
}
function buildJoin() {
  const nick = h('input', { maxlength: 14, placeholder: 'Nama panggilan', autocomplete: 'nickname', 'aria-label': 'Nama panggilan', value: state.nick });
  nick.addEventListener('input', () => {
    state.nick = nick.value;
    btn.disabled = !nick.value.trim() || state.busy;
  });
  const submit = async () => {
    const n = nick.value.trim();
    if (!n || state.busy) return;
    set({ nick: n, busy: true, error: null });
    try {
      await api.join(state.joinCode, n);
      history.replaceState(null, '', '/');
    } catch (e) {
      set({ error: e.code === 'offline' || e.code === 'timeout' ? 'Tidak tersambung. Coba lagi.' : ERRORS[e.code] || 'Gagal bergabung.' });
    }
    set({ busy: false });
  };
  nick.addEventListener('keydown', (e) => e.key === 'Enter' && submit());
  const btn = h('button', { class: 'btn with-chip block', disabled: !state.nick.trim() || state.busy, onclick: submit }, 'Gabung', h('span', { class: 'chip' }, icon('arrow', 18)));
  const tiles = [...state.joinCode.replace('-', '')].map((c, i) => h('span', { class: 'ctile', style: { '--i': i } }, c));
  tiles.splice(4, 0, h('span', { class: 'cdash' }, '–'));
  return h(
    'div',
    { class: 'screen join' },
    h('div', { class: 'topbar' }, h('button', { class: 'ibtn', 'aria-label': 'Kembali', onclick: () => (history.replaceState(null, '', '/'), set({ screen: 'home', error: null })) }, icon('back'))),
    h('div', { class: 'grow center-col' }, h('div', { class: 'code-tiles' }, tiles), h('label', { class: 'field' + (state.error ? ' err' : '') }, icon('user', 20), nick), state.error ? h('p', { class: 'errline' }, icon('info', 18), state.error) : null),
    btn
  );
}

export function resuming() {
  return { key: 'resuming', sig: 'resuming', theme: 'shell', build: () => h('div', { class: 'screen center-col' }, h('div', { class: 'loader' }, h('i'), h('i'), h('i'))) };
}

// ---------- Buat room dari sheet detail ----------
export async function createRoom(game, nick) {
  if (state.busy) return;
  set({ busy: true, nick });
  try {
    await api.create(game, nick);
    set({ sheet: null });
  } catch (e) {
    toast(e.code === 'offline' || e.code === 'timeout' ? 'Tidak tersambung. Coba lagi.' : ERRORS[e.code] || 'Gagal membuat room.', 'warn');
  }
  set({ busy: false });
}
