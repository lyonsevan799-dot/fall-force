import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import MetaScreenHeader from '@/components/game/meta/MetaScreenHeader';
import DailyChallengeCard from '@/components/game/meta/DailyChallengeCard';

export default function DailyChallengesScreen({ save, day, sound, onBack, onClaim, onPlay, onPrepare }) {
  const [selected, setSelected] = useState(day);
  useEffect(() => setSelected(day), [day]);
  const dates = [...new Set([day, ...Object.keys(save.dailyChallenges?.days || {})])].sort().reverse();
  const record = save.dailyChallenges?.days?.[selected];
  const today = new Date(`${day}T12:00:00Z`).toLocaleDateString('en-CA', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  return <main className="meta-shell mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-5 py-8 text-foreground sm:px-8">
    <MetaScreenHeader title="Daily Challenges" subtitle={`Today: ${today} · UTC. New goals arrive at 00:00 UTC.`} save={save} sound={sound} onBack={onBack} />
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Completed rewards remain claimable after the day ends.</p><label className="flex items-center gap-2 text-xs text-muted-foreground">Challenge date<select value={selected} onChange={(event) => setSelected(event.target.value)} className="min-h-11 rounded-xl border border-border bg-card px-3 text-foreground">{dates.map((date) => <option key={date} value={date}>{date}{date === day ? ' · Today' : ''}</option>)}</select></label></div>
    {!record ? <div role="status" className="rounded-2xl border border-border bg-card p-6"><Loader2 className="mb-3 animate-spin text-primary" size={20} /><p className="text-sm text-muted-foreground">Preparing today's goals…</p><button type="button" onClick={onPrepare} className="mt-4 min-h-11 text-xs text-primary">Try again</button></div> : <div className="grid gap-4 sm:grid-cols-2">{record.tasks.map((task) => <DailyChallengeCard key={`${selected}:${task.id}`} task={task} expired={selected !== day} onClaim={() => onClaim(selected, task.id)} onPlay={() => { sound.sfx('click'); onPlay(task); }} />)}</div>}
    <p className="text-xs leading-relaxed text-muted-foreground">These rewards are separate from special No-Death challenges: Easy 100, Medium 350, Hard 1,000 gems. Daily sets stay fixed once generated. Progress uses the device's UTC clock and is not cheat-proof.</p>
  </main>;
}