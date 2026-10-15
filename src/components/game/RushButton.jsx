import React from 'react';
import { Gem } from 'lucide-react';

// Dedicated hold-to-follow control for Gem Rush on touch devices. Press and
// hold to glide the character along a large gem row; release to resume normal
// play. Separate from the GravityButton so it never triggers a gravity flip.
export default function RushButton({ onPressStart, onPressEnd, active, sound }) {
  return (
    <button
      type="button"
      aria-label="Gem Rush"
      className={`pointer-events-auto absolute bottom-6 left-5 z-20 flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-full border backdrop-blur-md transition-transform duration-100 active:scale-90 sm:h-24 sm:w-24 ${
        active
          ? 'border-fuchsia-200/60 bg-fuchsia-500/25 text-fuchsia-50 shadow-[0_0_50px_-12px_rgba(255,62,165,0.95)]'
          : 'border-fuchsia-200/35 bg-fuchsia-400/10 text-fuchsia-100 shadow-[0_0_50px_-12px_rgba(255,62,165,0.7)]'
      }`}
      onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); sound?.sfx?.('click'); onPressStart(); }}
      onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); onPressEnd(); }}
      onPointerLeave={(e) => { e.preventDefault(); onPressEnd(); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Gem size={26} strokeWidth={2.2} />
      <span className="font-heading text-[9px] uppercase tracking-[0.22em] text-fuchsia-100/80">Rush</span>
    </button>
  );
}