// Uji mesin game dan room tanpa jaringan. Menjalankan: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { Room } from '../server/room.js';
import { kepekaanTier, kenalTier, cocokTier, pctOf } from '../server/engine/common.js';
import { KEPEKAAN, COCOK, KENAL, SIAPA } from '../server/data/cards.js';

// RNG deterministik supaya tes stabil.
function seeded(seed = 7) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function make(game, nicks, settings = {}) {
  const room = new Room({ code: 'TEST-01', game, rng: seeded() });
  Object.assign(room.settings, settings);
  const ps = nicks.map((n) => room.addPlayer(n).player);
  return { room, ps };
}
const act = (room, p, msg) => room.dispatch(p.id, { t: 'act', ...msg });
const start = (room, host) => room.dispatch(host.id, { t: 'start' });

test('room: minimal pemain divalidasi dan hanya host yang boleh memulai', () => {
  const { room, ps } = make('tod', ['A', 'B']);
  assert.equal(start(room, ps[1]), 'not_allowed');
  assert.equal(start(room, ps[0]), 'min_players');
  room.addPlayer('C');
  assert.equal(start(room, ps[0]), undefined);
  assert.equal(room.phase, 'playing');
  assert.equal(start(room, ps[0]), undefined, 'start kedua bersifat idempotent');
});

test('room: nama panggilan unik, dibersihkan, dan token reconnect valid', () => {
  const room = new Room({ code: 'TEST-02', game: 'deep' });
  const a = room.addPlayer('  Dinda <b>  ');
  const b = room.addPlayer('Dinda b');
  assert.equal(a.player.nick, 'Dinda b');
  assert.notEqual(b.player.nick, a.player.nick);
  assert.equal(room.findByToken(a.token).id, a.player.id);
  assert.equal(room.findByToken('salah-token-salah-token'), null);
  room.setConnected(a.player.id, false);
  assert.equal(room.view(b.player.id).players[0].connected, false);
});

test('room: host keluar memindahkan host, kick hanya oleh host', () => {
  const { room, ps } = make('deep', ['A', 'B', 'C']);
  assert.equal(room.dispatch(ps[1].id, { t: 'kick', id: ps[2].id }), 'not_allowed');
  room.dispatch(ps[0].id, { t: 'kick', id: ps[2].id });
  assert.equal(room.players.length, 2);
  room.removePlayer(ps[0].id);
  assert.equal(room.hostId, ps[1].id);
});

test('ToD: pilih, dare dikonfirmasi pemain lain, skip tanpa penalti', () => {
  const { room, ps } = make('tod', ['A', 'B', 'C', 'D']);
  start(room, ps[0]);
  const v0 = room.view(ps[0].id).session;
  assert.equal(v0.phase, 'choose');
  assert.equal(v0.activeId, ps[0].id);
  assert.equal(act(room, ps[1], { a: 'choose', kind: 'dare', r: 1 }), 'not_your_turn');
  assert.equal(act(room, ps[0], { a: 'choose', kind: 'dare', r: 1 }), undefined);
  let v = room.view(ps[2].id).session;
  assert.equal(v.phase, 'card');
  assert.equal(v.kind, 'dare');
  assert.ok(v.card.text);
  assert.equal(v.need, 2, '3 pemain lain: perlu 2 konfirmasi');
  assert.equal(act(room, ps[0], { a: 'confirm', r: 1 }), 'not_allowed', 'pemain aktif tidak boleh konfirmasi sendiri');
  act(room, ps[1], { a: 'confirm', r: 1 });
  act(room, ps[1], { a: 'confirm', r: 1 }); // tap ganda
  v = room.view(ps[1].id).session;
  assert.equal(v.confirms.length, 1, 'konfirmasi ganda tidak dihitung dua kali');
  act(room, ps[2], { a: 'confirm', r: 1 });
  v = room.view(ps[1].id).session;
  assert.equal(v.round, 2);
  assert.equal(v.activeId, ps[1].id, 'giliran berpindah berurutan');
  assert.equal(act(room, ps[1], { a: 'choose', kind: 'truth', r: 2 }), undefined);
  assert.equal(act(room, ps[1], { a: 'skip', r: 2 }), undefined);
  assert.equal(room.view(ps[0].id).session.round, 3);
  assert.equal(act(room, ps[2], { a: 'choose', kind: 'truth', r: 2 }), 'stale', 'pesan terlambat ditolak');
});

