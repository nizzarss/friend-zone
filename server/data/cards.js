// Bank kartu awal dari PRD Friend Zone v1.0 (bagian 4).
// PRD 7.1 FR-015: konten kartu disimpan sebagai data, bukan teks di komponen UI.
// Bagian bertanda "DIBUAT UNTUK MEKANISME" adalah tambahan agar game bisa jalan
// (pilihan jawaban Seberapa Kenal, topik singkat, bahan obrolan, pengelompokan tema Deep Talk).
// Tambahan itu perlu ditinjau produk sebelum rilis, sesuai PRD bagian 4 dan 12.2.

export const TRUTH = [
  { id: 'T01', text: 'Apa hal memalukan yang pernah kamu lakukan sampai sekarang masih bikin kamu menyesal?' },
  { id: 'T02', text: 'Apa hal ternakal yang pernah kamu lakuin? Coba ceritain.' },
  { id: 'T03', text: 'Pernah suka sama seseorang di sekitar kita? Kalau iya, kasih clue.' },
  { id: 'T04', text: 'Barang termahal apa yang pernah kamu beli? Kasih tahu nominalnya juga.' },
  { id: 'T05', text: 'Apa kesan pertama yang terlintas di pikiranmu waktu pertama kali melihat kita? Jelaskan satu per satu.' },
  { id: 'T06', text: 'Apa hal unik dari diri kamu yang menurut kamu nggak dimiliki orang lain?' },
  { id: 'T07', text: 'Kalau kita semua terjebak di jurang dan kamu cuma bisa menolong satu orang, siapa yang kamu pilih? Kenapa?' },
  { id: 'T08', text: 'Ada berapa mantan kamu? Sebutkan inisialnya.' },
  { id: 'T09', text: 'Kalau lagi benar-benar mager, biasanya kamu mandi berapa kali sehari?' },
  { id: 'T10', text: 'Hal jorok apa yang masih sering kamu lakukan?' },
  { id: 'T11', text: 'Kebiasaan siapa di antara kita yang paling bikin kamu kesal, malas, atau minder? Pilih satu dan jelaskan.' },
  { id: 'T12', text: 'Kalau kamu bisa berubah gender selama sehari, apa saja yang bakal kamu lakukan?' },
  { id: 'T13', text: 'Kalau ternyata salah satu dari kita yang berbeda gender adalah jodohmu, bagaimana reaksimu? Jelaskan.' },
];

export const DARE = [
  { id: 'D01', text: 'Buat story seperti orang random yang ada di IG kamu.' },
  { id: 'D02', text: 'Foto bareng orang random yang belum kamu kenal.' },
  { id: 'D03', text: 'Chat mantan kamu dan bilang, “Kangen.”' },
  { id: 'D04', text: 'Selama 5 menit, kamu cuma boleh ngomong “iya”, meskipun game masih berjalan.' },
  { id: 'D05', text: 'Jadi orang plenger selama 1 menit.' },
  { id: 'D06', text: 'Chat orang random di kontak kamu dan bilang mau minjam uang.' },
  { id: 'D07', text: 'Cosplay Titut.' },
  { id: 'D08', text: 'Dance Brazil selama 30 detik.' },
  { id: 'D09', text: 'Gombalin seseorang yang berbeda gender.' },
  { id: 'D10', text: 'Teriak “Hidup Jokowi!” sekencang mungkin.' },
];

// Aturan pelaksanaan Dare (PRD 4.1). Ditampilkan hanya lewat tombol info, bukan di kartu.
export { DARE_RULES } from '../../shared/games.js';

