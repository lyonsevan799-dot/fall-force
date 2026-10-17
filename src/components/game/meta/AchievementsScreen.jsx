import React from 'react';
import { ACHIEVEMENTS } from '@/game/meta/achievements';
import MetaScreenHeader from '@/components/game/meta/MetaScreenHeader';
import AchievementCard from '@/components/game/meta/AchievementCard';

export default function AchievementsScreen({ save, sound, onBack, onClaim }) {
  return <main className="meta-shell mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-5 py-8 text-foreground sm:px-8">
    <MetaScreenHeader title="Achievements" subtitle="Five permanent milestones. Each gem reward can be claimed once." save={save} sound={sound} onBack={onBack} />
    <section className="rounded-2xl border border-border bg-card p-5"><p className="font-heading text-xs uppercase tracking-widest text-primary">Lifetime gems collected</p><p className="mt-2 font-mono text-3xl">{(save.lifetimeGemsCollected || 0).toLocaleString()}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Actual pickups, separate from spendable gems. Skin purchases never reduce this counter; bonus rewards do not increase it.</p>
      {save.metaProgress?.legacyLifetimeEstimate ? <p className="mt-2 text-xs text-muted-foreground">Older saves start from recoverable pickup records. Historical pickups that were not recorded cannot be reconstructed.</p> : null}</section>
    <div className="grid gap-4 sm:grid-cols-2">{ACHIEVEMENTS.map((definition) => <AchievementCard key={definition.id} definition={definition} record={save.achievements?.[definition.id]} onClaim={() => onClaim(definition.id)} />)}</div>
    <p className="text-xs text-muted-foreground">Badges belong to this game, not a CrazyGames profile. Progress is client-side, not cheat-proof.</p>
  </main>;
}