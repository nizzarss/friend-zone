// Tes Kepekaan (PRD 4.3). Satu orang menjawab privat, satu orang menebak.
// Skor dihitung per arah (penebak -> pemilik jawaban) dan tidak digabung.
import { KEPEKAAN } from '../data/cards.js';
import { shuffle, isHost, pctOf, roundsFor, kepekaanTier } from './common.js';

function newRound(s) {
  const n = s.order.length;
  return {
    card: s.cards[s.index],
    answererId: s.order[s.index % n],
    guesserId: s.order[(s.index + 1) % n],
    answer: null,
    guess: null,
    skipped: false,
    correct: null,
  };
}

function finishRound(s) {
  const r = s.cur;
  s.history.push({
    cardId: r.card.id,
    topic: r.card.topic,
    answererId: r.answererId,
    guesserId: r.guesserId,
    skipped: r.skipped,
    correct: r.skipped ? null : r.correct,
  });
}

function toReveal(s) {
  const r = s.cur;
  r.correct = !r.skipped && r.answer !== null && r.guess !== null && r.answer === r.guess;
  s.phase = 'reveal';
}

function validOpt(card, opt) {
  return Number.isInteger(opt) && opt >= 0 && opt < card.options.length;
}

export default {
  id: 'kepekaan',

  start(room) {
    const cards = shuffle(KEPEKAAN, room.rng);
    const s = {
      order: room.players.map((p) => p.id),
      cards,
      total: roundsFor(room, 'kepekaan', cards.length),
      index: 0,
      phase: 'answer', // answer -> guess -> reveal
      history: [],
      cur: null,
    };
    s.cur = newRound(s);
    room.session = s;
  },

  act(room, p, m) {
    const s = room.session;
    if (m.r !== undefined && m.r !== String(s.index)) return 'stale';
    const r = s.cur;
    const host = isHost(room, p);
    const participant = p.id === r.answererId || p.id === r.guesserId;
    switch (m.a) {
      case 'lock_answer': {
        if (s.phase !== 'answer' || p.id !== r.answererId) return 'not_allowed';
        if (!validOpt(r.card, m.opt)) return 'bad_request';
        r.answer = m.opt; // terkunci di server; tidak dikirim ke pemain lain sebelum reveal
        s.phase = 'guess';
        return;
      }
      case 'lock_guess': {
        if (s.phase !== 'guess' || p.id !== r.guesserId) return 'not_allowed';
        if (!validOpt(r.card, m.opt)) return 'bad_request';
        r.guess = m.opt;
        toReveal(s);
        return;
      }
      case 'skip': {
        if (s.phase === 'reveal') return 'not_allowed';
        if (!participant && !host) return 'not_allowed';
        r.skipped = true; // tidak masuk denominator skor
        toReveal(s);
        return;
      }
      case 'next': {
        if (s.phase !== 'reveal') return 'not_allowed';
        if (!participant && !host) return 'not_allowed';
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
    const r = s.cur;
    if (s.phase !== 'reveal' && (!alive.has(r.answererId) || !alive.has(r.guesserId))) {
      r.skipped = true;
      toReveal(s);
    }
  },

  view(room, p) {
    const s = room.session;
    const r = s.cur;
    const participant = p.id === r.answererId || p.id === r.guesserId;
    const out = {
      index: s.index,
      total: s.total,
      phase: s.phase,
      rid: String(s.index),
      round: {
        answererId: r.answererId,
        guesserId: r.guesserId,
        card: { id: r.card.id, text: r.card.text, topic: r.card.topic, options: r.card.options },
        answerLocked: r.answer !== null,
        guessLocked: r.guess !== null,
        // Hanya pemilik masing-masing yang melihat pilihannya sendiri sebelum reveal.
        myAnswer: p.id === r.answererId ? r.answer : null,
        myGuess: p.id === r.guesserId ? r.guess : null,
        reveal: null,
      },
    };
    if (s.phase === 'reveal') {
      out.round.reveal = participant
        ? { skipped: r.skipped, correct: r.correct, answer: r.answer, guess: r.guess }
        : { skipped: r.skipped, correct: r.correct, answer: null, guess: null };
    }
    return out;
  },

  summary(room) {
    const s = room.session;
    const names = {};
    for (const [id, nick] of room.nicks) names[id] = nick;
    const dirs = new Map();
    for (const h of s.history) {
      const key = h.guesserId + '>' + h.answererId;
      if (!dirs.has(key)) dirs.set(key, { guesserId: h.guesserId, answererId: h.answererId, valid: 0, correct: 0, good: [], learn: [] });
      const d = dirs.get(key);
      if (h.skipped) continue;
      d.valid += 1;
      if (h.correct) {
        d.correct += 1;
        d.good.push(h.topic);
      } else d.learn.push(h.topic);
    }
    const directions = [...dirs.values()].map((d) => {
      const pct = pctOf(d.correct, d.valid);
      return { ...d, pct, tier: kepekaanTier(pct) };
    });
    return {
      names,
      directions,
      skipped: s.history.filter((h) => h.skipped).length,
      rounds: s.history.length,
    };
  },
};