// Deep Talk 30 kartu. Tier (DIBUAT UNTUK MEKANISME): 1-10 Ringan, 11-20 Personal, 21-30 Lebih Dalam.
const DT = [
  'Apa hal kecil yang belakangan ini bikin kamu senang?',
  'Kapan terakhir kali kamu merasa benar-benar menjadi diri sendiri?',
  'Kalau bisa mengulang satu hari yang menyenangkan, hari seperti apa yang ingin kamu ulang?',
  'Sisi diri kamu yang mana yang sekarang sedang kamu coba pahami lebih baik?',
  'Apa yang dulu kamu anggap penting, tetapi sekarang pandanganmu berubah?',
  'Nilai apa dari keluargamu yang ingin kamu bawa ke masa depan?',
  'Apa yang bikin sebuah tempat terasa seperti rumah buat kamu?',
  'Perhatian kecil apa dari teman yang paling kamu hargai?',
  'Apa yang membuat kamu merasa aman untuk menjadi diri sendiri di dekat seseorang?',
  'Kalau habis konflik dengan teman, apa yang membantumu mulai ngobrol lagi?',
  'Pengalaman apa yang mengubah cara pandangmu, kalau kamu nyaman menceritakannya?',
  'Saat kamu kewalahan, apa yang paling kamu butuhkan dari orang terdekat?',
  'Apa yang sebenarnya ingin lebih sering kamu ucapkan, tetapi sering kamu tahan?',
  'Apa hal dari masa lalu yang sedang kamu coba maafkan tanpa harus menceritakan detailnya?',
  'Apa yang kamu harap orang lain pahami tentang dirimu tanpa kamu perlu menjelaskannya berkali-kali?',
  'Ada hal yang akhir-akhir ini kamu pendam karena bingung harus cerita ke siapa?',
  'Kapan terakhir kali kamu merasa nggak dipahami padahal sudah berusaha menjelaskan?',
  'Ada kalimat dari seseorang yang masih kamu ingat sampai sekarang, entah karena membuatmu senang atau sakit hati?',
  'Hal apa dari masa kecil yang ternyata masih memengaruhi cara kamu melihat dunia?',
  'Pernah merasa sendirian padahal sedang ramai-ramai? Saat itu, apa yang sebenarnya kamu butuhkan?',
  'Apa hal yang paling sulit kamu ceritakan ke keluarga meskipun itu penting buat kamu?',
  'Kalau bisa bicara dengan dirimu setahun lalu, apa yang ingin kamu bilang?',
  'Apa yang ingin kamu dengar dari orang terdekat, tetapi jarang kamu dapatkan?',
  'Pernah kehilangan kedekatan dengan seseorang tanpa tahu kapan semuanya mulai berubah?',
  'Apa hal tentang dirimu yang sekarang sedang kamu pelajari untuk diterima?',
  'Kalau suatu hari kamu sedang nggak baik-baik saja, bagaimana teman bisa menyadarinya tanpa membuatmu merasa terpojok?',
  'Bentuk permintaan maaf seperti apa yang menurutmu benar-benar tulus?',
  'Apa yang paling kamu takutkan ketika mulai dekat dengan seseorang?',
  'Apa yang membuat kamu merasa aman untuk bercerita tanpa takut dihakimi?',
  'Menurutmu, apa yang sering membuat orang menjauh padahal sebenarnya masih saling peduli?',
];
export const DEEP = DT.map((text, i) => ({
  id: 'DT' + String(i + 1).padStart(2, '0'),
  text,
  tier: i < 10 ? 'Ringan' : i < 20 ? 'Personal' : 'Lebih Dalam',
  tierIndex: i < 10 ? 0 : i < 20 ? 1 : 2,
}));

