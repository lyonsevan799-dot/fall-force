import React from 'react';
import { Lock, ChevronLeft } from 'lucide-react';
import { Stars } from './ui';
import { LEVELS } from '@/game/levels';

export default function LevelSelect({ save, onSelect, onBack, sound }) {
  return (
    <div className="relative z-10 mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 px-5 py-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => { sound.sfx('click'); onBack(); }}
          className="flex items-center gap-2 font-heading text-[10px] uppercase tracking-[0.28em] text-white/50 transition-colors hover:text-white"
        >
          <ChevronLeft size={14} /> Menu
        </button>
        <div className="font-heading text-xs uppercase tracking-[0.4em] text-white/70">Levels</div>
        <div className="w-16" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {LEVELS.map((lv, i) => {
          const rec = save.levels[i];
          const locked = i > (save.unlocked || 0);
          return (
            <button
              key={lv.name}
              type="button"
              disabled={locked}
              onClick={() => { sound.sfx('click'); onSelect(i); }}
              className={`group relative aspect-square overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 ${
                locked
                  ? 'cursor-not-allowed border-white/8 bg-white/[0.02]'
                  : 'border-white/12 bg-white/[0.04] hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:shadow-[0_0_40px_-12px_rgba(56,232,255,0.6)] active:scale-[0.98]'
              }`}
            >
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className={`font-heading text-2xl leading-none ${locked ? 'text-white/15' : 'text-white/90'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {locked ? <Lock size={14} className="text-white/25" /> : null}
                </div>
                <div>
                  <div className={`font-heading text-[9px] uppercase leading-tight tracking-[0.16em] ${locked ? 'text-white/20' : 'text-white/55'}`}>
                    {locked ? 'Locked' : lv.name}
                  </div>
                  <div className="mt-2">
                    <Stars value={locked ? 0 : (rec ? rec.stars : 0)} size={12} />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-white/30">
        Earn 3 stars by clearing a level without dying — 2 stars for up to two deaths.
      </p>
    </div>
  );
}