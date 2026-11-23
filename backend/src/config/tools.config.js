export const CATEGORIES_CONFIG = [
  {
    id: "video-audio",
    label: "Video & Audio",
    icon: "video",
    description: "Convert video and audio files into modern, optimized formats with crystal clarity.",
    tools: [
      {
        id: "video-converter",
        label: "Video Converter",
        description: "Universal video converter supporting MP4, MOV, MKV, WEBM, AVI, and more.",
        category: "video-audio",
        type: "video",
        from: ["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv"],
        to: ["mp4", "mov", "mkv", "webm", "avi"],
        defaultTo: "mp4",
        maxSizeMB: 100,
        popular: true
      },
      {
        id: "audio-converter",
        label: "Audio Converter",
        description: "High quality audio format conversion across MP3, WAV, OGG, AAC, FLAC, M4A.",
        category: "video-audio",
        type: "audio",
        from: ["mp3", "wav", "ogg", "aac", "flac", "m4a"],
        to: ["mp3", "wav", "ogg", "aac", "flac", "m4a"],
        defaultTo: "mp3",
        maxSizeMB: 50
      },
      {
        id: "mp3-converter",
        label: "MP3 Converter",
        description: "Convert any audio or video recording directly into high quality MP3 format.",
        category: "video-audio",
        type: "audio",
        from: ["wav", "ogg", "aac", "flac", "m4a", "mp4", "mov", "avi", "webm", "wmv"],
        to: ["mp3"],
        defaultTo: "mp3",
        maxSizeMB: 80,
        popular: true
      },
      {
        id: "mp4-to-mp3",
        label: "MP4 to MP3",
        description: "Extract clean audio track from MP4 video file to MP3 in seconds.",
        category: "video-audio",
        type: "audio",
        from: ["mp4"],
        to: ["mp3"],
        defaultTo: "mp3",
        maxSizeMB: 100
      },
      {
        id: "video-to-mp3",
        label: "Video to MP3",
        description: "Extract audio streams from all common video formats into 320kbps MP3.",
        category: "video-audio",
        type: "audio",
        from: ["mp4", "mov", "avi", "mkv", "webm", "wmv", "flv"],
        to: ["mp3"],
        defaultTo: "mp3",
        maxSizeMB: 100
      },
      {
        id: "mp4-converter",
        label: "MP4 Converter",
        description: "Convert MOV, AVI, MKV, WEBM videos into highly compatible H.264 MP4 format.",
        category: "video-audio",
        type: "video",
        from: ["mov", "avi", "mkv", "webm", "flv", "wmv"],
        to: ["mp4"],
        defaultTo: "mp4",
        maxSizeMB: 100
      },
      {
        id: "mov-to-mp4",
        label: "MOV to MP4",
        description: "Convert Apple QuickTime MOV videos to web-friendly MP4 format.",
        category: "video-audio",
        type: "video",
        from: ["mov"],
        to: ["mp4"],
        defaultTo: "mp4",
        maxSizeMB: 100
      },
      {
        id: "mp3-to-ogg",
        label: "MP3 to OGG",
        description: "Convert standard MP3 audio into lightweight OGG Vorbis audio.",
        category: "video-audio",
        type: "audio",
        from: ["mp3"],
        to: ["ogg"],
        defaultTo: "ogg",
        maxSizeMB: 50
      },
      {id: "webm-to-mp4", label: "WEBM to MP4", description: "Convert WEBM web videos to widely supported MP4.", category: "video-audio", type: "video", from: ["webm"], to: ["mp4"],defaultTo: "mp4",maxSizeMB: 100},
      {id: "mkv-to-mp4", label: "MKV to MP4", description: "Convert MKV videos to MP4 for phones and browsers.", category: "video-audio", type: "video", from: ["mkv"], to: ["mp4"],defaultTo: "mp4",maxSizeMB: 100},
      {id: "avi-to-mp4", label: "AVI to MP4", description: "Convert old AVI videos to modern MP4.", category: "video-audio", type: "video", from: ["avi"], to: ["mp4"],defaultTo: "mp4",maxSizeMB: 100},
      {id: "mp4-to-webm", label: "MP4 to WEBM", description: "Convert MP4 to lightweight WEBM for the web.", category: "video-audio", type: "video", from: ["mp4"], to: ["webm"],defaultTo: "webm",maxSizeMB: 100},
      {id: "wav-to-mp3", label: "WAV to MP3", description: "Convert large WAV recordings to small MP3 files.", category: "video-audio", type: "audio", from: ["wav"], to: ["mp3"],defaultTo: "mp3",maxSizeMB: 80, popular: true},
      {id: "m4a-to-mp3", label: "M4A to MP3", description: "Convert iPhone voice notes and M4A audio to MP3.", category: "video-audio", type: "audio", from: ["m4a"], to: ["mp3"],defaultTo: "mp3",maxSizeMB: 80, popular: true},
      {id: "ogg-to-mp3", label: "OGG to MP3", description: "Convert OGG audio and WhatsApp voice notes to MP3.", category: "video-audio", type: "audio", from: ["ogg", "opus"], to: ["mp3"],defaultTo: "mp3",maxSizeMB: 80},
      {id: "flac-to-mp3", label: "FLAC to MP3", description: "Convert lossless FLAC music to MP3.", category: "video-audio", type: "audio", from: ["flac"], to: ["mp3"],defaultTo: "mp3",maxSizeMB: 80},
      {id: "aac-to-mp3", label: "AAC to MP3", description: "Convert AAC audio to MP3.", category: "video-audio", type: "audio", from: ["aac"], to: ["mp3"],defaultTo: "mp3",maxSizeMB: 80},
      {id: "mp3-to-wav", label: "MP3 to WAV", description: "Convert MP3 to uncompressed WAV for editing.", category: "video-audio", type: "audio", from: ["mp3"], to: ["wav"],defaultTo: "wav",maxSizeMB: 80},
      {id: "mp4-to-wav", label: "MP4 to WAV", description: "Extract the audio track of a video as WAV.", category: "video-audio", type: "audio", from: ["mp4", "mov", "mkv", "webm"], to: ["wav"],defaultTo: "wav",maxSizeMB: 100}
    ]
  },
  {
    id: "image",
    label: "Image",
    icon: "image",
    description: "Lightning-fast image conversions with lossless quality and web compression.",
    tools: [
      {
        id: "image-converter",
        label: "Image Converter",
        description: "Universal image conversion across WEBP, PNG, JPG, TIFF, GIF, BMP, AVIF.",
        category: "image",
        type: "image",
        from: ["png", "jpg", "jpeg", "webp", "heic", "tiff", "gif", "bmp", "avif", "svg"],
        to: ["png", "jpg", "webp", "avif", "tiff", "gif", "ico"],
        defaultTo: "webp",
        maxSizeMB: 30
      },
      {
        id: "webp-to-png",
        label: "WEBP to PNG",
        description: "Convert WEBP graphics to high-fidelity transparent PNG files.",
        category: "image",
        type: "image",
        from: ["webp"],
        to: ["png"],
        defaultTo: "png",
        maxSizeMB: 25,
        popular: true
      },
      {
        id: "jfif-to-png",
        label: "JFIF to PNG",
        description: "Convert JFIF / JPEG camera images to standard PNG format.",
        category: "image",
        type: "image",
        from: ["jfif", "jpg", "jpeg"],
        to: ["png"],
        defaultTo: "png",
        maxSizeMB: 25
      },
      {
        id: "png-to-svg",
        label: "PNG to SVG",
        description: "Wrap and convert raster PNG images into scalable SVG vector containers.",
        category: "image",
        type: "image",
        from: ["png"],
        to: ["svg"],
        defaultTo: "svg",
        maxSizeMB: 20
      },
      {
        id: "heic-to-jpg",
        label: "HEIC to JPG",
        description: "Convert Apple iPhone HEIC/HEIF photos to universally viewable JPG images.",
        category: "image",
        type: "image",
        from: ["heic", "heif"],
        to: ["jpg"],
        defaultTo: "jpg",
        maxSizeMB: 30,
        popular: true
      },
      {
        id: "heic-to-png",
        label: "HEIC to PNG",
        description: "Convert Apple HEIC photos into uncompressed lossless PNG format.",
        category: "image",
        type: "image",
        from: ["heic", "heif"],
        to: ["png"],
        defaultTo: "png",
        maxSizeMB: 30
      },
      {
        id: "webp-to-jpg",
        label: "WEBP to JPG",
        description: "Convert Google WEBP pictures to standard JPEG pictures with 100% quality.",
        category: "image",
        type: "image",
        from: ["webp"],
        to: ["jpg"],
        defaultTo: "jpg",
        maxSizeMB: 25
      },
      {
        id: "svg-converter",
        label: "SVG Converter",
        description: "Convert SVG vectors to high-res PNG, JPG, WEBP or convert images to SVG.",
        category: "image",
        type: "image",
        from: ["svg", "png", "jpg", "jpeg", "webp"],
        to: ["svg", "png", "jpg", "webp"],
        defaultTo: "png",
        maxSizeMB: 25
      },
      {id: "jpg-to-png", label: "JPG to PNG", description: "Convert JPG photos to PNG.", category: "image", type: "image", from: ["jpg", "jpeg", "jfif"], to: ["png"],defaultTo: "png",maxSizeMB: 30, popular: true},
      {id: "png-to-jpg", label: "PNG to JPG", description: "Convert PNG images to smaller JPG files.", category: "image", type: "image", from: ["png"], to: ["jpg"],defaultTo: "jpg",maxSizeMB: 30, popular: true},
      {id: "jpg-to-webp", label: "JPG to WEBP", description: "Convert JPG to lightweight WEBP for websites.", category: "image", type: "image", from: ["jpg", "jpeg", "jfif"], to: ["webp"],defaultTo: "webp",maxSizeMB: 30},
      {id: "png-to-webp", label: "PNG to WEBP", description: "Convert PNG to WEBP while keeping transparency.", category: "image", type: "image", from: ["png"], to: ["webp"],defaultTo: "webp",maxSizeMB: 30},
      {id: "avif-to-jpg", label: "AVIF to JPG", description: "Convert AVIF images to universally viewable JPG.", category: "image", type: "image", from: ["avif"], to: ["jpg"],defaultTo: "jpg",maxSizeMB: 30},
      {id: "avif-to-png", label: "AVIF to PNG", description: "Convert AVIF images to PNG.", category: "image", type: "image", from: ["avif"], to: ["png"],defaultTo: "png",maxSizeMB: 30},
      {id: "tiff-to-jpg", label: "TIFF to JPG", description: "Convert TIFF scans to JPG.", category: "image", type: "image", from: ["tiff", "tif"], to: ["jpg"],defaultTo: "jpg",maxSizeMB: 30},
      {id: "gif-to-webp", label: "GIF to WEBP", description: "Convert animated GIF to much smaller animated WEBP.", category: "image", type: "image", from: ["gif"], to: ["webp"],defaultTo: "webp",maxSizeMB: 30},
      {id: "png-to-ico", label: "PNG to ICO", description: "Create a favicon ICO (16 to 256 px) from an image.", category: "image", type: "image", from: ["png", "jpg", "jpeg", "webp", "svg"], to: ["ico"],defaultTo: "ico",maxSizeMB: 30}
    ]
  },
  {
    id: "pdf-documents",
    label: "PDF & Documents",
    icon: "file-text",
    description: "Convert PDFs, Word documents, and eBooks easily.",
    tools: [
      { id: "pdf-converter-legacy", label: "PDF Converter", description: "Convert between PDF and various other formats.", category: "pdf-documents", type: "document", from: ["pdf", "docx", "epub", "jpg", "png"], to: ["pdf", "docx", "jpg", "epub"], defaultTo: "pdf", maxSizeMB: 50 },
      { id: "document-converter", label: "Document Converter", description: "Convert between Word (DOCX), PDF and TXT.", category: "pdf-documents", type: "document", from: ["pdf", "docx", "txt"], to: ["pdf", "docx", "txt"], defaultTo: "pdf", maxSizeMB: 50 },
      { id: "ebook-converter", label: "Ebook Converter", description: "Convert eBooks to and from EPUB, PDF, MOBI.", category: "pdf-documents", type: "document", from: ["epub", "pdf", "mobi"], to: ["epub", "pdf", "mobi"], defaultTo: "epub", maxSizeMB: 50 },
      { id: "pdf-to-jpg", label: "PDF to JPG", description: "Extract pages from PDF to high quality JPG images.", category: "pdf-documents", type: "document", from: ["pdf"], to: ["jpg"], defaultTo: "jpg", maxSizeMB: 50 },
      { id: "pdf-to-epub", label: "PDF to EPUB", description: "Convert PDF to EPUB format for e-readers.", category: "pdf-documents", type: "document", from: ["pdf"], to: ["epub"], defaultTo: "epub", maxSizeMB: 50 },
      { id: "epub-to-pdf", label: "EPUB to PDF", description: "Convert EPUB eBooks to standard PDF documents.", category: "pdf-documents", type: "document", from: ["epub"], to: ["pdf"], defaultTo: "pdf", maxSizeMB: 50 },
      { id: "heic-to-pdf", label: "HEIC to PDF", description: "Convert HEIC images directly into a PDF document.", category: "pdf-documents", type: "document", from: ["heic", "heif"], to: ["pdf"], defaultTo: "pdf", maxSizeMB: 30 },
      { id: "jpg-to-pdf", label: "JPG to PDF", description: "Convert a JPG image into a PDF document.", category: "pdf-documents", type: "document", from: ["jpg", "jpeg"], to: ["pdf"], defaultTo: "pdf", maxSizeMB: 50 },
      {id: "word-to-pdf", label: "Word to PDF", description: "Convert Word DOCX documents to PDF.", category: "pdf-documents", type: "document", from: ["docx"], to: ["pdf"],defaultTo: "pdf",maxSizeMB: 50, popular: true},
      {id: "pdf-to-word", label: "PDF to Word", description: "Convert PDF text into an editable Word DOCX file.", category: "pdf-documents", type: "document", from: ["pdf"], to: ["docx"],defaultTo: "docx",maxSizeMB: 50, popular: true},
      {id: "pdf-to-txt", label: "PDF to TXT", description: "Extract all text from a PDF into a TXT file.", category: "pdf-documents", type: "document", from: ["pdf"], to: ["txt"],defaultTo: "txt",maxSizeMB: 50},
      {id: "word-to-txt", label: "Word to TXT", description: "Extract plain text from a Word document.", category: "pdf-documents", type: "document", from: ["docx"], to: ["txt"],defaultTo: "txt",maxSizeMB: 50},
      {id: "txt-to-pdf", label: "TXT to PDF", description: "Turn a plain text file into a PDF document.", category: "pdf-documents", type: "document", from: ["txt"], to: ["pdf"],defaultTo: "pdf",maxSizeMB: 50},
      {id: "txt-to-word", label: "TXT to Word", description: "Turn a plain text file into a Word document.", category: "pdf-documents", type: "document", from: ["txt"], to: ["docx"],defaultTo: "docx",maxSizeMB: 50},
      {id: "png-to-pdf", label: "PNG to PDF", description: "Convert a PNG image into a PDF document.", category: "pdf-documents", type: "document", from: ["png"], to: ["pdf"],defaultTo: "pdf",maxSizeMB: 50},
      {id: "image-to-pdf", label: "Image to PDF", description: "Convert JPG, PNG, WEBP or HEIC images into PDF.", category: "pdf-documents", type: "document", from: ["jpg", "jpeg", "png", "webp", "heic", "heif", "avif"], to: ["pdf"],defaultTo: "pdf",maxSizeMB: 50}
    ]
  },
  {
    id: "gif",
    label: "GIF",
    icon: "image",
    description: "Create and convert animated GIFs from videos or images.",
    tools: [
      { id: "video-to-gif", label: "Video to GIF", description: "Convert any video into an animated GIF.", category: "gif", type: "image", from: ["mp4", "webm", "mov", "avi"], to: ["gif"], defaultTo: "gif", maxSizeMB: 100, popular: true },
      { id: "mp4-to-gif", label: "MP4 to GIF", description: "Convert MP4 videos into animated GIF format.", category: "gif", type: "image", from: ["mp4"], to: ["gif"], defaultTo: "gif", maxSizeMB: 100 },
      { id: "webm-to-gif", label: "WEBM to GIF", description: "Convert WEBM web videos to GIF.", category: "gif", type: "image", from: ["webm"], to: ["gif"], defaultTo: "gif", maxSizeMB: 100 },
      { id: "apng-to-gif", label: "APNG to GIF", description: "Convert animated PNG to standard GIF.", category: "gif", type: "image", from: ["apng"], to: ["gif"], defaultTo: "gif", maxSizeMB: 30 },
      { id: "gif-to-mp4", label: "GIF to MP4", description: "Convert animated GIFs into MP4 video format.", category: "gif", type: "video", from: ["gif"], to: ["mp4"], defaultTo: "mp4", maxSizeMB: 50 },
      { id: "gif-to-apng", label: "GIF to APNG", description: "Convert GIF to animated PNG (APNG) for better quality.", category: "gif", type: "image", from: ["gif"], to: ["apng"], defaultTo: "apng", maxSizeMB: 50 },
      { id: "image-to-gif", label: "Image to GIF", description: "Convert static images to GIF format.", category: "gif", type: "image", from: ["png", "jpg", "jpeg", "webp"], to: ["gif"], defaultTo: "gif", maxSizeMB: 20 },
      { id: "mov-to-gif", label: "MOV to GIF", description: "Convert MOV videos into GIF animations.", category: "gif", type: "image", from: ["mov"], to: ["gif"], defaultTo: "gif", maxSizeMB: 100 },
      { id: "avi-to-gif", label: "AVI to GIF", description: "Convert AVI videos to GIF.", category: "gif", type: "image", from: ["avi"], to: ["gif"], defaultTo: "gif", maxSizeMB: 100 }
    ]
  }
];