const RT = [
  'Perhatian kecil apa yang membuat kamu merasa dihargai?',
  'Biasanya kamu menunjukkan rasa peduli dengan cara apa?',
  'Kalau kecewa, kamu lebih suka membicarakannya langsung atau setelah tenang?',
  'Apa yang membuat kamu merasa aman untuk jujur kepada seseorang?',
  'Bagaimana cara terbaik mengingatkanmu saat ada hal yang mengganggu orang lain?',
  'Batas pribadi apa yang paling penting untuk dihormati?',
  'Apa yang kamu butuhkan dari orang terdekat saat hari terasa berat?',
  'Kalau kamu salah, biasanya bagaimana kamu meminta maaf?',
  'Menurutmu, apa bedanya peduli dengan mengatur hidup seseorang?',
  'Apa yang membantu kalian menyelesaikan salah paham?',
  'Kebiasaan kecil apa yang bisa membuat hubungan lebih sehat?',
  'Apa yang ingin lebih sering kamu lakukan bersama orang terdekat?',
  'Pernah merasa harus selalu terlihat baik-baik saja di depan orang yang dekat denganmu?',
  'Apa yang paling membuat kamu merasa dihargai tanpa harus memintanya?',
  'Apa hal kecil yang bisa membuat kamu merasa dijauhkan seseorang?',
  'Kalau kamu mulai lebih diam, apa yang sebaiknya dilakukan orang terdekat?',
  'Apa yang membuatmu mau bertahan memperbaiki hubungan ketika sedang ada masalah?',
  'Menurutmu, kapan seseorang perlu meminta maaf meskipun tidak bermaksud menyakiti?',
  'Apa hal yang paling sulit kamu jelaskan saat sedang kecewa?',
  'Pernah kangen seseorang tetapi bingung harus mulai menghubungi duluan?',
  'Apa bedanya orang yang benar-benar mendengarkan dengan orang yang hanya menunggu giliran bicara?',
  'Apa yang ingin kamu ubah dari cara berkomunikasi dengan orang terdekat?',
  'Apa tanda sederhana yang membuatmu merasa hubungan masih sama-sama diperjuangkan?',
  'Kalau hubungan mulai terasa jauh, langkah kecil apa yang ingin kamu coba dahulu?',
  'Apa yang kamu harapkan dari orang terdekat saat kamu gagal atau kecewa pada diri sendiri?',
  'Menurutmu lebih sulit mengakui bahwa kita salah atau mengatakan bahwa kita terluka? Kenapa?',
  'Perhatian apa yang dulu terasa biasa tetapi sekarang kamu sadari sangat berharga?',
];
export const REL = RT.map((text, i) => ({ id: 'RT' + String(i + 1).padStart(2, '0'), text }));

// Tes Kepekaan 12 kartu (PRD 4.3). Pilihan jawaban mengikuti PRD. "topic" DIBUAT UNTUK MEKANISME
// (dipakai di bagian "Yang Sudah Dipahami" dan "Yang Bisa Dipelajari").
export const KEPEKAAN = [
  { id: 'P01', topic: 'Warna favorit', text: 'Warna favoritku sekarang apa?', options: ['Hitam', 'Putih', 'Biru', 'Merah', 'Hijau', 'Pink', 'Ungu', 'Lainnya'] },
  { id: 'P02', topic: 'Makanan favorit', text: 'Kalau disuruh pilih makanan sekarang, aku paling pengin apa?', options: ['Makanan pedas', 'Mi/bakso', 'Ayam/nasi', 'Makanan manis', 'Fast food', 'Terserah asal gratis'] },
  { id: 'P03', topic: 'Alasan cuma read chat', text: 'Kalau aku cuma read chat, biasanya kenapa?', options: ['Lagi sibuk', 'Belum tahu mau jawab apa', 'Lupa membalas', 'Lagi nggak punya energi buat chat', 'Sedang mikir jawabannya'] },
  { id: 'P04', topic: 'Arti balasan singkat', text: 'Kalau aku membalas chat singkat, kemungkinan aku sedang apa?', options: ['Benar-benar sibuk', 'Capek', 'Kurang mood', 'Menjawab seperlunya', 'Nggak sadar jawabanku terkesan dingin'] },
  { id: 'P05', topic: 'Penghibur saat bad mood', text: 'Kalau lagi bad mood, hal yang paling membantu aku apa?', options: ['Didengarkan', 'Diberi waktu sendiri', 'Diajak bercanda', 'Dibantu mencari solusi', 'Ditanya langsung butuh apa'] },
  { id: 'P06', topic: 'Respons saat cerita masalah', text: 'Kalau aku cerita masalah, aku lebih suka kamu apa?', options: ['Dengarkan dulu', 'Kasih saran', 'Bantu menyelesaikan', 'Temani tanpa banyak tanya', 'Tanya apa yang aku butuhkan'] },
  { id: 'P07', topic: 'Hal kecil yang bikin senang', text: 'Hal kecil apa yang paling gampang bikin aku senang?', options: ['Dikabari duluan', 'Ditemani', 'Diberi makanan', 'Diingat detail kecilnya', 'Mendapat pesan perhatian'] },
  { id: 'P08', topic: 'Reaksi rencana batal', text: 'Kalau rencana kita mendadak batal, reaksiku biasanya apa?', options: ['Santai', 'Kecewa tetapi mengerti', 'Minta jadwal baru', 'Memilih istirahat', 'Tergantung alasan batalnya'] },
  { id: 'P09', topic: 'Alasan lama balas', text: 'Kalau aku lama membalas chat, apa yang paling mungkin terjadi?', options: ['Sedang melakukan sesuatu', 'Ketiduran', 'Lupa membuka chat lagi', 'Sedang mengumpulkan energi untuk membalas', 'Masalah sinyal/baterai'] },
  { id: 'P10', topic: 'Cara menghadapi masalah', text: 'Kalau sedang ada masalah, aku biasanya apa?', options: ['Cerita saat itu juga', 'Menenangkan diri dulu', 'Menyelesaikan sendiri dulu', 'Menghubungi orang yang dipercaya', 'Belum tahu harus bagaimana'] },
  { id: 'P11', topic: 'Bentuk perhatian', text: 'Bentuk perhatian yang paling aku hargai apa?', options: ['Waktu bersama', 'Kata-kata menenangkan', 'Bantuan nyata', 'Hadiah kecil', 'Diingat hal-hal detail'] },
  { id: 'P12', topic: 'Cara menyikapi beda pendapat', text: 'Kalau kita beda pendapat, aku lebih nyaman bagaimana?', options: ['Membahas langsung', 'Menenangkan diri dulu', 'Menulis pesan terlebih dahulu', 'Mulai bicara perlahan saat suasana nyaman', 'Tergantung masalahnya'] },
];

