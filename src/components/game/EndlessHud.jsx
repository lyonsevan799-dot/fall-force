import React from 'react';
import { Pause } from 'lucide-react';
import { IconButton } from './ui';

export default function EndlessHud({ ui, best, onPause, sound }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-5">
      <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 backdrop-blur">
        <div className="font-heading text-[10px] uppercase tracking-[0.28em] text-cyan-200/80">Distance</div>
        <div className="font-mono text-lg leading-none text-white">{ui.distance}<span className="ml-1 text-[10px] text-white/40">m</span></div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-center backdrop-blur">
        <div className="font-heading text-[10px] uppercase tracking-[0.22em] text-amber-200/80">Score</div>
        <div className="font-mono text-lg leading-none text-white">{ui.score}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-right backdrop-blur sm:block">
          <div className="font-heading text-[10px] uppercase tracking-[0.22em] text-white/45">Best</div>
          <div className="font-mono text-xs leading-none text-white/70">{best}</div>
        </div>
        <IconButton label="Pause" onClick={onPause} sound={sound}><Pause size={16} /></IconButton>
      </div>
    </div>
  );
}