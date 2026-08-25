import { useState, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { convertSingleFile, checkJobStatus, downloadAllAsZip } from '../services/converterApi';

export function useConvertJob(toolId, targetFormat) {
  const [isConverting, setIsConverting] = useState(false);
  const [isAllDone, setIsAllDone] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const activePollers = useRef(new Map());

  const pollJob = useCallback((jobId, fileId, onProgress, onDone, onFailed) => {
    const interval = setInterval(async () => {
      try {
        const data = await checkJobStatus(jobId);
        if (!data.success) {
          clearInterval(interval);
          activePollers.current.delete(fileId);
          onFailed(data.error?.message || 'Conversion failed');
          return;
        }

        if (data.status === 'processing') {
          onProgress(data.progress || 50, 'Converting...');
        } else if (data.status === 'done') {
          clearInterval(interval);
          activePollers.current.delete(fileId);
          onDone(data.downloadUrl, data.fileName);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          activePollers.current.delete(fileId);
          onFailed(data.error?.message || 'Conversion failed');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1200);

    activePollers.current.set(fileId, interval);
  }, []);

  const convertQueue = useCallback(async (files, updateFileStatus) => {
    if (!files || files.length === 0) return;

    setIsConverting(true);
    setIsAllDone(false);

    let completedCount = 0;
    const totalFiles = files.length;

    const checkAllFinished = () => {
      completedCount++;
      if (completedCount >= totalFiles) {
        setIsConverting(false);
        setIsAllDone(true);
        // Confetti celebration
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#18181B', '#16A34A', '#8A8A93']
          });
        } catch (e) {}
      }
    };

    for (const fileItem of files) {
      if (fileItem.status === 'done') {
        completedCount++;
        continue;
      }

      updateFileStatus(fileItem.id, {
        status: 'uploading',
        progress: 0,
        error: null,
      });

      try {
        const uploadRes = await convertSingleFile(
          fileItem.file,
          toolId || 'general',
          targetFormat,
          (percent) => {
            updateFileStatus(fileItem.id, {
              status: 'uploading',
              progress: Math.min(99, percent),
            });
          }
        );

        if (uploadRes.success && uploadRes.jobId) {
          const jobId = uploadRes.jobId;
          updateFileStatus(fileItem.id, {
            status: 'converting',
            progress: 20,
            jobId,
          });

          pollJob(
            jobId,
            fileItem.id,
            (progress) => {
              updateFileStatus(fileItem.id, {
                status: 'converting',
                progress,
              });
            },
            (downloadUrl, outputFileName) => {
              updateFileStatus(fileItem.id, {
                status: 'done',
                progress: 100,
                downloadUrl,
                outputFileName,
              });
              checkAllFinished();
            },
            (errorMessage) => {
              updateFileStatus(fileItem.id, {
                status: 'failed',
                progress: 0,
                error: errorMessage,
              });
              checkAllFinished();
            }
          );
        } else {
          updateFileStatus(fileItem.id, {
            status: 'failed',
            progress: 0,
            error: uploadRes.error?.message || 'Failed to start job',
          });
          checkAllFinished();
        }
      } catch (err) {
        updateFileStatus(fileItem.id, {
          status: 'failed',
          progress: 0,
          error: err.response?.data?.error?.message || err.message || 'Upload error',
        });
        checkAllFinished();
      }
    }
  }, [toolId, targetFormat, pollJob]);

  const downloadAllZip = useCallback(async (files) => {
    const completedJobIds = files
      .filter((f) => f.status === 'done' && f.jobId)
      .map((f) => f.jobId);

    if (completedJobIds.length === 0) return;

    try {
      setIsZipping(true);
      await downloadAllAsZip(completedJobIds);
    } catch (err) {
      console.error('Failed to download ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  }, []);

  const cancelAllPollers = useCallback(() => {
    activePollers.current.forEach((interval) => clearInterval(interval));
    activePollers.current.clear();
    setIsConverting(false);
  }, []);

  return {
    isConverting,
    isAllDone,
    isZipping,
    convertQueue,
    downloadAllZip,
    cancelAllPollers,
  };
}
