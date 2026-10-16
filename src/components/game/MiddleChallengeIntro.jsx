import React from 'react';
import { MoveVertical } from 'lucide-react';
import { GameButton, Panel } from '@/components/game/ui';

export default function MiddleChallengeIntro({ challenge, sound, onStart, onExit }) {
  return (
    <div className="dark absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-background/90 p-4 text-foreground">
      <Panel className="my-auto w-full max-w-md text-center">
        <MoveVertical className="mx-auto text-primary" size={32} />
        <h2 className="mt-3 font-heading text-xl">Stay in the Middle</h2>
        <p className="mt-2 font-heading text-sm">{challenge.name} · +{challenge.reward.toLocaleString()} gems</p>
        <p className="mt-3 text-sm">Start in mid-air. Flip gravity to avoid both boundaries from launch to finish. A death or restart also fails this attempt.</p>
        <p className="mt-2 text-xs">A fresh attempt must start from the level picker, not a checkpoint.</p>
        <div className="mt-5 flex flex-col gap-2">
          <GameButton sound={sound} onClick={onStart}>Start Attempt</GameButton>
          <GameButton variant="ghost" sound={sound} onClick={onExit}>Challenges</GameButton>
        </div>
      </Panel>
    </div>
  );
}