let stats = {
  visitors: 0,
  uploadsBytes: 0,
  downloadsBytes: 0,
  processedFiles: 0,
  countries: {},
  toolUsage: {}
};

export function getStats() {
  return stats;
}

export function recordVisitor(country) {
  stats.visitors += 1;
  if (country) {
    stats.countries[country] = (stats.countries[country] || 0) + 1;
  }
}

export function recordUpload(bytes) {
  stats.uploadsBytes += bytes;
}

export function recordDownload(bytes) {
  stats.downloadsBytes += bytes;
}

export function recordProcessed(toolId) {
  stats.processedFiles += 1;
  if (toolId) {
    stats.toolUsage[toolId] = (stats.toolUsage[toolId] || 0) + 1;
  }
}