// Seberapa Cocok Kalian? 12 pertanyaan (PRD 4.4). "talk" = bahan obrolan DIBUAT UNTUK MEKANISME.
export const COCOK = [
  { id: 'M01', topic: 'Waktu kosong', text: 'Kalau punya waktu kosong, aku paling sering...', options: ['Keluar bareng orang', 'Menikmati waktu sendiri', 'Main game/nonton', 'Melakukan hobi/menyelesaikan sesuatu'], talk: 'Waktu kosong ideal buat kalian seperti apa?' },
  { id: 'M02', topic: 'Menghadapi masalah', text: 'Kalau ada masalah, aku lebih sering...', options: ['Langsung cari solusi', 'Cerita dulu', 'Menenangkan diri lalu berpikir', 'Minta bantuan orang terpercaya'], talk: 'Waktu ada masalah, bantuan seperti apa yang paling berguna?' },
  { id: 'M03', topic: 'Saat kesal', text: 'Kalau sedang kesal, aku butuh...', options: ['Diajak bicara', 'Waktu sendiri', 'Ditemani tanpa banyak bicara', 'Ditanya apa yang aku butuhkan'], talk: 'Tanda apa yang bikin kalian tahu satu sama lain sedang butuh ruang?' },
  { id: 'M04', topic: 'Cara ngobrol', text: 'Aku lebih nyaman membicarakan hal penting lewat...', options: ['Tatap muka', 'Chat', 'Telepon/panggilan suara', 'Tergantung situasi'], talk: 'Kapan terakhir kalian membahas hal penting, dan lewat apa rasanya paling nyaman?' },
  { id: 'M05', topic: 'Gaya rencana', text: 'Saat membuat rencana, aku cenderung...', options: ['Menyusun detail dari awal', 'Merencanakan garis besar saja', 'Spontan', 'Mengikuti rencana orang lain'], talk: 'Rencana liburan impian kalian, detail atau spontan?' },
  { id: 'M06', topic: 'Yang paling dihargai', text: 'Dalam pertemanan atau hubungan, aku paling menghargai...', options: ['Kejujuran', 'Waktu bersama', 'Dukungan', 'Konsistensi', 'Ruang pribadi'], talk: 'Hal apa dari satu sama lain yang paling kalian hargai?' },
  { id: 'M07', topic: 'Janji berubah', text: 'Saat janji berubah mendadak, aku biasanya...', options: ['Santai', 'Perlu penjelasan', 'Minta jadwal pengganti', 'Menyesuaikan diri jika perlu'], talk: 'Gimana cara terbaik kasih kabar kalau rencana berubah?' },
  { id: 'M08', topic: 'Saat kurang nyaman', text: 'Kalau kurang nyaman dengan sesuatu, aku lebih suka...', options: ['Langsung bilang', 'Memikirkan dulu', 'Menulis pesan', 'Menunggu waktu tepat'], talk: 'Cara menyampaikan rasa kurang nyaman seperti apa yang terasa aman buat kalian?' },
  { id: 'M09', topic: 'Waktu bersama', text: 'Cara paling nyaman menghabiskan waktu bersama...', options: ['Ngobrol lama', 'Melakukan kegiatan bersama', 'Jalan-jalan', 'Melakukan hal masing-masing tetapi tetap berdekatan'], talk: 'Ceritakan satu momen bareng yang paling kalian ingat.' },
  { id: 'M10', topic: 'Kabar baik', text: 'Kalau punya kabar baik, aku biasanya...', options: ['Langsung cerita', 'Cerita ke orang tertentu', 'Membagikan di media sosial', 'Menikmatinya sendiri dahulu'], talk: 'Kabar baik terakhir apa yang ingin kalian ceritakan?' },
  { id: 'M11', topic: 'Beda pendapat', text: 'Kalau beda pendapat dengan orang terdekat, aku ingin...', options: ['Mencari jalan tengah', 'Saling menjelaskan sampai paham', 'Menenangkan diri dahulu', 'Menentukan batas yang jelas'], talk: 'Apa yang membantu kalian saat beda pendapat?' },
  { id: 'M12', topic: 'Ruang pribadi', text: 'Dalam hubungan dekat, ruang pribadi itu...', options: ['Penting untuk tetap mandiri', 'Penting tetapi perlu dibicarakan', 'Fleksibel tergantung situasi', 'Aku suka menghabiskan banyak waktu bersama'], talk: 'Seberapa banyak ruang pribadi yang nyaman buat masing-masing?' },
];

