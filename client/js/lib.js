// Pembantu DOM, ikon, emblem game, avatar. Tanpa framework.
// Elemen.append bawaan menulis "null" sebagai teks; saring dulu supaya kondisi `x ? el : null` aman.
const _append = Element.prototype.append;
Element.prototype.append = function (...nodes) {
  return _append.apply(this, nodes.flat(Infinity).filter((n) => n != null && n !== false));
};

const SVGNS = 'http://www.w3.org/2000/svg';

function apply(el, props) {
  for (const [k, v] of Object.entries(props || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.setAttribute('class', v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'vars') for (const [n, val] of Object.entries(v)) el.style.setProperty('--' + n, val);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
}
function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k.nodeType ? k : document.createTextNode(String(k)));
  }
}
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  apply(el, props);
  append(el, kids);
  return el;
}
export function s(tag, props, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  apply(el, props);
  append(el, kids);
  return el;
}
export const svgFrom = (markup) => {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstChild;
};

// ---------- Ikon (garis 24x24) ----------
const P = {
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.5 0 4.5 1.7 4.5 4.4"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  cards: '<rect x="3.5" y="6" width="11" height="14" rx="2.2" transform="rotate(-8 9 13)"/><rect x="9.5" y="4" width="11" height="14" rx="2.2" transform="rotate(8 15 11)"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".6" fill="currentColor"/>',
  sound: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  mute: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  skip: '<path d="M5 6l8 6-8 6zM15.5 6v12"/>',
  heart: '<path d="M12 20C5 15 3 11.5 3 8.5 3 6 5 4.3 7.2 4.3c1.9 0 3.8 1.2 4.8 3 1-1.8 2.9-3 4.8-3C19 4.3 21 6 21 8.5c0 3-2 6.5-9 11.5z"/>',
  flame: '<path d="M12 3c.5 3.2 4.5 5.2 4.5 10a4.5 4.5 0 0 1-9 0c0-1.8.8-3 1.7-4 .2 1.3.8 2 1.6 2.3C10.2 8.2 10.5 5.5 12 3z"/>',
  crown: '<path d="M4 17l-1-9 5 4 4-7 4 7 5-4-1 9z"/><path d="M5 20h14"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.4"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  eyeoff: '<path d="M3 12s3.5-6 9-6c1.6 0 3 .5 4.2 1.2M21 12s-3.5 6-9 6c-1.6 0-3-.5-4.2-1.2"/><path d="M4 4l16 16"/>',
  eye: '<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.6"/>',
  share: '<circle cx="6.5" cy="12" r="2.4"/><circle cx="17.5" cy="6.5" r="2.4"/><circle cx="17.5" cy="17.5" r="2.4"/><path d="M8.6 10.9l6.8-3.3M8.6 13.1l6.8 3.3"/>',
  qr: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.2"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.2"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.2"/><path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 19h1.5M19 14h1.5"/>',
  refresh: '<path d="M19 8a8 8 0 0 0-14 1M5 16a8 8 0 0 0 14-1"/><path d="M19 3.5V8h-4.5M5 20.5V16h4.5"/>',
  chat: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/>',
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  trash: '<path d="M5 7h14M9.5 7V4.5h5V7M7 7l1 13h8l1-13"/>',
  wifi: '<path d="M3.5 9.5a12 12 0 0 1 17 0M6.5 12.8a7.6 7.6 0 0 1 11 0M9.4 16a3.4 3.4 0 0 1 5.2 0"/><circle cx="12" cy="19" r=".9" fill="currentColor"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.1" fill="currentColor"/><circle cx="15" cy="15" r="1.1" fill="currentColor"/><circle cx="15" cy="9" r="1.1" fill="currentColor"/><circle cx="9" cy="15" r="1.1" fill="currentColor"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
  bulb: '<path d="M9 17.5h6M10 20.5h4M12 3.5a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.100h5c0-.8.4-1.600 1-2.100A6 6 0 0 0 12 3.500z"/>',
  exit: '<path d="M10 4.5H6.5A2 2 0 0 0 4.5 6.500v11a2 2 0 0 0 2 2H10M15 8l4 4-4 4M19 12H9.500"/>',
  more: '<circle cx="6" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18" cy="12" r="1.4" fill="currentColor"/>',
  flag: '<path d="M6 21V4M6 5h11l-2 4 2 4H6"/>',
};
export function icon(name, size = 20, cls = '') {
  const el = svgFrom(`<svg xmlns="${SVGNS}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name] || ''}</svg>`);
  if (cls) el.setAttribute('class', 'ic ' + cls);
  else el.setAttribute('class', 'ic');
  return el;
}

