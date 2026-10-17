import React from 'react';
import { Pause } from 'lucide-react';
import { IconButton } from '@/components/game/ui';
import RunGemBalance from '@/components/game/RunGemBalance';
import { formatSurvivalTime } from '@/game/survivalRecords';

export default function SurvivalHud({ ui, records, totalGems, onPause, sound }) {
  return <div className="meta-shell pointer-events-none absolute inset-x-0 top-0 z-20 p-3">
    <div className="flex items-start justify-between gap-2 rounded-2xl border border-border bg-background/80 p-3">
      <div><div className="font-heading text-xs uppercase text-primary">Survival</div><div className="mt-1 font-mono text-xl">{formatSurvivalTime(ui.time)}</div><div className="mt-1 text-xs text-muted-foreground">{ui.sectionName || 'Training'}</div></div>
      <div className="text-center"><div className="text-xs text-muted-foreground">Score</div><div className="font-mono text-2xl">{(ui.score || 0).toLocaleString()}</div><div className="text-xs text-muted-foreground">Best {Math.max(records?.bestScore || 0, ui.score || 0).toLocaleString()}</div><div className="font-mono text-xs text-muted-foreground">Best time {formatSurvivalTime(Math.max(records?.bestTime || 0, ui.time || 0))}</div></div>
      <div className="flex items-start gap-2"><RunGemBalance total={totalGems} gems={ui.gems} endsOnDeath /><IconButton label="Pause Survival" sound={sound} onClick={onPause}><Pause size={16} /></IconButton></div>
    </div>
  </div>;
}