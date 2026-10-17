import React from 'react';
import { RotateCcw, Home } from 'lucide-react';
import { GameButton, Panel } from '@/components/game/ui';
import GemCounter from '@/components/game/GemCounter';
import RaceCelebration from '@/components/game/RaceCelebration';
import RacePlayerResult from '@/components/game/RacePlayerResult';
import { raceReward } from '@/game/raceRewards';
import RaceSeriesSummary from '@/components/game/race/RaceSeriesSummary';

export default function RaceResult({ ui, series, totalGems, sound, bank, onSave, onRestart, onExit }) {
  const reward = raceReward(ui);
  const tie = ui.winner === -1;
  const winnerText = ui.winner === 0 ? 'text-cyan-200' : 'text-pink-200';
  return (
    <div className="dark absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-background/70 p-4 text-foreground backdrop-blur-md">
      <RaceCelebration winner={reward ? ui.winner : -1} />
      <Panel className="gs-pop my-auto w-full max-w-md shrink-0 text-center">
        <div className="font-heading text-[10px] uppercase tracking-[0.5em] text-muted-foreground">{tie ? 'Race Tied' : 'Winner'}</div>
        <h2 className={`mt-2 font-heading text-3xl uppercase tracking-widest ${tie ? 'text-foreground' : winnerText}`}>
          {tie ? 'Draw' : `Player ${ui.winner + 1}`}
        </h2>
        <div className="mt-5 space-y-2">
          <RacePlayerResult number={1} finished={ui.p1Finished} time={ui.p1Time} progress={ui.p1Final} winner={ui.winner} reward={reward} />
          <RacePlayerResult number={2} finished={ui.p2Finished} time={ui.p2Time} progress={ui.p2Final} winner={ui.winner} reward={reward} />
        </div>
        <div role="status" className="mt-4 space-y-2 text-xs text-foreground">
          <p>{tie ? 'Draw: neither player earns gems.' : `Player ${ui.winner + 1}: ${reward} gems${bank === 'saved' ? ', added once to the shared balance.' : ' reward.'}`}</p>
          {reward && bank === 'saving' ? <p>Saving round reward…</p> : null}
          {reward && bank === 'error' ? <p>Reward not saved. <button type="button" className="underline" onClick={onSave}>Try saving again</button></p> : null}
          <div className="flex items-center justify-center gap-2"><span>Shared balance</span><GemCounter total={totalGems} size="md" /></div>
        </div>
        <RaceSeriesSummary series={series} />
        <div className="mt-6 space-y-3">
          <GameButton variant="primary" size="lg" sound={sound} onClick={onRestart} className="w-full"><RotateCcw size={18} /> {series?.bestOfThree ? series.complete ? 'New series' : 'Next round' : 'Rematch'}</GameButton>
          <GameButton variant="ghost" sound={sound} onClick={onExit} className="w-full"><Home size={16} /> Main Menu</GameButton>
        </div>
        <div className="mt-4 text-[10px] text-muted-foreground">R: next round / rematch · Esc: Main Menu</div>
      </Panel>
    </div>
  );
}