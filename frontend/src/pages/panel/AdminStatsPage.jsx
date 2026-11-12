import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, BarChart3, HardDrive, Minimize2, Percent, ReceiptText, RefreshCw, Repeat2, Table2, TrendingDown, Wallet } from 'lucide-react';
import PanelLayout, { PanelCrumb } from '../../components/panel/PanelLayout';
import StatCards from '../../components/panel/table/StatCards';
import ColumnChart from '../../components/panel/charts/ColumnChart';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { adminFetchOrderStats, adminFetchToolStats } from '../../services/qrApi';

// Statistik untuk super admin dalam satu periode: pesanan Premium (pemasukan, jumlah, rincian),
// lalu pemakaian konverter dan kompresor file.
// Pemasukan dihitung dari pesanan lunas pada tanggal lunasnya; jumlah pesanan dari tanggal pesanan dibuat.
// Pemakaian konverter dan kompresor dicatat server per hari, sejak fitur pencatatannya aktif.
const DAY = 24 * 60 * 60 * 1000;
const PERIODS = [
  { id: '7d', label: '7 hari', days: 7, unit: 'day' },
  { id: '30d', label: '30 hari', days: 30, unit: 'day' },
  { id: '90d', label: '90 hari', days: 91, unit: 'week' },
  { id: '12m', label: '12 bulan', months: 12, unit: 'month' },
  { id: 'all', label: 'Semua', unit: 'month' },
];

