import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Video,
  Image as ImageIcon,
  Music,
  Film,
  Sparkles,
  Download,
  Share2,
  Check,
  RotateCcw,
  Loader2,
  FolderArchive,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import UploadBox from '../components/ui/UploadBox';
import FileItemCard from '../components/ui/FileItemCard';
import FormatSelect from '../components/converter/FormatSelect';
import { fetchTools, fetchCompressors } from '../services/converterApi';
import { useUpload } from '../hooks/useUpload';
import { useConvertJob } from '../hooks/useConvertJob';

export default function ConvertPage() {
  const { type } = useParams();
  const navigate = useNavigate();

  const [tool, setTool] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    async function loadToolInfo() {
      try {
        setIsLoading(true);
        const [toolsData, compressorsData] = await Promise.all([
          fetchTools(),
          fetchCompressors()
        ]);
        
        let foundTool = null;
        let isCompressor = false;
        
        // Search in converters
        if (toolsData?.categories) {
          for (const cat of toolsData.categories) {
            const t = cat.tools.find((item) => item.id === type);
            if (t) { foundTool = t; break; }
          }
        }
        
        // Search in compressors
        if (!foundTool && compressorsData?.categories) {
          for (const cat of compressorsData.categories) {
            const t = cat.tools.find((item) => item.id === type);
            if (t) { foundTool = t; isCompressor = true; break; }
          }
        }
        
        if (foundTool) {
          // Add a flag so we can display correct titles
          foundTool.isCompressor = isCompressor;
          setTool(foundTool);
          setSelectedFormat(foundTool.defaultTo || foundTool.to[0] || 'mp3');
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error('Failed to load tool info:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadToolInfo();
  }, [type, navigate]);

  const {
    files,
    addFiles,
    removeFile,
    replaceFile,
    updateFileStatus,
    clearFiles,
    errorMessage,
    setErrorMessage,
  } = useUpload(tool?.from || []);

  const {
    isConverting,
    isAllDone,
    isZipping,
    convertQueue,
    downloadAllZip,
  } = useConvertJob(tool?.id || type, selectedFormat);

  const handleStartConvert = () => {
    if (!files.length) return;
    setErrorMessage(null);
    convertQueue(files, updateFileStatus);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-secondary">
          <Loader2 className="animate-spin" size={28} />
          <p className="text-[13px]">Loading converter...</p>
        </div>
      </PageContainer>
    );
  }

  if (!tool) return null;

  const isVideoCategory = tool.category === 'video-audio';
  const ToolIcon = isVideoCategory ? (tool.type === 'video' ? Film : Music) : ImageIcon;
  const hasFiles = files.length > 0;
  const doneFiles = files.filter((f) => f.status === 'done');
  const failedFiles = files.filter((f) => f.status === 'failed');
  const allCompleted = hasFiles && files.every((f) => f.status === 'done' || f.status === 'failed');
  const anyDone = doneFiles.length > 0;
  const pendingFiles = files.filter((f) => f.status === 'idle' || f.status === 'failed');

  return (
    <PageContainer>
      {/* Back Button & Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-secondary hover:text-primary transition-smooth"
        >
          <IconButton icon={ArrowLeft} size="sm" variant="bordered" title="Back" />
          <span className="hidden sm:inline">{tool.isCompressor ? 'All Compressors' : 'All Converters'}</span>
        </Link>

        <Button
          variant="secondary"
          size="sm"
          pill
          icon={copiedShare ? Check : Share2}
          onClick={handleShare}
        >
          {copiedShare ? 'Copied!' : 'Share Tool'}
        </Button>
      </div>

      {/* Main Card */}
      <Card className="p-6 sm:p-8 max-w-[800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-border flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-md bg-card-muted border border-border flex items-center justify-center text-primary shrink-0">
              <ToolIcon size={22} strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-[20px] font-semibold text-primary leading-[26px]">{tool.label}</h1>
              <p className="text-[13px] text-secondary leading-[18px] mt-0.5">
                {tool.description || `${tool.isCompressor ? 'Compress' : 'Convert'} ${tool.from.join(', ')} ${tool.isCompressor ? 'files' : '→ ' + selectedFormat.toUpperCase()}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* From → To badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card-muted border border-border text-[12px] font-medium text-secondary">
              <span>{tool.from.slice(0, 3).map(f => f.toUpperCase()).join(', ')}</span>
              <span className="text-tertiary">→</span>
              <span className="text-primary font-semibold">{selectedFormat.toUpperCase()}</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-card-muted border border-border text-[11px] font-medium text-secondary">
              Max {tool.maxSizeMB || 50}MB
            </div>
          </div>
        </div>

        {/* Upload Box */}
        <UploadBox
          onFilesSelected={addFiles}
          acceptFormats={tool.from}
          maxSizeMB={tool.maxSizeMB || 50}
          multiple={true}
        />

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3.5 bg-[#FEF2F2] dark:bg-red-950/40 border border-danger/25 rounded-md flex items-start gap-2.5 text-danger text-[13px]">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Format Selector */}
        {tool.to && tool.to.length > 1 && (
          <div className="p-4 bg-card-muted rounded-md border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[13px] font-semibold text-primary block">Output Format</span>
              <span className="text-[12px] text-secondary">Select the target file format</span>
            </div>
            <FormatSelect
              formats={tool.to}
              selectedFormat={selectedFormat}
              onSelectFormat={setSelectedFormat}
              label=""
            />
          </div>
        )}

        {/* File Queue */}
        {hasFiles && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-[14px] font-semibold text-primary">
                  Files ({files.length})
                </span>
                {allCompleted && anyDone && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DCFCE7] dark:bg-green-900/40 text-success text-[11px] font-medium">
                    <CheckCircle2 size={11} />
                    {doneFiles.length} {tool.isCompressor ? 'compressed' : 'converted'}
                  </span>
                )}
                {failedFiles.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEE2E2] dark:bg-red-900/40 text-danger text-[11px] font-medium">
                    <AlertTriangle size={11} />
                    {failedFiles.length} failed
                  </span>
                )}
              </div>
              {!isConverting && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearFiles}
                  icon={RotateCcw}
                  className="h-7 text-[12px] px-2.5 bg-card-muted hover:bg-[#FEE2E2] hover:text-danger hover:border-danger/30 transition-smooth !rounded-sm"
                >
                  Reset
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
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

        {/* Footer Actions */}
        {hasFiles && (
          <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Left: Download All ZIP (when any files done) */}
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
                  {isZipping ? 'Packaging ZIP...' : `Download All (${doneFiles.length}) ZIP`}
                </Button>
              ) : !isConverting ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={clearFiles}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              ) : null}
            </div>

            {/* Right: Convert Now */}
            <div className="flex items-center gap-2">
              {!allCompleted || pendingFiles.length > 0 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStartConvert}
                  disabled={isConverting || !pendingFiles.length}
                  icon={isConverting ? Loader2 : Sparkles}
                  className={`w-full sm:w-auto min-w-[148px] ${isConverting ? 'opacity-80' : ''}`}
                >
                  {isConverting
                    ? (tool.isCompressor ? 'Compressing...' : 'Converting...')
                    : pendingFiles.length > 0
                    ? `${tool.isCompressor ? 'Compress' : 'Convert'} ${pendingFiles.length} File${pendingFiles.length > 1 ? 's' : ''}`
                    : (tool.isCompressor ? 'All Compressed' : 'All Converted')}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  icon={CheckCircle2}
                  className="w-full sm:w-auto min-w-[148px] !bg-success cursor-default active:scale-100"
                >
                  All Done!
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
