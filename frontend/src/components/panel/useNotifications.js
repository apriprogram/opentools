import { useCallback, useEffect, useState } from 'react';
import { fetchMyOrders, fetchMyQr } from '../../services/authApi';
import { fetchLinktrees } from '../../services/linktreeApi';
import { adminFetchQrOrders } from '../../services/qrApi';

// Notifikasi panel disusun dari data yang sudah ada (pesanan, QR, dan Linktree), tanpa tabel tersendiri.
// Tiap notifikasi punya id tetap, supaya status "sudah dibaca" bisa diingat per akun di browser.
const REFRESH_MS = 2 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ITEMS = 20;

const rupiah = (n) => `Rp${Number(n || 0).toLocaleString('id-ID')}`;
const within = (iso, days) => Boolean(iso) && Date.now() - new Date(iso).getTime() < days * DAY_MS;

function userNotifications(orders, qrs, trees) {
  const items = [];
  for (const o of orders) {
    const to = `/dashboard/qr?kode=${o.code}`;
    if (o.status === 'pending' && o.verifyStatus === 'rejected') {
      items.push({ id: `order-rejected-${o.code}-${o.proofUploadedAt || ''}`, tone: 'danger', title: 'Bukti pembayaran ditolak', text: `Pesanan ${o.code}. Unggah ulang bukti transfernya.`, to, time: o.proofUploadedAt || o.createdAt });
    } else if (o.status === 'pending' && (o.verifyStatus === 'review' || o.verifyStatus === 'checking')) {
      items.push({ id: `order-review-${o.code}-${o.proofUploadedAt || ''}`, tone: 'info', title: 'Bukti sedang diperiksa admin', text: `Pesanan ${o.code} · ${rupiah(o.amount)}`, to, time: o.proofUploadedAt || o.createdAt });
    } else if (o.status === 'pending') {
      items.push({ id: `order-pending-${o.code}`, tone: 'warning', title: 'Pesanan menunggu pembayaran', text: `${o.planLabel} · ${rupiah(o.amount)} · ${o.code}`, to, time: o.createdAt });
    } else if (o.status === 'paid' && within(o.paidAt, 14)) {
      items.push({ id: `order-paid-${o.code}`, tone: 'success', title: 'Pembayaran lunas', text: `Pesanan ${o.code} lunas. Lisensinya sudah aktif.`, to: '/dashboard/qr', time: o.paidAt });
    } else if (o.status === 'cancelled' && within(o.createdAt, 14)) {
      items.push({ id: `order-cancelled-${o.code}`, tone: 'danger', title: 'Pesanan dibatalkan', text: `Pesanan ${o.code} dibatalkan.`, to: '/dashboard/qr', time: o.createdAt });
    }
  }
  for (const q of qrs) {
    const to = `/dashboard/qr?view=pilih&qr=${q.id}`;
    if (q.status === 'aktif' && q.planExpiresAt) {
      const days = Math.ceil((new Date(q.planExpiresAt).getTime() - Date.now()) / DAY_MS);
      if (days <= 7) {
        items.push({ id: `qr-expiring-${q.id}-${q.planExpiresAt}`, tone: 'warning', title: `Premium QR berakhir ${days <= 1 ? 'besok atau hari ini' : `${days} hari lagi`}`, text: q.link, to, time: new Date().toISOString() });
      }
    } else if (q.status === 'berakhir') {
      items.push({ id: `qr-expired-${q.id}`, tone: 'danger', title: 'Masa Premium QR sudah habis', text: `${q.link}. Perpanjang untuk memakai warna sendiri lagi.`, to, time: q.createdAt });
    } else if (q.status === 'nonaktif') {
      items.push({ id: `qr-disabled-${q.id}`, tone: 'danger', title: 'Lisensi QR dinonaktifkan admin', text: q.link, to: '/dashboard/qr', time: q.createdAt });
    }
  }
  for (const t of trees) {
    if (!t.published) {
      items.push({ id: `tree-draft-${t.id}`, tone: 'muted', title: 'Linktree belum diterbitkan', text: `${t.title} masih draf, jadi belum bisa dibuka orang lain.`, to: `/dashboard/linktree/${t.id}`, time: t.updatedAt || t.createdAt });
    }
  }
  return items;
}

function adminNotifications(orders) {
  return orders.map((o) =>
    o.verifyStatus === 'review'
      ? { id: `admin-review-${o.code}-${o.proofUploadedAt || ''}`, tone: 'warning', title: 'Bukti pembayaran perlu dicek', text: `${o.code} · ${o.name} · ${rupiah(o.amount)}`, to: '/admin', time: o.proofUploadedAt || o.createdAt }
      : { id: `admin-pending-${o.code}`, tone: 'info', title: 'Pesanan baru menunggu pembayaran', text: `${o.code} · ${o.name} · ${rupiah(o.amount)}`, to: '/admin', time: o.createdAt }
  );
}

const readKey = (userId) => `ot-notif-read:${userId}`;
const loadRead = (userId) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(readKey(userId)) || '[]'));
  } catch {
    return new Set();
  }
};

export function useNotifications(user) {
  const role = user?.role === 'superadmin' ? 'superadmin' : 'user';
  const userId = user?.id;
  const [items, setItems] = useState([]);
  const [read, setRead] = useState(() => loadRead(userId));
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      let next;
      if (role === 'superadmin') {
        const res = await adminFetchQrOrders('pending').catch(() => ({ orders: [] }));
        next = adminNotifications(res.orders || []);
      } else {
        const [orders, qrs, trees] = await Promise.all([
          fetchMyOrders().catch(() => []),
          fetchMyQr().catch(() => []),
          fetchLinktrees().catch(() => []),
        ]);
        next = userNotifications(orders || [], qrs || [], trees || []);
      }
      next.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
      setItems(next.slice(0, MAX_ITEMS));
    } finally {
      setLoading(false);
    }
  }, [role, userId]);

  useEffect(() => {
    setRead(loadRead(userId));
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [refresh, userId]);

  // Tandai semua notifikasi yang sedang tampil sebagai sudah dibaca.
  const markAllRead = useCallback(() => {
    setRead((prev) => {
      const next = new Set([...prev, ...items.map((i) => i.id)]);
      try {
        localStorage.setItem(readKey(userId), JSON.stringify([...next].slice(-300)));
      } catch {
        /* penyimpanan diblokir: status baca hanya berlaku selama halaman terbuka */
      }
      return next;
    });
  }, [items, userId]);

  const unreadIds = items.filter((i) => !read.has(i.id)).map((i) => i.id);
  return { items, unreadIds, loading, refresh, markAllRead };
}
