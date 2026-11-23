import fs from "fs";
import mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";

// Konversi dokumen dengan library JavaScript murni (tanpa LibreOffice), supaya jalan di hosting Node biasa.
// - Word (.docx) ke PDF: isi dokumen dibaca mammoth (judul, paragraf, tebal/miring, daftar, tabel, gambar),
//   lalu disusun ulang ke halaman A4 dengan pdf-lib. Tata letak asli (kolom, posisi gambar, font) tidak ikut.
// - PDF ke Word: teks tiap halaman dibaca pdfjs lalu disusun jadi paragraf di .docx. Gambar tidak ikut,
//   dan PDF hasil pindaian (gambar tanpa teks) tidak bisa dibaca.
// - TXT ke PDF/Word, dan PDF/Word ke TXT.

/* ── Membaca PDF ─────────────────────────────────────────────────────────── */

// pdfjs dimuat saat dibutuhkan, karena ukurannya besar dan hanya dipakai konversi dari PDF.
let pdfjsPromise = null;
const loadPdfjs = () => (pdfjsPromise ||= import("pdfjs-dist/legacy/build/pdf.mjs"));

/**
 * Baca teks PDF per halaman, disusun jadi baris dan paragraf.
 * Hasil: [{ paragraphs: [{ text, size }] }] dengan size = tinggi huruf rata-rata (untuk mengenali judul).
 */
async function readPdfPages(inputPath) {
  const pdfjs = await loadPdfjs();
  const task = pdfjs.getDocument({
    data: new Uint8Array(fs.readFileSync(inputPath)),
    useSystemFonts: false,
    isEvalSupported: false,
    disableFontFace: true,
    verbosity: 0
  });
  const doc = await task.promise;
  const pages = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      // Kelompokkan potongan teks menjadi baris menurut posisi tegaknya.
      const lines = [];
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const y = item.transform[5];
        const x = item.transform[4];
        const size = Math.abs(item.transform[3]) || item.height || 10;
        let line = lines.find((l) => Math.abs(l.y - y) < size * 0.5);
        if (!line) {
          line = { y, size, parts: [] };
          lines.push(line);
        }
        line.parts.push({ x, str: item.str, width: item.width || 0 });
        line.size = Math.max(line.size, size);
      }
      lines.sort((a, b) => b.y - a.y);

      // Gabungkan baris berdekatan menjadi paragraf. Jarak antarbaris yang lebar berarti paragraf baru.
      const paragraphs = [];
      let current = null;
      let lastY = null;
      for (const line of lines) {
        line.parts.sort((a, b) => a.x - b.x);
        let text = "";
        let end = null;
        for (const part of line.parts) {
          if (end !== null && part.x - end > line.size * 0.25 && !text.endsWith(" ") && !part.str.startsWith(" ")) text += " ";
          text += part.str;
          end = part.x + part.width;
        }
        text = text.replace(/\s+/g, " ").trim();
        if (!text) continue;
        const gap = lastY === null ? 0 : lastY - line.y;
        const sizeChanged = current && Math.abs(current.size - line.size) > 1.5;
        if (!current || gap > line.size * 1.8 || sizeChanged) {
          current = { text, size: line.size };
          paragraphs.push(current);
        } else {
          // Kata yang terpotong tanda hubung di akhir baris disambung lagi.
          current.text = current.text.endsWith("-") ? current.text.slice(0, -1) + text : `${current.text} ${text}`;
        }
        lastY = line.y;
      }
      pages.push({ paragraphs });
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }
  return pages;
}

const pdfHasText = (pages) => pages.some((p) => p.paragraphs.length > 0);
const NO_TEXT = "PDF ini tidak berisi teks yang bisa dibaca (kemungkinan hasil scan atau gambar), jadi tidak bisa diubah ke dokumen.";

