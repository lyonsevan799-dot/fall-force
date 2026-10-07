import React from 'react';
import { Pause } from 'lucide-react';
import { IconButton } from './ui';

export default function RaceHud({ ui, onPause, sound }) {
  const fmt = (t) => (t || 0).toFixed(2);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(56,232,255,0.8)]" />
        <div className="relative h-2 w-24 overflow-hidden rounded-full border border-white/10 bg-black/50 sm:w-40">
          <div className="h-full rounded-full bg-cyan-300 transition-[width] duration-100" style={{ width: `${ui.p1 * 100}%` }} />
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-center backdrop-blur">
        <div className="font-mono text-lg leading-none text-white">{fmt(ui.raceTime)}<span className="ml-1 text-[10px] text-white/40">s</span></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative h-2 w-24 overflow-hidden rounded-full border border-white/10 bg-black/50 sm:w-40">
          <div className="h-full rounded-full bg-pink-300 transition-[width] duration-100" style={{ width: `${ui.p2 * 100}%` }} />
        </div>
        <span className="h-3 w-3 rounded-full bg-pink-300 shadow-[0_0_10px_rgba(255,62,165,0.8)]" />
        <IconButton label="Pause" onClick={onPause} sound={sound}><Pause size={16} /></IconButton>
      </div>
    </div>
  );
}