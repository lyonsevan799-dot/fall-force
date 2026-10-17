import React from 'react';
import { CalendarCheck, Play } from 'lucide-react';
import { DAILY_NAMES, dailyDescription, dailyGoal } from '@/game/meta/dailyCatalog';
import MetaProgressBar from '@/components/game/meta/MetaProgressBar';
import RewardClaim from '@/components/game/meta/RewardClaim';

export default function DailyChallengeCard({ task, expired, onClaim, onPlay }) {
  const completed = !!task.completedAt;
  return <article className="rounded-3xl border border-primary/25 bg-card p-5 sm:p-6">
    <div className="flex items-center gap-3"><CalendarCheck size={23} className="shrink-0 text-primary" /><div><h2 className="font-heading text-base uppercase tracking-wider">{DAILY_NAMES[task.kind]}</h2><p className="mt-1 text-[10px] uppercase tracking-widest text-primary">{task.claimedAt ? 'Claimed' : completed ? 'Completed · Ready to claim' : expired ? 'Expired' : task.lastFailureAt ? 'Try again' : 'In progress'}</p></div></div>
    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{dailyDescription(task)}</p>
    <MetaProgressBar value={task.progress} target={dailyGoal(task)} label="Best progress today" />
    {task.lastFailureAt && !completed ? <p className="mt-3 text-xs text-muted-foreground">That attempt did not meet the objective. {expired ? 'This UTC day has ended.' : 'Start a fresh run and try again.'}</p> : null}
    {completed ? <p className="mt-3 text-xs text-muted-foreground">Completed {new Date(task.completedAt).toLocaleDateString('en-CA', { timeZone: 'UTC' })} UTC</p> : null}
    <div className="flex flex-wrap items-end gap-3"><RewardClaim reward={task.reward} completed={completed} claimed={!!task.claimedAt} onClaim={onClaim} />
      {!completed && !expired ? <button type="button" onClick={onPlay} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-xs text-foreground hover:bg-primary/10"><Play size={14} />Play</button> : null}</div>
  </article>;
}