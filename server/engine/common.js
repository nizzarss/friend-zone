// Fungsi bantu bersama untuk mesin game.
import { GAMES } from '../../shared/games.js';

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const playerById = (room, id) => room.players.find((p) => p.id === id) || null;
export const isHost = (room, p) => room.hostId === p.id;
export const connectedPlayers = (room) => room.players.filter((p) => p.connected);

// Pemain berikutnya (urutan bergabung) setelah `id` yang masih terhubung.
// Kalau `id` sudah tidak ada, pakai posisi `fallbackIdx` supaya giliran tidak melompat jauh.
export function nextConnectedAfter(room, id, fallbackIdx = 0) {
  const ps = room.players;
  if (!ps.length) return null;
  let idx = ps.findIndex((p) => p.id === id);
  if (idx < 0) idx = fallbackIdx - 1;
  for (let i = 1; i <= ps.length; i++) {
    const cand = ps[(((idx + i) % ps.length) + ps.length) % ps.length];
    if (cand.connected) return cand;
  }
  return ps[(((idx + 1) % ps.length) + ps.length) % ps.length];
}

export const pctOf = (n, d) => (d > 0 ? Math.round((n / d) * 100) : null);

// Jumlah ronde dari pengaturan host, dibatasi jumlah kartu.
export function roundsFor(room, gameId, cardCount) {
  const cfg = GAMES[gameId].rounds;
  let want = Number(room.settings.rounds);
  if (!cfg || !cfg.options.includes(want)) want = cfg ? cfg.def : cardCount;
  return Math.min(want, cardCount);
}

// PRD 4.3: predikat Tes Kepekaan berdasarkan persentase arah.
export function kepekaanTier(pct) {
  if (pct === null) return { id: 'none', label: 'Belum cukup jawaban', level: 0 };
  if (pct < 30) return { id: 'hilang', label: 'Sinyal Hilang', level: 1 };
  if (pct < 50) return { id: 'cari', label: 'Lagi Cari Frekuensi', level: 2 };
  if (pct < 70) return { id: 'nangkep', label: 'Mulai Nangkep', level: 3 };
  if (pct < 90) return { id: 'peka', label: 'Radar Peka', level: 4 };
  return { id: 'max', label: 'Peka Level Max', level: 5 };
}

// PRD 4.6: predikat Seberapa Kenal Kalian.
export function kenalTier(pct) {
  if (pct === null) return { id: 'none', label: 'Belum cukup jawaban', level: 0 };
  if (pct < 20) return { id: 'asing', label: 'Asing Banget', level: 1 };
  if (pct < 40) return { id: 'belum', label: 'Belum Kenal', level: 2 };
  if (pct < 60) return { id: 'kenal', label: 'Kenal', level: 3 };
  if (pct < 80) return { id: 'dekat', label: 'Dekat', level: 4 };
  return { id: 'bestie', label: 'Bestie', level: 5 };
}

// PRD 4.4: nama hasil kreatif yang tidak menyatakan hubungan pasti berhasil atau gagal.
export function cocokTier(pct) {
  if (pct === null) return { id: 'none', label: 'Belum cukup jawaban', level: 0 };
  if (pct < 30) return { id: 'dunia', label: 'Dua Dunia, Banyak Cerita', level: 1 };
  if (pct < 50) return { id: 'beda', label: 'Beda Gaya, Seru Dipelajari', level: 2 };
  if (pct < 70) return { id: 'nyambung', label: 'Beda Dikit, Tetap Nyambung', level: 3 };
  if (pct < 90) return { id: 'frekuensi', label: 'Satu Frekuensi', level: 4 };
  return { id: 'kembar', label: 'Kembar Rasa', level: 5 };
}
