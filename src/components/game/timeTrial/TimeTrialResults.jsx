import React from 'react';
import { Award, Loader2 } from 'lucide-react';
import { formatTrialTime, formatTrialDelta } from '@/game/timeTrial/courses';

export default function TimeTrialResults({ ui, status, reduced, onRetry, onMenu, onSaveAgain }) {
  const complete = ui.state === 'complete';
  const difference = ui.bestMs == null ? null : ui.timeMs - ui.bestMs;
  return <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-background/85 p-3">
    <section className="my-auto w-full max-w-md shrink-0 rounded-3xl border border-primary/35 bg-card p-5 text-center sm:p-7">
      {status.newRecord ? <div className={reduced ? '' : 'gs-pop motion-reduce:animate-none'}><Award size={30} className="mx-auto mb-2 text-primary" /><p className="font-heading text-xs uppercase tracking-widest text-primary">New personal best</p></div> : null}
      <h2 className="mt-2 font-heading text-xl">{complete ? 'Time Trial complete' : 'Run ended'}</h2>
      <p className="mt-3 font-mono text-3xl">{formatTrialTime(ui.timeMs)}</p>
      <p className="mt-2 text-xs text-muted-foreground">{complete ? difference == null ? 'Your first valid finish on this course.' : `${formatTrialDelta(difference)} versus the best at the start.` : 'A death ends the attempt. No personal record was changed.'}</p>
      <p className="mt-3 font-mono text-xs text-primary">Saved best: {formatTrialTime(status.saved ? status.bestMs : ui.bestMs)}</p>
      {status.pending ? <p role="status" className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Loader2 size={13} className="animate-spin" />Saving personal record…</p> : null}
      {status.saved ? <p role="status" className="mt-3 text-xs text-muted-foreground">{status.newRecord ? 'Personal record saved.' : 'Personal best unchanged.'}{status.newRecord && !status.ghostStored ? ' Time and splits saved without a ghost recording.' : ''}</p> : null}
      {status.error ? <div role="alert" className="mt-3 text-xs text-destructive"><p>{status.error}</p><button type="button" onClick={onSaveAgain} className="mt-2 min-h-10 underline">Retry saving record</button></div> : null}
      <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={onRetry} disabled={status.pending} className="min-h-11 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-40">Retry</button><button type="button" onClick={onMenu} className="min-h-11 rounded-xl border border-border px-3 text-xs">Main menu</button></div>
    </section>
  </div>;
}