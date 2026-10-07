import React from 'react';
import { GameButton, Panel } from './ui';

export default function EndlessGameOver({ score, best, isNewBest, sound, onRestart, onExit }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Panel className="gs-pop w-full max-w-md text-center">
        <div className="font-heading text-[10px] uppercase tracking-[0.5em] text-rose-200/80">Game Over</div>
        <h2 className="mt-2 font-heading text-2xl uppercase tracking-[0.2em] text-white">Endless Run</h2>
        <div className="mt-6 flex flex-col items-center gap-1">
          <div className="font-heading text-[10px] uppercase tracking-[0.3em] text-white/45">Score</div>
          <div className="font-mono text-5xl leading-none text-white">{score}</div>
        </div>
        <div className="mt-4 flex h-6 items-center justify-center">
          {isNewBest ? (
            <span className="rounded-full border border-amber-300/40 bg-amber-400/15 px-4 py-1 font-heading text-[10px] uppercase tracking-[0.24em] text-amber-200">New Best!</span>
          ) : null}
        </div>
        <div className="mt-2 font-heading text-[10px] uppercase tracking-[0.24em] text-white/45">Best {best}</div>
        <div className="mt-6 grid grid-cols-1 gap-3">
          <GameButton variant="primary" size="lg" sound={sound} onClick={onRestart}>Restart</GameButton>
          <GameButton variant="ghost" sound={sound} onClick={onExit}>Main Menu</GameButton>
        </div>
      </Panel>
    </div>
  );
}