'use client';

import { useState, useEffect, useMemo } from 'react';

const API_URL = '/api/backlog';

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const STATUS_COLORS = {
  backlog: { text: '#a0a0a0', bg: '#3a3d48' },
  planned: { text: '#b085ff', bg: '#3d3555' },
  'in-progress': { text: '#ffbc6b', bg: '#55452e' },
  review: { text: '#6bcbcf', bg: '#2e4a4c' },
  done: { text: '#6be686', bg: '#2e4a35' },
  cancelled: { text: '#8c92a0', bg: '#3a3d48' },
};

const PRIORITY_COLORS = {
  critical: { text: '#ff6b6b', bg: '#552e2e' },
  high: { text: '#ffa94d', bg: '#553a2e' },
  medium: { text: '#d9d96b', bg: '#4a4a2e' },
  low: { text: '#8ce66b', bg: '#354a2e' },
};

interface BacklogItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  tags?: string[];
  estimate?: number | null;
  created: string;
  path: string;
}

interface Filters {
  q: string;
  status: Set<string>;
  priority: Set<string>;
  tag: Set<string>;
}

export default function BacklogBrowser() {
  const [allItems, setAllItems] = useState<BacklogItem[]>([]);
  const [sortCol, setSortCol] = useState<string>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Filters>({
    q: '',
    status: new Set(),
    priority: new Set(),
    tag: new Set(),
  });
  const [dropdownsOpen] = useState({
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
        console.log('[backlog-page] API response:', data);
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
    if (filters.q) {
      const q = filters.q.toLowerCase();
      items = items.filter((item) => {
        const haystack = [item.id, item.title, item.description || '', ...(item.tags || [])]
          .join(' ')
          .toLowerCase();
        return q.split(/\s+/).every((word) => haystack.includes(word));
      });
    }

    items = [...items].sort((a, b) => {
      let av = a[sortCol as keyof BacklogItem];
      let bv = b[sortCol as keyof BacklogItem];
      if (sortCol === 'priority') {
        av = PRIORITY_ORDER[av as keyof typeof PRIORITY_ORDER] ?? 99;
        bv = PRIORITY_ORDER[bv as keyof typeof PRIORITY_ORDER] ?? 99;
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

  const handleFilterClick = (type: 'status' | 'priority' | 'tag', value: string) => {
    setFilters((prev) => {
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

  const getLabel = (type: 'status' | 'priority' | 'tag', options: string[]) => {
    const count = filters[type].size;
    if (count === 0) return `All ${type}`;
    if (count === options.length) return `All ${type}`;
    return `${count} selected`;
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
      <header className="bg-[#272930] border-b border-[#393c46] px-6 py-3.5 flex items-center gap-3">
        <img src="/stars@8x.png" alt="Icon" className="w-6 h-6" />
        <h1 className="text-[18px] font-semibold whitespace-nowrap">{backlogName} Backlog</h1>
        <span className="text-[#a0a0a0] text-[13px]">
          {allItems.length} items
        </span>
      </header>

      <div className="bg-[#272930] border-b border-[#393c46] px-6 py-2.5 flex flex-wrap gap-2.5 items-center">
        <input
          type="search"
          id="q"
          placeholder="Search ID, title, description, tags…"
          autoComplete="off"
          value={filters.q}
          onChange={handleSearchChange}
          className="flex-1 min-w-[200px] px-2.5 py-1.5 border border-[#393c46] rounded-md text-[14px] bg-[#1e1f24] text-[#e0e0e0] outline-none focus:border-[#4dabf7]"
        />

        <div className="relative inline-flex items-center min-w-[140px] px-2.5 py-1.5 border border-[#393c46] rounded-md text-[13px] bg-[#272930] cursor-pointer outline-none select-none">
          <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[#e0e0e0]">
            {getLabel('status', ['backlog', 'planned', 'in-progress', 'review', 'done', 'cancelled'])}
          </span>
          <svg
            className={`w-3 h-3 absolute right-2.5 top-1/2 transform -translate-y-1/2 fill-[#a0a0a0] pointer-events-none ${dropdownsOpen.status ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
          <div
            className={`absolute top-[calc(100%+4px)] left-0 z-10 w-[220px] max-h-[280px] overflow-y-auto bg-[#272930] border border-[#393c46] rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.3)] ${
              dropdownsOpen.status ? 'block' : 'hidden'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-1 px-2.5 py-1.5 border-b border-[#393c46]">
              <button
                className="flex-1 px-2 py-1 text-[12px] border border-[#393c46] rounded-[4px] bg-[#272930] cursor-pointer text-[#e0e0e0] hover:bg-[#1e1f24] border-color-[#4dabf7] text-[#4dabf7]"
                onClick={() => handleSelectAll('status', ['backlog', 'planned', 'in-progress', 'review', 'done', 'cancelled'])}
              >
                All
              </button>
              <button
                className="flex-1 px-2 py-1 text-[12px] border border-[#393c46] rounded-[4px] bg-[#272930] cursor-pointer text-[#e0e0e0] hover:bg-[#1e1f24] border-color-[#a0a0a0] text-[#a0a0a0]"
                onClick={() => handleSelectNone('status')}
              >
                None
              </button>
            </div>
            <div className="px-2.5 py-1">
              <div className="px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0]">Status</div>
              {['backlog', 'planned', 'in-progress', 'review', 'done', 'cancelled'].map((s) => (
                <label key={s} className="flex items-center px-2.5 py-1.5 text-[13px] cursor-pointer hover:bg-[#1e1f24]">
                  <input
                    type="checkbox"
                    className="mr-2 cursor-pointer accent-[#4dabf7]"
                    checked={filters.status.has(s)}
                    onChange={(e) => handleFilterChange('status', s, e.target.checked)}
                  />
                  <span className="flex-1 cursor-pointer capitalize">{s.replace(/-/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="relative inline-flex items-center min-w-[140px] px-2.5 py-1.5 border border-[#393c46] rounded-md text-[13px] bg-[#272930] cursor-pointer outline-none select-none">
          <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[#e0e0e0]">
            {getLabel('priority', ['critical', 'high', 'medium', 'low'])}
          </span>
          <svg
            className={`w-3 h-3 absolute right-2.5 top-1/2 transform -translate-y-1/2 fill-[#a0a0a0] pointer-events-none ${dropdownsOpen.priority ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
          <div
            className={`absolute top-[calc(100%+4px)] left-0 z-10 w-[220px] max-h-[280px] overflow-y-auto bg-[#272930] border border-[#393c46] rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.3)] ${
              dropdownsOpen.priority ? 'block' : 'hidden'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-1 px-2.5 py-1.5 border-b border-[#393c46]">
              <button
                className="flex-1 px-2 py-1 text-[12px] border border-[#393c46] rounded-[4px] bg-[#272930] cursor-pointer text-[#e0e0e0] hover:bg-[#1e1f24] border-color-[#4dabf7] text-[#4dabf7]"
                onClick={() => handleSelectAll('priority', ['critical', 'high', 'medium', 'low'])}
              >
                All
              </button>
              <button
                className="flex-1 px-2 py-1 text-[12px] border border-[#393c46] rounded-[4px] bg-[#272930] cursor-pointer text-[#e0e0e0] hover:bg-[#1e1f24] border-color-[#a0a0a0] text-[#a0a0a0]"
                onClick={() => handleSelectNone('priority')}
              >
                None
              </button>
            </div>
            <div className="px-2.5 py-1">
              <div className="px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0]">Priority</div>
              {['critical', 'high', 'medium', 'low'].map((p) => (
                <label key={p} className="flex items-center px-2.5 py-1.5 text-[13px] cursor-pointer hover:bg-[#1e1f24]">
                  <input
                    type="checkbox"
                    className="mr-2 cursor-pointer accent-[#4dabf7]"
                    checked={filters.priority.has(p)}
                    onChange={(e) => handleFilterChange('priority', p, e.target.checked)}
                  />
                  <span className="flex-1 cursor-pointer capitalize">{p}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="relative inline-flex items-center min-w-[140px] px-2.5 py-1.5 border border-[#393c46] rounded-md text-[13px] bg-[#272930] cursor-pointer outline-none select-none">
          <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[#e0e0e0]">
            {getLabel('tag', allTagOptions)}
          </span>
          <svg
            className={`w-3 h-3 absolute right-2.5 top-1/2 transform -translate-y-1/2 fill-[#a0a0a0] pointer-events-none ${dropdownsOpen.tag ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
          <div
            className={`absolute top-[calc(100%+4px)] left-0 z-10 w-[220px] max-h-[280px] overflow-y-auto bg-[#272930] border border-[#393c46] rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.3)] ${
              dropdownsOpen.tag ? 'block' : 'hidden'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-1 px-2.5 py-1.5 border-b border-[#393c46]">
              <button
                className="flex-1 px-2 py-1 text-[12px] border border-[#393c46] rounded-[4px] bg-[#272930] cursor-pointer text-[#e0e0e0] hover:bg-[#1e1f24] border-color-[#4dabf7] text-[#4dabf7]"
                onClick={() => handleSelectAll('tag', allTagOptions)}
              >
                All
              </button>
              <button
                className="flex-1 px-2 py-1 text-[12px] border border-[#393c46] rounded-[4px] bg-[#272930] cursor-pointer text-[#e0e0e0] hover:bg-[#1e1f24] border-color-[#a0a0a0] text-[#a0a0a0]"
                onClick={() => handleSelectNone('tag')}
              >
                None
              </button>
            </div>
            <div className="px-2.5 py-1">
              <div className="px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0]">Tags</div>
              {allTagOptions.map((tag) => (
                <label key={tag} className="flex items-center px-2.5 py-1.5 text-[13px] cursor-pointer hover:bg-[#1e1f24]">
                  <input
                    type="checkbox"
                    className="mr-2 cursor-pointer accent-[#4dabf7]"
                    checked={filters.tag.has(tag)}
                    onChange={(e) => handleFilterChange('tag', tag, e.target.checked)}
                  />
                  <span className="flex-1 cursor-pointer">{tag}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <span className="text-[#a0a0a0] text-[13px] whitespace-nowrap ml-auto">
          {filteredItems.length === allItems.length
            ? `${allItems.length} items`
            : `${filteredItems.length} of ${allItems.length} items`}
        </span>
      </div>

      <div className="p-4 overflow-x-auto">
        <table className="w-full border-collapse bg-[#272930] border border-[#393c46] rounded-md overflow-hidden">
          <thead>
            <tr className="bg-[#1e1f24] border-b border-[#393c46]">
              <th
                className="px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-[#a0a0a0] cursor-pointer select-none whitespace-nowrap hover:text-[#e0e0e0]"
                onClick={() => handleSort('id')}
              >
                ID
                <span className={`ml-1 ${sortCol === 'id' ? 'opacity-1' : 'opacity-0'}`}>{sortDir === 'asc' ? '↑' : '↓'}</span>
              </th>
              <th
                className="px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-[#a0a0a0] cursor-pointer select-none whitespace-nowrap hover:text-[#e0e0e0]"
                style={{ minWidth: '260px' }}
                onClick={() => handleSort('title')}
              >
                Title
                <span className={`ml-1 ${sortCol === 'title' ? 'opacity-1' : 'opacity-0'}`}>{sortDir === 'asc' ? '↑' : '↓'}</span>
              </th>
              <th
                className="px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-[#a0a0a0] cursor-pointer select-none whitespace-nowrap hover:text-[#e0e0e0]"
                onClick={() => handleSort('status')}
              >
                Status
                <span className={`ml-1 ${sortCol === 'status' ? 'opacity-1' : 'opacity-0'}`}>{sortDir === 'asc' ? '↑' : '↓'}</span>
              </th>
              <th
                className="px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-[#a0a0a0] cursor-pointer select-none whitespace-nowrap hover:text-[#e0e0e0]"
                onClick={() => handleSort('priority')}
              >
                Priority
                <span className={`ml-1 ${sortCol === 'priority' ? 'opacity-1' : 'opacity-0'}`}>{sortDir === 'asc' ? '↑' : '↓'}</span>
              </th>
              <th className="px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-[#a0a0a0] whitespace-nowrap">
                Tags
              </th>
              <th
                className="px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-[#a0a0a0] cursor-pointer select-none whitespace-nowrap hover:text-[#e0e0e0] text-center"
                onClick={() => handleSort('estimate')}
              >
                Est.
                <span className={`ml-1 ${sortCol === 'estimate' ? 'opacity-1' : 'opacity-0'}`}>{sortDir === 'asc' ? '↑' : '↓'}</span>
              </th>
              <th
                className="px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-[#a0a0a0] cursor-pointer select-none whitespace-nowrap hover:text-[#e0e0e0]"
                onClick={() => handleSort('created')}
              >
                Created
                {sortCol === 'created' && <span className="ml-1 opacity-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
              </th>
            </tr>
          </thead>
          <tbody className="text-[14px]">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[#a0a0a0]">
                  No items match your filters.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const statusColor = STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.backlog;
                const priorityColor = PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium;
                const tags = (item.tags || []).map((t) => (
                  <span key={t} className="inline-block px-1.5 py-0.5 rounded text-[11px] bg-[#2d4a6e] text-[#4dabf7] mr-1">
                    {t}
                  </span>
                ));
                const estimate = item.estimate != null ? item.estimate : '–';

                return (
                  <tr key={item.id} className="hover:bg-[#1e1f24]">
                    <td className="px-3 py-2.5 border-b border-[#393c46] font-mono text-[13px] whitespace-nowrap">
                      <a
                        href={obsidianHref(item.path)}
                        title={item.path}
                        className="text-[#4dabf7] font-semibold no-underline hover:underline"
                      >
                        {item.id}
                      </a>
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#393c46]">
                      <div>{item.title}</div>
                      {item.description && <div className="text-[12px] text-[#a0a0a0] mt-1">{item.description}</div>}
                    </td>
                     <td className="px-3 py-2.5 border-b border-[#393c46]">
                       <span
                         className="inline-block px-1.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80"
                         style={{ color: statusColor.text, backgroundColor: statusColor.bg }}
                         onClick={() => handleFilterClick('status', item.status)}
                         title={`Filter by ${item.status}`}
                       >
                         {item.status}
                       </span>
                     </td>
                     <td className="px-3 py-2.5 border-b border-[#393c46]">
                       <span
                         className="inline-block px-1.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80"
                         style={{ color: priorityColor.text, backgroundColor: priorityColor.bg }}
                         onClick={() => handleFilterClick('priority', item.priority)}
                         title={`Filter by ${item.priority}`}
                       >
                         {item.priority}
                       </span>
                     </td>
                     <td className="px-3 py-2.5 border-b border-[#393c46] min-w-[120px]">
                       {tags.map((tag) => (
                         <span
                           key={tag}
                           className="inline-block px-1.5 py-0.5 rounded text-[11px] bg-[#2d4a6e] text-[#4dabf7] mr-1 cursor-pointer hover:opacity-80"
                           onClick={() => handleFilterClick('tag', tag)}
                           title={`Filter by ${tag}`}
                         >
                           {tag}
                         </span>
                       ))}
                     </td>
                    <td className="px-3 py-2.5 border-b border-[#393c46] text-center text-[#a0a0a0] whitespace-nowrap">
                      {estimate}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#393c46] text-[#a0a0a0] whitespace-nowrap">
                      {item.created}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        *::-webkit-scrollbar { width: 8px; height: 8px; }
        *::-webkit-scrollbar-track { background: #1e1f24; }
        *::-webkit-scrollbar-thumb { background: #393c46; border-radius: 4px; }
        *::-webkit-scrollbar-thumb:hover { background: #a0a0a0; }
      `}</style>
    </div>
  );
}
