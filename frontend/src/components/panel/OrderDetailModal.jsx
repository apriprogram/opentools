import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Download, FileText, ImageIcon, KeyRound, QrCode, Receipt, User, ZoomIn } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import LicenseQr from './LicenseQr';
import DetailModal, { DetailSection } from './DetailModal';
import { useProofImage } from './ProofModal';
import { LicenseChip, OrderStatusChip, PlanChip, ProofChip, WhatsappPill } from './Chips';
import { buildQrSvg, downloadBlob, loadLogoDataUrl, svgToPngBlob } from '../../lib/qrCode';

const rupiah = (n) => (n === null || n === undefined ? null : `Rp${Number(n).toLocaleString('id-ID')}`);
const waktu = (d) => (d ? new Date(d).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : null);
const tanggal = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');

const mono = (text) => text && <span className="font-mono">{text}</span>;

function Swatch({ color }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono">
      <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" style={{ backgroundColor: color }} />
      {color}
    </span>
  );
}

// Gambar QR sesuai desain yang dipesan (link, warna, dan logo), lengkap dengan tombol unduh.
function OrderQr({ code, design }) {
  const { addToast: toast } = useToast();
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    let alive = true;
    if (design?.logo) {
      loadLogoDataUrl()
        .then((url) => alive && setLogoUrl(url))
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, [design?.logo]);

  const svg = useMemo(() => {
    if (!design?.link) return '';
    try {
      return buildQrSvg({ text: design.link, fg: design.fg, bg: design.bg, logoDataUrl: design.logo ? logoUrl : null, size: 512 });
    } catch {
      return '';
    }
  }, [design, logoUrl]);

  if (!svg) {
    return <p className="text-[12px] text-tertiary sm:text-[13px]">Pesanan ini tidak menyimpan desain QR.</p>;
  }

  const download = async () => {
    try {
      downloadBlob(await svgToPngBlob(svg, 1024), `qr-${code}.png`);
    } catch {
      toast({ type: 'error', title: 'Gagal mengunduh', message: 'QR tidak bisa diunduh sebagai PNG.' });
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
      <div
        role="img"
        aria-label={`Gambar QR pesanan ${code}`}
        className="h-36 w-36 shrink-0 self-center rounded-md border border-border bg-white p-1.5 sm:h-40 sm:w-40 sm:self-start [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-3 text-[12px] sm:text-[13px]">
        <div className="col-span-2 min-w-0">
          <dt className="text-[11px] text-tertiary sm:text-[12px]">Link QR</dt>
          <dd className="mt-0.5 font-medium text-primary [overflow-wrap:anywhere]">
            <a href={design.link} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">{design.link}</a>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-tertiary sm:text-[12px]">Warna QR</dt>
          <dd className="mt-0.5 font-medium text-primary"><Swatch color={design.fg} /></dd>
        </div>
        <div>
          <dt className="text-[11px] text-tertiary sm:text-[12px]">Warna latar</dt>
          <dd className="mt-0.5 font-medium text-primary"><Swatch color={design.bg} /></dd>
        </div>
        <div>
          <dt className="text-[11px] text-tertiary sm:text-[12px]">Logo di tengah</dt>
          <dd className="mt-0.5 font-medium text-primary">{design.logo ? 'Pakai logo' : 'Tanpa logo'}</dd>
        </div>
        <div className="col-span-2">
          <Button size="sm" variant="secondary" icon={Download} onClick={download}>Unduh QR (PNG)</Button>
        </div>
      </dl>
    </div>
  );
}

// Foto bukti pembayaran. Klik gambar untuk membukanya dalam ukuran besar.
function ProofPhoto({ code, fetcher, onOpen }) {
  const { url, error } = useProofImage(code, fetcher);
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!url}
      title="Klik untuk memperbesar"
      className="group relative flex min-h-[140px] w-full items-center justify-center overflow-hidden rounded-md border border-border bg-card-muted p-2 transition-smooth hover:border-blue-500 disabled:cursor-default disabled:hover:border-border"
    >
      {url ? (
        <>
          <img src={url} alt={`Bukti pembayaran pesanan ${code}`} className="max-h-[340px] w-auto max-w-full rounded-sm object-contain" />
          <span className="absolute right-2 top-2 inline-flex h-7 items-center gap-1.5 rounded-full bg-black/70 px-2.5 text-[11px] font-medium text-white">
            <ZoomIn size={13} strokeWidth={1.75} aria-hidden="true" /> Perbesar
          </span>
        </>
      ) : (
        <span className="text-[12px] text-tertiary sm:text-[13px]">{error || 'Memuat bukti...'}</span>
      )}
    </button>
  );
}

