import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Nota pesanan (tagihan) untuk setiap pesanan QR. Dibuat dari data pesanan, tanpa diskon dan tanpa PPN.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "../assets/nota-logo.svg");
const LOGO_SVG = fs.readFileSync(LOGO_PATH, "utf8");
const A4 = { width: 595.28, height: 841.89 };

// Data perusahaan dari environment. Nilai default mengikuti contoh invoice.
export const getCompany = () => ({
  name: process.env.NOTA_COMPANY_NAME || "PT Garuda Nexa Bahtera",
  addressLines: [
    process.env.NOTA_ADDRESS || "Jln. Waluh No 3 Tejo Agung, Metro Timur Kota Metro, KOTA METRO",
    process.env.NOTA_CONTACT || "Telp. 085188009152 · info@garudanexa.com · garudanexa.com"
  ],
  city: process.env.NOTA_CITY || "KOTA METRO",
  signerName: process.env.NOTA_SIGNER_NAME || "Muhammad Fajri",
  signerTitle: process.env.NOTA_SIGNER_TITLE || "Direktur",
  npwp: process.env.NOTA_NPWP || ""
});

export const rupiah = (n) => `${Number(n) < 0 ? "-" : ""}Rp${Math.abs(Number(n)).toLocaleString("id-ID")}`;

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Tanggal dan periode mengikuti zona waktu Indonesia (WIB).
const wibParts = (date) => {
  const d = new Date(new Date(date).getTime() + 7 * 60 * 60 * 1000);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
};

export const formatTanggal = (date) => {
  const { y, m, d } = wibParts(date);
  return `${d} ${MONTHS[m]} ${y}`;
};

export const notaPeriod = (date) => {
  const { y, m } = wibParts(date);
  return `${y}${String(m + 1).padStart(2, "0")}`;
};

export const formatNotaNumber = (period, seq) => `INV-${period}-${String(seq).padStart(3, "0")}`;

const SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
const say = (n) => {
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${say(n - 10)} belas`;
  if (n < 100) return `${say(Math.floor(n / 10))} puluh${n % 10 ? ` ${say(n % 10)}` : ""}`;
  if (n < 200) return `seratus${n - 100 ? ` ${say(n - 100)}` : ""}`;
  if (n < 1000) return `${say(Math.floor(n / 100))} ratus${n % 100 ? ` ${say(n % 100)}` : ""}`;
  if (n < 2000) return `seribu${n - 1000 ? ` ${say(n - 1000)}` : ""}`;
  if (n < 1000000) return `${say(Math.floor(n / 1000))} ribu${n % 1000 ? ` ${say(n % 1000)}` : ""}`;
  return `${say(Math.floor(n / 1000000))} juta${n % 1000000 ? ` ${say(n % 1000000)}` : ""}`;
};

export const terbilang = (n) => {
  const whole = Math.floor(n);
  if (whole === 0) return "nol rupiah";
  return `${say(whole).replace(/\s+/g, " ").trim()} rupiah`;
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const STATUS_LABEL = {
  pending: "Belum lunas",
  paid: "Lunas",
  cancelled: "Dibatalkan"
};

// Susun data nota dari pesanan. planDays dan planLabel dikirim dari layanan QR.
export const buildNotaData = (order, { notaNumber, planDays, company = getCompany(), dana = {} }) => {
  const subtotal = order.price + order.uniqueCode;
  // Pesanan dengan diskon: harga normal, lalu baris potongan bernilai minus.
  const discount = Number(order.discount || 0);
  const basePrice = discount > 0 ? Number(order.basePrice || order.price + discount) : order.price;
  const items = [
    {
      title: `Paket QR Generator ${order.planLabel} (aktif ${planDays} hari)`,
      sub: `Kode pesanan ${order.code}`,
      qty: 1,
      harga: basePrice,
      jumlah: basePrice
    },
    ...(discount > 0
      ? [{ title: "Diskon paket", sub: "Potongan harga yang berlaku saat pesanan dibuat", qty: 1, harga: -discount, jumlah: -discount }]
      : []),
    {
      title: "Kode unik pembayaran",
      sub: "Wajib ikut ditransfer agar pembayaran dapat dicocokkan",
      qty: 1,
      harga: order.uniqueCode,
      jumlah: order.uniqueCode
    }
  ].map((item, index) => ({ no: index + 1, ...item }));
  return {
    company,
    noNota: notaNumber,
    tanggal: formatTanggal(order.createdAt),
    status: STATUS_LABEL[order.status] || order.status,
    paidAt: order.paidAt ? formatTanggal(order.paidAt) : null,
    kepada: { nama: order.name, email: order.email, whatsapp: order.whatsapp || "" },
    kodePesanan: order.code,
    items,
    subtotal,
    total: subtotal,
    terbilang: terbilang(subtotal),
    payment: {
      method: dana.method || "Transfer DANA",
      number: dana.number || "",
      name: dana.name || ""
    }
  };
};

export const renderNotaHtml = (d) => {
  const e = escapeHtml;
  const rows = d.items
    .map(
      (i) => `
    <tr>
      <td>${i.no}</td>
      <td>${e(i.title)}<br /><span class="sub">${e(i.sub)}</span></td>
      <td class="num">${i.qty}</td>
      <td class="num">${rupiah(i.harga)}</td>
      <td class="num">${rupiah(i.jumlah)}</td>
    </tr>`
    )
    .join("");
  const logoInline = LOGO_SVG.replace(/<svg /, '<svg class="logo" ').replace(/ width="1704" height="1035"/, "");
  const npwp = d.company.npwp ? `<br />NPWP: ${e(d.company.npwp)}` : "";
  const paid = d.paidAt ? `<div>Tanggal bayar</div><div>:</div><div>${e(d.paidAt)}</div>` : "";
  const footerNote =
    d.status === "Lunas"
      ? `Terima kasih. Pesanan ini sudah lunas dan dikonfirmasi pada ${e(d.paidAt)}.`
      : `Terima kasih. Nota ini adalah tagihan pesanan, bukan bukti pembayaran. Kwitansi lunas diterbitkan setelah pembayaran dikonfirmasi.`;

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nota ${e(d.noNota)} - ${e(d.company.name)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Roboto, "Segoe UI", Arial, sans-serif; color: #1a1a1a; background: #e9e9e9; }
  .toolbar { text-align: center; padding: 12px; }
  .toolbar button { font: inherit; padding: 8px 16px; border: 1px solid #1a1a1a; background: #fff; cursor: pointer; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto 24px; padding: 16mm 19mm 14mm; background: #fff; display: flex; flex-direction: column; }
  .brand { display: flex; gap: 12px; align-items: flex-start; border-bottom: 1.5px solid #2121FF; padding-bottom: 10px; }
  .logo { width: 44px; height: auto; flex: 0 0 auto; }
  .brand h1 { margin: 2px 0 0; font-size: 17px; font-weight: 600; }
  .brand p { margin: 4px 0 0; font-size: 9.5px; color: #666; line-height: 1.45; }
  h2.title { text-align: center; font-size: 20px; font-weight: 500; margin: 30px 0 22px; letter-spacing: .5px; }
  .meta { display: grid; grid-template-columns: 110px 12px 1fr; row-gap: 5px; font-size: 13px; }
  .status { font-weight: 700; }
  h3 { font-size: 13px; font-weight: 600; margin: 22px 0 6px; }
  .kepada { font-size: 13px; line-height: 1.6; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
  table.items th, table.items td { border: 1px solid #d8dde6; padding: 7px 8px; vertical-align: top; }
  table.items th { background: #f7f8fb; font-weight: 600; font-size: 11px; text-align: left; }
  table.items .num { text-align: right; white-space: nowrap; }
  .sub { color: #666; font-size: 10.5px; }
  .summary { margin-left: auto; width: 52%; margin-top: 12px; font-size: 13px; }
  .summary div { display: flex; justify-content: space-between; padding: 5px 0; }
  .summary .total { border-top: 1.5px solid #1a1a1a; font-weight: 700; font-size: 14px; margin-top: 4px; padding-top: 8px; }
  .terbilang { font-size: 13px; margin-top: 10px; }
  .terbilang em { font-style: italic; }
  .note { font-size: 12.5px; line-height: 1.6; color: #333; }
  .sign { margin-left: auto; width: 60%; text-align: center; font-size: 13px; margin-top: 28px; line-height: 1.6; }
  .sign .space { height: 56px; }
  .sign .nama { font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
  footer { margin-top: auto; border-top: 1px solid #e2e6ee; padding-top: 6px; display: flex; justify-content: space-between; font-size: 10px; color: #777; }
  @media print {
    body { background: #fff; }
    .toolbar { display: none; }
    .page { margin: 0; min-height: auto; box-shadow: none; padding: 12mm 14mm; }
  }
</style>
</head>
<body>
<div class="toolbar"><button onclick="window.print()">Cetak</button></div>
<div class="page">

  <header class="brand">
    ${logoInline}
    <div>
      <h1>${e(d.company.name)}</h1>
      <p>${e(d.company.addressLines[0])}<br />${e(d.company.addressLines[1])}${npwp}</p>
    </div>
  </header>

  <h2 class="title">NOTA TAGIHAN</h2>

  <section class="meta">
    <div>No. nota</div><div>:</div><div>${e(d.noNota)}</div>
    <div>Tanggal</div><div>:</div><div>${e(d.tanggal)}</div>
    <div>Kode pesanan</div><div>:</div><div>${e(d.kodePesanan)}</div>
    <div>Status</div><div>:</div><div class="status">${e(d.status)}</div>
    ${paid}
  </section>

  <h3>Ditagihkan kepada</h3>
  <div class="kepada">
    <strong>${e(d.kepada.nama)}</strong><br />
    ${e(d.kepada.email)}${d.kepada.whatsapp ? `<br />WhatsApp: ${e(d.kepada.whatsapp)}` : ""}
  </div>

  <h3>Rincian tagihan</h3>
  <table class="items">
    <thead>
      <tr>
        <th style="width:6%">No</th>
        <th>Deskripsi</th>
        <th style="width:8%; text-align:right">Qty</th>
        <th style="width:19%; text-align:right">Harga satuan</th>
        <th style="width:19%; text-align:right">Jumlah</th>
      </tr>
    </thead>
    <tbody>${rows}
    </tbody>
  </table>

  <div class="summary">
    <div><span>Subtotal</span><span>${rupiah(d.subtotal)}</span></div>
    <div class="total"><span>Total</span><span>${rupiah(d.total)}</span></div>
  </div>

  <p class="terbilang">Terbilang: <em>${e(d.terbilang)}</em></p>

  <h3>Pembayaran</h3>
  <p class="note">
    ${e(d.payment.method)}${d.payment.number ? ` ke <strong>${e(d.payment.number)}</strong>` : ""}${d.payment.name ? ` a.n. ${e(d.payment.name)}` : ""}.
    Transfer <strong>tepat ${rupiah(d.total)}</strong>, termasuk kode unik.
  </p>

  <h3>Catatan</h3>
  <p class="note">${footerNote}</p>

  <section class="sign">
    <div>${e(d.company.city)}, ${e(d.tanggal)}</div>
    <div><strong>Hormat kami,</strong></div>
    <div>${e(d.company.name)}</div>
    <div class="space"></div>
    <div class="nama">${e(d.company.signerName)}</div>
    <div>${e(d.company.signerTitle)}</div>
  </section>

  <footer>
    <span>${e(d.noNota)}</span>
    <span>Halaman 1 dari 1</span>
  </footer>

</div>
</body>
</html>`;
};

