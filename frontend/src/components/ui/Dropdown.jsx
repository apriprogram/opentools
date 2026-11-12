import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function Dropdown({
  options = [],
  value,
  onChange,
  label = 'Format',
  placeholder = 'Select format',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) =>
    typeof opt === 'string' ? opt.toLowerCase() === value?.toLowerCase() : opt.value === value
  );

  const selectedLabel = typeof selectedOption === 'string'
    ? selectedOption.toUpperCase()
    : selectedOption?.label || value?.toUpperCase() || placeholder;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-[13px] font-semibold text-primary mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-[44px] min-w-[140px] px-3.5 bg-card border border-border hover:border-border-hover focus:border-border-focus rounded-md flex items-center justify-between gap-3 text-[14px] font-medium text-primary transition-smooth focus:outline-none focus-visible:border-blue-500"
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className={`text-tertiary transition-transform duration-150 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-1.5 w-[168px] max-h-[240px] overflow-y-auto rounded-md border border-border bg-card p-1 shadow-menu animate-in fade-in zoom-in-95 duration-150 motion-reduce:animate-none dark:shadow-menu-dark">
          {options.map((opt) => {
            const optVal = typeof opt === 'string' ? opt : opt.value;
            const optLabel = typeof opt === 'string' ? opt.toUpperCase() : opt.label;
            const isSelected = optVal.toLowerCase() === value?.toLowerCase();

            return (
              <button
                key={optVal}
                type="button"
                onClick={() => {
                  onChange(optVal);
                  setIsOpen(false);
                }}
                className={`flex min-h-[34px] w-full items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-left text-[13px] transition-smooth hover:bg-card-muted focus:bg-card-muted focus:outline-none ${
                  isSelected ? 'font-medium text-primary' : 'text-secondary hover:text-primary'
                }`}
              >
                <span>{optLabel}</span>
                {isSelected && <Check size={14} strokeWidth={2} className="shrink-0 text-blue-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
