import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { RACE_LEVELS } from '@/game/raceLevels';

export default function RaceLevelSelect({ onSelect, onBack, sound }) {
  return (
    <div className="relative z-10 mx-auto flex min-h-full w-full max-w-4xl flex-col gap-6 px-5 py-10">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => { sound.sfx('click'); onBack(); }}
          className="flex items-center gap-2 font-heading text-[10px] uppercase tracking-[0.28em] text-white/50 transition-colors hover:text-white">
          <ChevronLeft size={14} /> Menu
        </button>
        <div className="font-heading text-xs uppercase tracking-[0.4em] text-white/70">Race Levels</div>
        <div className="w-16" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {RACE_LEVELS.map((lv, i) => (
          <button key={lv.name} type="button" onClick={() => { sound.sfx('click'); onSelect(i); }}
            className="group relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-pink-300/40 hover:bg-pink-400/10 hover:shadow-[0_0_40px_-12px_rgba(255,62,165,0.6)] active:scale-[0.98]">
            <div className="flex items-center justify-between">
              <span className="font-heading text-2xl text-white/90">{String(i + 1).padStart(2, '0')}</span>
              <span className="font-heading text-[9px] uppercase tracking-[0.2em] text-white/40">{lv.theme}</span>
            </div>
            <div className="mt-2 font-heading text-sm uppercase tracking-[0.14em] text-white/80">{lv.name}</div>
            <div className="mt-1 text-[11px] text-white/40">2 players · local</div>
          </button>
        ))}
      </div>

      <p className="text-center text-[11px] text-white/30">Two players, one device. First to the finish wins.</p>
    </div>
  );
}