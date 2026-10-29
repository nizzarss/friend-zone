// Uji integrasi lewat WebSocket sungguhan: protokol, privasi, dan perlindungan dasar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket as WS } from 'ws';
import { createServer } from '../server/index.js';

async function boot() {
  const { server, hub } = createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const close = () => { hub.shutdown(); server.closeAllConnections?.(); server.close(); };
  return { port, close };
}

function client(port) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const inbox = [];
  const waiters = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    inbox.push(m);
    waiters.splice(0).forEach((w) => w());
  };
  const opened = new Promise((r) => (ws.onopen = r));
  const waitFor = async (pred, ms = 2000) => {
    const t0 = Date.now();
    for (;;) {
      const i = inbox.findIndex(pred);
      if (i >= 0) return inbox.splice(i, 1)[0];
      if (Date.now() - t0 > ms) throw new Error('timeout menunggu pesan');
      await new Promise((r) => { waiters.push(r); setTimeout(r, 50); });
    }
  };
  const send = (o) => ws.send(JSON.stringify(o));
  return { ws, opened, waitFor, send, inbox };
}

test('buat room, gabung, resume dengan token, dan jawaban rahasia tidak bocor', async () => {
  const { port, close } = await boot();
  try {
    const a = client(port); const b = client(port);
    await Promise.all([a.opened, b.opened]);
    a.send({ t: 'create', id: 1, game: 'kepekaan', nick: 'Ayu' });
    const ja = await a.waitFor((m) => m.t === 'joined');
    assert.match(ja.code, /^[A-Z]{4}-\d{2}$/);
    b.send({ t: 'join', id: 1, code: ja.code.toLowerCase().replace('-', ' '), nick: 'Budi' });
    const jb = await b.waitFor((m) => m.t === 'joined');
    assert.equal(jb.view.players.length, 2);
    a.send({ t: 'start' });
    const sa = await a.waitFor((m) => m.t === 'state' && m.view.phase === 'playing');
    const rid = sa.view.session.rid;
    const r = sa.view.session.round;
    const [answerer, guesser] = r.answererId === ja.playerId ? [a, b] : [b, a];
    answerer.send({ t: 'act', a: 'lock_answer', opt: 2, r: rid });
    const seen = await guesser.waitFor((m) => m.t === 'state' && m.view.session?.phase === 'guess');
    assert.equal(seen.view.session.round.myAnswer, null);
    assert.ok(!JSON.stringify(seen.view).includes('"answer":2'));
    // koneksi putus lalu resume memakai token
    b.ws.close();
    await a.waitFor((m) => m.t === 'state' && m.view.players.some((p) => !p.connected));
    const b2 = client(port);
    await b2.opened;
    b2.send({ t: 'resume', id: 2, code: jb.code, token: jb.token });
    const again = await b2.waitFor((m) => m.t === 'joined');
    assert.equal(again.playerId, jb.playerId);
    // token salah ditolak
    const c = client(port); await c.opened;
    c.send({ t: 'resume', id: 3, code: jb.code, token: 'x'.repeat(48) });
    const bad = await c.waitFor((m) => m.t === 'error');
    assert.equal(bad.code, 'resume_failed');
    [a, b2, c].forEach((x) => x.ws.close());
  } finally { close(); }
});

test('kode room salah, origin asing, dan pesan rusak ditangani', async () => {
  const { port, close } = await boot();
  try {
    const a = client(port); await a.opened;
    a.send({ t: 'join', id: 9, code: 'ZZZZ-99', nick: 'X' });
    assert.equal((await a.waitFor((m) => m.t === 'error')).code, 'room_not_found');
    a.ws.send('bukan json');
    a.send({ t: 'act', a: 'x' });
    assert.equal((await a.waitFor((m) => m.t === 'error')).code, 'not_in_room');
    a.ws.close();
    const evil = new WS(`ws://127.0.0.1:${port}/ws`, { headers: { Origin: 'https://evil.example' } });
    const outcome = await new Promise((r) => { evil.on('open', () => r('open')); evil.on('error', () => r('blocked')); evil.on('close', () => r('blocked')); });
    const good = new WS(`ws://127.0.0.1:${port}/ws`, { headers: { Origin: `http://127.0.0.1:${port}` } });
    assert.equal(await new Promise((r) => { good.on('open', () => r('open')); good.on('error', () => r('blocked')); }), 'open');
    good.close();
    assert.equal(outcome, 'blocked');
    const res = await fetch(`http://127.0.0.1:${port}/healthz`);
    assert.equal(res.status, 200);
    const trav = await fetch(`http://127.0.0.1:${port}/..%2f..%2fpackage.json`);
    assert.notEqual(trav.status, 200);
  } finally { close(); }
});
