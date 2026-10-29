# Friend Zone

Game kumpul-kumpul lewat tautan untuk anak muda: satu HP satu pemain, tanpa akun. Tujuh game, tiap game punya tema visual sendiri.

| Game | Tema | Pemain min. |
|---|---|---|
| Truth or Dare | hitam, kuning, oranye | 3 |
| Deep Talk | senja lavender | 2 |
| Tes Kepekaan | radar hijau-hitam | 2 |
| Seberapa Cocok Kalian? | merah hati | 2 |
| Relationship Talk | terakota hangat | 2 |
| Seberapa Kenal Kalian | biru dan kuning | 2 |
| Siapa yang Paling... | ungu dan lime | 2 |

Hasil tiap game punya animasi sendiri: radar dan blip (Kepekaan), hati yang terbelah lalu menyatu (Cocok), kartu profil yang terisi dan stempel (Kenal), podium dan predikat (Siapa).

## Menjalankan

Butuh Node.js 18 atau lebih baru (disarankan 22).

```bash
npm install
npm start          # http://localhost:3000
npm test           # 19 tes: mesin game, privasi jawaban, WebSocket
```

Buka di dua tab atau dua HP, buat room, lalu gabung lewat tautan atau kode. Variabel lingkungan:

| Nama | Fungsi | Bawaan |
|---|---|---|
| `PORT` | port server | 3000 |
| `HOST` | alamat bind | 0.0.0.0 |
| `TRUST_PROXY` | `1` bila di belakang proxy (Render, Railway, Nginx), supaya batas laju memakai IP asli | mati |
| `ALLOWED_ORIGINS` | daftar origin tambahan untuk WebSocket, pisah koma | hanya host yang sama |

## Mengunggah ke GitHub

```bash
cd friend-zone
git init
git add .
git commit -m "Friend Zone: versi awal"
git branch -M main
git remote add origin https://github.com/USERNAME/friend-zone.git
git push -u origin main
```

## Deploy

GitHub Pages tidak bisa dipakai, karena game butuh server WebSocket. Pilih salah satu:

- **Render**: New > Blueprint > pilih repo (file `render.yaml` sudah siap).
- **Railway / Fly.io / VPS**: `npm install` lalu `npm start`, atau pakai `Dockerfile`.
- Pastikan platform mendukung WebSocket (semua di atas mendukung) dan HTTPS (browser menyambung lewat `wss://` otomatis).

## Struktur

```
server/        HTTP statis + WebSocket, room, dan mesin tiap game (otoritatif)
server/engine/ satu file per game; jawaban rahasia tidak pernah dikirim sebelum reveal
server/data/   bank kartu (konten dari PRD)
shared/        metadata game dan aturan Dare, dipakai server dan klien
client/        JS modul tanpa build: css/ (tema), js/screens/ (layar per game)
tests/         node:test
```

## Catatan keputusan

- **Server otoritatif.** Kunci jawaban, skor, dan reveal dihitung di server. Tiap pemain hanya menerima tampilan miliknya. Jawaban Seberapa Cocok dihapus dari memori setelah hasil keluar.
- **Reconnect.** Token sesi disimpan di browser (hash-nya saja di server), jadi refresh atau putus sinyal tidak mengeluarkan pemain.
- **Batas dan perlindungan.** Batas laju buat/gabung room, batas pesan per koneksi, ukuran pesan maksimal 4 KB, cek Origin, CSP, pencegahan path traversal. Room kedaluwarsa 3 jam, atau 10 menit setelah semua pemain putus. Maksimal 12 pemain per room.
- **Room disimpan di memori satu proses.** Restart server menghapus semua room. Untuk lebih dari satu instance, perlu penyimpanan bersama (Redis) dan sticky session.
- **Truth or Dare.** Teks aturan Dare tidak ditampilkan di kartu supaya layar bersih. Aturan tetap bisa dibuka lewat ikon info (i) di bagian atas layar. PRD 4.1 meminta aturan itu tersedia, jadi cek apakah penempatan ini sudah sesuai.
- **Gerak.** Animasi mengikuti pengaturan "Reduce motion" perangkat; bisa diubah di Pengaturan (Auto, Penuh, Hemat).
- **Seberapa Cocok.** Semua skor memakai komposisi animasi yang sama; hanya jarak akhir kedua belahan hati yang berbeda, dan nama hasilnya netral (sesuai PRD, tidak mempermalukan skor rendah).

## Konten yang dibuat untuk mekanisme (perlu ditinjau)

Teks kartu dari PRD dipakai apa adanya. Bagian berikut ditulis agar game bisa berjalan, dan perlu ditinjau tim produk sebelum rilis (ditandai `DIBUAT UNTUK MEKANISME` di `server/data/cards.js`):

- pilihan jawaban Seberapa Kenal (kecuali KF03, KF05, KF07, KF10, KF12 yang ada di PRD),
- label topik singkat tiap kartu tebak-tebakan,
- bahan obrolan Seberapa Cocok,
- pembagian tingkat Deep Talk (1-10 Ringan, 11-20 Personal, 21-30 Lebih Dalam),
- nama hasil Seberapa Cocok.

Library pihak ketiga: `ws` (WebSocket server, MIT). Pembuat QR memakai bundel kecil di `client/vendor/qrcode.js` (berbasis QRCode for JavaScript, MIT).
