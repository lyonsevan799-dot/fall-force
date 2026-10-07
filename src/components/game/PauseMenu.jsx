import React from 'react';
import { GameButton, Panel } from './ui';
import { LEVELS } from '@/game/levels';

export default function PauseMenu({ levelIndex, onResume, onRestart, onSettings, onExit, sound }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Panel className="gs-pop w-full max-w-sm text-center">
        <div className="font-heading text-[10px] uppercase tracking-[0.5em] text-cyan-200/80">Paused</div>
        <h2 className="mt-2 font-heading text-xl uppercase tracking-[0.2em] text-white">
          {LEVELS[levelIndex].name}
        </h2>
        <div className="mt-6 flex flex-col gap-3">
          <GameButton variant="primary" size="lg" sound={sound} onClick={onResume}>Resume</GameButton>
          <GameButton variant="accent" sound={sound} onClick={onRestart}>Restart</GameButton>
          <GameButton variant="ghost" sound={sound} onClick={onSettings}>Settings</GameButton>
          <GameButton variant="ghost" sound={sound} onClick={onExit}>Exit to Levels</GameButton>
        </div>
      </Panel>
    </div>
  );
}