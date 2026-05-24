import { BacklogItem } from './types';
import { StatusPill, PriorityPill, TagPill, FeaturePill } from './Pills';

interface BacklogTableProps {
  items: BacklogItem[];
  sortCol: string;
  sortDir: 'asc' | 'desc';
  onSort: (col: string) => void;
  onFilterClick: (type: 'status' | 'priority' | 'tag' | 'feature', value: string) => void;
  obsidianHref: (path: string) => string;
}

export function BacklogTable({
  items,
  sortCol,
  sortDir,
  onSort,
  onFilterClick,
  obsidianHref,
}: BacklogTableProps) {
  return (
    <div className="p-4 overflow-x-auto">
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
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-[#a0a0a0]">
                No items match your filters.
              </td>
            </tr>
          ) : (
            items.map((item) => (
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
                </td>
                <td className="px-3 py-2.5 border-b border-[#393c46]">
                  <StatusPill 
                    label={item.status} 
                    onClick={() => onFilterClick('status', item.status)}
                    title={`Filter by ${item.status}`}
                  />
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
