import React from 'react';
import { Lock, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { GameButton } from './ui';
import { GROUPS, groupUnlocked, groupProgress } from '@/game/groups';

const ACCENT = {
  cyan: {
    ring: 'border-cyan-300/40',
    glow: 'hover:shadow-[0_0_50px_-15px_rgba(56,232,255,0.55)]',
    bar: 'from-cyan-400/80 to-cyan-200/40',
    text: 'text-cyan-200',
    chip: 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100',
    dot: 'bg-cyan-300',
  },
  amber: {
    ring: 'border-amber-300/40',
    glow: 'hover:shadow-[0_0_50px_-15px_rgba(252,211,77,0.55)]',
    bar: 'from-amber-400/80 to-amber-200/40',
    text: 'text-amber-200',
    chip: 'border-amber-300/40 bg-amber-400/10 text-amber-100',
    dot: 'bg-amber-300',
  },
  pink: {
    ring: 'border-pink-300/40',
    glow: 'hover:shadow-[0_0_50px_-15px_rgba(255,62,165,0.55)]',
    bar: 'from-fuchsia-400/80 to-pink-200/40',
    text: 'text-pink-200',
    chip: 'border-pink-300/40 bg-pink-400/10 text-pink-100',
    dot: 'bg-pink-300',
  },
};

function DifficultyDots({ level, accent }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i < level ? accent.dot : 'bg-white/15'}`}
        />
      ))}
    </div>
  );
}

export default function CareerGroups({ save, sound, onEnter, onBack }) {
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
        <div className="font-heading text-xs uppercase tracking-[0.4em] text-white/70">Career</div>
        <div className="w-16" />
      </div>

      <div className="flex flex-col gap-4">
        {GROUPS.map((g, gi) => {
          const a = ACCENT[g.accent];
          const unlocked = groupUnlocked(save, gi);
          const { done, total, stars, starTotal } = groupProgress(save, g);
          const pct = total ? Math.round((done / total) * 100) : 0;
          const complete = done === total;
          return (
            <div
              key={g.id}
              className={`relative overflow-hidden rounded-3xl border ${unlocked ? `${a.ring} bg-white/[0.04] ${a.glow}` : 'border-white/10 bg-white/[0.02]'} p-5 transition-all duration-200 sm:p-6`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className={`font-heading text-2xl uppercase tracking-[0.18em] ${unlocked ? 'text-white' : 'text-white/40'}`}>
                      {g.name}
                    </h2>
                    <span className={`rounded-full border px-2.5 py-0.5 font-heading text-[9px] uppercase tracking-[0.22em] ${unlocked ? a.chip : 'border-white/15 bg-white/5 text-white/40'}`}>
                      {g.tagline}
                    </span>
                    <DifficultyDots level={gi + 1} accent={a} />
                    {complete ? (
                      <span className={`flex items-center gap-1 font-heading text-[9px] uppercase tracking-[0.2em] ${a.text}`}>
                        <Check size={12} /> Cleared
                      </span>
                    ) : null}
                  </div>
                  <p className={`mt-2 max-w-xl text-[12px] leading-relaxed ${unlocked ? 'text-white/55' : 'text-white/35'}`}>
                    {g.desc}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${a.bar} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className={`shrink-0 font-heading text-[10px] uppercase tracking-[0.18em] ${unlocked ? 'text-white/70' : 'text-white/40'}`}>
                      {done}/{total} <span className="text-white/30">completed</span>
                    </div>
                  </div>
                  <div className={`mt-1.5 font-mono text-[10px] ${unlocked ? 'text-white/35' : 'text-white/25'}`}>
                    {stars}/{starTotal} stars
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  {unlocked ? (
                    <GameButton
                      variant={complete ? 'ghost' : 'primary'}
                      className="sm:w-40"
                      sound={sound}
                      onClick={() => onEnter(gi)}
                    >
                      Enter <ChevronRight size={14} className="ml-1" />
                    </GameButton>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3 sm:w-64">
                      <Lock size={14} className="shrink-0 text-white/40" />
                      <span className="font-heading text-[10px] uppercase leading-tight tracking-[0.16em] text-white/45">
                        {g.lockHint}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-white/30">
        Complete every level in a group to unlock the next. Gems stay yours across every mode.
      </p>
    </div>
  );
}