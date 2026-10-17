import React from 'react';
import { Ghost, Pause, Play, RotateCcw, ArrowLeft } from 'lucide-react';
import { formatTrialTime, formatTrialDelta } from '@/game/timeTrial/courses';

export default function TimeTrialHud({ ui, paused, ghostEnabled, onGhost, onPause, onRetry, onBack, pending }) {
  const running = ui.state === 'playing', delta = ui.splitDelta;
  return <header className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 text-foreground">
    <div className="flex items-center gap-4"><div><p className="font-heading text-[8px] uppercase tracking-widest text-primary">{ui.state === 'ready' ? 'Ready' : running ? 'Current run' : 'Final time'}</p><p className="font-mono text-lg leading-tight sm:text-xl">{formatTrialTime(ui.timeMs)}</p></div><div><p className="font-heading text-[8px] uppercase tracking-widest text-muted-foreground">Best at start</p><p className="font-mono text-xs">{formatTrialTime(ui.bestMs)}</p></div>
      <div className="hidden text-[10px] text-muted-foreground sm:block">{delta == null ? 'No matched split yet' : `Last split: ${formatTrialDelta(delta)} · ${delta < 0 ? 'ahead' : delta > 0 ? 'behind' : 'level'}`}</div></div>
    <nav aria-label="Time Trial controls" className="flex items-center gap-1">
      <button type="button" aria-pressed={ghostEnabled} aria-label="Toggle personal best ghost" onClick={onGhost} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-border px-2 text-[10px] text-primary"><Ghost size={14} />Ghost {ghostEnabled ? 'on' : 'off'}</button>
      <button type="button" aria-label={paused ? 'Resume Time Trial' : 'Pause Time Trial'} onClick={onPause} disabled={!['ready', 'playing'].includes(ui.state)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border disabled:opacity-40">{paused ? <Play size={16} /> : <Pause size={16} />}</button>
      <button type="button" aria-label="Retry Time Trial" onClick={onRetry} disabled={pending} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border disabled:opacity-40"><RotateCcw size={16} /></button>
      <button type="button" aria-label="Return to Time Trial level selection" onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border"><ArrowLeft size={16} /></button>
    </nav>
    <p className="w-full text-[9px] text-muted-foreground sm:hidden">{delta == null ? 'Current run and saved best are separate' : `Last split: ${formatTrialDelta(delta)} · ${delta < 0 ? 'ahead' : delta > 0 ? 'behind' : 'level'}`}</p>
  </header>;
}