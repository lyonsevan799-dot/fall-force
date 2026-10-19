import React from 'react';
import { Lock, ChevronLeft, Play, Target, Gem } from 'lucide-react';
import { Stars } from './ui';
import { LEVELS } from '@/game/levels';
import { GROUPS, isLevelPlayable, groupUnlocked } from '@/game/groups';

export default function LevelSelect({ save, groupIndex, onSelect, onBack, sound, backLabel = 'Groups', banner = null }) {
  const group = GROUPS[groupIndex] || GROUPS[0];
  const levels = LEVELS.slice(group.start, group.end + 1);
  const current = save.unlocked || 0;

  return (
    <div className="relative z-10 mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 px-5 py-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => { sound.sfx('click'); onBack(); }}
          className="flex items-center gap-2 font-heading text-[10px] uppercase tracking-[0.28em] text-white/50 transition-colors hover:text-white"
        >
          <ChevronLeft size={14} /> {backLabel}
        </button>
        <div className="text-center">
          <div className="font-heading text-xs uppercase tracking-[0.4em] text-white/80">{group.name}</div>
          <div className="font-heading text-[9px] uppercase tracking-[0.24em] text-white/40">{group.tagline}</div>
        </div>
        <div className="w-16" />
      </div>

      {banner ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-fuchsia-300/30 bg-fuchsia-500/10 px-5 py-3">
          <Target size={16} className="text-fuchsia-200" />
          <span className="font-heading text-[11px] uppercase tracking-[0.2em] text-white/90">{banner.name}</span>
          <span className="text-white/30">·</span>
          <span className="flex items-center gap-1 font-heading text-[11px] uppercase tracking-[0.16em] text-fuchsia-200">
            <Gem size={12} /> +{banner.reward}
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {levels.map((lv, k) => {
          const i = group.start + k;
          const rec = save.levels[i];
          const playable = banner?.type === 'middle' ? groupUnlocked(save, groupIndex) : isLevelPlayable(save, i);
          const isCurrent = i === current && playable && !(rec && rec.completed);
          return (
            <button
              key={lv.name}
              type="button"
              disabled={!playable}
              onClick={() => { sound.sfx('click'); onSelect(i); }}
              className={`group relative aspect-square overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 ${
                !playable
                  ? 'cursor-not-allowed border-white/8 bg-white/[0.02]'
                  : isCurrent
                    ? 'border-cyan-300/60 bg-cyan-400/10 shadow-[0_0_36px_-10px_rgba(56,232,255,0.7)] hover:-translate-y-1'
                    : 'border-white/12 bg-white/[0.04] hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:shadow-[0_0_40px_-12px_rgba(56,232,255,0.6)] active:scale-[0.98]'
              }`}
            >
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-start justify-between">
                  <span className={`font-heading text-2xl leading-none ${playable ? 'text-white/90' : 'text-white/15'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {!playable ? <Lock size={14} className="text-white/25" /> : isCurrent ? <Play size={13} className="text-cyan-200" /> : null}
                </div>
                <div>
                  <div className={`font-heading text-[9px] uppercase leading-tight tracking-[0.16em] ${playable ? 'text-white/55' : 'text-white/20'}`}>
                    {!playable ? 'Locked' : lv.name}
                  </div>
                  <div className="mt-2">
                    {rec?.skipped ? <span className="font-heading text-[9px] uppercase text-race-two">Skipped · Replay to earn stars</span> : <Stars value={playable ? (rec ? rec.stars : 0) : 0} size={12} />}
                  </div>
                </div>
              </div>
              {isCurrent ? (
                <span className="absolute right-2 top-2 rounded-full border border-cyan-300/50 bg-cyan-400/15 px-1.5 py-0.5 font-heading text-[7px] uppercase tracking-[0.18em] text-cyan-100">
                  Next
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-white/30">
        {group.desc}
      </p>
    </div>
  );
}