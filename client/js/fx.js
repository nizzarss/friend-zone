// Efek: suara sintetis (WebAudio), pengaturan gerak, count-up, konfeti, kartu bagikan.
import { state } from './store.js';

// ---------- Gerak ----------
export function motionMode() {
  if (state.motion === 'full') return 'full';
  if (state.motion === 'off') return 'off';
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'off' : 'full';
}
export const animated = () => motionMode() === 'full';

/** Menghitung naik angka; langsung ke akhir kalau gerak dimatikan. */
export function countUp(el, to, { from = 0, delay = 0, dur = 1100, suffix = '%' } = {}) {
  const paint = (v) => (el.textContent = Math.round(v) + suffix);
  if (!animated()) return paint(to);
  paint(from);
  const t0 = performance.now() + delay;
  const tick = (now) => {
    if (!el.isConnected) return;
    const p = Math.min(1, Math.max(0, (now - t0) / dur));
    const e = 1 - Math.pow(1 - p, 3);
    paint(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ---------- Suara ----------
let ctx = null;
function ac() {
  if (!state.sound) return null;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}
function tone(freq, t0, dur, { type = 'sine', gain = 0.06, slide = 0 } = {}) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  const t = a.currentTime + t0;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}
export const sfx = {
  tap: () => tone(520, 0, 0.07, { type: 'triangle', gain: 0.05 }),
  lock: () => (tone(330, 0, 0.09, { type: 'square', gain: 0.03 }), tone(660, 0.08, 0.12, { type: 'triangle', gain: 0.05 })),
  flip: () => tone(220, 0, 0.18, { type: 'sawtooth', gain: 0.025, slide: 2.2 }),
  ping: () => (tone(880, 0, 0.35, { gain: 0.06 }), tone(1320, 0.05, 0.4, { gain: 0.03 })),
  miss: () => tone(200, 0, 0.3, { type: 'sawtooth', gain: 0.03, slide: 0.6 }),
  merge: () => (tone(262, 0, 0.5, { gain: 0.05 }), tone(330, 0.1, 0.5, { gain: 0.05 }), tone(392, 0.2, 0.7, { gain: 0.05 }), tone(523, 0.45, 0.9, { gain: 0.05 })),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.3, { type: 'triangle', gain: 0.05 })),
};

// ---------- Konfeti sederhana (elemen DOM, bukan canvas) ----------
export function burst(host, { count = 18, colors = ['#fff', '#ffd23f', '#ff7eb6'], shape = 'dot', spread = 120 } = {}) {
  if (!animated() || !host) return;
  const box = document.createElement('span');
  box.className = 'burst';
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const d = spread * (0.55 + Math.random() * 0.6);
    p.style.setProperty('--dx', Math.cos(a) * d + 'px');
    p.style.setProperty('--dy', Math.sin(a) * d - 20 + 'px');
    p.style.setProperty('--rot', Math.round(Math.random() * 360) + 'deg');
    p.style.setProperty('--c', colors[i % colors.length]);
    p.style.setProperty('--dl', Math.round(Math.random() * 120) + 'ms');
    p.className = 'bp bp-' + shape;
    box.append(p);
  }
  host.append(box);
  setTimeout(() => box.remove(), 1800);
}

// ---------- Kartu bagikan (PNG) ----------
const THEMES = {
  kepekaan: ['#050b09', '#0e2a1d', '#3dff9a', '#ffb020'],
  cocok: ['#3a0912', '#7a0f23', '#ff6b7d', '#7fe3c4'],
  kenal: ['#10233a', '#183a66', '#ffd23f', '#ff7eb6'],
  siapa: ['#2b087c', '#5a14c2', '#c6ff3d', '#ff4fb8'],
  tod: ['#14110d', '#2a2014', '#ffc61a', '#ff5a1f'],
  deep: ['#221a2e', '#34264a', '#c9b2f0', '#f4e9dc'],
  rel: ['#26120f', '#4a241d', '#f2a58e', '#ffd9a8'],
};
function wrap(c, text, x, y, maxW, lh) {
  const words = String(text).split(' ');
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (c.measureText(t).width > maxW && line) {
      c.fillText(line, x, y);
      y += lh;
      line = w;
    } else line = t;
  }
  c.fillText(line, x, y);
  return y + lh;
}
/** Hanya data aman: label hasil, persentase, nama panggilan. Tidak ada jawaban mentah. */
export async function shareCard({ game, title, big, sub, names = [] }) {
  const W = 1080;
  const H = 1350;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d');
  const [dark, mid, a1, a2] = THEMES[game] || THEMES.cocok;
  const g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, mid);
  g.addColorStop(1, dark);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.globalAlpha = 0.18;
  c.fillStyle = a1;
  c.beginPath();
  c.arc(W * 0.85, H * 0.12, 360, 0, 7);
  c.fill();
  c.fillStyle = a2;
  c.beginPath();
  c.arc(W * 0.1, H * 0.9, 300, 0, 7);
  c.fill();
  c.globalAlpha = 1;
  c.textAlign = 'center';
  c.fillStyle = '#ffffffcc';
  c.font = '700 42px "Plus Jakarta Sans", system-ui, sans-serif';
  c.fillText('FRIEND ZONE', W / 2, 140);
  c.fillStyle = a1;
  c.font = '800 54px "Plus Jakarta Sans", system-ui, sans-serif';
  c.fillText(title, W / 2, 260);
  c.fillStyle = '#fff';
  c.font = '800 300px "Plus Jakarta Sans", system-ui, sans-serif';
  c.fillText(big, W / 2, 700);
  c.fillStyle = a2;
  c.font = '800 70px "Plus Jakarta Sans", system-ui, sans-serif';
  wrap(c, sub, W / 2, 830, 880, 84);
  c.fillStyle = '#ffffffb0';
  c.font = '600 46px "Plus Jakarta Sans", system-ui, sans-serif';
  if (names.length) wrap(c, names.join('  ·  '), W / 2, 1120, 900, 58);
  const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
  const file = new File([blob], 'friend-zone.png', { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Friend Zone' });
      return 'shared';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancel';
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'friend-zone.png';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