test('Deep Talk: pembicara bergantian, hanya host yang lanjut kartu, tanpa skor', () => {
  const { room, ps } = make('deep', ['A', 'B', 'C']);
  start(room, ps[0]);
  let v = room.view(ps[0].id).session;
  assert.equal(v.card.tier, 'Ringan');
  assert.equal(v.queue.length, 3);
  assert.equal(act(room, ps[2], { a: 'next_speaker', r: v.rid }), 'not_allowed');
  act(room, ps[0], { a: 'next_speaker', r: v.rid });
  act(room, ps[1], { a: 'next_speaker', r: v.rid });
  act(room, ps[2], { a: 'next_speaker', r: v.rid });
  v = room.view(ps[0].id).session;
  assert.equal(v.allSpoken, true);
  assert.equal(act(room, ps[1], { a: 'next_card', r: v.rid }), 'not_allowed');
  act(room, ps[0], { a: 'next_card', r: v.rid });
  v = room.view(ps[0].id).session;
  assert.equal(v.index, 1);
  assert.equal(v.pos, 0);
  assert.equal(act(room, ps[0], { a: 'again', r: v.rid }), 'not_allowed', 'Bahas Lagi hanya di Relationship Talk');
});

test('Relationship Talk: Bahas Lagi mengulang putaran pada kartu yang sama', () => {
  const { room, ps } = make('rel', ['A', 'B']);
  start(room, ps[0]);
  let v = room.view(ps[0].id).session;
  const cardId = v.card.id;
  act(room, ps[0], { a: 'next_speaker', r: v.rid });
  act(room, ps[0], { a: 'again', r: v.rid });
  v = room.view(ps[1].id).session;
  assert.equal(v.card.id, cardId);
  assert.equal(v.pos, 0);
  assert.equal(v.again, 1);
});

test('Tes Kepekaan: jawaban rahasia tidak bocor, skor per arah, skip keluar dari denominator', () => {
  const { room, ps } = make('kepekaan', ['A', 'B']);
  start(room, ps[0]);
  const byId = Object.fromEntries(ps.map((p) => [p.id, p]));
  let correct = 0;
  let valid = 0;
  const seenDirections = new Set();
  for (let i = 0; i < 12; i++) {
    let v = room.view(ps[0].id).session;
    const ans = byId[v.round.answererId];
    const gs = byId[v.round.guesserId];
    seenDirections.add(gs.id + '>' + ans.id);
    if (i === 3) {
      // satu ronde dilewati
      assert.equal(act(room, ans, { a: 'skip', r: v.rid }), undefined);
    } else {
      assert.equal(act(room, ans, { a: 'lock_answer', opt: 0, r: v.rid }), undefined);
      act(room, ans, { a: 'lock_answer', opt: 1, r: v.rid }); // upaya ganti jawaban ditolak (fase sudah guess)
      const gv = room.view(gs.id).session;
      assert.equal(gv.round.myAnswer, null, 'penebak tidak boleh melihat jawaban sebelum reveal');
      assert.equal(gv.round.reveal, null);
      assert.ok(!JSON.stringify(gv).includes('"answer":0'));
      assert.equal(gv.round.answerLocked, true);
      const ok = i % 4 !== 0 && i !== 11; // sebagian tebakan salah
      assert.equal(act(room, gs, { a: 'lock_guess', opt: ok ? 0 : 1, r: v.rid }), undefined);
      valid += 1;
      if (ok) correct += 1;
      const rv = room.view(ans.id).session.round.reveal;
      assert.equal(rv.correct, ok);
    }
    act(room, ans, { a: 'next', r: v.rid });
  }
  assert.equal(room.phase, 'completed');
  const sum = room.view(ps[0].id).summary;
  const tot = sum.directions.reduce((a, d) => ({ valid: a.valid + d.valid, correct: a.correct + d.correct }), { valid: 0, correct: 0 });
  assert.equal(tot.valid, valid);
  assert.equal(tot.correct, correct);
  assert.equal(sum.skipped, 1);
  assert.equal(sum.directions.length, 2, 'dua arah dihitung terpisah');
  for (const d of sum.directions) assert.equal(d.pct, pctOf(d.correct, d.valid));
});

