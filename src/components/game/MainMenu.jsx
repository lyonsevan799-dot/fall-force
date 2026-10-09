import React from 'react';
import { Trophy, Infinity as InfinityIcon, Swords, Settings2 } from 'lucide-react';
import { LEVELS } from '@/game/levels';
import { totalStars, completedCount } from '@/game/progress';

const MODES = [
  { key: 'career', label: 'Career', desc: 'Master the levels and conquer Fall Force.', icon: Trophy, accent: 'cyan' },
  { key: 'endless', label: 'Endless', desc: 'How long can you survive?', icon: InfinityIcon, accent: 'amber' },
  { key: 'race', label: 'Race', desc: 'Race your opponent to the finish!', icon: Swords, accent: 'pink' },
];

const ACCENT = {
  cyan: 'border-cyan-300/40 bg-cyan-400/10 text-cyan-200',
  amber: 'border-amber-300/40 bg-amber-400/10 text-amber-200',
  pink: 'border-pink-300/40 bg-pink-400/10 text-pink-200',
};

export default function MainMenu({ save, sound, onCareer, onEndless, onRace, onSettings }) {
  const stars = totalStars(save);
  const done = completedCount(save);
  const best = save.endlessBest || 0;

  const go = (key) => {
    sound.sfx('click');
    if (key === 'career') onCareer();
    else if (key === 'endless') onEndless();
    else onRace();
  };

  return (
    <div className="relative z-10 flex min-h-full flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="font-heading text-[10px] uppercase tracking-[0.6em] text-cyan-200/60">Arcade Gravity Runner</div>
        <h1 className="gs-title font-heading text-4xl uppercase leading-none tracking-[0.14em] sm:text-6xl">
          Fall
          <span className="block bg-gradient-to-r from-cyan-200 via-white to-fuchsia-300 bg-clip-text text-transparent">Force</span>
        </h1>
        <div className="h-[2px] w-40 bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
      </div>

      <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
        {MODES.map((m) => {
          const Icon = m.icon;
          return (
            <button key={m.key} type="button" onClick={() => go(m.key)}
              className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl border border-white/12 bg-white/[0.04] px-5 py-7 text-center transition-all duration-200 hover:-translate-y-1.5 hover:border-white/30 hover:bg-white/[0.08] hover:shadow-[0_0_50px_-15px_rgba(56,232,255,0.5)] active:scale-[0.97]">
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${ACCENT[m.accent]} transition-transform duration-200 group-hover:scale-110`}>
                <Icon size={26} strokeWidth={2} />
              </span>
              <span className="font-heading text-base uppercase tracking-[0.22em] text-white">{m.label}</span>
              <span className="text-[11px] leading-relaxed text-white/45">{m.desc}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 font-heading text-[10px] uppercase tracking-[0.24em] text-white/40">
        <span>{done} / {LEVELS.length} cleared</span>
        <span className="text-amber-200/70">{stars} / {LEVELS.length * 3} stars</span>
        <span className="text-cyan-200/70">Best {best}</span>
        <span className="text-amber-200/70">{save.totalCoins || 0} coins</span>
        <span className="text-pink-200/70">{save.raceWins || 0} wins</span>
      </div>

      <button type="button" onClick={() => { sound.sfx('click'); onSettings(); }}
        className="flex items-center gap-2 font-heading text-[10px] uppercase tracking-[0.24em] text-white/45 transition-colors hover:text-white">
        <Settings2 size={14} /> Settings
      </button>

      <div className="font-heading text-[9px] uppercase tracking-[0.3em] text-white/25">
        Flip gravity · dodge · survive
      </div>
    </div>
  );
}