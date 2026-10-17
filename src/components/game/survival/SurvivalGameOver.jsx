import React from 'react';
import { GameButton, Panel } from '@/components/game/ui';
import { formatSurvivalTime } from '@/game/survivalRecords';
import RunSaveStatus from '@/components/game/procedural/RunSaveStatus';

export default function SurvivalGameOver({ ui, records, sound, bank, onSave, onRetry, onExit }) {
  return <div className="meta-shell absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-background/80 p-4">
    <Panel className="my-auto w-full max-w-md text-center">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Game Over</div><h2 className="mt-2 font-heading text-2xl uppercase">Survival</h2>
      <div className="mt-4 font-mono text-4xl">{formatSurvivalTime(ui.time)}</div><div className="mt-2 font-mono text-2xl">{(ui.score || 0).toLocaleString()} points</div>
      {ui.isNewBest ? <p className="mt-2 text-primary">New personal best</p> : null}
      <p className="mt-4 text-sm text-muted-foreground">Best score {Math.max(records?.bestScore || 0, ui.score || 0).toLocaleString()}</p>
      <p className="text-sm text-muted-foreground">Best time {formatSurvivalTime(Math.max(records?.bestTime || 0, ui.time || 0))}</p>
      <p className="mt-2 text-sm text-primary">{ui.gems || 0} gems collected · {ui.distance || 0}m</p>
      <RunSaveStatus state={bank} onRetry={onSave} />
      <div className="mt-5 flex flex-col gap-3"><GameButton sound={sound} onClick={onRetry}>Retry</GameButton><GameButton variant="ghost" sound={sound} onClick={onExit}>Main Menu</GameButton></div>
      <p className="mt-3 text-xs text-muted-foreground">Space or R to retry · Survival records are separate from Endless.</p>
    </Panel>
  </div>;
}