// PDF dibuat dengan pdf-lib. Logo diubah ke PNG dengan sharp.
export const renderNotaPdf = async (d) => {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([A4.width, A4.height]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);
  const ink = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.4, 0.4, 0.4);
  const blue = rgb(0.13, 0.13, 1);

  const M = 56;
  const W = A4.width - 2 * M;
  const top = (y) => A4.height - y; // y dihitung dari atas halaman

  const text = (s, x, y, size, f = font, color = ink) =>
    page.drawText(String(s), { x, y: top(y), size, font: f, color });
  const width = (s, size, f = font) => f.widthOfTextAtSize(String(s), size);
  const right = (s, xRight, y, size, f = font, color = ink) => text(s, xRight - width(s, size, f), y, size, f, color);
  const center = (s, y, size, f = font) => text(s, (A4.width - width(s, size, f)) / 2, y, size, f);
  const line = (x1, y1, x2, y2, thickness, color) =>
    page.drawLine({ start: { x: x1, y: top(y1) }, end: { x: x2, y: top(y2) }, thickness, color });

  // Header: logo, nama, alamat
  const logoPng = await sharp(Buffer.from(LOGO_SVG)).resize({ width: 240 }).png().toBuffer();
  const logo = await pdf.embedPng(logoPng);
  const lw = 40;
  const lh = (lw * logo.height) / logo.width;
  page.drawImage(logo, { x: M, y: top(40 + lh), width: lw, height: lh });
  text(d.company.name, M + 52, 50, 15, bold);
  text(d.company.addressLines[0], M + 52, 66, 7.5, font, gray);
  text(d.company.addressLines[1], M + 52, 77, 7.5, font, gray);
  if (d.company.npwp) text(`NPWP: ${d.company.npwp}`, M + 52, 88, 7.5, font, gray);
  line(M, 98, M + W, 98, 1.2, blue);

  // Judul dan metadata
  center("NOTA TAGIHAN", 138, 16, bold);
  const meta = [
    ["No. nota", d.noNota],
    ["Tanggal", d.tanggal],
    ["Kode pesanan", d.kodePesanan],
    ["Status", d.status]
  ];
  if (d.paidAt) meta.push(["Tanggal bayar", d.paidAt]);
  let y = 170;
  for (const [k, v] of meta) {
    text(k, M, y, 10.5);
    text(":", M + 92, y, 10.5);
    text(v, M + 104, y, 10.5, k === "Status" ? bold : font);
    y += 16;
  }

  // Tagihan kepada
  y += 14;
  text("Ditagihkan kepada", M, y, 10.5, bold);
  y += 15;
  text(d.kepada.nama, M, y, 10.5, bold);
  y += 13;
  text(d.kepada.email, M, y, 10.5);
  if (d.kepada.whatsapp) {
    y += 13;
    text(`WhatsApp: ${d.kepada.whatsapp}`, M, y, 10.5);
  }

  // Tabel rincian
  y += 26;
  text("Rincian tagihan", M, y, 10.5, bold);
  y += 10;
  const cols = { no: M, desc: M + 30, qty: M + 318, harga: M + 402, jumlah: M + W };
  const tableTop = y;
  page.drawRectangle({ x: M, y: top(tableTop + 22), width: W, height: 22, color: rgb(0.97, 0.97, 0.98) });
  y += 15;
  text("No", cols.no + 4, y, 9, bold);
  text("Deskripsi", cols.desc + 4, y, 9, bold);
  right("Qty", cols.qty, y, 9, bold);
  right("Harga satuan", cols.harga, y, 9, bold);
  right("Jumlah", cols.jumlah - 4, y, 9, bold);
  y = tableTop + 22;
  for (const item of d.items) {
    const rowH = 32;
    line(M, y, M + W, y, 0.6, rgb(0.85, 0.87, 0.9));
    text(item.no, cols.no + 4, y + 14, 9.5);
    text(item.title, cols.desc + 4, y + 13, 9.5);
    text(item.sub, cols.desc + 4, y + 25, 8, font, gray);
    right(item.qty, cols.qty, y + 14, 9.5);
    right(rupiah(item.harga), cols.harga, y + 14, 9.5);
    right(rupiah(item.jumlah), cols.jumlah - 4, y + 14, 9.5);
    y += rowH;
  }
  line(M, y, M + W, y, 0.6, rgb(0.85, 0.87, 0.9));

  // Ringkasan (tanpa diskon dan PPN)
  y += 22;
  const sumX = M + W * 0.48;
  text("Subtotal", sumX, y, 10.5);
  right(rupiah(d.subtotal), M + W, y, 10.5);
  y += 20;
  line(sumX, y - 12, M + W, y - 12, 1.2, ink);
  text("Total", sumX, y, 11.5, bold);
  right(rupiah(d.total), M + W, y, 11.5, bold);

  // Terbilang
  y += 24;
  text("Terbilang: ", M, y, 10.5);
  text(`${d.terbilang}`, M + width("Terbilang: ", 10.5) + 3, y, 10.5, italic);

  // Pembayaran dan catatan
  y += 26;
  text("Pembayaran", M, y, 10.5, bold);
  y += 14;
  const payLine = `${d.payment.method}${d.payment.number ? ` ke ${d.payment.number}` : ""}${d.payment.name ? ` a.n. ${d.payment.name}` : ""}. Transfer tepat ${rupiah(d.total)}, termasuk kode unik.`;
  text(payLine, M, y, 9.5, font, ink);
  y += 22;
  text("Catatan", M, y, 10.5, bold);
  y += 14;
  const note =
    d.status === "Lunas"
      ? `Terima kasih. Pesanan ini sudah lunas dan dikonfirmasi pada ${d.paidAt}.`
      : "Terima kasih. Nota ini adalah tagihan pesanan, bukan bukti pembayaran.";
  text(note, M, y, 9.5);
  y += 13;
  if (d.status !== "Lunas") text("Kwitansi lunas diterbitkan setelah pembayaran dikonfirmasi.", M, y, 9.5);

  // Tanda tangan
  const signX = M + W * 0.4;
  const signW = W * 0.6;
  y += 36;
  const cx = (s, size, f) => signX + (signW - width(s, size, f)) / 2;
  text(`${d.company.city}, ${d.tanggal}`, cx(`${d.company.city}, ${d.tanggal}`, 10.5), y, 10.5);
  y += 16;
  text("Hormat kami,", cx("Hormat kami,", 10.5, bold), y, 10.5, bold);
  y += 14;
  text(d.company.name, cx(d.company.name, 10.5), y, 10.5);
  y += 52;
  text(d.company.signerName, cx(d.company.signerName, 10.5, bold), y, 10.5, bold);
  line(cx(d.company.signerName, 10.5, bold), y + 2, cx(d.company.signerName, 10.5, bold) + width(d.company.signerName, 10.5, bold), y + 2, 0.8, ink);
  y += 13;
  text(d.company.signerTitle, cx(d.company.signerTitle, 10.5), y, 10.5);

  // Footer
  line(M, 800, M + W, 800, 0.5, rgb(0.9, 0.91, 0.93));
  text(d.noNota, M, 812, 8, font, gray);
  right("Halaman 1 dari 1", M + W, 812, 8, font, gray);

  pdf.setTitle(`Nota ${d.noNota}`);
  pdf.setAuthor(d.company.name);
  return Buffer.from(await pdf.save());
};
