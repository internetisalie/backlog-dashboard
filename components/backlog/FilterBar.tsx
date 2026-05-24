import Image from 'next/image';
import { Filters } from './types';
import { FilterDropdown } from './FilterDropdown';

interface FilterBarProps {
  backlogName: string;
  filters: Filters;
  allTagOptions: string[];
  totalCount: number;
  filteredCount: number;
  dropdownsOpen: { status: boolean; priority: boolean; tag: boolean };
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterChange: (type: 'status' | 'priority' | 'tag', value: string, checked: boolean) => void;
  onSelectAll: (type: 'status' | 'priority' | 'tag', values: string[]) => void;
  onSelectNone: (type: 'status' | 'priority' | 'tag') => void;
  onToggleDropdown: (type: 'status' | 'priority' | 'tag') => void;
  onClearFeature: () => void;
}

export function FilterBar({
  backlogName,
  filters,
  allTagOptions,
  totalCount,
  filteredCount,
  dropdownsOpen,
  onSearchChange,
  onFilterChange,
  onSelectAll,
  onSelectNone,
  onToggleDropdown,
  onClearFeature,
}: FilterBarProps) {
  return (
    <div className="bg-[#272930] border-b border-[#393c46] px-6 py-2.5 flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-3 mr-2">
        <Image src="/stars@8x.png" alt="Icon" width={24} height={24} className="w-6 h-6" />
        <h1 className="text-[18px] font-semibold whitespace-nowrap">{backlogName} Backlog</h1>
      </div>

      <div className="flex-1 min-w-[300px] flex items-center gap-2.5">
        <input
          type="search"
          placeholder="Search ID, title, description, tags…"
          autoComplete="off"
          value={filters.q}
          onChange={onSearchChange}
          className="flex-1 min-w-[150px] px-2.5 py-1.5 border border-[#393c46] rounded-md text-[14px] bg-[#1e1f24] text-[#e0e0e0] outline-none focus:border-[#4dabf7]"
        />

        {filters.feature && (
          <div className="flex items-center gap-2 px-2 py-1 bg-[#3d3555] border border-[#b085ff] rounded-md text-[12px] text-[#b085ff] max-w-[200px]">
            <span className="truncate" title={filters.feature}>Feature: {filters.feature.split('/').pop()}</span>
            <button onClick={onClearFeature} className="hover:text-white flex-shrink-0">✕</button>
          </div>
        )}

        <FilterDropdown
          label="Status"
          type="status"
          isOpen={dropdownsOpen.status}
          onToggle={() => onToggleDropdown('status')}
          options={['backlog', 'planned', 'in-progress', 'review', 'done', 'cancelled']}
          selectedValues={filters.status}
          onChange={(val, chk) => onFilterChange('status', val, chk)}
          onSelectAll={(vals) => onSelectAll('status', vals)}
          onSelectNone={() => onSelectNone('status')}
        />

        <FilterDropdown
          label="Priority"
          type="priority"
          isOpen={dropdownsOpen.priority}
          onToggle={() => onToggleDropdown('priority')}
          options={['critical', 'high', 'medium', 'low']}
          selectedValues={filters.priority}
          onChange={(val, chk) => onFilterChange('priority', val, chk)}
          onSelectAll={(vals) => onSelectAll('priority', vals)}
          onSelectNone={() => onSelectNone('priority')}
        />

        <FilterDropdown
          label="Tag"
          type="tag"
          isOpen={dropdownsOpen.tag}
          onToggle={() => onToggleDropdown('tag')}
          options={allTagOptions}
          selectedValues={filters.tag}
          onChange={(val, chk) => onFilterChange('tag', val, chk)}
          onSelectAll={(vals) => onSelectAll('tag', vals)}
          onSelectNone={() => onSelectNone('tag')}
        />
      </div>

      <span className="text-[#a0a0a0] text-[13px] whitespace-nowrap">
        {filteredCount === totalCount
          ? `${totalCount} items`
          : `${filteredCount} of ${totalCount} items`}
      </span>
    </div>
  );
}

