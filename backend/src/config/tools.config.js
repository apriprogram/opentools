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
      }
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
        to: ["png", "jpg", "webp", "tiff", "avif"],
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
      }
    ]
  },
  {
    id: "pdf-documents",
    label: "PDF & Documents",
    icon: "file-text",
    description: "Convert PDFs, Word documents, and eBooks easily.",
    tools: [
      { id: "pdf-converter", label: "PDF Converter", description: "Convert between PDF and various other formats.", category: "pdf-documents", type: "document", from: ["pdf", "docx", "epub", "jpg", "png"], to: ["pdf", "docx", "jpg", "epub"], defaultTo: "pdf", maxSizeMB: 50 },
      { id: "document-converter", label: "Document Converter", description: "Universal document conversion.", category: "pdf-documents", type: "document", from: ["pdf", "docx", "txt", "rtf"], to: ["pdf", "docx", "txt"], defaultTo: "pdf", maxSizeMB: 20 },
      { id: "ebook-converter", label: "Ebook Converter", description: "Convert eBooks to and from EPUB, PDF, MOBI.", category: "pdf-documents", type: "document", from: ["epub", "pdf", "mobi"], to: ["epub", "pdf", "mobi"], defaultTo: "epub", maxSizeMB: 50 },
      { id: "pdf-to-word", label: "PDF to Word", description: "Convert PDF documents to editable Word DOCX files.", category: "pdf-documents", type: "document", from: ["pdf"], to: ["docx"], defaultTo: "docx", maxSizeMB: 50, popular: true },
      { id: "pdf-to-jpg", label: "PDF to JPG", description: "Extract pages from PDF to high quality JPG images.", category: "pdf-documents", type: "document", from: ["pdf"], to: ["jpg"], defaultTo: "jpg", maxSizeMB: 50 },
      { id: "pdf-to-epub", label: "PDF to EPUB", description: "Convert PDF to EPUB format for e-readers.", category: "pdf-documents", type: "document", from: ["pdf"], to: ["epub"], defaultTo: "epub", maxSizeMB: 50 },
      { id: "epub-to-pdf", label: "EPUB to PDF", description: "Convert EPUB eBooks to standard PDF documents.", category: "pdf-documents", type: "document", from: ["epub"], to: ["pdf"], defaultTo: "pdf", maxSizeMB: 50 },
      { id: "heic-to-pdf", label: "HEIC to PDF", description: "Convert HEIC images directly into a PDF document.", category: "pdf-documents", type: "document", from: ["heic", "heif"], to: ["pdf"], defaultTo: "pdf", maxSizeMB: 30 },
      { id: "docx-to-pdf", label: "DOCX to PDF", description: "Convert Word DOCX files into PDF documents.", category: "pdf-documents", type: "document", from: ["docx"], to: ["pdf"], defaultTo: "pdf", maxSizeMB: 50, popular: true },
      { id: "jpg-to-pdf", label: "JPG to PDF", description: "Combine JPG images into a single PDF file.", category: "pdf-documents", type: "document", from: ["jpg", "jpeg"], to: ["pdf"], defaultTo: "pdf", maxSizeMB: 50 }
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
      { id: "wav-compressor", label: "WAV Compressor", description: "Compress WAV audio files.", category: "compress-video-audio", type: "audio", from: ["wav"], to: ["wav"], defaultTo: "wav", maxSizeMB: 200 }
    ]
  },
  {
    id: "compress-image",
    label: "Image",
    icon: "image",
    description: "Smart compression for web images.",
    tools: [
      { id: "image-compressor", label: "Image Compressor", description: "Universal image compression.", category: "compress-image", type: "image", from: ["png", "jpg", "jpeg", "webp"], to: ["webp"], defaultTo: "webp", maxSizeMB: 50, popular: true },
      { id: "jpeg-compressor", label: "JPEG Compressor", description: "Compress JPEG images.", category: "compress-image", type: "image", from: ["jpg", "jpeg"], to: ["jpg"], defaultTo: "jpg", maxSizeMB: 50 },
      { id: "png-compressor", label: "PNG Compressor", description: "Compress PNG images with high fidelity.", category: "compress-image", type: "image", from: ["png"], to: ["png"], defaultTo: "png", maxSizeMB: 50 }
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

