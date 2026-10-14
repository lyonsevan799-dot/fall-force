import React from 'react';
import { Pause, Flame, Gauge } from 'lucide-react';
import { IconButton } from './ui';
import GemCounter from './GemCounter';

export default function EndlessHud({ ui, best, totalGems, onPause, sound }) {
  const speedPct = Math.round((ui.speed || 0.62) * 100);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center gap-2 p-3 sm:p-4">
      <div className="flex w-full items-start justify-between gap-2">
        <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur">
          <div className="font-heading text-[9px] uppercase tracking-[0.28em] text-cyan-200/80">Distance</div>
          <div className="font-mono text-base leading-none text-white">{(ui.distance || 0).toLocaleString()}<span className="ml-1 text-[9px] text-white/40">m</span></div>
        </div>

        <div className="rounded-2xl border border-amber-300/20 bg-black/40 px-5 py-2 text-center backdrop-blur">
          <div className="font-heading text-[9px] uppercase tracking-[0.22em] text-amber-200/80">Score</div>
          <div className="font-mono text-2xl leading-none text-white">{(ui.score || 0).toLocaleString()}</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-cyan-300/20 bg-black/40 px-3 py-2 backdrop-blur">
            <GemCounter count={ui.gems || 0} total={totalGems || 0} size="md" />
          </div>
          <div className="hidden rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-right backdrop-blur sm:block">
            <div className="font-heading text-[9px] uppercase tracking-[0.22em] text-white/45">Best</div>
            <div className="font-mono text-xs leading-none text-white/70">{(best || 0).toLocaleString()}</div>
          </div>
          <IconButton label="Pause" onClick={onPause} sound={sound}><Pause size={16} /></IconButton>
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-full border border-white/8 bg-black/30 px-4 py-1.5 backdrop-blur">
        <span className="font-heading text-[9px] uppercase tracking-[0.2em] text-cyan-200/70">{ui.sectionName || 'Training'}</span>
        {ui.streak > 1.05 ? (
          <>
            <span className="text-white/20">·</span>
            <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-amber-200">
              <Flame size={11} /> x{(ui.streak || 1).toFixed(1)}
            </span>
          </>
        ) : null}
        <span className="hidden text-white/20 sm:inline">·</span>
        <span className="hidden items-center gap-1 font-mono text-[11px] text-white/70 sm:flex">
          <Gauge size={11} className="text-cyan-300" /> {speedPct}%
        </span>
      </div>
    </div>
  );
}