import React from 'react';
import { Play, Grid3x3, Settings2 } from 'lucide-react';
import { GameButton } from './ui';
import { LEVELS } from '@/game/levels';
import { totalStars, completedCount } from '@/game/progress';

export default function MainMenu({ save, onPlay, onLevels, onSettings, sound }) {
  const stars = totalStars(save);
  const done = completedCount(save);
  const next = Math.min(save.unlocked || 0, LEVELS.length - 1);

  return (
    <div className="relative z-10 flex min-h-full flex-col items-center justify-center gap-10 px-6 py-14">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="font-heading text-[10px] uppercase tracking-[0.6em] text-cyan-200/60">Arcade Gravity Runner</div>
        <h1 className="gs-title font-heading text-4xl uppercase leading-none tracking-[0.14em] sm:text-6xl">
          Gravity
          <span className="block bg-gradient-to-r from-cyan-200 via-white to-fuchsia-300 bg-clip-text text-transparent">Switch</span>
        </h1>
        <div className="h-[2px] w-40 bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
        <p className="max-w-sm text-xs leading-relaxed text-white/45">
          Flip gravity to run the floor and the ceiling. Survive 15 levels of blades, lasers, crushers and portals.
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:w-80">
        <GameButton variant="primary" size="lg" sound={sound} onClick={() => onPlay(next)}>
          <Play size={16} /> {done > 0 ? `Play Level ${next + 1}` : 'Play'}
        </GameButton>
        <GameButton variant="accent" sound={sound} onClick={onLevels}>
          <Grid3x3 size={15} /> Levels
        </GameButton>
        <GameButton variant="ghost" sound={sound} onClick={onSettings}>
          <Settings2 size={15} /> Settings
        </GameButton>
      </div>

      <div className="flex items-center gap-8 font-heading text-[10px] uppercase tracking-[0.24em] text-white/40">
        <span>{done} / {LEVELS.length} cleared</span>
        <span className="text-amber-200/70">{stars} / {LEVELS.length * 3} stars</span>
      </div>

      <div className="font-heading text-[9px] uppercase tracking-[0.3em] text-white/25">
        Space · Click · Tap to switch gravity
      </div>
    </div>
  );
}