// ---------- Emblem geometris tiap game (tanpa karakter) ----------
const EM = {
  tod: `<circle cx="32" cy="32" r="26" fill="var(--e1)"/><path d="M32 6a26 26 0 0 1 0 52z" fill="var(--e2)"/><path d="M32 16c1 6 9 9 9 18a9 9 0 0 1-18 0c0-3.500 1.500-5.500 3.200-7.500.4 2.600 1.600 4 3.200 4.600C28.400 26 29 20.500 32 16z" fill="var(--e3)"/>`,
  deep: `<circle cx="32" cy="32" r="26" fill="var(--e1)" opacity=".25"/><path d="M42 12a21 21 0 1 0 10 28A17 17 0 0 1 42 12z" fill="var(--e1)"/><circle cx="46" cy="18" r="2.200" fill="var(--e2)"/><circle cx="52" cy="28" r="1.500" fill="var(--e2)"/><circle cx="20" cy="14" r="1.400" fill="var(--e2)"/><path d="M10 52c8-5 16-5 24 0s16 5 20 0" fill="none" stroke="var(--e2)" stroke-width="2.500" stroke-linecap="round"/>`,
  kepekaan: `<circle cx="32" cy="32" r="26" fill="none" stroke="var(--e1)" stroke-width="2.500"/><circle cx="32" cy="32" r="16" fill="none" stroke="var(--e1)" stroke-width="2.500" opacity=".6"/><circle cx="32" cy="32" r="7" fill="none" stroke="var(--e1)" stroke-width="2.500" opacity=".4"/><path d="M32 32L52 14A26 26 0 0 1 58 32z" fill="var(--e1)" opacity=".45"/><path d="M32 32L52 14" stroke="var(--e1)" stroke-width="3" stroke-linecap="round"/><circle cx="44" cy="40" r="3.200" fill="var(--e2)"/>`,
  cocok: `<defs><clipPath id="eL"><rect x="0" y="0" width="32" height="64"/></clipPath><clipPath id="eR"><rect x="32" y="0" width="32" height="64"/></clipPath></defs><g clip-path="url(#eL)"><path id="eh" d="M32 56C10 40 6 30 6 22c0-7 5-12 12-12 6 0 11 4 14 9 3-5 8-9 14-9 7 0 12 5 12 12 0 8-4 18-26 34z" fill="var(--e1)" transform="translate(-3 0)"/></g><g clip-path="url(#eR)"><path d="M32 56C10 40 6 30 6 22c0-7 5-12 12-12 6 0 11 4 14 9 3-5 8-9 14-9 7 0 12 5 12 12 0 8-4 18-26 34z" fill="var(--e2)" transform="translate(3 0)"/></g>`,
  rel: `<path d="M8 14a6 6 0 0 1 6-6h24a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H24l-9 8v-8a6 6 0 0 1-7-6z" fill="var(--e1)"/><path d="M24 36a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6h-2v7l-8-7H30a6 6 0 0 1-6-6z" fill="var(--e2)" opacity=".95"/><circle cx="20" cy="21" r="2" fill="var(--e3)"/><circle cx="28" cy="21" r="2" fill="var(--e3)"/><circle cx="36" cy="21" r="2" fill="var(--e3)"/>`,
  kenal: `<rect x="6" y="12" width="52" height="40" rx="9" fill="var(--e1)"/><circle cx="23" cy="29" r="7.500" fill="var(--e3)"/><path d="M11 46c1-7 6-10 12-10s11 3 12 10z" fill="var(--e3)"/><rect x="38" y="22" width="14" height="4" rx="2" fill="var(--e2)"/><rect x="38" y="31" width="14" height="4" rx="2" fill="var(--e2)" opacity=".7"/><rect x="38" y="40" width="9" height="4" rx="2" fill="var(--e2)" opacity=".45"/>`,
  siapa: `<rect x="6" y="38" width="16" height="18" rx="3" fill="var(--e2)" opacity=".75"/><rect x="24" y="30" width="16" height="26" rx="3" fill="var(--e1)"/><rect x="42" y="42" width="16" height="14" rx="3" fill="var(--e2)" opacity=".55"/><path d="M24 20l-2-9 6 5 4-8 4 8 6-5-2 9z" fill="var(--e3)"/>`,
};
export function emblem(id, size = 56) {
  const el = svgFrom(`<svg xmlns="${SVGNS}" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true" focusable="false">${EM[id] || ''}</svg>`);
  el.setAttribute('class', 'emblem em-' + id);
  return el;
}

// ---------- Avatar ----------
const AV = ['#ff8a5c', '#ffd23f', '#7fe3c4', '#6ec1ff', '#c9a0ff', '#ff7eb6', '#b6f25b', '#ffb020'];
export function avatarColor(id, players) {
  const i = Math.max(0, players ? players.findIndex((p) => p.id === id) : 0);
  return AV[i % AV.length];
}
export function avatar(p, players, size = 40, extra = '') {
  const nick = p?.nick || '?';
  const ch = [...nick.trim()][0] || '?';
  return h('span', { class: 'avatar ' + extra, style: { '--av': avatarColor(p?.id, players), '--sz': size + 'px' }, title: nick }, ch.toUpperCase());
}

export const nickOf = (room, id) => room.players.find((p) => p.id === id)?.nick || null;
export const playerOf = (room, id) => room.players.find((p) => p.id === id) || null;
export const nameIn = (names, id) => names?.[id] || 'Pemain';
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// Animasi masuk hanya sekali per kunci, supaya render ulang karena update server tidak memutar ulang animasi.
const seen = new Set();
export const fresh = (k) => (seen.has(k) ? false : (seen.add(k), true));