// Detail lengkap satu pesanan untuk super admin: pesanan, pemesan, gambar QR, bukti pembayaran, dan lisensi.
// Tombol nota (lihat dan unduh PDF) ada di sini, bukan di menu titik tiga.
export default function OrderDetailModal({ order: o, proofFetcher, onClose, onProof, onNota, onPdf }) {
  const paid = o.status === 'paid';

  return (
    <DetailModal
      title={`Pesanan ${o.code}`}
      subtitle={`Dibuat ${waktu(o.createdAt)}`}
      icon={Receipt}
      badges={
        <>
          <OrderStatusChip status={o.status} />
          <PlanChip plan={o.plan} label={o.planLabel} />
          {paid && <LicenseChip state={o.licenseState} />}
          <ProofChip verifyStatus={o.verifyStatus} hasProof={o.hasProof} />
        </>
      }
      summary={[
        { label: 'Nominal transfer', value: rupiah(o.amount) },
        { label: 'Harga paket', value: rupiah(o.price) },
        { label: 'Kode unik', value: o.uniqueCode ?? '-' },
        { label: 'Dibayar', value: tanggal(o.paidAt) },
      ]}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="secondary" icon={FileText} onClick={() => onNota(o.code)}>Lihat nota</Button>
          <Button size="sm" variant="primary" icon={Download} onClick={() => onPdf(o.code)}>Unduh nota PDF</Button>
        </>
      }
    >
      <DetailSection
        title="Pesanan"
        icon={ClipboardList}
        rows={[
          ['Kode pesanan', mono(o.code)],
          ['Nomor nota', mono(o.notaNumber)],
          ['Paket', o.planLabel],
          ['Status pesanan', <OrderStatusChip status={o.status} />],
          ['Dibuat', waktu(o.createdAt)],
          ['Dibayar', waktu(o.paidAt)],
        ]}
      />

      <DetailSection
        title="Pemesan"
        icon={User}
        rows={[
          ['Nama', o.name],
          ['WhatsApp', o.whatsapp && <WhatsappPill number={o.whatsapp} />],
          ['Email', o.email && <a href={`mailto:${o.email}`} className="underline hover:text-blue-500">{o.email}</a>, { wide: true }],
        ]}
      />

      <DetailSection title="Gambar QR" icon={QrCode}>
        <OrderQr code={o.code} design={o.qrDesign} />
      </DetailSection>

      <DetailSection
        title="Bukti pembayaran"
        icon={ImageIcon}
        rows={[
          ['Status bukti', <ProofChip verifyStatus={o.verifyStatus} hasProof={o.hasProof} />],
          ['Percobaan unggah', `${o.proofAttempts || 0} dari ${o.maxProofAttempts}`],
          ['Diunggah', waktu(o.proofUploadedAt)],
          ['Nominal terbaca', rupiah(o.verifyAmount)],
          ['Catatan pemeriksaan', o.verifyNote, { wide: true }],
        ]}
      >
        {o.hasProof ? (
          <ProofPhoto code={o.code} fetcher={proofFetcher} onOpen={() => onProof(o.code)} />
        ) : (
          <p className="text-[12px] text-tertiary sm:text-[13px]">Pemesan belum mengunggah foto bukti pembayaran.</p>
        )}
      </DetailSection>

      <DetailSection
        title="Lisensi"
        icon={KeyRound}
        rows={[
          ['Status lisensi', paid ? <LicenseChip state={o.licenseState} /> : 'Belum ada, pesanan belum lunas'],
          ['Berlaku sampai', waktu(o.licenseExpiresAt)],
          ['Kode lisensi', mono(o.licenseKey), { wide: true }],
          ['ID QR di akun', mono(o.qrId), { wide: true }],
        ]}
      >
        {paid && o.licenseKey && <LicenseQr licenseKey={o.licenseKey} />}
      </DetailSection>
    </DetailModal>
  );
}
