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
        className="h-[44px] min-w-[140px] px-3.5 bg-card border border-border hover:border-border-hover focus:border-border-focus rounded-md flex items-center justify-between gap-3 text-[14px] font-medium text-primary transition-smooth focus:outline-none"
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`text-secondary transition-transform duration-150 ${isOpen ? 'rotate-180 text-primary' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-1.5 w-[160px] bg-card rounded-md border border-border shadow-subtle-dropdown py-1 max-h-[220px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
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
                className={`w-full px-3.5 py-2 text-left text-[13px] flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-card-muted font-semibold text-primary'
                    : 'text-secondary hover:text-primary hover:bg-card-muted/60'
                }`}
              >
                <span>{optLabel}</span>
                {isSelected && <Check size={14} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