const angka = (n) => Number(n || 0).toLocaleString('id-ID');
const rupiah = (n) => `Rp${angka(Math.round(n))}`;
// Ringkas untuk sumbu: Rp1,5 jt, Rp300 rb.
const rupiahRingkas = (n) => {
  if (n >= 1e9) return `Rp${(n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
  if (n >= 1e6) return `Rp${(n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  if (n >= 1e3) return `Rp${(n / 1e3).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`;
  return `Rp${angka(n)}`;
};
// Ukuran file yang mudah dibaca: 1,2 GB, 340 MB, 12 KB.
const ukuran = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = Number(bytes) || 0;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toLocaleString('id-ID', { maximumFractionDigits: value >= 100 || i === 0 ? 0 : 1 })} ${units[i]}`;
};
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const tglPendek = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
const tglPanjang = (d) => d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const bulanPendek = (d) => d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
const bulanPanjang = (d) => d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

// Wadah waktu (hari, minggu, atau bulan) untuk satu periode, dari yang paling lama ke yang terbaru.
function buildBuckets(period, orders, now) {
  const today = startOfDay(now);
  const buckets = [];
  if (period.unit === 'day' || period.unit === 'week') {
    const size = period.unit === 'week' ? 7 : 1;
    const count = Math.ceil(period.days / size);
    for (let i = count - 1; i >= 0; i -= 1) {
      const from = new Date(today.getTime() - (i * size + size - 1) * DAY);
      const to = new Date(from.getTime() + size * DAY);
      const last = new Date(to.getTime() - DAY);
      buckets.push({
        from,
        to,
        label: tglPendek(from),
        title: size === 1 ? tglPanjang(from) : `${tglPendek(from)} sampai ${tglPendek(last)} ${last.getFullYear()}`,
      });
    }
    return buckets;
  }
  let months = period.months;
  if (!months) {
    const first = orders.length ? new Date(orders[0].createdAt) : today;
    months = Math.min(60, Math.max(1, (today.getFullYear() - first.getFullYear()) * 12 + today.getMonth() - first.getMonth() + 1));
  }
  for (let i = months - 1; i >= 0; i -= 1) {
    const from = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
    buckets.push({ from, to, label: bulanPendek(from), title: bulanPanjang(from) });
  }
  return buckets;
}

// Kartu grafik dengan tombol pindah ke tampilan tabel, supaya setiap angka bisa dibaca tanpa mengarahkan kursor.
function ChartCard({ title, subtitle, total, data, format, formatTick, wholeNumbers, valueHeader }) {
  const [asTable, setAsTable] = useState(false);
  const empty = data.every((d) => d.value === 0);
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold text-primary sm:text-[14px]">{title}</h2>
          <p className="mt-0.5 text-[11px] text-secondary sm:text-[12px]">{subtitle}</p>
          <p className="mt-2 text-[20px] font-semibold leading-tight text-primary sm:text-[24px]">{total}</p>
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          aria-pressed={asTable}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 text-[12px] text-secondary transition-smooth hover:border-border-hover hover:text-primary"
        >
          {asTable ? <BarChart3 size={14} strokeWidth={1.75} aria-hidden="true" /> : <Table2 size={14} strokeWidth={1.75} aria-hidden="true" />}
          {asTable ? 'Grafik' : 'Tabel'}
        </button>
      </div>

      {asTable ? (
        <div className="max-h-[220px] overflow-y-auto rounded-md border border-border">
          <table className="w-full border-collapse text-[12px] sm:text-[13px]">
            <thead className="sticky top-0 border-b border-border bg-card-muted text-left text-[11px] uppercase tracking-[0.08em] text-tertiary">
              <tr>
                <th className="px-3 py-2 font-semibold">Periode</th>
                <th className="px-3 py-2 text-right font-semibold">{valueHeader}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...data].reverse().map((d) => (
                <tr key={d.key}>
                  <td className="px-3 py-1.5 text-secondary">{d.title}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-primary">{format(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : empty ? (
        <p className="flex h-[220px] items-center justify-center rounded-md bg-card-muted text-[12px] text-tertiary sm:text-[13px]">
          Belum ada data pada periode ini.
        </p>
      ) : (
        <ColumnChart data={data} format={format} formatTick={formatTick} wholeNumbers={wholeNumbers} ariaLabel={`${title}. ${subtitle}. Total ${total}.`} />
      )}
    </section>
  );
}

// Daftar batang sejajar: nama, batang porsi, dan angkanya. Satu warna; identitas dibawa oleh nama di kirinya.
function ShareList({ title, subtitle, rows, emptyText }) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h2 className="text-[13px] font-semibold text-primary sm:text-[14px]">{title}</h2>
      <p className="mt-0.5 text-[11px] text-secondary sm:text-[12px]">{subtitle}</p>
      {total === 0 ? (
        <p className="mt-4 text-[12px] text-tertiary sm:text-[13px]">{emptyText}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => {
            const share = total ? (r.count / total) * 100 : 0;
            return (
              <li key={r.label}>
                <div className="flex items-baseline justify-between gap-3 text-[12px] sm:text-[13px]">
                  <span className="min-w-0 truncate text-primary">{r.label}</span>
                  <span className="shrink-0 tabular-nums text-secondary">
                    <span className="font-medium text-primary">{angka(r.count)}</span> · {share.toLocaleString('id-ID', { maximumFractionDigits: 0 })}%
                    {r.note ? ` · ${r.note}` : ''}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-blue-500/15" role="presentation">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${share}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function AdminStatsPage() {
  const { addToast: toast } = useToast();
  const [raw, setRaw] = useState(null);
  const [toolRaw, setToolRaw] = useState(null);
  const [loading, setLoading] = useState(false);
  const [periodId, setPeriodId] = useState('30d');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Dua sumber dimuat bersamaan. Kalau salah satunya gagal, yang lain tetap tampil.
      const [orders, tools] = await Promise.allSettled([adminFetchOrderStats(), adminFetchToolStats()]);
      if (orders.status === 'rejected') throw orders.reason;
      setRaw(orders.value);
      setToolRaw(tools.status === 'fulfilled' ? tools.value : { usage: [], tools: {} });
    } catch (err) {
      toast({ type: 'error', title: 'Gagal memuat', message: err?.response?.data?.message || 'Tidak bisa menghubungi server.' });
      setRaw((current) => current || { orders: [], plans: [] });
      setToolRaw((current) => current || { usage: [], tools: {} });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const period = PERIODS.find((p) => p.id === periodId) || PERIODS[1];

  const stats = useMemo(() => {
    const orders = raw?.orders || [];
    const buckets = buildBuckets(period, orders, new Date());
    const from = buckets[0].from.getTime();
    const to = buckets[buckets.length - 1].to.getTime();
    const span = to - from;
    const inRange = (iso, a = from, b = to) => {
      if (!iso) return false;
      const t = new Date(iso).getTime();
      return t >= a && t < b;
    };
    const created = orders.filter((o) => inRange(o.createdAt));
    const paid = orders.filter((o) => o.status === 'paid' && inRange(o.paidAt));
    const revenue = paid.reduce((sum, o) => sum + o.amount, 0);
    // Periode sebelumnya dengan panjang yang sama, sebagai pembanding. Tidak dipakai untuk "Semua".
    const prevPaid = period.id === 'all' ? null : orders.filter((o) => o.status === 'paid' && inRange(o.paidAt, from - span, from));
    const prevRevenue = prevPaid ? prevPaid.reduce((sum, o) => sum + o.amount, 0) : null;
    const createdPaid = created.filter((o) => o.status === 'paid').length;

    const series = (pick, list, value) =>
      buckets.map((b) => ({
        key: String(b.from.getTime()),
        label: b.label,
        title: b.title,
        value: list.filter((o) => inRange(pick(o), b.from.getTime(), b.to.getTime())).reduce((sum, o) => sum + value(o), 0),
      }));

    const planLabel = Object.fromEntries((raw?.plans || []).map((p) => [p.id, p.label]));
    const plans = [...new Set([...(raw?.plans || []).map((p) => p.id), ...paid.map((o) => o.plan)])]
      .map((id) => {
        const list = paid.filter((o) => o.plan === id);
        return { label: planLabel[id] || id, count: list.length, note: rupiah(list.reduce((sum, o) => sum + o.amount, 0)) };
      })
      .sort((a, b) => b.count - a.count);

    const auto = paid.filter((o) => o.verifyStatus === 'approved').length;

    return {
      revenue,
      prevRevenue,
      created: created.length,
      paid: paid.length,
      conversion: created.length ? (createdPaid / created.length) * 100 : null,
      average: paid.length ? revenue / paid.length : null,
      revenueSeries: series((o) => o.paidAt, paid, (o) => o.amount),
      orderSeries: series((o) => o.createdAt, created, () => 1),
      plans,
      statuses: [
        { label: 'Lunas', count: created.filter((o) => o.status === 'paid').length },
        { label: 'Menunggu pembayaran', count: created.filter((o) => o.status === 'pending').length },
        { label: 'Dibatalkan', count: created.filter((o) => o.status === 'cancelled').length },
      ],
      proofs: [
        { label: 'Aktif otomatis dari bukti', count: auto },
        { label: 'Dikonfirmasi admin', count: paid.length - auto },
      ],
      bucketWord: period.unit === 'day' ? 'per hari' : period.unit === 'week' ? 'per minggu' : 'per bulan',
    };
  }, [raw, period]);

  // Pemakaian konverter dan kompresor pada periode yang sama.
  const toolStats = useMemo(() => {
    const usage = toolRaw?.usage || [];
    const labels = toolRaw?.tools || {};
    const buckets = buildBuckets(period, [], new Date());
    // Untuk "Semua", mulai dari hari pertama yang tercatat.
    const firstDay = usage.length ? new Date(`${usage[0].day}T00:00:00`) : null;
    const allBuckets = period.id === 'all' && firstDay ? buildBuckets(period, [{ createdAt: firstDay.toISOString() }], new Date()) : buckets;
    const from = allBuckets[0].from.getTime();
    const to = allBuckets[allBuckets.length - 1].to.getTime();
    const rows = usage
      .map((u) => ({ ...u, time: new Date(`${u.day}T00:00:00`).getTime() }))
      .filter((u) => u.time >= from && u.time < to);
    const of = (kind) => rows.filter((u) => u.kind === kind);
    const sum = (list, key) => list.reduce((total, u) => total + u[key], 0);
    const series = (kind) =>
      allBuckets.map((b) => ({
        key: String(b.from.getTime()),
        label: b.label,
        title: b.title,
        value: sum(of(kind).filter((u) => u.time >= b.from.getTime() && u.time < b.to.getTime()), 'uses'),
      }));
    // Enam alat teratas; sisanya digabung jadi "Lainnya".
    const top = (kind) => {
      const byTool = new Map();
      for (const u of of(kind)) byTool.set(u.toolId, (byTool.get(u.toolId) || 0) + u.uses);
      const ranked = [...byTool.entries()].sort((a, b) => b[1] - a[1]);
      const list = ranked.slice(0, 6).map(([id, count]) => ({ label: labels[id] || id, count }));
      const rest = ranked.slice(6).reduce((total, [, count]) => total + count, 0);
      return rest ? [...list, { label: 'Lainnya', count: rest }] : list;
    };
    const compress = of('compress');
    const compressIn = sum(compress, 'bytesIn');
    const saved = Math.max(0, compressIn - sum(compress, 'bytesOut'));
    return {
      converted: sum(of('convert'), 'uses'),
      compressed: sum(compress, 'uses'),
      bytesIn: sum(rows, 'bytesIn'),
      saved,
      savedShare: compressIn ? (saved / compressIn) * 100 : null,
      convertSeries: series('convert'),
      compressSeries: series('compress'),
      topConvert: top('convert'),
      topCompress: top('compress'),
      since: usage.length ? usage[0].day : null,
    };
  }, [toolRaw, period]);

  const toolCards = [
    { label: 'File dikonversi', value: angka(toolStats.converted), icon: Repeat2 },
    { label: 'File dikompres', value: angka(toolStats.compressed), icon: Minimize2 },
    { label: 'Ukuran file diproses', value: ukuran(toolStats.bytesIn), icon: HardDrive, hint: 'Total ukuran file yang diunggah' },
    {
      label: 'Dihemat kompresor',
      value: ukuran(toolStats.saved),
      icon: TrendingDown,
      hint: toolStats.savedShare === null ? 'Belum ada file dikompres' : `${toolStats.savedShare.toLocaleString('id-ID', { maximumFractionDigits: 0 })}% lebih kecil dari aslinya`,
    },
  ];

  const delta =
    stats.prevRevenue === null
      ? 'Sejak pesanan pertama'
      : stats.prevRevenue === 0
        ? stats.revenue > 0
          ? 'Periode sebelumnya Rp0'
          : 'Sama dengan periode sebelumnya'
        : `${stats.revenue >= stats.prevRevenue ? 'Naik' : 'Turun'} ${Math.abs(((stats.revenue - stats.prevRevenue) / stats.prevRevenue) * 100).toLocaleString('id-ID', { maximumFractionDigits: 0 })}% dari periode sebelumnya`;

  const cards = [
    { label: 'Pemasukan', value: rupiah(stats.revenue), icon: Wallet, hint: delta },
    { label: 'Pesanan dibuat', value: angka(stats.created), icon: ReceiptText, hint: `${angka(stats.paid)} pembayaran lunas diterima` },
    {
      label: 'Pesanan jadi lunas',
      value: stats.conversion === null ? '-' : `${stats.conversion.toLocaleString('id-ID', { maximumFractionDigits: 0 })}%`,
      icon: Percent,
      hint: 'Dari pesanan yang dibuat di periode ini',
    },
    { label: 'Rata-rata per pesanan lunas', value: stats.average === null ? '-' : rupiah(stats.average), icon: BadgeCheck },
  ];

  return (
    <PanelLayout title="Statistik">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-primary sm:text-[24px]">Statistik</h1>
          <PanelCrumb />
          <p className="mt-1 text-[13px] text-secondary sm:text-[14px]">Pesanan paket Premium serta pemakaian konverter dan kompresor dalam satu periode.</p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} disabled={loading} className="self-start sm:self-auto">
          Muat ulang
        </Button>
      </div>

      {/* Satu baris pilihan periode di atas, berlaku untuk semua angka dan grafik di bawahnya */}
      <div className="mb-3 overflow-x-auto [scrollbar-width:none] sm:mb-4 [&::-webkit-scrollbar]:hidden">
        <div role="tablist" aria-label="Periode" className="inline-flex gap-0.5 rounded-md bg-card p-0.5 sm:gap-1 sm:rounded-lg sm:p-1">
          {PERIODS.map((p) => {
            const active = p.id === period.id;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setPeriodId(p.id)}
                className={`flex h-8 shrink-0 items-center whitespace-nowrap rounded-sm px-3 text-[12px] font-medium transition-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:h-9 sm:rounded-md sm:px-3.5 sm:text-[13px] ${
                  active ? 'bg-accent-black text-card' : 'text-secondary hover:text-primary'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`transition-opacity duration-150 ${loading && raw ? 'opacity-60' : ''}`}>
        {raw === null ? (
          <p className="rounded-2xl border border-border bg-card p-5 text-[13px] text-tertiary">Memuat...</p>
        ) : (
          <>
            <h2 className="mb-2 text-[14px] font-semibold text-primary sm:mb-3 sm:text-[15px]">Pesanan Premium</h2>
            <StatCards items={cards} />

            <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
              <ChartCard
                title="Pemasukan"
                subtitle={`Pesanan lunas, ${stats.bucketWord}`}
                total={rupiah(stats.revenue)}
                data={stats.revenueSeries}
                format={rupiah}
                formatTick={rupiahRingkas}
                valueHeader="Pemasukan"
              />
              <ChartCard
                title="Pesanan dibuat"
                subtitle={`Semua status, ${stats.bucketWord}`}
                total={`${angka(stats.created)} pesanan`}
                data={stats.orderSeries}
                format={(n) => `${angka(n)} pesanan`}
                formatTick={angka}
                wholeNumbers
                valueHeader="Pesanan"
              />
            </div>

            <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-3">
              <ShareList title="Paket yang dibeli" subtitle="Pesanan lunas per paket" rows={stats.plans} emptyText="Belum ada pesanan lunas pada periode ini." />
              <ShareList title="Status pesanan" subtitle="Pesanan yang dibuat di periode ini" rows={stats.statuses} emptyText="Belum ada pesanan pada periode ini." />
              <ShareList title="Cara pesanan menjadi lunas" subtitle="Otomatis dari bukti transfer atau oleh admin" rows={stats.proofs} emptyText="Belum ada pesanan lunas pada periode ini." />
            </div>

            <div className="mb-2 mt-6 sm:mb-3 sm:mt-8">
              <h2 className="text-[14px] font-semibold text-primary sm:text-[15px]">Konverter dan kompresor</h2>
              <p className="mt-0.5 text-[12px] text-secondary sm:text-[13px]">
                {toolStats.since
                  ? `File yang selesai diproses, dicatat sejak ${new Date(`${toolStats.since}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                  : 'Belum ada file yang tercatat. Pencatatan dimulai sejak fitur ini aktif, jadi pemakaian sebelumnya tidak ikut terhitung.'}
              </p>
            </div>
            <StatCards items={toolCards} />

            <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
              <ChartCard
                title="File dikonversi"
                subtitle={`Semua konverter, ${stats.bucketWord}`}
                total={`${angka(toolStats.converted)} file`}
                data={toolStats.convertSeries}
                format={(n) => `${angka(n)} file`}
                formatTick={angka}
                wholeNumbers
                valueHeader="File"
              />
              <ChartCard
                title="File dikompres"
                subtitle={`Semua kompresor, ${stats.bucketWord}`}
                total={`${angka(toolStats.compressed)} file`}
                data={toolStats.compressSeries}
                format={(n) => `${angka(n)} file`}
                formatTick={angka}
                wholeNumbers
                valueHeader="File"
              />
            </div>

            <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-2">
              <ShareList title="Konverter paling sering dipakai" subtitle="Jumlah file per konverter" rows={toolStats.topConvert} emptyText="Belum ada file dikonversi pada periode ini." />
              <ShareList title="Kompresor paling sering dipakai" subtitle="Jumlah file per kompresor" rows={toolStats.topCompress} emptyText="Belum ada file dikompres pada periode ini." />
            </div>
          </>
        )}
      </div>
    </PanelLayout>
  );
}
