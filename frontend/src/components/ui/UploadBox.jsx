import React, { useRef, useState } from 'react';
import { CloudUpload, AlertCircle } from 'lucide-react';
import Button from './Button';

export default function UploadBox({
  onFilesSelected,
  acceptFormats = [],
  maxSizeMB = 50,
  multiple = true,
  title = "Choose a file or drag & drop it here.",
  customSubtext = null,
  className = "",
}) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragError, setDragError] = useState(null);

  const formatListString = acceptFormats.length > 0
    ? acceptFormats.map((f) => f.toUpperCase().replace('.', '')).join(', ')
    : 'Any format';

  const subtext = customSubtext || `${formatListString} • Up to ${maxSizeMB}MB`;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragError(null);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      onFilesSelected(droppedFiles);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  const handleClickBrowse = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Convert formats list to accept attribute for file dialog
  const acceptAttr = acceptFormats.length > 0
    ? acceptFormats.map((f) => `.${f.toLowerCase().replace('.', '')}`).join(',')
    : undefined;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClickBrowse}
      className={`relative w-full h-[200px] rounded-md transition-smooth flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none ${
        isDragOver
          ? 'bg-white border-2 border-solid border-border-focus'
          : dragError
          ? 'bg-card-muted border-[1.5px] border-dashed border-danger'
          : 'bg-card-muted border-[1.5px] border-dashed border-border hover:border-border-hover'
      } ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptAttr}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className={`mb-3 transition-colors duration-150 ${isDragOver ? 'text-primary' : 'text-tertiary'}`}>
        <CloudUpload size={36} strokeWidth={1.5} />
      </div>

      <p className={`text-[14px] font-medium leading-[20px] mb-1 transition-colors duration-150 ${isDragOver ? 'text-primary' : 'text-primary'}`}>
        {title}
      </p>

      <p className="text-[12px] font-normal text-secondary leading-[16px] mb-4">
        {subtext}
      </p>

      {dragError ? (
        <div className="flex items-center gap-1.5 text-danger text-[12px] font-medium">
          <AlertCircle size={14} />
          <span>{dragError}</span>
        </div>
      ) : (
        <Button
          size="sm"
          pill
          variant="secondary"
          onClick={handleClickBrowse}
          className="pointer-events-none"
        >
          Browse files
        </Button>
      )}
    </div>
  );
}
