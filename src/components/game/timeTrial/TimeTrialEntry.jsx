import React from 'react';
import { Timer, ChevronRight } from 'lucide-react';

export default function TimeTrialEntry({ sound, onOpen }) {
  return <button type="button" onClick={() => { sound.sfx('click'); onOpen(); }} className="meta-shell flex min-h-16 w-full max-w-3xl items-center gap-4 rounded-2xl border border-primary/35 bg-card px-6 py-4 text-left text-foreground transition-colors hover:bg-primary/10">
    <Timer size={26} className="shrink-0 text-primary" /><span className="flex-1"><span className="block font-heading text-sm uppercase tracking-widest">Time Trial</span><span className="mt-1 block text-[11px] text-muted-foreground">Race your personal best · Optional ghost</span></span><ChevronRight size={17} className="text-primary" />
  </button>;
}