// Metadata 7 game. Dipakai server (validasi) dan client (katalog).
// PRD 2.4 dan 5.2: tiap game punya identitas tema sendiri.

export const GAMES = {
  tod: {
    id: 'tod',
    name: 'Truth or Dare',
    short: 'Truth or Dare',
    min: 3,
    cat: 'seru',
    cards: 23,
    goal: 'Pilih Truth atau Dare. Kartunya muncul di semua HP.',
    rounds: null,
  },
  deep: {
    id: 'deep',
    name: 'Deep Talk',
    short: 'Deep Talk',
    min: 2,
    cat: 'ngobrol',
    cards: 30,
    goal: 'Satu pertanyaan untuk semua, dijawab bergantian tanpa skor.',
    rounds: null,
  },
  kepekaan: {
    id: 'kepekaan',
    name: 'Tes Kepekaan',
    short: 'Tes Kepekaan',
    min: 2,
    cat: 'tebak',
    cards: 12,
    goal: 'Tebak kebiasaan temanmu, lalu lihat seberapa peka kamu.',
    rounds: { options: [6, 12], def: 12 },
  },
  cocok: {
    id: 'cocok',
    name: 'Seberapa Cocok Kalian?',
    short: 'Seberapa Cocok',
    min: 2,
    cat: 'tebak',
    cards: 12,
    goal: 'Isi profil masing-masing, lalu cocokkan jawabannya.',
    rounds: null,
  },
  rel: {
    id: 'rel',
    name: 'Relationship Talk',
    short: 'Relationship Talk',
    min: 2,
    cat: 'ngobrol',
    cards: 27,
    goal: 'Ngobrol soal komunikasi dan rasa aman, bergantian tanpa skor.',
    rounds: null,
  },
  kenal: {
    id: 'kenal',
    name: 'Seberapa Kenal Kalian',
    short: 'Seberapa Kenal',
    min: 2,
    cat: 'tebak',
    cards: 12,
    goal: 'Satu orang menjawab, yang lain menebak. Bestie atau asing?',
    rounds: { options: [6, 12], def: 12 },
  },
  siapa: {
    id: 'siapa',
    name: 'Siapa yang Paling...',
    short: 'Siapa yang Paling',
    min: 2,
    cat: 'seru',
    cards: 20,
    goal: 'Voting rahasia siapa yang paling cocok jadi jawabannya.',
    rounds: { options: [5, 10, 20], def: 10 },
  },
};

// Urutan katalog mengikuti PRD 2.4.
export const GAME_ORDER = ['tod', 'deep', 'kepekaan', 'cocok', 'rel', 'kenal', 'siapa'];

export const MAX_PLAYERS = 12;
export const NICK_MAX = 14;

// Aturan Dare (PRD 4.1). Ditampilkan sesuai kebutuhan lewat ikon info, bukan di kartu.
export const DARE_RULES = [
  'Foto dengan orang yang belum dikenal harus didahului permintaan izin. Kalau ditolak, jangan dipaksa.',
  'Jangan kirim pesan ke orang yang sudah minta tidak dihubungi, dan jangan membuat penerima merasa terancam.',
  'Jangan lakukan tantangan saat kelas berlangsung, di jalan, atau di tempat yang mengganggu dan berisiko.',
  'Skip selalu boleh, tanpa penalti.',
];