/** PDF ke Word (.docx): teks tiap halaman jadi paragraf, ukuran huruf besar jadi judul. */
export async function pdfToDocx(inputPath, outputPath) {
  const pages = await readPdfPages(inputPath);
  if (!pdfHasText(pages)) throw new Error(NO_TEXT);

  // Ukuran huruf yang paling sering dipakai dianggap teks biasa; yang jauh lebih besar dianggap judul.
  const sizes = pages.flatMap((p) => p.paragraphs.map((q) => Math.round(q.size)));
  const counts = sizes.reduce((acc, s) => ((acc[s] = (acc[s] || 0) + 1), acc), {});
  const body = Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 11);

  const children = [];
  pages.forEach((page, index) => {
    for (const p of page.paragraphs) {
      const ratio = p.size / body;
      const heading = ratio >= 1.6 ? HeadingLevel.HEADING_1 : ratio >= 1.3 ? HeadingLevel.HEADING_2 : null;
      children.push(
        heading
          ? new Paragraph({ heading, children: [new TextRun(p.text)] })
          : new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: p.text, size: 22 })] })
      );
    }
    if (index < pages.length - 1) children.push(new Paragraph({ children: [new PageBreak()] }));
  });

  const doc = new Document({ sections: [{ children }] });
  fs.writeFileSync(outputPath, await Packer.toBuffer(doc));
}

/** PDF ke teks biasa. */
export async function pdfToTxt(inputPath, outputPath) {
  const pages = await readPdfPages(inputPath);
  if (!pdfHasText(pages)) throw new Error(NO_TEXT);
  const text = pages.map((p) => p.paragraphs.map((q) => q.text).join("\n\n")).join("\n\n\f\n\n");
  fs.writeFileSync(outputPath, text, "utf8");
}

/* ── Word dan teks ke dokumen lain ───────────────────────────────────────── */

const assertDocx = (inputPath) => {
  const head = Buffer.alloc(2);
  const fd = fs.openSync(inputPath, "r");
  fs.readSync(fd, head, 0, 2, 0);
  fs.closeSync(fd);
  // .docx adalah arsip ZIP (diawali "PK"). File .doc lama berformat lain dan belum didukung.
  if (head.toString("latin1") !== "PK") {
    throw new Error("File ini bukan Word .docx. Simpan ulang dokumen sebagai .docx (Word 2007 ke atas), lalu coba lagi.");
  }
};

/** Word (.docx) ke teks biasa. */
export async function docxToTxt(inputPath, outputPath) {
  assertDocx(inputPath);
  const { value } = await mammoth.extractRawText({ path: inputPath });
  fs.writeFileSync(outputPath, value, "utf8");
}

/** Teks biasa ke Word (.docx). */
export async function txtToDocx(inputPath, outputPath) {
  const text = fs.readFileSync(inputPath, "utf8").replace(/\r\n?/g, "\n");
  const children = text.split("\n").map((line) => new Paragraph({ children: [new TextRun({ text: line, size: 22 })] }));
  const doc = new Document({ sections: [{ children: children.length ? children : [new Paragraph("")] }] });
  fs.writeFileSync(outputPath, await Packer.toBuffer(doc));
}

/* ── Menyusun PDF dari blok teks ─────────────────────────────────────────── */

// Ukuran A4 dalam poin, dengan margin 2 cm.
const PAGE = { width: 595.28, height: 841.89, margin: 56.7 };
const STYLE = {
  h1: { size: 20, bold: true, before: 14, after: 8 },
  h2: { size: 16, bold: true, before: 12, after: 6 },
  h3: { size: 13.5, bold: true, before: 10, after: 5 },
  h4: { size: 12, bold: true, before: 8, after: 4 },
  p: { size: 11, bold: false, before: 0, after: 7 },
  li: { size: 11, bold: false, before: 0, after: 3 },
  cell: { size: 9.5, bold: false, before: 0, after: 0 }
};

// Font bawaan PDF hanya mengenal huruf Latin. Karakter lain diganti tanda tanya supaya PDF tetap jadi.
function makeSanitizer(font) {
  const supported = new Set(font.getCharacterSet());
  const swaps = { " ": " ", " ": " ", " ": " ", " ": " ", "​": "", "−": "-", "‐": "-", "‑": "-", "\t": "    " };
  return (text) =>
    Array.from(String(text))
      .map((ch) => (ch in swaps ? swaps[ch] : supported.has(ch.codePointAt(0)) ? ch : "?"))
      .join("");
}

