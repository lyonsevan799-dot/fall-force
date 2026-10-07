import React from 'react';
import { LEVELS } from '@/game/levels';

export default function LevelIntro({ levelIndex }) {
  const level = LEVELS[levelIndex];
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <div className="gs-intro flex flex-col items-center gap-2 px-6 text-center">
        <div className="font-heading text-[11px] uppercase tracking-[0.6em] text-cyan-200/80">
          Level {String(levelIndex + 1).padStart(2, '0')}
        </div>
        <div className="font-heading text-2xl uppercase tracking-[0.24em] text-white sm:text-4xl">
          {level.name}
        </div>
        <div className="mt-1 h-[2px] w-24 bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
        {level.tip ? (
          <div className="mt-2 max-w-md font-body text-sm tracking-wide text-cyan-100/80 sm:text-base">
            {level.tip}
          </div>
        ) : null}
      </div>
    </div>
  );
}