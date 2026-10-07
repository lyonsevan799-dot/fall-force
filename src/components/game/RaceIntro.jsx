import React from 'react';
import { GameButton, Panel } from './ui';

export default function RaceIntro({ sound, onStart, isTouch }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <Panel className="gs-pop w-full max-w-lg text-center">
        <div className="font-heading text-[10px] uppercase tracking-[0.5em] text-cyan-200/80">Two Players</div>
        <h2 className="mt-2 font-heading text-2xl uppercase tracking-[0.2em] text-white">Race Mode</h2>
        <p className="mt-3 text-xs leading-relaxed text-white/50">First to the finish line wins. Flip gravity to dodge the obstacles.</p>

        <div className="mt-6 grid grid-cols-2 gap-4 text-left">
          <div className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-cyan-300" />
              <span className="font-heading text-xs uppercase tracking-[0.2em] text-cyan-100">Player 1</span>
            </div>
            <div className="mt-3 font-mono text-sm text-white/80">{isTouch ? 'Left button' : 'W · Space'}</div>
          </div>
          <div className="rounded-2xl border border-pink-300/30 bg-pink-400/10 p-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-pink-300" />
              <span className="font-heading text-xs uppercase tracking-[0.2em] text-pink-100">Player 2</span>
            </div>
            <div className="mt-3 font-mono text-sm text-white/80">{isTouch ? 'Right button' : '↑ · Enter'}</div>
          </div>
        </div>

        <div className="mt-6">
          <GameButton variant="primary" size="lg" sound={sound} onClick={onStart}>Start Race</GameButton>
        </div>
      </Panel>
    </div>
  );
}