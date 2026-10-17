import React from 'react';
import { Lock, Timer, Play } from 'lucide-react';
import { LEVELS } from '@/game/levels';
import { GROUPS, groupUnlocked, isLevelPlayable } from '@/game/groups';
import { trialRecord, formatTrialTime } from '@/game/timeTrial/courses';
import MetaScreenHeader from '@/components/game/meta/MetaScreenHeader';

export default function TimeTrialLevels({ save, sound, onSelect, onBack }) {
  return <main className="meta-shell mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-7 px-5 py-8 text-foreground sm:px-8">
    <MetaScreenHeader title="Time Trial" subtitle="Race unlocked Career courses. Personal records only, not a global leaderboard." save={save} sound={sound} onBack={onBack} />
    {GROUPS.map((group, index) => <section key={group.id}><h2 className="mb-3 font-heading text-lg uppercase tracking-widest">{group.name}</h2>
      {!groupUnlocked(save, index) ? <p className="mb-3 text-xs text-muted-foreground">{group.lockHint}</p> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{LEVELS.slice(group.start, group.end + 1).map((level) => {
        const unlocked = isLevelPlayable(save, level.index), best = trialRecord(save.timeTrialRecords, level.index);
        return <button key={level.index} type="button" disabled={!unlocked} onClick={() => { sound.init(); sound.resume(); sound.sfx('click'); onSelect(level.index); }} className="flex min-h-32 flex-col gap-3 rounded-2xl border border-primary/25 bg-card p-4 text-left transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40">
          <span className="flex items-center justify-between font-heading text-xs text-primary">Level {String(level.index + 1).padStart(2, '0')}{unlocked ? <Play size={14} /> : <Lock size={14} />}</span>
          <span className="font-heading text-xs">{level.name}</span><span className="mt-auto flex items-center gap-2 font-mono text-xs text-muted-foreground"><Timer size={13} />{best ? `Best ${formatTrialTime(best.timeMs)}` : unlocked ? 'No personal best yet' : 'Locked in Career'}</span>
        </button>;
      })}</div></section>)}
    <p className="text-xs leading-relaxed text-muted-foreground">Complete Career levels to unlock more courses. Time Trial records do not unlock Career content or change Endless scores or your gem balance. Gems here are practice pickups and can still activate Gem Rush. Ghosts are optional visual recordings of your best valid runs.</p>
  </main>;
}