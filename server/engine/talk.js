// Deep Talk (PRD 4.2) dan Relationship Talk (PRD 4.5).
// Satu kartu yang sama untuk semua, dijawab bergantian. Tanpa skor. Semua boleh skip.
import { DEEP, REL } from '../data/cards.js';
import { shuffle, isHost } from './common.js';

function buildDeck(kind, rng) {
  if (kind === 'deep') {
    // Urutan tidak memaksa topik emosional terlalu cepat: Ringan, Personal, lalu Lebih Dalam.
    const out = [];
    for (let t = 0; t < 3; t++) out.push(...shuffle(DEEP.filter((c) => c.tierIndex === t), rng));
    return out;
  }
  return shuffle(REL, rng);
}

// Antrean pembicara diputar tiap kartu supaya bukan orang yang sama selalu mulai duluan.
function makeQueue(room, offset) {
  const ids = room.players.map((p) => p.id);
  if (!ids.length) return [];
  const k = offset % ids.length;
  return ids.slice(k).concat(ids.slice(0, k));
}

function nextCard(room, s, skipped) {
  if (skipped) s.skipped += 1;
  else s.done += 1;
  s.index += 1;
  s.again = 0;
  if (s.index >= s.deck.length) {
    s.index = s.deck.length - 1;
    room.complete();
    return;
  }
  s.queue = makeQueue(room, s.index);
  s.pos = 0;
}

function make(kind) {
  const isRel = kind === 'rel';
  return {
    id: kind,

    start(room) {
      room.session = {
        deck: buildDeck(kind, room.rng),
        index: 0,
        queue: makeQueue(room, 0),
        pos: 0,
        again: 0,
        done: 0,
        skipped: 0,
      };
    },

    act(room, p, m) {
      const s = room.session;
      if (m.r !== undefined && m.r !== s.index + ':' + s.again) return 'stale';
      const host = isHost(room, p);
      const current = s.queue[s.pos];
      switch (m.a) {
        case 'next_speaker': {
          // Pembicara yang sedang giliran (atau host) melanjutkan ke orang berikutnya.
          if (s.pos >= s.queue.length) return 'not_allowed';
          if (p.id !== current && !host) return 'not_allowed';
          s.pos += 1;
          return;
        }
        case 'next_card': {
          if (!host) return 'not_allowed';
          return void nextCard(room, s, false);
        }
        case 'skip_card': {
          if (!host) return 'not_allowed';
          return void nextCard(room, s, true);
        }
        case 'again': {
          // Relationship Talk: Bahas Lagi. Putaran bicara diulang untuk kartu yang sama.
          if (!isRel || !host) return 'not_allowed';
          s.again += 1;
          s.queue = makeQueue(room, s.index + s.again);
          s.pos = 0;
          return;
        }
        default:
          return 'bad_request';
      }
    },

    onPlayersChanged(room) {
      const s = room.session;
      if (!s) return;
      // Buang pemain yang sudah keluar dari antrean, tambahkan yang baru di akhir.
      const alive = new Set(room.players.map((p) => p.id));
      const currentId = s.queue[s.pos];
      const spokenIds = new Set(s.queue.slice(0, s.pos));
      s.queue = s.queue.filter((id) => alive.has(id));
      for (const p of room.players) if (!s.queue.includes(p.id)) s.queue.push(p.id);
      const idx = s.queue.indexOf(currentId);
      s.pos = idx >= 0 ? idx : s.queue.filter((id) => spokenIds.has(id)).length;
    },

    view(room) {
      const s = room.session;
      const card = s.deck[s.index];
      return {
        index: s.index,
        total: s.deck.length,
        rid: s.index + ':' + s.again,
        card: { id: card.id, text: card.text, tier: card.tier || null },
        queue: s.queue,
        pos: s.pos,
        current: s.queue[s.pos] || null,
        allSpoken: s.pos >= s.queue.length,
        again: s.again,
      };
    },

    summary(room) {
      const s = room.session;
      return { rounds: s.done, skipped: s.skipped };
    },
  };
}

export const deepTalk = make('deep');
export const relTalk = make('rel');
