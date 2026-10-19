import React from 'react';
import { Gem } from 'lucide-react';
export default function DoubleGemsBadge({ label = 'Double Gems', reduced = false }) {
  return <span className="inline-flex items-center gap-2 font-heading text-xs text-primary">
    <span className={`relative inline-flex h-9 w-10 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 ${reduced ? '' : 'motion-safe:animate-pulse'}`}>
      <Gem size={24} className="drop-shadow-[0_0_8px_hsl(var(--primary)/0.7)]" /><b className="absolute -right-2 -top-1 rounded bg-primary px-1 text-[10px] text-primary-foreground">×2</b>
    </span><span>{label}</span>
  </span>;
}