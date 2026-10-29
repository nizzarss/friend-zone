// Seberapa Cocok Kalian? (PRD 4.4). Tiap pemain mengisi profil sendiri, lalu dicocokkan.
// Jawaban orang lain tidak pernah dikirim sebelum reveal.
import { COCOK } from '../data/cards.js';
import { isHost, pctOf, cocokTier } from './common.js';

function pairResult(s, aId, bId) {
  const A = s.answers[aId] || {};
  const B = s.answers[bId] || {};
  const same = [];
  const diff = [];
  let valid = 0;
  COCOK.forEach((c, q) => {
    const a = A[q];
    const b = B[q];
    if (!(a >= 0) || !(b >= 0)) return; // tidak dijawab salah satu: keluar dari perhitungan
    valid += 1;
    if (a === b) same.push({ q, topic: c.topic, label: c.options[a] });
    else diff.push({ q, topic: c.topic, aLabel: c.options[a], bLabel: c.options[b], talk: c.talk });
  });
  const pct = pctOf(same.length, valid);
  // Bahan obrolan: utamakan topik yang berbeda, lengkapi dari topik yang sama.
  const talk = diff.map((d) => d.talk).concat(same.map((x) => COCOK[x.q].talk)).slice(0, 2);
  return { aId, bId, valid, sameCount: same.length, pct, tier: cocokTier(pct), same, diff, talk };
}

function reveal(room, s) {
  const ids = room.players.filter((p) => s.locked.includes(p.id)).map((p) => p.id);
  const pairs = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) pairs.push(pairResult(s, ids[i], ids[j]));
  s.result = pairs;
  s.answers = {}; // retensi minimal: jawaban mentah dibuang setelah hasil dihitung (PRD 8.1)
  s.phase = 'result';
  room.complete();
}

export default {
  id: 'cocok',

  start(room) {
    room.session = { phase: 'answering', answers: {}, locked: [], result: null };
  },

  act(room, p, m) {
    const s = room.session;
    if (s.phase !== 'answering') return 'not_allowed';
    switch (m.a) {
      case 'answer': {
        if (s.locked.includes(p.id)) return 'not_allowed';
        const c = COCOK[m.q];
        if (!c) return 'bad_request';
        const opt = m.opt;
        if (!(opt === -1 || (Number.isInteger(opt) && opt >= 0 && opt < c.options.length))) return 'bad_request';
        (s.answers[p.id] ||= {})[m.q] = opt; // -1 = dilewati
        return;
      }
      case 'lock': {
        if (!s.locked.includes(p.id)) s.locked.push(p.id); // idempotent
        const connected = room.players.filter((x) => x.connected);
        if (connected.every((x) => s.locked.includes(x.id)) && s.locked.length >= 2) reveal(room, s);
        return;
      }
      case 'reveal': {
        // Host menutup sesi isi profil bila minimal dua profil sudah terkunci.
        if (!isHost(room, p)) return 'not_allowed';
        if (s.locked.length < 2) return 'min_locked';
        reveal(room, s);
        return;
      }
      default:
        return 'bad_request';
    }
  },

  onPlayersChanged(room) {
    const s = room.session;
    if (!s || s.phase !== 'answering') return;
    const connected = room.players.filter((x) => x.connected);
    if (connected.length && s.locked.length >= 2 && connected.every((x) => s.locked.includes(x.id))) reveal(room, s);
  },

  view(room, p) {
    const s = room.session;
    return {
      phase: s.phase,
      total: COCOK.length,
      cards: COCOK.map((c) => ({ id: c.id, topic: c.topic, text: c.text, options: c.options })),
      mine: s.answers[p.id] || {},
      locked: s.locked.filter((id) => room.players.some((x) => x.id === id)),
    };
  },

  summary(room, p) {
    const s = room.session;
    const names = {};
    for (const [id, nick] of room.nicks) names[id] = nick;
    const pairs = (s.result || []).map((r) => {
      const mine = p && (r.aId === p.id || r.bId === p.id);
      // Detail jawaban hanya untuk dua orang yang dipasangkan.
      return mine ? r : { aId: r.aId, bId: r.bId, valid: r.valid, sameCount: r.sameCount, pct: r.pct, tier: r.tier, same: [], diff: [], talk: [] };
    });
    return { names, pairs };
  },
};