// Seberapa Kenal Kalian? 12 kartu (PRD 4.6). Pilihan jawaban DIBUAT UNTUK MEKANISME;
// KF03, KF05, KF07, KF10, KF12 memakai opsi yang tertulis di PRD.
export const KENAL = [
  { id: 'KF01', topic: 'Waktu kosong', text: 'Kalau punya waktu kosong, dia biasanya ngapain?', options: ['Rebahan atau tidur', 'Main game atau nonton', 'Keluar bareng teman', 'Hobi atau mengerjakan sesuatu'] },
  { id: 'KF02', topic: 'Peran di grup chat', text: 'Kalau grup chat mulai ramai, dia biasanya jadi siapa?', options: ['Pembuka obrolan', 'Tukang komentar', 'Penonton diam-diam', 'Pengirim stiker dan meme'] },
  { id: 'KF03', topic: 'Saat kesal', text: 'Kalau sedang kesal, dia lebih sering...', options: ['Diam', 'Cerita', 'Bercanda', 'Langsung membahas masalah'] },
  { id: 'KF04', topic: 'Yang bikin tertawa', text: 'Apa yang paling gampang bikin dia tertawa?', options: ['Meme atau video lucu', 'Bercandaan teman', 'Hal receh', 'Cerita konyol'] },
  { id: 'KF05', topic: 'Ajakan mendadak', text: 'Kalau diajak pergi mendadak, dia biasanya...', options: ['Langsung ikut', 'Berpikir dahulu'] },
  { id: 'KF06', topic: 'Peran tugas kelompok', text: 'Kalau ada tugas kelompok, peran apa yang paling mungkin dia ambil?', options: ['Pengatur atau ketua', 'Pencari bahan', 'Pembuat slide atau laporan', 'Presenter'] },
  { id: 'KF07', topic: 'Tempat nongkrong', text: 'Dia lebih suka nongkrong di...', options: ['Tempat ramai', 'Tempat santai'] },
  { id: 'KF08', topic: 'Cerita kabar baik', text: 'Kalau punya kabar baik, dia paling mungkin cerita ke siapa dulu?', options: ['Keluarga', 'Sahabat dekat', 'Pasangan atau gebetan', 'Grup chat'] },
  { id: 'KF09', topic: 'Kebiasaan kecil', text: 'Apa kebiasaan kecil yang paling menggambarkan dirinya?', options: ['Suka merencanakan', 'Sering telat', 'Selalu bawa camilan', 'Sering melamun'] },
  { id: 'KF10', topic: 'Saat capek', text: 'Kalau sedang capek, dia lebih suka...', options: ['Ditemani', 'Diberi waktu sendiri'] },
  { id: 'KF11', topic: 'Saat bosan', text: 'Apa yang paling sering dia lakukan saat bosan?', options: ['Scroll media sosial', 'Tidur', 'Main game', 'Ngobrol atau chat'] },
  { id: 'KF12', topic: 'Spontan atau terencana', text: 'Kalau harus memilih satu, dia lebih...', options: ['Spontan', 'Terencana', 'Tergantung situasi'] },
];

