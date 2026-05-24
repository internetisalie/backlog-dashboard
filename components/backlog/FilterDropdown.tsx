import { useEffect, useRef } from 'react';

interface FilterDropdownProps {
  label: string;
  type: string;
  isOpen: boolean;
  onToggle: () => void;
  options: string[];
  selectedValues: Set<string>;
  onChange: (value: string, checked: boolean) => void;
  onSelectAll: (values: string[]) => void;
  onSelectNone: () => void;
}

export function FilterDropdown({
  label,
  isOpen,
  onToggle,
  options,
  selectedValues,
  onChange,
  onSelectAll,
  onSelectNone,
}: FilterDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div className="relative inline-flex" ref={dropdownRef}>
      <div
        className="inline-flex items-center min-w-[140px] px-2.5 py-1.5 border border-[#393c46] rounded-md text-[13px] bg-[#272930] cursor-pointer outline-none select-none hover:border-[#4dabf7]"
        onClick={onToggle}
      >
        <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[#e0e0e0]">
          {selectedValues.size === 0 || selectedValues.size === options.length
            ? `All ${label}`
            : `${selectedValues.size} selected`}
        </span>
        <svg
          className={`w-3 h-3 ml-2 fill-[#a0a0a0] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-10 w-[220px] max-h-[280px] overflow-y-auto bg-[#272930] border border-[#393c46] rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
          <div className="flex gap-1 px-2.5 py-1.5 border-b border-[#393c46]">
            <button
              className="flex-1 px-2 py-1 text-[12px] border border-[#393c46] rounded-[4px] bg-[#272930] cursor-pointer text-[#4dabf7] hover:bg-[#1e1f24]"
              onClick={(e) => { e.stopPropagation(); onSelectAll(options); }}
            >
              All
            </button>
            <button
              className="flex-1 px-2 py-1 text-[12px] border border-[#393c46] rounded-[4px] bg-[#272930] cursor-pointer text-[#a0a0a0] hover:bg-[#1e1f24]"
              onClick={(e) => { e.stopPropagation(); onSelectNone(); }}
            >
              None
            </button>
          </div>
          <div className="px-2.5 py-1">
            <div className="px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0]">{label}</div>
            {options.map((opt) => (
              <label key={opt} className="flex items-center px-2.5 py-1.5 text-[13px] cursor-pointer hover:bg-[#1e1f24]" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  className="mr-2 cursor-pointer accent-[#4dabf7]"
                  checked={selectedValues.has(opt)}
                  onChange={(e) => onChange(opt, e.target.checked)}
                />
                <span className="flex-1 cursor-pointer capitalize">{opt.replace(/-/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
