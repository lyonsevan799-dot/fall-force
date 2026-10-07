import React from 'react';
import { GameButton } from './ui';

export default function DeathOverlay({ deaths, levelIndex, onRetry, onExit, sound }) {
  return (
    <div
      className="absolute inset-0 z-30 flex cursor-pointer flex-col items-center justify-center gap-5 bg-black/45 backdrop-blur-[2px]"
      onPointerDown={onRetry}
    >
      <div className="gs-pop flex flex-col items-center gap-3">
        <div className="font-heading text-3xl uppercase tracking-[0.4em] text-white/95 sm:text-5xl">
          Retry
        </div>
        <div className="font-heading text-[10px] uppercase tracking-[0.3em] text-white/50">
          Deaths: {deaths}
        </div>
        <div className="font-heading text-[10px] uppercase tracking-[0.3em] text-cyan-200/80">
          Tap · Click · Space
        </div>
      </div>
      <div className="gs-pop flex gap-3" onPointerDown={(e) => e.stopPropagation()}>
        <GameButton variant="primary" sound={sound} onClick={onRetry}>Retry</GameButton>
        <GameButton variant="ghost" sound={sound} onClick={onExit}>Levels</GameButton>
      </div>
    </div>
  );
}