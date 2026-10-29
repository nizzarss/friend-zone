// Truth or Dare (PRD 4.1). Minimal 3 pemain, giliran berurutan, tanpa skor.
import { TRUTH, DARE } from '../data/cards.js';
import { shuffle, isHost, nextConnectedAfter } from './common.js';

function draw(room, s, kind) {
  if (!s.decks[kind].length) s.decks[kind] = shuffle(kind === 'truth' ? TRUTH : DARE, room.rng);
  return s.decks[kind].pop();
}

function needConfirms(room, s) {
  const others = room.players.filter((p) => p.connected && p.id !== s.activeId).length;
  return others === 0 ? 0 : Math.max(1, Math.ceil(others / 2));
}

function advance(room, s, skipped) {
  s.played += skipped ? 0 : 1;
  s.skipped += skipped ? 1 : 0;
  s.round += 1;
  const next = nextConnectedAfter(room, s.activeId, s.activeIdx);
  s.activeId = next.id;
  s.activeIdx = room.players.indexOf(next);
  s.phase = 'choose';
  s.kind = null;
  s.card = null;
  s.confirms = [];
}

export default {
  id: 'tod',

  start(room) {
    const first = room.players.find((p) => p.connected) || room.players[0];
    room.session = {
      round: 1,
      phase: 'choose', // choose -> card
      activeId: first.id,
      activeIdx: room.players.indexOf(first),
      kind: null,
      card: null,
      confirms: [],
      played: 0,
      skipped: 0,
      decks: { truth: shuffle(TRUTH, room.rng), dare: shuffle(DARE, room.rng) },
    };
  },

  act(room, p, m) {
    const s = room.session;
    if (m.r !== undefined && m.r !== s.round) return 'stale';
    const host = isHost(room, p);
    switch (m.a) {
      case 'choose': {
        if (s.phase !== 'choose' || p.id !== s.activeId) return 'not_your_turn';
        if (m.kind !== 'truth' && m.kind !== 'dare') return 'bad_request';
        s.kind = m.kind;
        s.card = draw(room, s, m.kind);
        s.phase = 'card';
        s.confirms = [];
        return;
      }
      case 'confirm': {
        // Dare: pemain lain mengonfirmasi penyelesaian.
        if (s.phase !== 'card' || s.kind !== 'dare' || p.id === s.activeId) return 'not_allowed';
        if (!s.confirms.includes(p.id)) s.confirms.push(p.id);
        if (s.confirms.length >= needConfirms(room, s)) advance(room, s, false);
        return;
      }
      case 'done': {
        if (s.phase !== 'card') return 'not_allowed';
        // Truth: pemain aktif selesai bicara. Dare: hanya host yang boleh memaksa lanjut.
        if (s.kind === 'truth' && (p.id === s.activeId || host)) return void advance(room, s, false);
        if (s.kind === 'dare' && host) return void advance(room, s, false);
        return 'not_allowed';
      }
      case 'skip': {
        // Skip tidak memberi poin atau penalti.
        if (p.id !== s.activeId && !host) return 'not_allowed';
        return void advance(room, s, true);
      }
      default:
        return 'bad_request';
    }
  },

  onPlayersChanged(room) {
    const s = room.session;
    if (!s) return;
    if (!room.players.some((p) => p.id === s.activeId)) advance(room, s, true);
    else if (s.phase === 'card' && s.kind === 'dare' && s.confirms.length >= needConfirms(room, s) && s.confirms.length > 0) advance(room, s, false);
  },

  view(room) {
    const s = room.session;
    return {
      round: s.round,
      phase: s.phase,
      activeId: s.activeId,
      kind: s.kind,
      card: s.card,
      confirms: s.confirms.filter((id) => room.players.some((p) => p.id === id)),
      need: needConfirms(room, s),
    };
  },

  summary(room) {
    const s = room.session;
    return { rounds: s.played, skipped: s.skipped };
  },
};
