import api from './api';

export async function fetchTools() {
  const res = await api.get('/tools');
  return res.data;
}

export async function fetchCompressors() {
  const res = await api.get('/compressors');
  return res.data;
}

export async function fetchStats() {
  const res = await api.get('/stats');
  return res.data;
}

export async function recordVisit(country) {
  const res = await api.post('/stats/visit', { country });
  return res.data;
}

export async function convertSingleFile(file, toolId, targetFormat, onUploadProgress) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('toolId', toolId || 'custom');
  formData.append('targetFormat', targetFormat);

  const res = await api.post('/convert', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onUploadProgress) {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(pct);
      }
    },
  });

  return res.data;
}

export async function convertBatchFiles(files, toolId, targetFormat, onUploadProgress) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('toolId', toolId || 'batch');
  formData.append('targetFormat', targetFormat || 'png');

  const res = await api.post('/convert/batch', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onUploadProgress) {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(pct);
      }
    },
  });

  return res.data;
}

export async function checkJobStatus(jobId) {
  const res = await api.get(`/convert/${jobId}/status`);
  return res.data;
}

export function getDownloadUrl(jobId) {
  return `/api/v1/convert/${jobId}/download`;
}

/**
 * Download all completed jobs as a single ZIP archive.
 * The server streams back a .zip file.
 */
export async function downloadAllAsZip(jobIds) {
  const res = await api.post(
    '/convert/download-all',
    { jobIds },
    { responseType: 'blob', timeout: 120000 }
  );

  const contentDisposition = res.headers['content-disposition'] || '';
  let filename = 'opentools_converted.zip';
  const match = contentDisposition.match(/filename="?([^";\s]+)"?/);
  if (match) filename = match[1];

  const blob = new Blob([res.data], { type: 'application/zip' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 2000);
}