test('Tes Kepekaan: rentang predikat sesuai PRD', () => {
  assert.equal(kepekaanTier(0).label, 'Sinyal Hilang');
  assert.equal(kepekaanTier(29).label, 'Sinyal Hilang');
  assert.equal(kepekaanTier(30).label, 'Lagi Cari Frekuensi');
  assert.equal(kepekaanTier(50).label, 'Mulai Nangkep');
  assert.equal(kepekaanTier(70).label, 'Radar Peka');
  assert.equal(kepekaanTier(90).label, 'Peka Level Max');
  assert.equal(kepekaanTier(100).label, 'Peka Level Max');
  assert.equal(kepekaanTier(null).label, 'Belum cukup jawaban');
});

test('Seberapa Kenal: rentang predikat sesuai PRD', () => {
  const l = (p) => kenalTier(p).label;
  assert.deepEqual([0, 19, 20, 39, 40, 59, 60, 79, 80, 100].map(l), [
    'Asing Banget', 'Asing Banget', 'Belum Kenal', 'Belum Kenal', 'Kenal', 'Kenal', 'Dekat', 'Dekat', 'Bestie', 'Bestie',
  ]);
  assert.equal(cocokTier(null).label, 'Belum cukup jawaban');
});

test('Seberapa Cocok: jawaban privat, persentase dari jawaban sama, jawaban mentah dibuang', () => {
  const { room, ps } = make('cocok', ['A', 'B']);
  start(room, ps[0]);
  for (let q = 0; q < 12; q++) {
    act(room, ps[0], { a: 'answer', q, opt: 0 });
    act(room, ps[1], { a: 'answer', q, opt: q < 8 ? 0 : 1 }); // 8 sama, 4 beda
  }
  const vb = room.view(ps[1].id).session;
  assert.equal(vb.mine[0], 0);
  assert.equal(JSON.stringify(room.view(ps[1].id)).includes('"locked":[]'), true);
  act(room, ps[0], { a: 'lock' });
  act(room, ps[0], { a: 'lock' }); // idempotent
  assert.equal(room.phase, 'playing', 'belum semua mengunci');
  act(room, ps[1], { a: 'answer', q: 0, opt: 1 });
  act(room, ps[1], { a: 'lock' });
  assert.equal(room.phase, 'completed');
  const sum = room.view(ps[0].id).summary;
  assert.equal(sum.pairs.length, 1);
  const pr = sum.pairs[0];
  // jawaban B untuk q=0 sempat diganti menjadi 1 sebelum mengunci -> 7 sama
  assert.equal(pr.valid, 12);
  assert.equal(pr.sameCount, 7);
  assert.equal(pr.pct, 58);
  assert.equal(pr.tier.label, 'Beda Dikit, Tetap Nyambung');
  assert.equal(pr.diff.length, 5);
  assert.deepEqual(room.session.answers, {}, 'jawaban mentah dihapus setelah hasil');
});