class PdfWriter {
  constructor(pdf, fonts) {
    this.pdf = pdf;
    this.fonts = fonts;
    this.clean = makeSanitizer(fonts.regular);
    this.width = PAGE.width - PAGE.margin * 2;
    this.newPage();
  }

  newPage() {
    this.page = this.pdf.addPage([PAGE.width, PAGE.height]);
    this.y = PAGE.height - PAGE.margin;
  }

  ensure(height) {
    if (this.y - height < PAGE.margin) this.newPage();
  }

  font(run) {
    if (run.bold && run.italic) return this.fonts.boldItalic;
    if (run.bold) return this.fonts.bold;
    if (run.italic) return this.fonts.italic;
    return this.fonts.regular;
  }

  /** Tulis paragraf dari potongan teks bergaya (tebal/miring), dibungkus sesuai lebar. */
  paragraph(runs, style, { indent = 0, prefix = "", width = this.width } = {}) {
    const size = style.size;
    const lineHeight = size * 1.35;
    this.y -= style.before;
    // Pecah jadi kata, tiap kata menyimpan fontnya.
    const words = [];
    for (const run of runs) {
      const font = this.font({ bold: run.bold || style.bold, italic: run.italic });
      const text = this.clean(run.text);
      for (const piece of text.split(/(\s+)/)) {
        if (piece === "") continue;
        words.push({ text: piece, font, space: /^\s+$/.test(piece) });
      }
    }
    const lines = [];
    let line = [];
    let lineWidth = 0;
    const available = width - indent;
    for (const word of words) {
      const w = word.font.widthOfTextAtSize(word.space ? " " : word.text, size);
      if (word.space) {
        if (line.length) {
          line.push({ ...word, text: " ", w });
          lineWidth += w;
        }
        continue;
      }
      if (lineWidth + w > available && line.length) {
        while (line.length && line[line.length - 1].space) line.pop();
        lines.push(line);
        line = [];
        lineWidth = 0;
      }
      // Kata yang lebih panjang dari satu baris dipotong per huruf.
      if (w > available) {
        let chunk = "";
        for (const ch of word.text) {
          if (word.font.widthOfTextAtSize(chunk + ch, size) > available && chunk) {
            lines.push([{ ...word, text: chunk, w: word.font.widthOfTextAtSize(chunk, size) }]);
            chunk = "";
          }
          chunk += ch;
        }
        line = [{ ...word, text: chunk, w: word.font.widthOfTextAtSize(chunk, size) }];
        lineWidth = line[0].w;
        continue;
      }
      line.push({ ...word, w });
      lineWidth += w;
    }
    if (line.length) lines.push(line);
    if (!lines.length) lines.push([]);

    lines.forEach((parts, index) => {
      this.ensure(lineHeight);
      this.y -= size;
      let x = PAGE.margin + indent;
      if (index === 0 && prefix) {
        this.page.drawText(prefix, { x: x - 14, y: this.y, size, font: this.fonts.regular, color: rgb(0.1, 0.1, 0.12) });
      }
      for (const part of parts) {
        if (!part.space) this.page.drawText(part.text, { x, y: this.y, size, font: part.font, color: rgb(0.1, 0.1, 0.12) });
        x += part.w;
      }
      this.y -= lineHeight - size;
    });
    this.y -= style.after;
  }

  /** Gambar dari dokumen, dikecilkan supaya muat selebar halaman. */
  async image(buffer) {
    let bytes = buffer;
    let embedded;
    try {
      const meta = await sharp(bytes).metadata();
      if (meta.format === "png") embedded = await this.pdf.embedPng(bytes);
      else {
        if (meta.format !== "jpeg") bytes = await sharp(bytes).jpeg({ quality: 88 }).toBuffer();
        embedded = await this.pdf.embedJpg(bytes);
      }
    } catch {
      return; // Gambar yang tidak bisa dibaca dilewati.
    }
    const scale = Math.min(1, this.width / embedded.width, (PAGE.height - PAGE.margin * 2) / embedded.height);
    const w = embedded.width * scale;
    const h = embedded.height * scale;
    this.y -= 4;
    this.ensure(h);
    this.y -= h;
    this.page.drawImage(embedded, { x: PAGE.margin, y: this.y, width: w, height: h });
    this.y -= 8;
  }

