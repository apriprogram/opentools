import React, { useState } from 'react';
import { Layers, ArrowRight, Sparkles, FolderArchive, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';
import UploadBox from '../ui/UploadBox';
import FileItemCard from '../ui/FileItemCard';
import FormatSelect from './FormatSelect';
import { useUpload } from '../../hooks/useUpload';
import { useConvertJob } from '../../hooks/useConvertJob';
import Card from '../ui/Card';
import { useTranslation } from 'react-i18next';

const ALL_FORMATS = ['png', 'jpg', 'webp', 'mp3', 'mp4', 'ogg', 'wav', 'svg'];

export default function BatchConvertSection() {
  const { t } = useTranslation();
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

  const hasFiles = files.length > 0;
  const doneFiles = files.filter((f) => f.status === 'done');
  const failedFiles = files.filter((f) => f.status === 'failed');
  const allCompleted = hasFiles && files.every((f) => f.status === 'done' || f.status === 'failed');
  const anyDone = doneFiles.length > 0;
  const pendingFiles = files.filter((f) => f.status === 'idle' || f.status === 'failed');

  return (
    <Card className="p-6 sm:p-8 max-w-[800px] mx-auto space-y-6 shadow-none border-border">
      <div className="flex items-center gap-3.5 pb-5 border-b border-border">
        <div className="w-11 h-11 rounded-md bg-card-muted border border-border flex items-center justify-center text-primary shrink-0">
          <FolderArchive size={22} strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-[20px] font-semibold text-primary leading-[26px]">{t('batch.converter_title', 'Konverter Massal')}</h2>
          <p className="text-[13px] text-secondary leading-[18px] mt-0.5">
            {t('batch.converter_desc', 'Konversi puluhan gambar, video, atau audio sekaligus')}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Upload Box */}
        <UploadBox
          onFilesSelected={addFiles}
          maxSizeMB={150}
          multiple={true}
          title={t('batch.upload_title', 'Tarik beberapa file ke sini atau telusuri')}
          customSubtext={t('batch.upload_subtext', 'Gambar, Video, atau Audio • Maksimal 20 file sekaligus')}
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
                {t('batch.format_title', 'Format Output Universal')}
              </span>
              <span className="text-[12px] text-secondary">
                {t('batch.format_desc', 'Semua file yang dipilih akan dikonversi ke format ini')}
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
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-[14px] font-semibold text-primary">
                  {t('batch.queue', 'Antrean')} ({files.length})
                </span>
                {allCompleted && anyDone && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DCFCE7] text-success text-[11px] font-medium">
                    <CheckCircle2 size={11} />
                    {doneFiles.length} {t('batch.converted', 'berhasil')}
                  </span>
                )}
                {failedFiles.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEE2E2] text-danger text-[11px] font-medium">
                    <AlertTriangle size={11} />
                    {failedFiles.length} {t('batch.failed', 'gagal')}
                  </span>
                )}
              </div>
              {!isConverting && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearFiles}
                  icon={RotateCcw}
                  className="h-7 text-[12px] px-2.5 bg-card-muted hover:bg-[#FEE2E2] hover:text-danger hover:border-danger/30 transition-smooth"
                >
                  {t('batch.clear_queue', 'Bersihkan Antrean')}
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
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

        {/* Actions */}
        {hasFiles && (
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {anyDone && doneFiles.length > 1 ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => downloadAllZip(files)}
                  disabled={isZipping}
                  icon={FolderArchive}
                  className="w-full sm:w-auto"
                >
                  {isZipping ? t('batch.packaging_zip', 'Membungkus ZIP...') : t('batch.download_all_zip', 'Unduh Semua ({{count}}) ZIP', { count: doneFiles.length })}
                </Button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {!allCompleted || pendingFiles.length > 0 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStartBatch}
                  disabled={isConverting || !pendingFiles.length}
                  icon={Sparkles}
                  className={`w-full sm:w-auto min-w-[148px] ${isConverting ? 'opacity-80' : ''}`}
                >
                  {isConverting
                    ? t('batch.processing', 'Memproses...')
                    : t('batch.convert_files', 'Konversi {{count}} File', { count: pendingFiles.length })}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  disabled
                  icon={CheckCircle2}
                  className="w-full sm:w-auto min-w-[148px] !bg-success"
                >
                  {t('batch.all_done', 'Semua Selesai!')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
