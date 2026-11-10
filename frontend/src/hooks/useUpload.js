import { useState, useCallback } from 'react';

export function useUpload(supportedExtensions = [], maxSizeMB = null) {
  // files: [{ id, file, name, size, type, previewUrl, error }]
  const [files, setFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  const validateFile = useCallback((file) => {
    if (!supportedExtensions || supportedExtensions.length === 0) return true;
    const ext = file.name.split('.').pop().toLowerCase();
    const isSupported = supportedExtensions.some(
      (s) => s.toLowerCase().replace('.', '') === ext
    );
    return isSupported;
  }, [supportedExtensions]);

  // Enforce the "Max NMB" limit shown on the upload box.
  const validateSize = useCallback((file) => {
    if (!maxSizeMB) return true;
    return file.size <= maxSizeMB * 1024 * 1024;
  }, [maxSizeMB]);

  const addFiles = useCallback((newFiles) => {
    setErrorMessage(null);
    const validItems = [];
    const invalidNames = [];
    const oversizedNames = [];

    Array.from(newFiles).forEach((file) => {
      if (!validateSize(file)) {
        oversizedNames.push(file.name);
      } else if (validateFile(file)) {
        let previewUrl = null;
        if (file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file);
        }
        validItems.push({
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          previewUrl,
          status: 'idle', // idle, uploading, converting, done, failed
          progress: 0,
          jobId: null,
          error: null,
        });
      } else {
        invalidNames.push(file.name);
      }
    });

    if (invalidNames.length > 0) {
      setErrorMessage(`Unsupported format: ${invalidNames.join(', ')}. Supported: ${supportedExtensions.join(', ')}`);
    }

    if (oversizedNames.length > 0) {
      setErrorMessage(`File too large (max ${maxSizeMB}MB): ${oversizedNames.join(', ')}`);
    }

    if (validItems.length > 0) {
      setFiles((prev) => [...prev, ...validItems]);
    }
  }, [validateFile, validateSize, supportedExtensions, maxSizeMB]);

  const removeFile = useCallback((id) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const replaceFile = useCallback((id, newFile) => {
    if (!validateSize(newFile)) {
      setErrorMessage(`File too large (max ${maxSizeMB}MB): ${newFile.name}`);
      return false;
    }
    if (!validateFile(newFile)) {
      setErrorMessage(`Unsupported format for replacement: ${newFile.name}`);
      return false;
    }

    setFiles((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          if (item.previewUrl) {
            URL.revokeObjectURL(item.previewUrl);
          }
          let previewUrl = null;
          if (newFile.type.startsWith('image/')) {
            previewUrl = URL.createObjectURL(newFile);
          }
          return {
            ...item,
            file: newFile,
            name: newFile.name,
            size: newFile.size,
            type: newFile.type,
            previewUrl,
            status: 'idle',
            progress: 0,
            jobId: null,
            error: null,
          };
        }
        return item;
      });
    });
    return true;
  }, [validateFile, validateSize, maxSizeMB]);

  const updateFileStatus = useCallback((id, updates) => {
    setFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const clearFiles = useCallback(() => {
    files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setFiles([]);
    setErrorMessage(null);
  }, [files]);

  return {
    files,
    setFiles,
    addFiles,
    removeFile,
    replaceFile,
    updateFileStatus,
    clearFiles,
    errorMessage,
    setErrorMessage,
  };
}
