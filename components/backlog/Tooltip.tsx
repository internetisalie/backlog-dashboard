'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const show = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX + rect.width / 2,
    });
    setVisible(true);
  };

  const hide = () => setVisible(false);

  // Nudge left if it would overflow the viewport
  useEffect(() => {
    if (!visible || !tooltipRef.current || !pos) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    const overflow = rect.right - window.innerWidth + 8;
    if (overflow > 0) {
      setPos((p) => p && { ...p, left: p.left - overflow });
    }
  }, [visible, pos]);

  const tooltip = visible && pos && (
    <div
      ref={tooltipRef}
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      className="bg-[#16171b] border border-[#393c46] text-[#e0e0e0] text-[12px] rounded-md px-3 py-2 shadow-lg whitespace-nowrap"
    >
      {content}
    </div>
  );

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="inline-flex"
      >
        {children}
      </span>
      {typeof document !== 'undefined' && tooltip
        ? createPortal(tooltip, document.body)
        : null}
    </>
  );
}
