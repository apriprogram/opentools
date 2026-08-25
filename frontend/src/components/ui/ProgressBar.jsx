import React from 'react';

export default function ProgressBar({
  progress = 0,
  status = 'idle', // 'idle' | 'uploading' | 'converting' | 'done' | 'failed'
  className = '',
}) {
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  let barColor = 'bg-accent-black';
  if (status === 'done') barColor = 'bg-success';
  if (status === 'failed') barColor = 'bg-danger';

  return (
    <div className={`w-full bg-[#EAEAEA] rounded-full h-[6px] overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ease-out ${barColor} ${
          status === 'converting' ? 'animate-pulse' : ''
        }`}
        style={{ width: `${normalizedProgress}%` }}
      />
    </div>
  );
}
