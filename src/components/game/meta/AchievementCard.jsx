import React from 'react';
import { Award, LockKeyhole } from 'lucide-react';
import MetaProgressBar from '@/components/game/meta/MetaProgressBar';
import RewardClaim from '@/components/game/meta/RewardClaim';

export default function AchievementCard({ definition, record = {}, onClaim }) {
  const unlocked = !!record.unlockedAt;
  return <article className="rounded-3xl border border-primary/25 bg-card p-5 sm:p-6">
    <div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">{unlocked ? <Award size={26} /> : <LockKeyhole size={22} />}</span>
      <div><h2 className="font-heading text-base uppercase tracking-wider">{definition.name}</h2><p className="mt-1 text-[10px] uppercase tracking-widest text-primary">{unlocked ? record.claimedAt ? 'Unlocked · Reward claimed' : 'Unlocked · Reward available' : 'Locked'}</p></div></div>
    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{definition.description}</p>
    <MetaProgressBar value={record.progress} target={definition.target} label="Progress" />
    {unlocked ? <p className="mt-3 text-xs text-muted-foreground">Unlocked {new Date(record.unlockedAt).toLocaleDateString('en-CA', { timeZone: 'UTC' })} UTC · In-game badge earned</p> : null}
    <RewardClaim reward={definition.reward} completed={unlocked} claimed={!!record.claimedAt || record.rewardClaimed === true} onClaim={onClaim} />
  </article>;
}