  /** Tabel sederhana: kolom sama lebar, garis tipis di setiap sel. */
  table(rows) {
    const columns = Math.max(1, ...rows.map((r) => r.length));
    const colWidth = this.width / columns;
    const style = STYLE.cell;
    const pad = 4;
    for (const row of rows) {
      // Hitung tinggi baris dari sel yang paling banyak barisnya.
      const cellLines = row.map((cell) => this.wrapPlain(cell.text, cell.bold, style.size, colWidth - pad * 2));
      const lineHeight = style.size * 1.3;
      const height = Math.max(1, ...cellLines.map((l) => l.length)) * lineHeight + pad * 2;
      this.ensure(height);
      const top = this.y;
      for (let c = 0; c < columns; c++) {
        const x = PAGE.margin + c * colWidth;
        this.page.drawRectangle({ x, y: top - height, width: colWidth, height, borderColor: rgb(0.78, 0.79, 0.82), borderWidth: 0.6 });
        const lines = cellLines[c] || [];
        const font = row[c]?.bold ? this.fonts.bold : this.fonts.regular;
        lines.forEach((text, i) => {
          this.page.drawText(text, { x: x + pad, y: top - pad - style.size - i * lineHeight, size: style.size, font, color: rgb(0.1, 0.1, 0.12) });
        });
      }
      this.y = top - height;
    }
    this.y -= 8;
  }

  wrapPlain(text, bold, size, width) {
    const font = bold ? this.fonts.bold : this.fonts.regular;
    const words = this.clean(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  }
}

async function newPdfWriter() {
  const pdf = await PDFDocument.create();
  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await pdf.embedFont(StandardFonts.HelveticaBoldOblique)
  };
  return { pdf, writer: new PdfWriter(pdf, fonts) };
}

/** Teks biasa ke PDF. */
export async function txtToPdf(inputPath, outputPath) {
  const text = fs.readFileSync(inputPath, "utf8").replace(/\r\n?/g, "\n");
  const { pdf, writer } = await newPdfWriter();
  for (const line of text.split("\n")) writer.paragraph([{ text: line || " " }], { ...STYLE.p, after: 2 });
  fs.writeFileSync(outputPath, await pdf.save());
}

/* ── Word (.docx) ke PDF ─────────────────────────────────────────────────── */

const decodeEntities = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");

/**
 * Ubah HTML sederhana dari mammoth menjadi daftar blok:
 * { type: 'h1'..'h4'|'p'|'li', runs:[{text,bold,italic}], prefix } | { type:'img', src } | { type:'table', rows }.
 */
