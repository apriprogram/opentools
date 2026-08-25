import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Users, UploadCloud, DownloadCloud, Activity, MapPin } from 'lucide-react';
import Card from '../ui/Card';
import { fetchStats } from '../../services/converterApi';
import { useTranslation } from 'react-i18next';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatToolId(toolId) {
  if (!toolId) return 'Unknown';
  return toolId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function StatsOverview({ id }) {
  const [data, setData] = useState({ visitors: 0, processedFiles: 0, uploadsBytes: 0, downloadsBytes: 0, countries: {} });
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      try {
        const res = await fetchStats();
        if (mounted && res.stats) {
          setData(res.stats);
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };
    
    loadStats(); // initial load
    const interval = setInterval(loadStats, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const stats = [
    {
      id: 'visitors',
      label: 'Total Visitors',
      value: data.visitors.toLocaleString(),
      change: 'Realtime',
      isPositive: true,
      icon: Users,
    },
    {
      id: 'conversions',
      label: 'Files Processed (Convert/Compress)',
      value: data.processedFiles.toLocaleString(),
      change: 'Realtime',
      isPositive: true,
      icon: Activity,
    },
    {
      id: 'uploads',
      label: 'Total Uploads',
      value: formatBytes(data.uploadsBytes),
      change: 'Realtime',
      isPositive: true,
      icon: UploadCloud,
    },
    {
      id: 'downloads',
      label: 'Total Downloads',
      value: formatBytes(data.downloadsBytes),
      change: 'Realtime',
      isPositive: true,
      icon: DownloadCloud,
    },
  ];

  return (
    <div id={id} className="mb-8">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {stats.map((item) => (
          <Card key={item.id} className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-normal text-secondary leading-[18px]">
                {item.label}
              </span>
              <div className="w-8 h-8 rounded-full bg-card-muted flex items-center justify-center text-secondary">
                <item.icon size={16} strokeWidth={1.75} />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[28px] font-semibold text-primary tracking-tight leading-[34px]">
                {item.value}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[12px] font-medium text-success leading-[16px]">
                <ArrowUpRight size={14} />
                <span>{item.change}</span>
              </div>
            </div>
          </Card>
        ))}
      </section>

      {Object.keys(data.countries).length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-secondary" />
            <h3 className="text-[14px] font-semibold text-primary">Visitor Locations (Realtime)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.countries).map(([country, count]) => (
              <div key={country} className="px-3 py-1.5 rounded-md bg-card-muted text-primary text-[13px] flex items-center gap-2 border border-border">
                <span>{country}</span>
                <span className="bg-primary text-card px-1.5 py-0.5 rounded text-[10px] font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {Object.keys(data.toolUsage || {}).length > 0 && (
        <Card className="p-5 mt-4">
          <div className="flex items-center gap-2 mb-4">
             <Activity size={16} className="text-secondary" />
             <h3 className="text-[14px] font-semibold text-primary">Popular Features Used</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(data.toolUsage)
              .sort((a,b) => b[1] - a[1])
              .map(([toolId, count], idx) => (
                <div key={toolId} className="flex items-center justify-between p-3 rounded-md bg-card-muted border border-border hover:border-yellow-500 transition-colors">
                   <div className="flex items-center gap-3">
                     <span className="text-[13px] font-semibold text-yellow-600 dark:text-yellow-500">#{idx + 1}</span>
                     <span className="text-[14px] font-semibold text-primary">{formatToolId(toolId)}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="bg-primary text-card px-2 py-0.5 rounded text-[11px] font-bold">{count}x</span>
                   </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
