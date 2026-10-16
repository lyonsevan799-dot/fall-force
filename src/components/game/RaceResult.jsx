import React from 'react';
import { RotateCcw, Home } from 'lucide-react';
import { GameButton, Panel } from '@/components/game/ui';
import GemCounter from '@/components/game/GemCounter';
import RaceCelebration from '@/components/game/RaceCelebration';
import RacePlayerResult from '@/components/game/RacePlayerResult';
import { raceReward } from '@/game/raceRewards';

export default function RaceResult({ ui, totalGems, sound, onRestart, onExit }) {
  const reward = raceReward(ui);
  const tie = ui.winner === -1;
  const winnerText = ui.winner === 0 ? 'text-cyan-200' : 'text-pink-200';
  return (
    <div className="dark absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-background/70 p-4 text-foreground backdrop-blur-md">
      <RaceCelebration winner={reward ? ui.winner : -1} />
      <Panel className="gs-pop my-auto w-full max-w-md shrink-0 text-center">
        <div className="font-heading text-[10px] uppercase tracking-[0.5em] text-muted-foreground">{tie ? 'Race Tied' : 'Winner'}</div>
        <h2 className={`mt-2 font-heading text-3xl uppercase tracking-widest ${tie ? 'text-foreground' : winnerText}`}>
          {tie ? 'No Winner' : `Player ${ui.winner + 1}`}
        </h2>
        <div className="mt-5 space-y-2">
          <RacePlayerResult number={1} finished={ui.p1Finished} time={ui.p1Time} progress={ui.p1Final} winner={ui.winner} reward={reward} />
          <RacePlayerResult number={2} finished={ui.p2Finished} time={ui.p2Time} progress={ui.p2Final} winner={ui.winner} reward={reward} />
        </div>
        <div role="status" className="mt-4 space-y-2 text-xs text-foreground">
          <p>{tie ? 'Tie: neither player earns gems.' : `Player ${ui.winner + 1} earned ${reward} gems. Added once to the shared balance.`}</p>
          <div className="flex items-center justify-center gap-2"><span>Shared balance</span><GemCounter total={totalGems} size="md" /></div>
        </div>
        <div className="mt-6 space-y-3">
          <GameButton variant="primary" size="lg" sound={sound} onClick={onRestart} className="w-full"><RotateCcw size={18} /> Rematch</GameButton>
          <GameButton variant="ghost" sound={sound} onClick={onExit} className="w-full"><Home size={16} /> Main Menu</GameButton>
        </div>
        <div className="mt-4 text-[10px] text-muted-foreground">Press R to rematch · Esc for menu</div>
      </Panel>
    </div>
  );
}