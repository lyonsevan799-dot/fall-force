import React from 'react';
import GemCounter from '@/components/game/GemCounter';

export default function RunGemBalance({ total, gems, endsOnDeath = false }) {
  return <div className="meta-shell" title={`Collected gems are credited once when this run ${endsOnDeath ? 'ends' : 'is completed'}.`}>
    <div className="mb-1 font-heading text-[8px] uppercase tracking-widest text-muted-foreground">Saved balance</div>
    <GemCounter count={0} total={total || 0} size="md" />
    <div className="mt-1 font-mono text-[9px] text-muted-foreground">{(gems || 0).toLocaleString()} collected this run</div>
  </div>;
}