// Siapa yang Paling... 20 kartu dan predikat (PRD 4.7). "fx" = jenis animasi predikat (PRD 4.7: efek tawa,
// kilatan energi, Zzz, stiker untuk lainnya).
export const SIAPA = [
  { id: 'SM01', text: 'Siapa yang paling ekstrovert?', title: 'Si Ekstrovert', fx: 'burst' },
  { id: 'SM02', text: 'Siapa yang paling kocak?', title: 'Si Kocak Abies', fx: 'laugh' },
  { id: 'SM03', text: 'Siapa yang paling ambis dalam segala hal?', title: 'Si Paling Ambis', fx: 'energy' },
  { id: 'SM04', text: 'Siapa yang paling dewasa?', title: 'Si Paling Dewasa', fx: 'burst' },
  { id: 'SM05', text: 'Siapa yang paling sering menunjukkan perhatian lewat tindakan (act of service)?', title: 'Si Paling Peka', fx: 'burst' },
  { id: 'SM06', text: 'Siapa yang paling mageran?', title: 'Si Mager', fx: 'zzz' },
  { id: 'SM07', text: 'Siapa yang paling lemot otaknya?', title: 'Si Lemot', fx: 'burst' },
  { id: 'SM08', text: 'Siapa yang paling kelihatan garang?', title: 'Si Preman', fx: 'energy' },
  { id: 'SM09', text: 'Siapa yang paling suka tidur di mana pun dan dalam keadaan apa pun?', title: 'Si Pelor', fx: 'zzz' },
  { id: 'SM10', text: 'Siapa yang paling suka bikin ide mendadak dan di luar nalar?', title: 'Si Ngide', fx: 'energy' },
  { id: 'SM11', text: 'Siapa yang paling suka banyak omong?', title: 'Si Yapping', fx: 'chat' },
  { id: 'SM12', text: 'Siapa yang paling suka mengajak melakukan sesuatu tetapi akhirnya nggak jadi?', title: 'Si Wacana', fx: 'burst' },
  { id: 'SM13', text: 'Siapa yang paling nggak bisa serius?', title: 'Si Ngeselin', fx: 'laugh' },
  { id: 'SM14', text: 'Siapa yang paling suka makan?', title: 'Si Buntal', fx: 'burst' },
  { id: 'SM15', text: 'Siapa yang paling kelihatan terkenal dan punya banyak kenalan?', title: 'Si Paling Famous', fx: 'burst' },
  { id: 'SM16', text: 'Siapa yang paling tahu banyak hal?', title: 'Si Buku Berjalan', fx: 'burst' },
  { id: 'SM17', text: 'Siapa yang paling nggak nyambung ketika ditanya atau diajak bicara?', title: 'Si Plenger', fx: 'zzz' },
  { id: 'SM18', text: 'Siapa yang paling jail?', title: 'Si Jail', fx: 'laugh' },
  { id: 'SM19', text: 'Siapa yang paling setia kawan?', title: 'Si Paling Setia Kawan', fx: 'burst' },
  { id: 'SM20', text: 'Siapa yang paling susah diajak main?', title: 'Si Paling Sibuk', fx: 'burst' },
];
