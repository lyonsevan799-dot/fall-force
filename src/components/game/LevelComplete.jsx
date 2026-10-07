import React from 'react';
import { GameButton, Panel, Stars } from './ui';
import { LEVELS } from '@/game/levels';

export default function LevelComplete({ levelIndex, stars, deaths, time, isLast, onNext, onRetry, onExit, sound }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <Panel className="gs-pop w-full max-w-md text-center">
        <div className="font-heading text-[10px] uppercase tracking-[0.5em] text-cyan-200/80">Level Complete</div>
        <h2 className="mt-2 font-heading text-2xl uppercase tracking-[0.2em] text-white">
          {LEVELS[levelIndex].name}
        </h2>
        <div className="mt-6 flex justify-center">
          <Stars value={stars} size={40} />
        </div>
        <div className="mt-5 flex items-center justify-center gap-6 font-mono text-xs text-white/60">
          <span>Time {time.toFixed(2)}s</span>
          <span>Deaths {deaths}</span>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {isLast ? (
            <GameButton variant="primary" className="col-span-2" sound={sound} onClick={onExit}>Finish</GameButton>
          ) : (
            <GameButton variant="primary" className="col-span-2" sound={sound} onClick={onNext}>Next Level</GameButton>
          )}
          <GameButton variant="ghost" sound={sound} onClick={onRetry}>Retry</GameButton>
          <GameButton variant="ghost" sound={sound} onClick={onExit}>Levels</GameButton>
        </div>
      </Panel>
    </div>
  );
}