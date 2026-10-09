import React from 'react';
import { Coins, Flame, RotateCcw, Home } from 'lucide-react';
import { GameButton, Panel } from './ui';

export default function EndlessGameOver({ score, best, distance, gems, coins, maxStreak, isNewBest, sound, onRestart, onExit }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Panel className="gs-pop w-full max-w-md text-center">
        <div className="font-heading text-[10px] uppercase tracking-[0.5em] text-rose-200/80">Game Over</div>
        <h2 className="mt-2 font-heading text-2xl uppercase tracking-[0.2em] text-white">Endless Run</h2>

        <div className="mt-6 flex flex-col items-center gap-1">
          <div className="font-heading text-[10px] uppercase tracking-[0.3em] text-white/45">Score</div>
          <div className="font-mono text-5xl leading-none text-white">{(score || 0).toLocaleString()}</div>
        </div>

        <div className="mt-4 flex h-8 items-center justify-center">
          {isNewBest ? (
            <span className="gs-pop rounded-full border border-amber-300/50 bg-amber-400/15 px-5 py-1.5 font-heading text-[11px] uppercase tracking-[0.28em] text-amber-200 shadow-[0_0_40px_-10px_rgba(252,211,77,0.6)]">
              ★ New Best! ★
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <div className="font-heading text-[8px] uppercase tracking-[0.2em] text-white/40">Best</div>
            <div className="font-mono text-sm text-white/80">{(best || 0).toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <div className="font-heading text-[8px] uppercase tracking-[0.2em] text-white/40">Distance</div>
            <div className="font-mono text-sm text-white/80">{(distance || 0).toLocaleString()}m</div>
          </div>
          <div className="rounded-xl border border-amber-300/15 bg-amber-400/5 px-3 py-2">
            <div className="font-heading text-[8px] uppercase tracking-[0.2em] text-amber-200/60">Coins</div>
            <div className="font-mono text-sm text-amber-100">{coins || 0}</div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-white/40">
          <Flame size={11} className="text-amber-300/70" />
          <span className="font-mono">Max Streak x{(maxStreak || 1).toFixed(1)}</span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <GameButton variant="primary" size="lg" sound={sound} onClick={onRestart}>
            <RotateCcw size={16} /> Retry
          </GameButton>
          <GameButton variant="ghost" sound={sound} onClick={onExit}>
            <Home size={14} /> Main Menu
          </GameButton>
        </div>

        <div className="mt-4 font-heading text-[9px] uppercase tracking-[0.24em] text-white/25">
          Press Space or R to retry
        </div>
      </Panel>
    </div>
  );
}