// Siapa yang Paling... (PRD 4.7). Voting rahasia, hasil dibuka serentak, seri = beberapa pemenang.
import { SIAPA } from '../data/cards.js';
import { shuffle, isHost, roundsFor } from './common.js';

function tally(room, s) {
  const counts = {};
  for (const p of room.players) counts[p.id] = 0;
  for (const target of Object.values(s.votes)) if (target in counts) counts[target] += 1;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const max = Math.max(0, ...Object.values(counts));
  const winners = max > 0 ? Object.keys(counts).filter((id) => counts[id] === max) : [];
  return { counts, total, max, winners };
}

function toReveal(room, s) {
  const t = tally(room, s);
  s.result = { ...t, card: s.cards[s.index], tie: t.winners.length > 1 };
  s.phase = 'reveal';
}

function maybeReveal(room, s) {
  if (s.phase !== 'voting') return;
  const connected = room.players.filter((p) => p.connected);
  if (connected.length && connected.every((p) => p.id in s.votes)) toReveal(room, s);
}

function archive(room, s) {
  const r = s.result;
  s.history.push({
    cardId: r.card.id,
    text: r.card.text,
    title: r.card.title,
    fx: r.card.fx,
    winners: r.winners,
    counts: r.counts,
    skipped: !!r.skipped,
  });
}

export default {
  id: 'siapa',

  start(room) {
    const cards = shuffle(SIAPA, room.rng);
    room.session = {
      cards,
      total: roundsFor(room, 'siapa', cards.length),
      index: 0,
      phase: 'voting', // voting -> reveal
      votes: {}, // voterId -> targetId (terkunci; satu suara per pemain)
      result: null,
      history: [],
    };
  },

  act(room, p, m) {
    const s = room.session;
    if (m.r !== undefined && m.r !== String(s.index)) return 'stale';
    const host = isHost(room, p);
    switch (m.a) {
      case 'lock': {
        if (s.phase !== 'voting') return 'not_allowed';
        if (p.id in s.votes) return; // idempotent: tap ganda tidak membuat suara kedua
        if (!room.players.some((x) => x.id === m.target)) return 'bad_request'; // boleh memilih diri sendiri
        s.votes[p.id] = m.target;
        maybeReveal(room, s);
        return;
      }
      case 'close': {
        if (!host || s.phase !== 'voting') return 'not_allowed';
        toReveal(room, s);
        return;
      }
      case 'skip_card': {
        // Opsi lewati untuk label yang terasa sensitif bagi kelompok tertentu.
        if (!host || s.phase !== 'voting') return 'not_allowed';
        s.result = { ...tally(room, { votes: {} }), card: s.cards[s.index], tie: false, skipped: true };
        s.phase = 'reveal';
        return;
      }
      case 'next': {
        if (!host || s.phase !== 'reveal') return 'not_allowed';
        archive(room, s);
        s.index += 1;
        if (s.index >= s.total) {
          room.complete();
          return;
        }
        s.votes = {};
        s.result = null;
        s.phase = 'voting';
        return;
      }
      default:
        return 'bad_request';
    }
  },

  onPlayersChanged(room) {
    const s = room.session;
    if (!s || room.phase !== 'playing') return;
    // Suara dari pemain yang sudah keluar dibuang.
    const alive = new Set(room.players.map((p) => p.id));
    if (s.phase === 'voting') for (const id of Object.keys(s.votes)) if (!alive.has(id)) delete s.votes[id];
    maybeReveal(room, s);
  },

  view(room, p) {
    const s = room.session;
    const card = s.cards[s.index];
    const out = {
      index: s.index,
      total: s.total,
      phase: s.phase,
      rid: String(s.index),
      card: { id: card.id, text: card.text },
      voted: Object.keys(s.votes).filter((id) => room.players.some((x) => x.id === id)), // siapa sudah memilih, bukan pilihannya
      myVote: s.phase === 'voting' && p.id in s.votes ? s.votes[p.id] : null,
      result: null,
    };
    if (s.phase === 'reveal') {
      const r = s.result;
      out.result = {
        skipped: !!r.skipped,
        title: r.skipped ? null : card.title,
        fx: card.fx,
        counts: r.counts,
        winners: r.winners,
        tie: r.tie,
        total: r.total,
        enough: r.total > 0,
      };
    }
    return out;
  },

  summary(room) {
    const s = room.session;
    const names = {};
    for (const [id, nick] of room.nicks) names[id] = nick;
    // Ringkasan sesi per ronde. Tidak ada peringkat permanen antarorang (PRD 4.7).
    return { names, rounds: s.history.filter((h) => !h.skipped) };
  },
};