// Helper to look up a tool by ID
export function getToolById(toolId) {
  for (const cat of CATEGORIES_CONFIG) {
    const found = cat.tools.find((t) => t.id === toolId);
    if (found) return found;
  }
  return null;
}

// Helper to find all available tools flattened
export function getAllTools() {
  return CATEGORIES_CONFIG.flatMap((cat) => cat.tools);
}

export const COMPRESSORS_CONFIG = [
  {
    id: "compress-video-audio",
    label: "Video & Audio",
    icon: "video",
    description: "Reduce file sizes of your media without losing quality.",
    tools: [
      { id: "video-compressor", label: "Video Compressor", description: "Compress MP4, MOV, and AVI videos.", category: "compress-video-audio", type: "video", from: ["mp4", "mov", "avi", "mkv", "webm"], to: ["mp4"], defaultTo: "mp4", maxSizeMB: 500, popular: true },
      { id: "mp3-compressor", label: "MP3 Compressor", description: "Compress MP3 audio files.", category: "compress-video-audio", type: "audio", from: ["mp3"], to: ["mp3"], defaultTo: "mp3", maxSizeMB: 100 },
      { id: "wav-compressor", label: "WAV Compressor", description: "Compress WAV audio files.", category: "compress-video-audio", type: "audio", from: ["wav"], to: ["wav"], defaultTo: "wav", maxSizeMB: 200 },
      { id: "mp4-compressor", label: "MP4 Compressor", description: "Shrink MP4 videos for WhatsApp, email and upload.", category: "compress-video-audio", type: "video", from: ["mp4"], to: ["mp4"], defaultTo: "mp4", maxSizeMB: 500, popular: true },
      { id: "mov-compressor", label: "MOV Compressor", description: "Compress iPhone MOV videos.", category: "compress-video-audio", type: "video", from: ["mov"], to: ["mov", "mp4"], defaultTo: "mov", maxSizeMB: 500 },
      { id: "webm-compressor", label: "WEBM Compressor", description: "Compress WEBM videos.", category: "compress-video-audio", type: "video", from: ["webm"], to: ["webm"], defaultTo: "webm", maxSizeMB: 500 },
      { id: "mkv-compressor", label: "MKV Compressor", description: "Compress MKV videos.", category: "compress-video-audio", type: "video", from: ["mkv"], to: ["mkv", "mp4"], defaultTo: "mkv", maxSizeMB: 500 },
      { id: "m4a-compressor", label: "M4A Compressor", description: "Compress M4A and AAC audio.", category: "compress-video-audio", type: "audio", from: ["m4a", "aac"], to: ["m4a"], defaultTo: "m4a", maxSizeMB: 200 },
      { id: "ogg-compressor", label: "OGG Compressor", description: "Compress OGG audio.", category: "compress-video-audio", type: "audio", from: ["ogg", "opus"], to: ["ogg"], defaultTo: "ogg", maxSizeMB: 200 },
      { id: "flac-compressor", label: "FLAC Compressor", description: "Make FLAC files smaller, lossless or with lower sample rate.", category: "compress-video-audio", type: "audio", from: ["flac"], to: ["flac", "mp3"], defaultTo: "flac", maxSizeMB: 300 }
    ]
  },
  {
    id: "compress-image",
    label: "Image",
    icon: "image",
    description: "Smart compression for web images.",
    tools: [
      { id: "image-compressor", label: "Image Compressor", description: "Universal image compression.", category: "compress-image", type: "image", from: ["png", "jpg", "jpeg", "webp", "heic", "heif", "avif", "tiff"], to: ["webp", "jpg", "png", "avif"], defaultTo: "webp", maxSizeMB: 50, popular: true },
      { id: "jpeg-compressor", label: "JPEG Compressor", description: "Compress JPEG images.", category: "compress-image", type: "image", from: ["jpg", "jpeg"], to: ["jpg"], defaultTo: "jpg", maxSizeMB: 50 },
      { id: "png-compressor", label: "PNG Compressor", description: "Compress PNG images with high fidelity.", category: "compress-image", type: "image", from: ["png"], to: ["png"], defaultTo: "png", maxSizeMB: 50 },
      { id: "webp-compressor", label: "WEBP Compressor", description: "Compress WEBP images, animation kept.", category: "compress-image", type: "image", from: ["webp"], to: ["webp"], defaultTo: "webp", maxSizeMB: 50 },
      { id: "heic-compressor", label: "HEIC Compressor", description: "Compress iPhone HEIC photos into small JPG.", category: "compress-image", type: "image", from: ["heic", "heif"], to: ["jpg"], defaultTo: "jpg", maxSizeMB: 50 },
      { id: "avif-compressor", label: "AVIF Compressor", description: "Compress AVIF images.", category: "compress-image", type: "image", from: ["avif"], to: ["avif"], defaultTo: "avif", maxSizeMB: 50 },
      { id: "tiff-compressor", label: "TIFF Compressor", description: "Compress large TIFF scans.", category: "compress-image", type: "image", from: ["tiff", "tif"], to: ["tiff", "jpg"], defaultTo: "tiff", maxSizeMB: 100 }
    ]
  },
  {
    id: "compress-pdf",
    label: "PDF & Documents",
    icon: "file-text",
    description: "Compress heavy PDF documents.",
    tools: [
      { id: "pdf-compressor", label: "PDF Compressor", description: "Reduce PDF file size.", category: "compress-pdf", type: "document", from: ["pdf"], to: ["pdf"], defaultTo: "pdf", maxSizeMB: 100, popular: true }
    ]
  },
  {
    id: "compress-gif",
    label: "GIF",
    icon: "image",
    description: "Optimize animated GIFs.",
    tools: [
      { id: "gif-compressor", label: "GIF Compressor", description: "Reduce GIF file size.", category: "compress-gif", type: "image", from: ["gif"], to: ["gif"], defaultTo: "gif", maxSizeMB: 100 }
    ]
  }
];


// Konversi dokumen yang belum ada mesinnya di server (EPUB, MOBI, PDF ke gambar).
// Disembunyikan dari daftar sampai ada mesinnya. Word, PDF, dan TXT sudah didukung (document.service.js).
export const UNSUPPORTED_TOOL_IDS = new Set([
  "pdf-converter-legacy",
  "ebook-converter",
  "pdf-to-jpg",
  "pdf-to-epub",
  "epub-to-pdf"
]);

export const visibleCategories = (categories) =>
  categories
    .map((cat) => ({ ...cat, tools: cat.tools.filter((t) => !UNSUPPORTED_TOOL_IDS.has(t.id)) }))
    .filter((cat) => cat.tools.length > 0);