function htmlToBlocks(html) {
  const blocks = [];
  const tokens = html.match(/<[^>]+>|[^<]+/g) || [];
  let block = null;
  let bold = 0;
  let italic = 0;
  const lists = []; // tumpukan daftar: { ordered, count }
  let table = null;
  let row = null;
  let cell = null;

  const flush = () => {
    if (block && block.runs.some((r) => r.text.trim())) blocks.push(block);
    block = null;
  };
  const addText = (text) => {
    if (cell) {
      cell.text += text;
      if (bold) cell.bold = true;
      return;
    }
    if (!block) block = { type: "p", runs: [] };
    block.runs.push({ text, bold: bold > 0, italic: italic > 0 });
  };

  for (const token of tokens) {
    if (!token.startsWith("<")) {
      addText(decodeEntities(token));
      continue;
    }
    const closing = token.startsWith("</");
    const name = (token.match(/^<\/?\s*([a-z0-9]+)/i)?.[1] || "").toLowerCase();
    if (["strong", "b"].includes(name)) bold += closing ? -1 : 1;
    else if (["em", "i"].includes(name)) italic += closing ? -1 : 1;
    else if (/^h[1-6]$/.test(name) || name === "p") {
      if (cell) {
        if (closing) cell.text += " ";
        continue;
      }
      flush();
      if (!closing) {
        const type = name === "p" ? "p" : `h${Math.min(4, Number(name[1]))}`;
        block = { type, runs: [] };
      }
    } else if (name === "ul" || name === "ol") {
      flush();
      if (closing) lists.pop();
      else lists.push({ ordered: name === "ol", count: 0 });
    } else if (name === "li") {
      flush();
      if (!closing) {
        const list = lists[lists.length - 1] || { ordered: false, count: 0 };
        list.count += 1;
        block = { type: "li", runs: [], depth: Math.max(1, lists.length), prefix: list.ordered ? `${list.count}.` : "•" };
      }
    } else if (name === "br") addText("\n");
    else if (name === "img") {
      const src = token.match(/src="([^"]+)"/i)?.[1];
      if (src) {
        flush();
        blocks.push({ type: "img", src });
      }
    } else if (name === "table") {
      flush();
      if (closing) {
        if (table && table.rows.length) blocks.push(table);
        table = null;
      } else table = { type: "table", rows: [] };
    } else if (name === "tr") {
      if (closing) {
        if (table && row) table.rows.push(row);
        row = null;
      } else row = [];
    } else if (name === "td" || name === "th") {
      if (closing) {
        if (row && cell) row.push({ text: cell.text.replace(/\s+/g, " ").trim(), bold: cell.bold });
        cell = null;
      } else cell = { text: "", bold: name === "th" };
    }
  }
  flush();
  return blocks;
}

/** Word (.docx) ke PDF. */
export async function docxToPdf(inputPath, outputPath) {
  assertDocx(inputPath);
  const { value: html } = await mammoth.convertToHtml(
    { path: inputPath },
    {
      convertImage: mammoth.images.imgElement(async (image) => ({
        src: `data:${image.contentType};base64,${await image.read("base64")}`
      }))
    }
  );
  const blocks = htmlToBlocks(html);
  if (!blocks.length) throw new Error("Dokumen Word ini kosong atau isinya tidak bisa dibaca.");

  const { pdf, writer } = await newPdfWriter();
  for (const block of blocks) {
    if (block.type === "img") {
      const data = block.src.match(/^data:[^;]+;base64,(.+)$/)?.[1];
      if (data) await writer.image(Buffer.from(data, "base64"));
    } else if (block.type === "table") {
      writer.table(block.rows);
    } else if (block.type === "li") {
      // Baris baru di dalam butir daftar dipecah supaya tetap rapi.
      writer.paragraph(block.runs, STYLE.li, { indent: 16 * block.depth, prefix: block.prefix });
    } else {
      const style = STYLE[block.type] || STYLE.p;
      const parts = splitOnBreaks(block.runs);
      parts.forEach((runs, i) => writer.paragraph(runs, i < parts.length - 1 ? { ...style, after: 0 } : style));
    }
  }
  fs.writeFileSync(outputPath, await pdf.save());
}

// Pisahkan potongan teks pada baris baru (<br>), supaya baris baru di Word tetap jadi baris baru di PDF.
function splitOnBreaks(runs) {
  const out = [[]];
  for (const run of runs) {
    const pieces = run.text.split("\n");
    pieces.forEach((piece, i) => {
      if (i > 0) out.push([]);
      if (piece) out[out.length - 1].push({ ...run, text: piece });
    });
  }
  return out.map((r) => (r.length ? r : [{ text: " " }]));
}

/** Pilih fungsi konversi dokumen untuk pasangan format tertentu, atau null bila tidak ada. */
export function documentConverter(fromExt, toExt) {
  const key = `${fromExt}>${toExt}`;
  const map = {
    "docx>pdf": docxToPdf,
    "docx>txt": docxToTxt,
    "pdf>docx": pdfToDocx,
    "pdf>txt": pdfToTxt,
    "txt>pdf": txtToPdf,
    "txt>docx": txtToDocx
  };
  return map[key] || null;
}