test('Seberapa Cocok: pertanyaan yang dilewati keluar dari perhitungan, tanpa jawaban = Belum cukup jawaban', () => {
  const { room, ps } = make('cocok', ['A', 'B']);
  start(room, ps[0]);
  act(room, ps[0], { a: 'answer', q: 0, opt: 1 });
  act(room, ps[1], { a: 'answer', q: 0, opt: 1 });
  act(room, ps[0], { a: 'answer', q: 1, opt: -1 });
  act(room, ps[1], { a: 'answer', q: 1, opt: 2 });
  act(room, ps[0], { a: 'lock' });
  act(room, ps[1], { a: 'lock' });
  const pr = room.view(ps[0].id).summary.pairs[0];
  assert.equal(pr.valid, 1);
  assert.equal(pr.pct, 100);
  const r2 = make('cocok', ['A', 'B']);
  start(r2.room, r2.ps[0]);
  act(r2.room, r2.ps[0], { a: 'lock' });
  act(r2.room, r2.ps[1], { a: 'lock' });
  const p2 = r2.room.view(r2.ps[0].id).summary.pairs[0];
  assert.equal(p2.pct, null);
  assert.equal(p2.tier.label, 'Belum cukup jawaban');
});

test('Seberapa Cocok: detail jawaban pasangan tidak terlihat pemain lain', () => {
  const { room, ps } = make('cocok', ['A', 'B', 'C']);
  start(room, ps[0]);
  for (const p of ps) {
    for (let q = 0; q < 12; q++) act(room, p, { a: 'answer', q, opt: p === ps[2] ? 1 : 0 });
    act(room, p, { a: 'lock' });
  }
  const forC = room.view(ps[2].id).summary.pairs;
  const ab = forC.find((x) => x.aId === ps[0].id && x.bId === ps[1].id);
  assert.equal(ab.same.length, 0, 'C bukan bagian pasangan A-B: detail disembunyikan');
  assert.equal(ab.pct, 100);
  const forA = room.view(ps[0].id).summary.pairs.find((x) => x.aId === ps[0].id && x.bId === ps[1].id);
  assert.equal(forA.same.length, 12);
});

test('Seberapa Kenal: ronde seimbang, tebakan tersembunyi sampai semua mengunci', () => {
  const { room, ps } = make('kenal', ['A', 'B', 'C']);
  start(room, ps[0]);
  const byId = Object.fromEntries(ps.map((p) => [p.id, p]));
  const targets = {};
  let rounds = 0;
  while (room.phase === 'playing') {
    const v = room.view(ps[0].id).session;
    rounds += 1;
    const target = byId[v.round.targetId];
    targets[target.id] = (targets[target.id] || 0) + 1;
    act(room, target, { a: 'lock_answer', opt: 0, r: v.rid });
    const g1 = ps.find((p) => p.id !== target.id);
    const g2 = ps.find((p) => p.id !== target.id && p !== g1);
    act(room, g1, { a: 'lock_guess', opt: 0, r: v.rid });
    const mid = room.view(g2.id).session;
    assert.equal(mid.phase, 'guess', 'belum reveal sebelum semua penebak mengunci');
    assert.equal(mid.round.reveal, null);
    assert.equal(mid.round.lockedGuessers.length, 1);
    assert.equal(act(room, target, { a: 'lock_guess', opt: 0, r: v.rid }), 'not_allowed', 'target tidak boleh menebak');
    act(room, g2, { a: 'lock_guess', opt: 1, r: v.rid });
    assert.equal(room.view(g2.id).session.phase, 'reveal');
    act(room, target, { a: 'next', r: v.rid });
  }
  assert.equal(rounds, 12);
  assert.deepEqual(Object.values(targets), [4, 4, 4], 'tiap orang jadi target sama banyak');
  const sum = room.view(ps[0].id).summary;
  assert.equal(sum.directions.length, 6);
  const dBA = sum.directions.find((d) => d.guesserId === ps[1].id && d.targetId === ps[0].id);
  assert.equal(dBA.pct, 100);
});

