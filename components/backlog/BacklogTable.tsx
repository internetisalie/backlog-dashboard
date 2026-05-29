import { useState, useMemo } from 'react';
import { BacklogItem, STATUS_COLORS } from './types';
import { StatusPill, PriorityPill, TagPill, FeaturePill, TypePill, RepositoryPill } from './Pills';
import { Tooltip } from './Tooltip';

interface BacklogTableProps {
  items: BacklogItem[];
  sortCol: string;
  sortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
  onFilterClick: (type: 'status' | 'priority' | 'tag' | 'feature' | 'repository', value: string) => void;
  obsidianHref: (path: string) => string;
}

interface FlatRow {
  item: BacklogItem;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

const STATUS_ORDER = ['done', 'in-progress', 'review', 'planned', 'backlog', 'cancelled'];

function StatusSparkline({ children }: { children: BacklogItem[] }) {
  const counts: Record<string, number> = {};
  for (const c of children) {
    counts[c.status] = (counts[c.status] ?? 0) + 1;
  }
  const total = children.length;
  const segments = STATUS_ORDER.filter((s) => counts[s]).map((s) => ({
    status: s,
    count: counts[s],
    pct: (counts[s] / total) * 100,
    textColor: (STATUS_COLORS[s] || STATUS_COLORS.backlog).text,
  }));

  const tooltipContent = (
    <div className="flex flex-col gap-1">
      {segments.map((s) => (
        <div key={s.status} className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-sm flex-shrink-0"
            style={{ backgroundColor: s.textColor }}
          />
          <span style={{ color: s.textColor }} className="capitalize">{s.status}</span>
          <span className="text-[#606370] ml-auto pl-4">{s.count}</span>
        </div>
      ))}
      <div className="border-t border-[#393c46] mt-0.5 pt-0.5 text-[#606370] text-right">
        {total} total
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <div className="mt-1.5 cursor-default">
        <div className="flex rounded-sm overflow-hidden h-[5px] w-[80px] gap-[1px]">
          {segments.map((s) => (
            <div
              key={s.status}
              style={{ width: `${s.pct}%`, backgroundColor: s.textColor, opacity: 0.7 }}
            />
          ))}
        </div>
        <div className="text-[10px] text-[#606370] mt-0.5">{total} items</div>
      </div>
    </Tooltip>
  );
}

function buildTree(items: BacklogItem[]): {
  childrenOf: Map<string, BacklogItem[]>;
  roots: BacklogItem[];
} {
  const idSet = new Set(items.map((i) => i.id));
  const childrenOf = new Map<string, BacklogItem[]>();
  const roots: BacklogItem[] = [];

  for (const item of items) {
    if (item.parent_id && idSet.has(item.parent_id)) {
      const siblings = childrenOf.get(item.parent_id) ?? [];
      siblings.push(item);
      childrenOf.set(item.parent_id, siblings);
    } else {
      roots.push(item);
    }
  }
  return { childrenOf, roots };
}

function buildFlatRows(
  items: BacklogItem[],
  expanded: Set<string>,
  childrenOf: Map<string, BacklogItem[]>,
  roots: BacklogItem[],
): FlatRow[] {
  const flatten = (nodes: BacklogItem[], depth: number): FlatRow[] => {
    const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    const rows: FlatRow[] = [];
    for (const item of sorted) {
      const children = childrenOf.get(item.id) ?? [];
      const hasChildren = children.length > 0;
      const isExpanded = expanded.has(item.id);
      rows.push({ item, depth, hasChildren, isExpanded });
      if (hasChildren && isExpanded) {
        rows.push(...flatten(children, depth + 1));
      }
    }
    return rows;
  };
  return flatten(roots, 0);
}

export function BacklogTable({
  items,
  sortCol,
  sortDir,
  onSort,
  onFilterClick,
  obsidianHref,
}: BacklogTableProps) {
  const { childrenOf, roots } = useMemo(() => buildTree(items), [items]);

  const parentIds = useMemo(() => new Set(childrenOf.keys()), [childrenOf]);

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(parentIds));

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(parentIds));
  const collapseAll = () => setExpanded(new Set());

  const rows = useMemo(
    () => buildFlatRows(items, expanded, childrenOf, roots),
    [items, expanded, childrenOf, roots],
  );

  const hasHierarchy = parentIds.size > 0;

  return (
    <div className="p-4 overflow-x-auto">
      {hasHierarchy && (
        <div className="flex gap-2 mb-2 text-[12px] text-[#a0a0a0]">
          <button onClick={expandAll} className="hover:text-[#e0e0e0] cursor-pointer">expand all</button>
          <span>·</span>
          <button onClick={collapseAll} className="hover:text-[#e0e0e0] cursor-pointer">collapse all</button>
        </div>
      )}
      <table className="w-full border-collapse bg-[#272930] border border-[#393c46] rounded-md overflow-hidden">
        <thead>
          <tr className="bg-[#1e1f24] border-b border-[#393c46]">
            {['id', 'title', 'status', 'priority', 'tags', 'estimate', 'created'].map((col) => (
              <th
                key={col}
                className={`px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-[#a0a0a0] select-none whitespace-nowrap hover:text-[#e0e0e0] ${
                  col !== 'tags' ? 'cursor-pointer' : ''
                } ${col === 'estimate' ? 'text-center' : 'text-left'}`}
                style={col === 'title' ? { minWidth: '260px' } : {}}
                onClick={() => col !== 'tags' && onSort(col)}
              >
                {col === 'estimate' ? 'Est.' : col}
                {sortCol === col && (
                  <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[14px]">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-[#a0a0a0]">
                No items match your filters.
              </td>
            </tr>
          ) : (
            rows.map(({ item, depth, hasChildren, isExpanded }) => {
              const children = childrenOf.get(item.id) ?? [];
              return (
                <tr key={item.id} className="hover:bg-[#1e1f24] h-[72px]">
                  <td className="px-3 py-2.5 border-b border-[#393c46] font-mono text-[13px] whitespace-nowrap">
                    <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 16}px` }}>
                      {hasChildren ? (
                        <button
                          onClick={() => toggle(item.id)}
                          className="text-[#a0a0a0] hover:text-[#e0e0e0] w-4 text-center leading-none cursor-pointer select-none"
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? '▾' : '▸'}
                        </button>
                      ) : (
                        depth > 0 && <span className="w-4 inline-block" />
                      )}
                      <a
                        href={obsidianHref(item.path)}
                        title={item.path}
                        className="text-[#4dabf7] font-semibold no-underline hover:underline"
                      >
                        {item.id}
                      </a>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#393c46]">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span>{item.title}</span>
                      {item.type && <TypePill label={item.type} title={item.type} />}
                    </div>
                    {item.description && (
                      <div className="text-[12px] text-[#a0a0a0] mt-1">{item.description}</div>
                    )}
                    {item.feature && (
                      <div className="mt-1">
                        <FeaturePill
                          label={item.feature}
                          onClick={() => onFilterClick('feature', item.feature!)}
                          title="Filter by this feature"
                        />
                      </div>
                    )}
                    {item.repository && (
                      <div className="mt-1">
                        <RepositoryPill
                          label={item.repository}
                          onClick={() => onFilterClick('repository', item.repository!)}
                          title="Filter by this repository"
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#393c46]">
                    <StatusPill
                      label={item.status}
                      onClick={() => onFilterClick('status', item.status)}
                      title={`Filter by ${item.status}`}
                    />
                    {hasChildren && <StatusSparkline children={children} />}
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#393c46]">
                    <PriorityPill
                      label={item.priority}
                      onClick={() => onFilterClick('priority', item.priority)}
                      title={`Filter by ${item.priority}`}
                    />
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#393c46] min-w-[120px]">
                    {(item.tags || []).map((tag) => (
                      <TagPill
                        key={tag}
                        label={tag}
                        onClick={() => onFilterClick('tag', tag)}
                        title={`Filter by ${tag}`}
                      />
                    ))}
                  </td>
                  <td className="px-3 py-2.5 border-b border-[#393c46] text-center text-[#a0a0a0] whitespace-nowrap">
                    {item.estimate ?? '–'}
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
  );
}

