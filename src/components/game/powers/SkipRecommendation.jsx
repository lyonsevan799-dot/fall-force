import React from 'react';
import { groupForLevel } from '@/game/groups';
import SkipLevelControl from '@/components/game/powers/SkipLevelControl';
export default function SkipRecommendation({ save, levelIndex, updateSave, onSkipped, onDismiss }) {
  const hard = groupForLevel(levelIndex).id === 'hard';
  return <section aria-label="Optional skip recommendation" className={`shop-shell gs-pop rounded-2xl border bg-card p-5 text-foreground ${hard ? 'border-race-two ring-2 ring-race-two/30' : 'border-primary/40'}`}>
    <h2 className="font-heading text-sm">Having trouble with this level?</h2>
    <p className="mt-2 text-sm text-muted-foreground">Use Skip Level to move forward and keep your progress!</p>
    <p className="mt-2 text-xs text-muted-foreground">Optional, no rewards for skipped levels. You can always keep trying.</p>
    <SkipLevelControl save={save} levelIndex={levelIndex} updateSave={updateSave} onSkipped={onSkipped} />
    <button type="button" onClick={onDismiss} className="mt-3 min-h-11 w-full rounded-xl border border-border px-4 text-sm">Dismiss · Keep Trying</button>
  </section>;
}