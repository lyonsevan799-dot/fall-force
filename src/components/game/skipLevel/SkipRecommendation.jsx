import React, { useState } from 'react';
import SkipLevelControl from '@/components/game/skipLevel/SkipLevelControl';
export default function SkipRecommendation({ save, levelIndex, updateSave, onSkipped, onDismiss }) {
  const [pending, setPending] = useState(false);
  return <section aria-label="Optional skip recommendation" className="shop-shell rounded-2xl border border-primary/40 bg-card p-5 text-foreground">
    <h2 className="font-heading text-sm">Having trouble with this level?</h2>
    <p className="mt-2 text-sm text-muted-foreground">Skip this level and keep moving forward!</p>
    <p className="mt-2 text-xs text-muted-foreground">Optional. Skipped levels give no completion rewards.</p>
    <SkipLevelControl save={save} levelIndex={levelIndex} updateSave={updateSave} onSkipped={onSkipped} onBusyChange={setPending} />
    <button type="button" disabled={pending} onClick={onDismiss} className="mt-3 min-h-11 w-full rounded-xl border border-border px-4 text-sm disabled:opacity-50">Keep Trying</button>
  </section>;
}