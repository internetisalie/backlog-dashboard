import { STATUS_COLORS, PRIORITY_COLORS } from './types';

interface PillProps {
  label: string;
  onClick?: () => void;
  title?: string;
}

export function StatusPill({ label, onClick, title }: PillProps) {
  const colors = STATUS_COLORS[label] || STATUS_COLORS.backlog;
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80"
      style={{ color: colors.text, backgroundColor: colors.bg }}
      onClick={onClick}
      title={title}
    >
      {label}
    </span>
  );
}

export function PriorityPill({ label, onClick, title }: PillProps) {
  const colors = PRIORITY_COLORS[label] || PRIORITY_COLORS.medium;
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80"
      style={{ color: colors.text, backgroundColor: colors.bg }}
      onClick={onClick}
      title={title}
    >
      {label}
    </span>
  );
}

export function TagPill({ label, onClick, title }: PillProps) {
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-[11px] bg-[#2d4a6e] text-[#4dabf7] mr-1 cursor-pointer hover:opacity-80"
      onClick={onClick}
      title={title}
    >
      {label}
    </span>
  );
}

export function FeaturePill({ label, onClick, title }: PillProps) {
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-[11px] bg-[#4a2d6e] text-[#b085ff] mr-1 cursor-pointer hover:opacity-80"
      onClick={onClick}
      title={title}
    >
      {label}
    </span>
  );
}
