import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Gem, ChevronRight } from 'lucide-react';
import { GameButton, Panel } from './ui';
import GemCounter from '@/components/game/GemCounter';

// Celebration overlay shown the first time a no-death challenge is completed.
// Displays the reward amount prominently and lets the player collect it or
// replay the level (no second reward).
export default function ChallengeComplete({ reward, challengeName, sound, onContinue, onPlayAgain, totalGems }) {
  useEffect(() => {
    const colors = ['#38e8ff', '#ff3ea5', '#ffffff', '#fbbf24'];
    const fire = () =>
      confetti({ particleCount: 70, spread: 78, startVelocity: 45, origin: { y: 0.35 }, colors, disableForReducedMotion: true });
    fire();
    const t = setTimeout(fire, 260);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-md">
      <Panel className="gs-pop my-auto w-full max-w-md shrink-0 text-center">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-fuchsia-400/25 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-fuchsia-300/50 bg-fuchsia-400/15">
            <Gem size={36} className="text-fuchsia-200" />
          </div>
        </div>

        <div className="mt-5 font-heading text-[10px] uppercase tracking-[0.5em] text-fuchsia-200/80">Challenge Complete</div>
        <h2 className="mt-2 font-heading text-2xl uppercase tracking-[0.18em] text-white">{challengeName}</h2>

        <div className="mt-6 gs-pop">
          <div className="flex items-center justify-center gap-2">
            <Gem size={28} className="text-amber-300 drop-shadow-[0_0_14px_rgba(252,211,77,0.7)]" />
            <span className="font-heading text-4xl font-bold tracking-[0.04em] text-amber-200 drop-shadow-[0_0_18px_rgba(252,211,77,0.5)]">
              +{reward.toLocaleString()}
            </span>
            <span className="font-heading text-lg uppercase tracking-[0.2em] text-amber-200/80">Gems</span>
          </div>
        </div>
        <div className="mt-2 text-[11px] text-white/45">Added to your gem balance</div>
        {totalGems != null ? <div className="mt-2 flex justify-center"><GemCounter total={totalGems} size="lg" /></div> : null}

        <div className="mt-7 flex flex-col gap-3">
          <GameButton variant="primary" className="w-full" sound={sound} onClick={onContinue}>
            Collect Reward <ChevronRight size={14} className="ml-1" />
          </GameButton>
          <GameButton variant="ghost" className="w-full" sound={sound} onClick={onPlayAgain}>
            Play Again
          </GameButton>
        </div>
      </Panel>
    </div>
  );
}