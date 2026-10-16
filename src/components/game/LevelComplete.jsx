import React from 'react';
import { Gem, Trophy, ChevronRight } from 'lucide-react';
import { GameButton, Panel, Stars } from './ui';
import { LEVELS } from '@/game/levels';
import { groupForLevel } from '@/game/groups';

export default function LevelComplete({ levelIndex, stars, deaths, time, gems, totalGems, isLast, groupJustCompleted, nextGroupName, isFinalGroup, onNext, onRetry, onExit, onEnterNextGroup, sound, challengeMode = false, exitLabel = 'Levels' }) {
  const isLastInGroup = levelIndex === groupForLevel(levelIndex).end;
  const showGroupComplete = isLastInGroup && groupJustCompleted && !challengeMode;
  const showFinal = showGroupComplete && isFinalGroup;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <Panel className="gs-pop w-full max-w-md text-center">
        {showFinal ? (
          <>
            <div className="flex justify-center"><Trophy size={40} className="text-amber-300 drop-shadow-[0_0_18px_rgba(252,211,77,0.6)]" /></div>
            <div className="mt-3 font-heading text-[10px] uppercase tracking-[0.5em] text-amber-200/80">Fall Force Complete</div>
            <h2 className="mt-2 font-heading text-2xl uppercase tracking-[0.2em] text-white">You Conquered It All</h2>
          </>
        ) : showGroupComplete ? (
          <>
            <div className="flex justify-center"><Trophy size={36} className="text-cyan-200 drop-shadow-[0_0_16px_rgba(56,232,255,0.6)]" /></div>
            <div className="mt-3 font-heading text-[10px] uppercase tracking-[0.5em] text-cyan-200/80">Group Complete</div>
            <h2 className="mt-2 font-heading text-2xl uppercase tracking-[0.2em] text-white">{groupForLevel(levelIndex).name} Cleared</h2>
          </>
        ) : (
          <>
            <div className="font-heading text-[10px] uppercase tracking-[0.5em] text-cyan-200/80">Level Complete</div>
            <h2 className="mt-2 font-heading text-2xl uppercase tracking-[0.2em] text-white">
              {LEVELS[levelIndex].name}
            </h2>
          </>
        )}

        <div className="mt-6 flex justify-center">
          <Stars value={stars} size={40} />
        </div>
        <div className="mt-5 flex flex-col items-center gap-2 font-mono text-xs text-white/60">
          <div className="flex items-center justify-center gap-6">
            <span>Time {time.toFixed(2)}s</span>
            <span>Deaths {deaths}</span>
          </div>
          <div className="text-white/50">Gems collected this level: <span className="text-cyan-300">{gems || 0}</span></div>
          <div className="flex items-center gap-1.5 text-cyan-300">
            <Gem size={12} />
            <span>{(totalGems || 0).toLocaleString()}</span>
            <span className="text-[10px] text-cyan-200/50">total</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {challengeMode ? (
            <>
              <GameButton variant="ghost" sound={sound} onClick={onRetry}>Retry</GameButton>
              <GameButton variant="primary" sound={sound} onClick={onExit}>{exitLabel}</GameButton>
            </>
          ) : showFinal ? (
            <GameButton variant="primary" className="col-span-2" sound={sound} onClick={onExit}>Finish</GameButton>
          ) : showGroupComplete ? (
            <GameButton variant="primary" className="col-span-2" sound={sound} onClick={onEnterNextGroup}>
              Enter {nextGroupName} <ChevronRight size={14} className="ml-1" />
            </GameButton>
          ) : isLast ? (
            <GameButton variant="primary" className="col-span-2" sound={sound} onClick={onExit}>Finish</GameButton>
          ) : (
            <GameButton variant="primary" className="col-span-2" sound={sound} onClick={onNext}>Next Level</GameButton>
          )}
          {!challengeMode ? (
            <>
              <GameButton variant="ghost" sound={sound} onClick={onRetry}>Retry</GameButton>
              <GameButton variant="ghost" sound={sound} onClick={onExit}>Levels</GameButton>
            </>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}