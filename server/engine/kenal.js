// Seberapa Kenal Kalian (PRD 4.6). Target menjawab privat, pemain lain menebak.
// Semua tebakan dikunci sebelum jawaban dibuka. Skor dihitung per arah dan per target.
import { KENAL } from '../data/cards.js';
import { shuffle, isHost, pctOf, kenalTier } from './common.js';

function newRound(s) {
  const targetId = s.order[s.index % s.order.length];
  return {
    card: s.cards[s.index],
    targetId,
    answer: null,
    guesses: {}, // guesserId -> opsi (terkunci)
    skipped: false,
    results: null, // setelah reveal: guesserId -> benar atau salah
  };
}

const validOpt = (card, opt) => Number.isInteger(opt) && opt >= 0 && opt < card.options.length;

function guessersOf(room, s) {
  return room.players.filter((p) => s.order.includes(p.id) && p.id !== s.cur.targetId);
}

function toReveal(room, s) {
  const r = s.cur;
  r.results = {};
  if (!r.skipped) for (const [gid, g] of Object.entries(r.guesses)) r.results[gid] = g === r.answer;
  s.phase = 'reveal';
}

function maybeReveal(room, s) {
  if (s.phase !== 'guess') return;
  const need = guessersOf(room, s).filter((p) => p.connected);
  const locked = need.filter((p) => p.id in s.cur.guesses);
  // Buka bila semua penebak yang terhubung sudah mengunci (dan minimal satu tebakan masuk).
  if (need.length === locked.length && Object.keys(s.cur.guesses).length > 0) toReveal(room, s);
  else if (!need.length && !Object.keys(s.cur.guesses).length) {
    s.cur.skipped = true;
    toReveal(room, s);
  }
}

function finishRound(s) {
  const r = s.cur;
  s.history.push({
    cardId: r.card.id,
    topic: r.card.topic,
    targetId: r.targetId,
    skipped: r.skipped,
    results: r.results || {},
  });
}

export default {
  id: 'kenal',

  start(room) {
    const order = room.players.map((p) => p.id);
    const n = order.length;
    const cards = shuffle(KENAL, room.rng);
    const want = Number(room.settings.rounds) || 12;
    // Seimbang: tiap orang jadi target dalam jumlah ronde yang sama (PRD 4.6).
    const per = Math.max(1, Math.floor(Math.min(want, cards.length) / n));
    const s = { order, cards, total: Math.min(per * n, cards.length), index: 0, phase: 'answer', history: [], cur: null };
    s.cur = newRound(s);
    room.session = s;
  },

  act(room, p, m) {
    const s = room.session;
    if (m.r !== undefined && m.r !== String(s.index)) return 'stale';
    const r = s.cur;
    const host = isHost(room, p);
    switch (m.a) {
      case 'lock_answer': {
        if (s.phase !== 'answer' || p.id !== r.targetId) return 'not_allowed';
        if (!validOpt(r.card, m.opt)) return 'bad_request';
        r.answer = m.opt;
        s.phase = 'guess';
        maybeReveal(room, s);
        return;
      }
      case 'lock_guess': {
        if (s.phase !== 'guess' || p.id === r.targetId || !s.order.includes(p.id)) return 'not_allowed';
        if (!validOpt(r.card, m.opt)) return 'bad_request';
        if (p.id in r.guesses) return; // idempotent: tebakan pertama yang terkunci tetap berlaku
        r.guesses[p.id] = m.opt;
        maybeReveal(room, s);
        return;
      }
      case 'close_guessing': {
        // Host menutup tebakan walau ada yang belum mengunci.
        if (!host || s.phase !== 'guess') return 'not_allowed';
        if (!Object.keys(r.guesses).length) r.skipped = true;
        toReveal(room, s);
        return;
      }
      case 'skip': {
        if (s.phase === 'reveal') return 'not_allowed';
        if (p.id !== r.targetId && !host) return 'not_allowed';
        r.skipped = true;
        toReveal(room, s);
        return;
      }
      case 'next': {
        if (s.phase !== 'reveal') return 'not_allowed';
        if (p.id !== r.targetId && !host) return 'not_allowed';
        finishRound(s);
        s.index += 1;
        if (s.index >= s.total) {
          room.complete();
          return;
        }
        s.cur = newRound(s);
        s.phase = 'answer';
        return;
      }
      default:
        return 'bad_request';
    }
  },

  onPlayersChanged(room) {
    const s = room.session;
    if (!s || room.phase !== 'playing') return;
    const alive = new Set(room.players.map((p) => p.id));
    if (s.phase !== 'reveal' && !alive.has(s.cur.targetId)) {
      s.cur.skipped = true;
      toReveal(room, s);
      return;
    }
    maybeReveal(room, s);
  },

  view(room, p) {
    const s = room.session;
    const r = s.cur;
    const guessers = guessersOf(room, s).map((x) => x.id);
    const out = {
      index: s.index,
      total: s.total,
      phase: s.phase,
      rid: String(s.index),
      round: {
        targetId: r.targetId,
        guessers,
        card: { id: r.card.id, text: r.card.text, topic: r.card.topic, options: r.card.options },
        answerLocked: r.answer !== null,
        lockedGuessers: Object.keys(r.guesses),
        myAnswer: p.id === r.targetId ? r.answer : null,
        myGuess: p.id in r.guesses ? r.guesses[p.id] : null,
        reveal: null,
      },
    };
    if (s.phase === 'reveal') {
      out.round.reveal = {
        skipped: r.skipped,
        answer: r.skipped ? null : r.answer,
        guesses: r.skipped ? {} : r.guesses,
        results: r.results,
      };
    }
    return out;
  },

  summary(room) {
    const s = room.session;
    const names = {};
    for (const [id, nick] of room.nicks) names[id] = nick;
    const dirs = new Map();
    for (const h of s.history) {
      if (h.skipped) continue;
      for (const [gid, ok] of Object.entries(h.results)) {
        const key = gid + '>' + h.targetId;
        if (!dirs.has(key)) dirs.set(key, { guesserId: gid, targetId: h.targetId, valid: 0, correct: 0 });
        const d = dirs.get(key);
        d.valid += 1;
        if (ok) d.correct += 1;
      }
    }
    const directions = [...dirs.values()].map((d) => {
      const pct = pctOf(d.correct, d.valid);
      return { ...d, pct, tier: kenalTier(pct) };
    });
    // Akurasi per target: rata-rata tebakan semua orang tentang target itu.
    const byTarget = new Map();
    for (const d of directions) {
      const t = byTarget.get(d.targetId) || { targetId: d.targetId, valid: 0, correct: 0 };
      t.valid += d.valid;
      t.correct += d.correct;
      byTarget.set(d.targetId, t);
    }
    const targets = [...byTarget.values()].map((t) => {
      const pct = pctOf(t.correct, t.valid);
      return { ...t, pct, tier: kenalTier(pct) };
    });
    return { names, directions, targets, rounds: s.history.length, skipped: s.history.filter((h) => h.skipped).length };
  },
};
