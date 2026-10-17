import React, { useEffect, useRef, useState } from 'react';
import { Award, X } from 'lucide-react';
import { ACHIEVEMENTS } from '@/game/meta/achievements';

export default function AchievementUnlocks({ achievements, onNotified, reduced }) {
  const [active, setActive] = useState(null);
  const shown = useRef(new Set());
  useEffect(() => {
    if (active) return;
    const next = ACHIEVEMENTS.find((entry) => achievements?.[entry.id]?.unlockedAt && !achievements[entry.id].notifiedAt && !shown.current.has(entry.id));
    if (!next) return;
    shown.current.add(next.id); setActive(next); void onNotified(next.id);
  }, [achievements, active, onNotified]);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(null), 4500);
    return () => clearTimeout(timer);
  }, [active]);
  if (!active) return null;
  return <aside role="status" aria-live="polite" className={`meta-shell fixed right-4 top-4 z-50 flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl border border-primary/40 bg-card p-4 text-foreground shadow-xl ${reduced ? '' : 'gs-pop motion-reduce:animate-none'}`}>
    <Award size={25} className="shrink-0 text-primary" /><div><p className="font-heading text-[9px] uppercase tracking-widest text-primary">Achievement unlocked</p><p className="mt-1 font-heading text-sm">{active.name}</p><p className="mt-1 text-xs text-muted-foreground">Claim {active.reward.toLocaleString()} gems in Achievements.</p></div><button type="button" aria-label="Dismiss achievement notification" onClick={() => setActive(null)} className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground"><X size={15} /></button>
  </aside>;
}