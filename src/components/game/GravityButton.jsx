import React from 'react';
import { ChevronsUpDown } from 'lucide-react';

export default function GravityButton({ onPress, sound }) {
  return (
    <button
      type="button"
      aria-label="Switch gravity"
      className="pointer-events-auto absolute bottom-6 right-5 z-20 flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-full border border-cyan-200/35 bg-cyan-400/10 text-cyan-100 shadow-[0_0_50px_-12px_rgba(56,232,255,0.85)] backdrop-blur-md transition-transform duration-100 active:scale-90 sm:h-28 sm:w-28"
      onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onPress(); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ChevronsUpDown size={30} strokeWidth={2.2} />
      <span className="font-heading text-[9px] uppercase tracking-[0.22em] text-cyan-100/80">Switch</span>
    </button>
  );
}