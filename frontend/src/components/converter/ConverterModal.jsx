import React, { useState } from 'react';
import { ArrowRight, Sparkles, Video, Image as ImageIcon } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import UploadBox from '../ui/UploadBox';
import FileItemCard from '../ui/FileItemCard';
import FormatSelect from './FormatSelect';
import { useUpload } from '../../hooks/useUpload';
import { useConvertJob } from '../../hooks/useConvertJob';

export default function ConverterModal({ tool, isOpen, onClose }) {
  if (!tool) return null;

  const [selectedFormat, setSelectedFormat] = useState(tool.defaultTo || tool.to[0]);

  const {
    files,
    addFiles,
    removeFile,
    replaceFile,
    updateFileStatus,
    clearFiles,
    errorMessage,
  } = useUpload(tool.from);

  const {
    isConverting,
    isAllDone,
    isZipping,
    convertQueue,
    downloadAllZip,
  } = useConvertJob(tool.id, selectedFormat);

  const handleStartConvert = () => {
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
  const isVideoCategory = tool.category === 'video-audio';
  const Icon = isVideoCategory ? Video : ImageIcon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={tool.label}
      subtitle={tool.description || `Convert ${tool.from.join(', ')} to ${selectedFormat.toUpperCase()}`}
      icon={Icon}
      maxWidth="max-w-[620px]"
      footer={
        hasFiles ? (
          <div className="w-full flex items-center justify-between">
            <Button
              variant="secondary"
              size="md"
              onClick={allCompleted ? () => downloadAllZip(files) : clearFiles}
              disabled={isConverting || isZipping}
            >
              {allCompleted ? 'Download All (ZIP)' : 'Clear Queue'}
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleStartConvert}
              disabled={isConverting || allCompleted}
              icon={Sparkles}
            >
              {isConverting ? 'Converting...' : allCompleted ? 'Completed' : 'Convert Now'}
            </Button>
          </div>
        ) : null
      }
    >
      <div className="space-y-5">
        {/* Upload Box */}
        <UploadBox
          onFilesSelected={addFiles}
          acceptFormats={tool.from}
          maxSizeMB={tool.maxSizeMB || 50}
          multiple={true}
        />

        {errorMessage && (
          <div className="p-3 bg-[#FEF2F2] border border-danger/20 rounded-md text-danger text-[12px]">
            {errorMessage}
          </div>
        )}

        {/* Format Select */}
        {tool.to && tool.to.length > 1 && (
          <FormatSelect
            formats={tool.to}
            selectedFormat={selectedFormat}
            onSelectFormat={setSelectedFormat}
          />
        )}

        {/* Selected Files Queue */}
        {hasFiles && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[13px] font-semibold text-primary">
              <span>Files ({files.length})</span>
            </div>
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {files.map((fileItem) => (
                <FileItemCard
                  key={fileItem.id}
                  fileItem={fileItem}
                  onDelete={removeFile}
                  onReplace={replaceFile}
                  acceptFormats={tool.from}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