test('Siapa yang Paling: suara privat, satu suara per pemain, seri = beberapa pemenang', () => {
  const { room, ps } = make('siapa', ['A', 'B', 'C', 'D'], { rounds: 5 });
  start(room, ps[0]);
  let v = room.view(ps[0].id).session;
  assert.equal(v.phase, 'voting');
  act(room, ps[0], { a: 'lock', target: ps[0].id, r: v.rid }); // boleh memilih diri sendiri
  act(room, ps[0], { a: 'lock', target: ps[1].id, r: v.rid }); // tap ganda atau retry tidak mengganti suara
  const vb = room.view(ps[1].id).session;
  assert.deepEqual(vb.voted, [ps[0].id]);
  assert.equal(vb.myVote, null, 'pilihan orang lain tidak dikirim');
  assert.equal(JSON.stringify(vb).includes(ps[0].id + '"'), true);
  assert.equal(vb.result, null);
  act(room, ps[1], { a: 'lock', target: ps[0].id, r: v.rid });
  act(room, ps[2], { a: 'lock', target: ps[1].id, r: v.rid });
  assert.equal(room.view(ps[0].id).session.phase, 'voting');
  act(room, ps[3], { a: 'lock', target: ps[1].id, r: v.rid });
  v = room.view(ps[0].id).session;
  assert.equal(v.phase, 'reveal');
  assert.equal(v.result.tie, true);
  assert.equal(v.result.winners.length, 2);
  assert.equal(v.result.counts[ps[0].id], 2);
  assert.equal(v.result.counts[ps[1].id], 2);
  assert.ok(v.result.title);
});

test('Siapa yang Paling: host menutup voting, tanpa suara = belum cukup suara, lompati kartu', () => {
  const { room, ps } = make('siapa', ['A', 'B'], { rounds: 5 });
  start(room, ps[0]);
  let v = room.view(ps[0].id).session;
  assert.equal(act(room, ps[1], { a: 'close', r: v.rid }), 'not_allowed');
  act(room, ps[0], { a: 'close', r: v.rid });
  v = room.view(ps[0].id).session;
  assert.equal(v.result.enough, false);
  assert.equal(v.result.winners.length, 0);
  act(room, ps[0], { a: 'next', r: v.rid });
  v = room.view(ps[0].id).session;
  assert.equal(act(room, ps[0], { a: 'skip_card', r: v.rid }), undefined);
  assert.equal(room.view(ps[0].id).session.result.skipped, true);
});

test('Siapa yang Paling: sesi selesai menghasilkan ringkasan per ronde', () => {
  const { room, ps } = make('siapa', ['A', 'B'], { rounds: 5 });
  start(room, ps[0]);
  for (let i = 0; i < 5; i++) {
    const v = room.view(ps[0].id).session;
    act(room, ps[0], { a: 'lock', target: ps[1].id, r: v.rid });
    act(room, ps[1], { a: 'lock', target: ps[1].id, r: v.rid });
    act(room, ps[0], { a: 'next', r: v.rid });
  }
  assert.equal(room.phase, 'completed');
  const sum = room.view(ps[0].id).summary;
  assert.equal(sum.rounds.length, 5);
  assert.equal(sum.rounds[0].winners[0], ps[1].id);
  assert.equal(room.dispatch(ps[0].id, { t: 'to_lobby' }), undefined);
  assert.equal(room.phase, 'lobby');
  assert.equal(room.session, null, 'suara mentah dibuang saat kembali ke lobby');
});

test('Data kartu sesuai PRD: jumlah dan tidak ada ID ganda atau teks kosong', async () => {
  const cards = await import('../server/data/cards.js');
  const counts = { TRUTH: 13, DARE: 10, DEEP: 30, REL: 27, KEPEKAAN: 12, COCOK: 12, KENAL: 12, SIAPA: 20 };
  for (const [k, n] of Object.entries(counts)) {
    assert.equal(cards[k].length, n, k);
    const ids = new Set(cards[k].map((c) => c.id));
    assert.equal(ids.size, n, k + ' ID unik');
    for (const c of cards[k]) assert.ok(c.text && c.text.trim().length > 3, c.id);
  }
  for (const c of [...KEPEKAAN, ...COCOK, ...KENAL]) assert.ok(c.options.length >= 2, c.id);
  for (const c of SIAPA) assert.ok(c.title, c.id);
});
