import React from 'react';
import { Pause } from 'lucide-react';
import { LEVELS } from '@/game/levels';
import { IconButton } from './ui';
import RunGemBalance from '@/components/game/RunGemBalance';


export default function Hud({ levelIndex, ui, totalGems, onPause, sound }) {
  const level = LEVELS[levelIndex];
  const cps = level.checkpoints;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 p-3 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur">
          <div className="font-heading text-[10px] uppercase tracking-[0.28em] text-cyan-200/80">
            Level {String(levelIndex + 1).padStart(2, '0')} / {LEVELS.length}
          </div>
          <div className="font-heading text-sm uppercase tracking-[0.16em] text-white">{level.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-right backdrop-blur sm:block">
            <div className="font-heading text-[10px] uppercase tracking-[0.22em] text-white/45">
              {ui.deaths} death{ui.deaths === 1 ? '' : 's'}
            </div>
            <div className="font-mono text-xs text-white/70">{ui.time.toFixed(1)}s</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-2xl border border-cyan-300/20 bg-black/40 px-3 py-2 backdrop-blur">
              <RunGemBalance total={totalGems} gems={ui.gems} />
            </div>
            <IconButton label="Pause" onClick={onPause} sound={sound}><Pause size={16} /></IconButton>
          </div>
        </div>
      </div>



      <div className="relative mx-auto h-[6px] w-full max-w-3xl overflow-hidden rounded-full border border-white/10 bg-black/45 backdrop-blur">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400 transition-[width] duration-100"
          style={{ width: `${Math.max(0, Math.min(100, ui.progress * 100))}%` }}
        />
        {cps.map((cp, i) => (
          <span
            key={i}
            className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border ${i < ui.checkpoint ? 'border-cyan-200 bg-cyan-300' : 'border-white/40 bg-black/60'}`}
            style={{ left: `calc(${(cp.x / level.length) * 100}% - 6px)` }}
          />
        ))}
      </div>

      <div className="flex justify-center sm:hidden">
        <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-heading text-[10px] uppercase tracking-[0.22em] text-white/60 backdrop-blur">
          {ui.deaths} death{ui.deaths === 1 ? '' : 's'} · {ui.time.toFixed(1)}s
        </div>
      </div>
    </div>
  );
}