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

  const iconColor =
    fileItem.status === 'done'
      ? 'text-green-600 dark:text-green-400'
      : fileItem.status === 'failed'
      ? 'text-red-500 dark:text-red-400'
      : 'text-secondary';

  return (
    <div className={`relative group w-full p-2 sm:p-3 bg-card border rounded-lg transition-smooth select-none ${
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

      <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
        {/* Thumbnail — smaller on mobile */}
        <div className={`w-[40px] h-[40px] min-w-[40px] sm:w-[48px] sm:h-[48px] sm:min-w-[48px] rounded-[8px] flex items-center justify-center overflow-hidden ${
          fileItem.status === 'done'
            ? 'bg-green-100 dark:bg-green-900/30 border border-green-400/60 dark:border-green-600/50'
            : fileItem.status === 'failed'
            ? 'bg-red-100 dark:bg-red-900/30 border border-red-400/60 dark:border-red-600/50'
            : 'bg-card-muted dark:bg-zinc-800/50 border border-border/60 dark:border-zinc-700/50'
        }`}>
          {fileItem.previewUrl ? (
            <img src={fileItem.previewUrl} alt={fileItem.name} className="w-full h-full object-cover" />
          ) : isVideo ? (
            <Video size={18} className={iconColor} strokeWidth={1.5} />
          ) : isAudio ? (
            <Music size={18} className={iconColor} strokeWidth={1.5} />
          ) : isImage ? (
            <ImageIcon size={18} className={iconColor} strokeWidth={1.5} />
          ) : (
            <FileText size={18} className={iconColor} strokeWidth={1.5} />
          )}
        </div>

        {/* Middle: file info + progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <p className="text-[12px] sm:text-[13px] font-medium text-primary leading-[16px] truncate" title={fileItem.outputFileName || fileItem.name}>
              {fileItem.outputFileName || fileItem.name}
            </p>
            {fileItem.status === 'done' && <CheckCircle2 size={12} className="text-success shrink-0" />}
            {fileItem.status === 'failed' && <AlertCircle size={12} className="text-danger shrink-0" />}
            {isActive && <Loader2 size={11} className="text-secondary animate-spin shrink-0" />}
          </div>

          {isActive ? (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-secondary">
                <span>{fileItem.status === 'uploading' ? 'Uploading...' : 'Converting...'}</span>
                <span className="font-medium">{fileItem.progress}%</span>
              </div>
              <ProgressBar progress={fileItem.progress} status={fileItem.status} />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] text-secondary overflow-hidden">
              <span className="shrink-0">{formatBytes(fileItem.size)}</span>
              {fileItem.status === 'done' && (
                <>
                  <span className="shrink-0">•</span>
                  <span className="text-success font-medium shrink-0">Done ✓</span>
                </>
              )}
              {fileItem.status === 'failed' && (
                <>
                  <span className="shrink-0">•</span>
                  <span className="text-danger font-medium truncate" title={fileItem.error}>
                    {fileItem.error || 'Failed'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {fileItem.status === 'done' && fileItem.downloadUrl && (
            <button
              type="button"
              onClick={handleDownload}
              title={`Download ${fileItem.outputFileName}`}
              className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-sm p-0 bg-accent-black dark:bg-white text-white dark:text-black hover:bg-accent-black-hover dark:hover:bg-zinc-200 flex items-center justify-center transition-smooth"
            >
              <Download size={13} strokeWidth={2} />
            </button>
          )}

          {!isActive && fileItem.status !== 'done' && (
            <button
              type="button"
              onClick={handleReplaceClick}
              title="Replace file"
              className="w-[28px] h-[28px] sm:w-[30px] sm:h-[30px] rounded-sm flex items-center justify-center text-tertiary hover:text-primary hover:bg-card-muted transition-smooth"
            >
              <Edit2 size={13} strokeWidth={1.75} />
            </button>
          )}

          {!isActive && (
            <button
              type="button"
              onClick={() => onDelete(fileItem.id)}
              title="Remove file"
              className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-sm p-0 flex items-center justify-center text-tertiary hover:text-danger hover:bg-[#FEE2E2] dark:hover:bg-red-900/30 transition-smooth"
            >
              <Trash2 size={13} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
