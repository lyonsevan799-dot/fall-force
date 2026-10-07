import React from 'react';
import { GameButton, Panel } from './ui';

export default function RaceResult({ ui, sound, onRestart, onExit }) {
  const winner = ui.winner === 0 ? 'Player 1' : 'Player 2';
  const color = ui.winner === 0 ? 'text-cyan-200' : 'text-pink-200';
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Panel className="gs-pop w-full max-w-md text-center">
        <div className="font-heading text-[10px] uppercase tracking-[0.5em] text-white/50">Winner</div>
        <h2 className={`mt-2 font-heading text-3xl uppercase tracking-[0.2em] ${color}`}>{winner}</h2>
        <div className="mt-4 font-mono text-sm text-white/60">{(ui.raceTime || 0).toFixed(2)}s</div>
        <div className="mt-6 grid grid-cols-1 gap-3">
          <GameButton variant="primary" size="lg" sound={sound} onClick={onRestart}>Race Again</GameButton>
          <GameButton variant="ghost" sound={sound} onClick={onExit}>Menu</GameButton>
        </div>
      </Panel>
    </div>
  );
}