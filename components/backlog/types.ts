export interface BacklogItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  tags?: string[];
  estimate?: number | null;
  created: string;
  path: string;
  feature?: string;
  parent_id?: string;
  type?: string;
}

export interface Filters {
  q: string;
  status: Set<string>;
  priority: Set<string>;
  tag: Set<string>;
  feature?: string;
}

export type FilterType = 'status' | 'priority' | 'tag';

export const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  backlog: { text: '#a0a0a0', bg: '#3a3d48' },
  planned: { text: '#b085ff', bg: '#3d3555' },
  'in-progress': { text: '#ffbc6b', bg: '#55452e' },
  review: { text: '#6bcbcf', bg: '#2e4a4c' },
  done: { text: '#6be686', bg: '#2e4a35' },
  cancelled: { text: '#8c92a0', bg: '#3a3d48' },
};

export const TYPE_COLORS: Record<string, { text: string; bg: string; label: string }> = {
  epic:         { text: '#b085ff', bg: '#3d3555', label: 'Epic' },
  feature:      { text: '#4dabf7', bg: '#2d4a6e', label: 'Feature' },
  'user-story': { text: '#6be686', bg: '#2e4a35', label: 'User Story' },
  spec:         { text: '#a0c4b0', bg: '#2a3d35', label: 'Miscellaneous' },
  design:       { text: '#6bcbcf', bg: '#2e4a4c', label: 'Technical Design' },
  plan:         { text: '#ffbc6b', bg: '#55452e', label: 'Implementation Plan' },
};

export const PRIORITY_COLORS: Record<string, { text: string; bg: string }> = {
  critical: { text: '#ff6b6b', bg: '#552e2e' },
  high: { text: '#ffa94d', bg: '#553a2e' },
  medium: { text: '#d9d96b', bg: '#4a4a2e' },
  low: { text: '#8ce66b', bg: '#354a2e' },
};
