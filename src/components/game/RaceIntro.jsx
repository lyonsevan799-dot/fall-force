import React from 'react';
import { GameButton, Panel } from './ui';
import { RACE_WIN_REWARD } from '@/game/raceRewards';

export default function RaceIntro({ sound, onStart, isTouch }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-sm">
      <Panel className="gs-pop my-auto w-full max-w-lg shrink-0 text-center">
        <div className="font-heading text-[10px] uppercase tracking-[0.5em] text-cyan-200/80">Two Players</div>
        <h2 className="mt-2 font-heading text-2xl uppercase tracking-[0.2em] text-white">Race Mode</h2>
        <p className="mt-3 text-xs leading-relaxed text-white/50">First to the finish line wins. Flip gravity to dodge the obstacles.</p>

        <div className="mt-6 grid grid-cols-2 gap-4 text-left">
          <div className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(56,232,255,0.8)]" />
              <span className="font-heading text-xs uppercase tracking-[0.2em] text-cyan-100">Player 1</span>
            </div>
            <div className="mt-3 space-y-1.5">
              {isTouch ? (
                <div className="flex items-center gap-2">
                  <kbd className="rounded-md border border-cyan-300/30 bg-cyan-400/15 px-3 py-1 font-mono text-xs text-cyan-100">Tap left half</kbd>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <kbd className="rounded-md border border-cyan-300/30 bg-cyan-400/15 px-3 py-1 font-mono text-xs text-cyan-100">W</kbd>
                    <span className="text-[11px] text-white/40">or</span>
                    <kbd className="rounded-md border border-cyan-300/30 bg-cyan-400/15 px-3 py-1 font-mono text-xs text-cyan-100">Space</kbd>
                  </div>
                  <div className="text-[10px] text-white/30">Switch gravity</div>
                </>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-pink-300/30 bg-pink-400/10 p-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-pink-300 shadow-[0_0_10px_rgba(255,62,165,0.8)]" />
              <span className="font-heading text-xs uppercase tracking-[0.2em] text-pink-100">Player 2</span>
            </div>
            <div className="mt-3 space-y-1.5">
              {isTouch ? (
                <div className="flex items-center gap-2">
                  <kbd className="rounded-md border border-pink-300/30 bg-pink-400/15 px-3 py-1 font-mono text-xs text-pink-100">Tap right half</kbd>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <kbd className="rounded-md border border-pink-300/30 bg-pink-400/15 px-3 py-1 font-mono text-xs text-pink-100">↑</kbd>
                    <span className="text-[11px] text-white/40">or</span>
                    <kbd className="rounded-md border border-pink-300/30 bg-pink-400/15 px-3 py-1 font-mono text-xs text-pink-100">Enter</kbd>
                  </div>
                  <div className="text-[10px] text-white/30">Switch gravity</div>
                </>
              )}
            </div>
          </div>
        </div>

        {!isTouch ? (
          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-white/30">
            <span><kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono">Esc</kbd> Pause</span>
            <span><kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono">R</kbd> Restart</span>
          </div>
        ) : null}

        <p className="mt-3 text-xs leading-relaxed text-white/50">Winner earns {RACE_WIN_REWARD} gems, credited once to the shared balance after the race ends. The loser and tied racers earn 0 gems. No pickups or Gem Rush.</p>
        <div className="mt-6">
          <GameButton variant="primary" size="lg" sound={sound} onClick={onStart}>Start Race</GameButton>
        </div>
      </Panel>
    </div>
  );
}