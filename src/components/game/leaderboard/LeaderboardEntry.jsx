import React from 'react';
import { Globe2, ChevronRight } from 'lucide-react';

export default function LeaderboardEntry({ best, sound, onOpen }) {
  return (
    <button type="button" onClick={() => { sound.sfx('click'); onOpen(); }}
      className="leaderboard-shell flex min-h-16 w-full max-w-3xl items-center gap-4 rounded-2xl border border-primary/30 bg-card/80 px-6 py-4 text-left text-foreground transition-colors hover:bg-primary/10">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary"><Globe2 size={23} /></span>
      <span className="min-w-0 flex-1"><span className="block font-heading text-sm uppercase tracking-[0.16em]">Global Leaderboard</span><span className="mt-1 block text-[11px] text-muted-foreground">Endless Mode · Personal best {best.toLocaleString()}</span></span>
      <ChevronRight size={18} className="shrink-0 text-primary" />
    </button>
  );
}