import React from 'react';
import Chip from '../ui/Chip';
import Dropdown from '../ui/Dropdown';

export default function FormatSelect({
  formats = [],
  selectedFormat,
  onSelectFormat,
  label = 'Target Format',
}) {
  if (!formats || formats.length === 0) return null;

  // If few formats, show as chips
  if (formats.length <= 6) {
    return (
      <div className="space-y-2">
        <label className="block text-[13px] font-semibold text-primary">
          {label}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {formats.map((fmt) => (
            <Chip
              key={fmt}
              label={fmt.toUpperCase()}
              selected={selectedFormat?.toLowerCase() === fmt.toLowerCase()}
              onClick={() => onSelectFormat(fmt.toLowerCase())}
            />
          ))}
        </div>
      </div>
    );
  }

  // If many formats, show dropdown
  return (
    <Dropdown
      label={label}
      options={formats}
      value={selectedFormat}
      onChange={onSelectFormat}
    />
  );
}
