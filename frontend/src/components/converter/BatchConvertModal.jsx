import React, { useState } from 'react';
import { Layers, ArrowRight, Sparkles, FolderArchive } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import UploadBox from '../ui/UploadBox';
import FileItemCard from '../ui/FileItemCard';
import FormatSelect from './FormatSelect';
import { useUpload } from '../../hooks/useUpload';
import { useConvertJob } from '../../hooks/useConvertJob';

const ALL_FORMATS = ['png', 'jpg', 'webp', 'mp3', 'mp4', 'ogg', 'wav', 'svg'];

export default function BatchConvertModal({ isOpen, onClose }) {
  const [targetFormat, setTargetFormat] = useState('png');
  const {
    files,
    addFiles,
    removeFile,
    replaceFile,
    updateFileStatus,
    clearFiles,
    errorMessage,
  } = useUpload();

  const {
    isConverting,
    isAllDone,
    isZipping,
    convertQueue,
    downloadAllZip,
  } = useConvertJob('batch', targetFormat);

  const handleStartBatch = () => {
    convertQueue(files, updateFileStatus);
  };

  const handleClose = () => {
    if (!isConverting) {
      clearFiles();
      onClose();
    }
  };

  const hasFiles = files.length > 0;
  const allCompleted = files.length > 0 && files.every((f) => f.status === 'done');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Multiple Files"
      subtitle="Convert dozens of files in batch with high speed."
      icon={FolderArchive}
      maxWidth="max-w-[660px]"
      footer={
        hasFiles ? (
          <div className="w-full flex items-center justify-between">
            <Button
              variant="secondary"
              size="md"
              onClick={clearFiles}
              disabled={isConverting}
            >
              Clear Queue
            </Button>

            <div className="flex items-center gap-2">
              {allCompleted ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => downloadAllZip(files)}
                  disabled={isZipping}
                >
                  {isZipping ? 'Generating ZIP...' : 'Download All (ZIP)'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStartBatch}
                  disabled={isConverting}
                  icon={Sparkles}
                >
                  {isConverting ? 'Processing Batch...' : `Convert ${files.length} Files`}
                </Button>
              )}
            </div>
          </div>
        ) : null
      }
    >
      <div className="space-y-5">
        {/* Upload Box */}
        <UploadBox
          onFilesSelected={addFiles}
          maxSizeMB={150}
          multiple={true}
          title="Drop multiple files here or browse"
          customSubtext="Images, Videos, or Audios • Up to 20 files at once"
        />

        {errorMessage && (
          <div className="p-3 bg-[#FEF2F2] border border-danger/20 rounded-md text-danger text-[12px]">
            {errorMessage}
          </div>
        )}

        {/* Format Selector */}
        {hasFiles && (
          <div className="p-4 bg-card-muted rounded-md border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[13px] font-semibold text-primary block">
                Universal Output Format
              </span>
              <span className="text-[12px] text-secondary">
                All selected files will be converted into this format
              </span>
            </div>
            <FormatSelect
              formats={ALL_FORMATS}
              selectedFormat={targetFormat}
              onSelectFormat={setTargetFormat}
              label=""
            />
          </div>
        )}

        {/* Selected Files List */}
        {hasFiles && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[13px] font-semibold text-primary">
              <span>Queue ({files.length} files)</span>
            </div>
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {files.map((fileItem) => (
                <FileItemCard
                  key={fileItem.id}
                  fileItem={fileItem}
                  onDelete={removeFile}
                  onReplace={replaceFile}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
