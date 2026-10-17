import React from 'react';
import { GameButton, Panel } from '@/components/game/ui';
import { formatSurvivalTime } from '@/game/survivalRecords';

export default function SurvivalReady({ records, sound, onStart, onExit }) {
  return <div className="meta-shell absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-background/80 p-4">
    <Panel className="my-auto max-w-md text-center">
      <h2 className="font-heading text-2xl uppercase">Survival</h2>
      <p className="mt-3 text-sm text-muted-foreground">One life. Survive endless hazard waves for as long as possible.</p>
      <p className="mt-2 text-xs text-muted-foreground">100 points per second. Pausing stops the timer. Gems are optional and banked when the run ends.</p>
      <p className="mt-2 text-xs text-muted-foreground">Tap, click, Space or arrows to flip. P to pause. R to restart. Large gems start an automatic Rush.</p>
      <p className="mt-4 font-mono text-sm text-primary">Best {(records?.bestScore || 0).toLocaleString()} · {formatSurvivalTime(records?.bestTime)}</p>
      <div className="mt-5 flex flex-col gap-3"><GameButton sound={sound} onClick={onStart}>Start Survival</GameButton><GameButton variant="ghost" sound={sound} onClick={onExit}>Main Menu</GameButton></div>
    </Panel>
  </div>;
}