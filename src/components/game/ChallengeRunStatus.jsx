import React from 'react';
import { GameButton } from '@/components/game/ui';

export default function ChallengeRunStatus({ challenge, failed, reason, onNewAttempt, sound }) {
  if (!challenge) return null;
  const middle = challenge.type === 'middle';
  return (
    <div className="dark pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-3">
      <div role="status" className="rounded-2xl border border-primary/40 bg-background/90 px-4 py-2 text-center font-heading text-[10px] uppercase tracking-widest text-primary">
        {middle && failed ? (
          <>
            <div>Failed Attempt · {reason}</div>
            <div className="mt-1 text-[9px]">Restarting cannot clear this attempt’s failure.</div>
            <GameButton className="pointer-events-auto mt-2" variant="ghost" sound={sound} onClick={onNewAttempt}>Choose New Attempt</GameButton>
          </>
        ) : <div>{middle ? 'Stay in the Middle' : 'No-Death'} · {challenge.name} · +{challenge.reward.toLocaleString()} Gems</div>}
      </div>
    </div>
  );
}