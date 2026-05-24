'use client';

import { useState, useEffect, useMemo } from 'react';
import { BacklogItem, Filters, PRIORITY_ORDER } from '@/components/backlog/types';
import { FilterBar } from '@/components/backlog/FilterBar';
import { BacklogTable } from '@/components/backlog/BacklogTable';

const API_URL = '/api/backlog';

export default function BacklogBrowser() {
  const [allItems, setAllItems] = useState<BacklogItem[]>([]);
  const [sortCol, setSortCol] = useState<string>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Filters>({
    q: '',
    status: new Set(),
    priority: new Set(),
    tag: new Set(),
    feature: undefined,
  });
  const [dropdownsOpen, setDropdownsOpen] = useState({
    status: false,
    priority: false,
    tag: false,
  });
  const [allTagOptions, setAllTagOptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [backlogName, setBacklogName] = useState<string>('Glimmer');

  useEffect(() => {
    async function init() {
      try {
        const resp = await fetch(API_URL);
        if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${API_URL}`);
        const data = await resp.json();
        const items = Array.isArray(data) ? data : (data.items || []);
        setAllItems(items);
        setBacklogName(Array.isArray(data) ? 'Backlog' : (data.configs?.[0]?.name || 'Backlog'));
        const tags: string[] = [...new Set(items.flatMap((i: BacklogItem) => i.tags || []))].sort();
        setAllTagOptions(tags);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Could not load backlog data: ${message}`);
      }
    }
    init();
  }, []);

  const filteredItems = useMemo(() => {
    let items = allItems;

    if (filters.status.size > 0) {
      items = items.filter((item) => filters.status.has(item.status));
    }
    if (filters.priority.size > 0) {
      items = items.filter((item) => filters.priority.has(item.priority));
    }
    if (filters.tag.size > 0) {
      items = items.filter((item) => item.tags?.some((t) => filters.tag.has(t)));
    }
    if (filters.feature) {
      items = items.filter((item) => item.feature === filters.feature);
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      items = items.filter((item) => {
        const haystack = [
          item.id,
          item.title,
          item.description || '',
          item.feature || '',
          ...(item.tags || [])
        ]
          .join(' ')
          .toLowerCase();
        return q.split(/\s+/).every((word) => haystack.includes(word));
      });
    }

    items = [...items].sort((a, b) => {
      let av = a[sortCol as keyof BacklogItem];
      let bv = b[sortCol as keyof BacklogItem];
      if (sortCol === 'priority') {
        av = PRIORITY_ORDER[av as string] ?? 99;
        bv = PRIORITY_ORDER[bv as string] ?? 99;
      }
      if (av == null) av = '';
      if (bv == null) bv = '';
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * (sortDir === 'asc' ? 1 : -1);
      }
      return String(av).localeCompare(String(bv)) * (sortDir === 'asc' ? 1 : -1);
    });

    return items;
  }, [allItems, filters, sortCol, sortDir]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, q: e.target.value }));
  };

  const handleFilterChange = (type: 'status' | 'priority' | 'tag', value: string, checked: boolean) => {
    setFilters((prev) => {
      const newSet = new Set(prev[type]);
      if (checked) {
        newSet.add(value);
      } else {
        newSet.delete(value);
      }
      return { ...prev, [type]: newSet };
    });
  };

  const handleSelectAll = (type: 'status' | 'priority' | 'tag', values: string[]) => {
    setFilters((prev) => ({ ...prev, [type]: new Set(values) }));
  };

  const handleSelectNone = (type: 'status' | 'priority' | 'tag') => {
    setFilters((prev) => ({ ...prev, [type]: new Set() }));
  };

  const handleFilterClick = (type: 'status' | 'priority' | 'tag' | 'feature', value: string) => {
    setFilters((prev) => {
      if (type === 'feature') {
        return { ...prev, feature: value === prev.feature ? undefined : value };
      }
      const newSet = new Set(prev[type]);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return { ...prev, [type]: newSet };
    });
  };

  const handleSort = (col: string) => {
    if (col === 'tags') return;
    if (sortCol === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const toggleDropdown = (type: 'status' | 'priority' | 'tag') => {
    setDropdownsOpen((prev) => ({
      status: type === 'status' ? !prev.status : false,
      priority: type === 'priority' ? !prev.priority : false,
      tag: type === 'tag' ? !prev.tag : false,
    }));
  };

  const obsidianHref = (path: string) => {
    const file = path.replace(/\.md$/, '');
    return `obsidian://open?vault=glimmer-project&file=${encodeURIComponent(file)}`;
  };

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-[#1e1f24] text-[#e0e0e0] font-sans">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-[#552e2e] text-[#ffb3b3] px-6 py-4 rounded-md max-w-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#1e1f24] text-[#e0e0e0] font-sans">
      <FilterBar
        backlogName={backlogName}
        filters={filters}
        allTagOptions={allTagOptions}
        totalCount={allItems.length}
        filteredCount={filteredItems.length}
        dropdownsOpen={dropdownsOpen}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSelectAll={handleSelectAll}
        onSelectNone={handleSelectNone}
        onToggleDropdown={toggleDropdown}
        onClearFeature={() => setFilters(prev => ({ ...prev, feature: undefined }))}
      />

      <BacklogTable
        items={filteredItems}
        sortCol={sortCol}
        sortDir={sortDir}
        onSort={handleSort}
        onFilterClick={handleFilterClick}
        obsidianHref={obsidianHref}
      />

      <style>{`
        *::-webkit-scrollbar { width: 8px; height: 8px; }
        *::-webkit-scrollbar-track { background: #1e1f24; }
        *::-webkit-scrollbar-thumb { background: #393c46; border-radius: 4px; }
        *::-webkit-scrollbar-thumb:hover { background: #a0a0a0; }
      `}</style>
    </div>
  );
}
