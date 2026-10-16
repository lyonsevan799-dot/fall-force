import React from 'react';
import { Pause } from 'lucide-react';
import { IconButton } from './ui';
import GemCounter from '@/components/game/GemCounter';

export default function RaceHud({ ui, totalGems, onPause, sound }) {
  const fmt = (t) => (t || 0).toFixed(2);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center gap-2 p-3 sm:p-4">
      {/* Dual progress indicators: P1 ─────●────── / P2 ────●────────── */}
      <div className="w-full max-w-2xl space-y-2">
        <div className="flex items-center gap-2.5">
          <span className="w-5 shrink-0 font-heading text-[10px] uppercase tracking-[0.15em] text-cyan-300">P1</span>
          <div className="relative h-1.5 flex-1 rounded-full bg-white/10">
            <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(56,232,255,0.9)] transition-[left] duration-100"
                 style={{ left: `${Math.max(2, Math.min(98, ui.p1 * 100))}%` }} />
          </div>
          <span className="flex w-24 shrink-0 items-center justify-end gap-1 font-mono text-xs text-cyan-200">
            {ui.p1Finished ? 'Finished' : `${Math.floor(ui.p1 * 100)}%`}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-5 shrink-0 font-heading text-[10px] uppercase tracking-[0.15em] text-pink-300">P2</span>
          <div className="relative h-1.5 flex-1 rounded-full bg-white/10">
            <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-300 shadow-[0_0_10px_rgba(255,62,165,0.9)] transition-[left] duration-100"
                 style={{ left: `${Math.max(2, Math.min(98, ui.p2 * 100))}%` }} />
          </div>
          <span className="flex w-24 shrink-0 items-center justify-end gap-1 font-mono text-xs text-pink-200">
            {ui.p2Finished ? 'Finished' : `${Math.floor(ui.p2 * 100)}%`}
          </span>
        </div>
      </div>

      {/* Timer + pause */}
      <div className="flex items-center gap-2.5">
        <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-1.5 text-center backdrop-blur">
          <span className="font-mono text-base leading-none text-white">{fmt(ui.raceTime)}<span className="ml-0.5 text-[10px] text-white/40">s</span></span>
        </div>
        <GemCounter total={totalGems} size="md" />
        <IconButton label="Pause" onClick={onPause} sound={sound}><Pause size={16} /></IconButton>
      </div>
    </div>
  );
}