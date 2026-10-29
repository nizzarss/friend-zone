// Aksi di akhir sesi: bagikan, main lagi (host), keluar.
import { h, icon } from '../lib.js';
import { api } from '../net.js';
import { shareCard } from '../fx.js';
import { toast } from '../store.js';
import { waitPill } from './frame.js';

export function resultFooter(room, share) {
  const host = room.you.isHost;
  return h(
    'footer',
    { class: 'res-foot' },
    share
      ? h('button', { class: 'ibtn', 'aria-label': 'Bagikan hasil', onclick: async () => {
          const r = await shareCard(share);
          if (r === 'downloaded') toast('Gambar tersimpan');
        } }, icon('share'))
      : null,
    host ? h('button', { class: 'btn with-chip grow', onclick: () => api.send({ t: 'to_lobby' }) }, 'Main Lagi', h('span', { class: 'chip' }, icon('refresh', 18))) : h('div', { class: 'grow' }, waitPill()),
    h('button', { class: 'ibtn', 'aria-label': 'Keluar', onclick: () => api.leave() }, icon('exit'))
  );
}
