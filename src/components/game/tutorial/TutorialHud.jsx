import React from 'react';
import { Pause, Play, RotateCcw, X, Gem } from 'lucide-react';

export default function TutorialHud({ ui, totalGems, banked, canSkip, onPause, onRestart, onExit, onSkip }) {
  return (
    <>
      <header className="absolute inset-x-0 top-0 z-40 flex flex-wrap items-center justify-between gap-1 bg-background/85 px-3 py-2 text-[10px] sm:text-xs">
        <span className="font-heading">Level 0: Tutorial</span>
        <span className="flex items-center gap-1 text-primary"><Gem size={14} />{totalGems.toLocaleString()} saved · {ui.gems} collected{banked ? ' (practice)' : ''}</span>
        <div className="flex items-center gap-1">
          {canSkip && <button type="button" onClick={onSkip} className="min-h-11 px-2 text-primary">Skip Tutorial</button>}
          <button type="button" aria-label={ui.paused ? 'Resume tutorial' : 'Pause tutorial'} onClick={onPause} className="min-h-11 min-w-11">{ui.paused ? <Play className="mx-auto" size={18} /> : <Pause className="mx-auto" size={18} />}</button>
          <button type="button" aria-label="Restart tutorial" onClick={onRestart} className="min-h-11 min-w-11"><RotateCcw className="mx-auto" size={18} /></button>
          <button type="button" aria-label="Exit tutorial" onClick={onExit} className="min-h-11 min-w-11"><X className="mx-auto" size={18} /></button>
        </div>
      </header>
      {ui.paused && <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/75"><button type="button" onClick={onPause} className="rounded-xl bg-primary p-4 font-bold text-primary-foreground">Resume Tutorial</button></div>}
      {['dead', 'dying'].includes(ui.state) && <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/75"><div className="rounded-2xl border border-border bg-card p-5 text-center"><h2 className="font-heading">Try again!</h2><p className="my-3 text-sm text-muted-foreground">Your saved gems are safe.</p><button type="button" onClick={onRestart} className="min-h-11 rounded-xl bg-primary p-3 font-bold text-primary-foreground">Restart Tutorial</button></div></div>}
    </>
  );
}