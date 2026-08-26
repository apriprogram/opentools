import React, { useRef } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Edit2,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import ProgressBar from './ProgressBar';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function FileItemCard({ fileItem, onDelete, onReplace, acceptFormats = [] }) {
  const replaceInputRef = useRef(null);

  const handleReplaceClick = (e) => {
    e.stopPropagation();
    replaceInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      onReplace(fileItem.id, e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleDownload = () => {
    // downloadUrl is like /api/v1/convert/:jobId/download
    // Since Vite proxies /api → backend, this works directly
    const url = fileItem.downloadUrl;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileItem.outputFileName || 'converted_file');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const isImage = fileItem.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp|heic|heif|tiff|avif)$/i.test(fileItem.name);
  const isVideo = fileItem.type?.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|wmv|flv)$/i.test(fileItem.name);
  const isAudio = fileItem.type?.startsWith('audio/') || /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(fileItem.name);

  const acceptAttr = acceptFormats.length > 0
    ? acceptFormats.map((f) => `.${f.toLowerCase().replace('.', '')}`).join(',')
    : undefined;

  const isActive = fileItem.status === 'uploading' || fileItem.status === 'converting';

  return (
    <div className={`relative group w-full p-3 bg-card border rounded-lg transition-smooth select-none ${
      fileItem.status === 'done'
        ? 'border-green-400/70 bg-green-50 dark:border-green-500/50 dark:bg-green-900/20'
        : fileItem.status === 'failed'
        ? 'border-[#FCA5A5] bg-[#FEF2F2] dark:border-red-800 dark:bg-red-950/30'
        : 'border-border hover:border-border-hover'
    }`}
    >
      <input
        ref={replaceInputRef}
        type="file"
        accept={acceptAttr}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center justify-between gap-3 w-full">
        {/* Thumbnail (56×56px, radius 10px) */}
        <div className={`w-[56px] h-[56px] min-w-[56px] rounded-[10px] flex items-center justify-center overflow-hidden ${
          fileItem.status === 'done'
            ? 'bg-green-100 dark:bg-green-900/30 border border-green-400/60 dark:border-green-600/50'
            : fileItem.status === 'failed'
            ? 'bg-red-100 dark:bg-red-900/30 border border-red-400/60 dark:border-red-600/50'
            : 'bg-card-muted dark:bg-zinc-800/50 border border-border/60 dark:border-zinc-700/50'
        }`}>
          {fileItem.previewUrl ? (
            <img src={fileItem.previewUrl} alt={fileItem.name} className="w-full h-full object-cover" />
          ) : isVideo ? (
            <Video size={22} className={fileItem.status === 'done' ? 'text-green-600 dark:text-green-400' : fileItem.status === 'failed' ? 'text-red-500 dark:text-red-400' : 'text-secondary'} strokeWidth={1.5} />
          ) : isAudio ? (
            <Music size={22} className={fileItem.status === 'done' ? 'text-green-600 dark:text-green-400' : fileItem.status === 'failed' ? 'text-red-500 dark:text-red-400' : 'text-secondary'} strokeWidth={1.5} />
          ) : isImage ? (
            <ImageIcon size={22} className={fileItem.status === 'done' ? 'text-green-600 dark:text-green-400' : fileItem.status === 'failed' ? 'text-red-500 dark:text-red-400' : 'text-secondary'} strokeWidth={1.5} />
          ) : (
            <FileText size={22} className={fileItem.status === 'done' ? 'text-green-600 dark:text-green-400' : fileItem.status === 'failed' ? 'text-red-500 dark:text-red-400' : 'text-secondary'} strokeWidth={1.5} />
          )}
        </div>

        {/* Middle: file info + progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-[14px] font-medium text-primary leading-[18px] truncate" title={fileItem.outputFileName || fileItem.name}>
              {fileItem.outputFileName || fileItem.name}
            </p>
            {fileItem.status === 'done' && (
              <CheckCircle2 size={14} className="text-success shrink-0" />
            )}
            {fileItem.status === 'failed' && (
              <AlertCircle size={14} className="text-danger shrink-0" />
            )}
            {isActive && (
              <Loader2 size={13} className="text-secondary animate-spin shrink-0" />
            )}
          </div>

          {isActive ? (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] text-secondary">
                <span>{fileItem.status === 'uploading' ? 'Uploading...' : 'Converting...'}</span>
                <span className="font-medium">{fileItem.progress}%</span>
              </div>
              <ProgressBar progress={fileItem.progress} status={fileItem.status} />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[12px] text-secondary flex-wrap">
              <span>{formatBytes(fileItem.size)}</span>
              {fileItem.status === 'done' && (
                <>
                  <span>•</span>
                  <span className="text-success font-medium">Conversion complete ✓</span>
                  {fileItem.outputFileName && (
                    <>
                      <span>•</span>
                      <span className="text-secondary truncate max-w-[160px]">{fileItem.outputFileName}</span>
                    </>
                  )}
                </>
              )}
              {fileItem.status === 'failed' && (
                <>
                  <span>•</span>
                  <span className="text-danger font-medium truncate max-w-[240px]" title={fileItem.error}>
                    {fileItem.error || 'Conversion failed'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Download button — only when done */}
          {fileItem.status === 'done' && fileItem.downloadUrl && (
            <button
              type="button"
              onClick={handleDownload}
              title={`Download ${fileItem.outputFileName}`}
              className="w-[36px] h-[36px] rounded-sm p-0 bg-accent-black dark:bg-white text-white dark:text-black hover:bg-accent-black-hover dark:hover:bg-zinc-200 flex items-center justify-center transition-smooth"
            >
              <Download size={15} strokeWidth={2} />
            </button>
          )}

          {/* Replace file — hide when converting/done */}
          {!isActive && fileItem.status !== 'done' && (
            <button
              type="button"
              onClick={handleReplaceClick}
              title="Replace file"
              className="w-[32px] h-[32px] rounded-sm flex items-center justify-center text-tertiary hover:text-primary hover:bg-card-muted transition-smooth"
            >
              <Edit2 size={15} strokeWidth={1.75} />
            </button>
          )}

          {/* Delete — always visible unless uploading */}
          {!isActive && (
            <button
              type="button"
              onClick={() => onDelete(fileItem.id)}
              title="Remove file"
              className="w-[36px] h-[36px] rounded-sm p-0 flex items-center justify-center text-tertiary hover:text-danger hover:bg-[#FEE2E2] dark:hover:bg-red-900/30 transition-smooth"
            >
              <Trash2 size={15} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
