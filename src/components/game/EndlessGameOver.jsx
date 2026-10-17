import React from 'react';
import { Gem, Flame, RotateCcw, Home } from 'lucide-react';
import { GameButton, Panel } from './ui';
import LeaderboardRunStatus from '@/components/game/leaderboard/LeaderboardRunStatus';
import RunSaveStatus from '@/components/game/procedural/RunSaveStatus';
import NewRecordBadge from '@/components/game/NewRecordBadge';

export default function EndlessGameOver({ score, best, distance, gems, maxStreak, isNewBest, leaderboardStatus, sound, onRestart, onExit, saveStatus, onRetrySave }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <Panel className="gs-pop my-auto w-full max-w-md shrink-0 text-center">
        <div className="font-heading text-[10px] uppercase tracking-[0.5em] text-rose-200/80">Game Over</div>
        <h2 className="mt-2 font-heading text-2xl uppercase tracking-[0.2em] text-white">Endless Run</h2>

        <div className="mt-6 flex flex-col items-center gap-1">
          <div className="font-heading text-[10px] uppercase tracking-[0.3em] text-white/45">Score</div>
          <div className="font-mono text-5xl leading-none text-white">{(score || 0).toLocaleString()}</div>
        </div>

        <div className="mt-4 flex h-8 items-center justify-center">
          {isNewBest ? (
            <NewRecordBadge />
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
          <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/5 px-3 py-2">
            <div className="font-heading text-[8px] uppercase tracking-[0.2em] text-cyan-200/60">Gems</div>
            <div className="font-mono text-sm text-cyan-100">{gems || 0}</div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-white/40">
          <Flame size={11} className="text-amber-300/70" />
          <span className="font-mono">Max Streak x{(maxStreak || 1).toFixed(1)}</span>
        </div>

        <LeaderboardRunStatus status={leaderboardStatus} />
        <RunSaveStatus state={saveStatus} onRetry={onRetrySave} />

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