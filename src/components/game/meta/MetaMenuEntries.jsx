import React from 'react';
import { Award, CalendarDays, ChevronRight } from 'lucide-react';

export default function MetaMenuEntries({ sound, onDaily, onAchievements }) {
  return <div className="meta-shell grid w-full max-w-3xl gap-3 text-foreground sm:grid-cols-2">
    {[{ name: 'Daily Challenges', detail: 'UTC goals · Fresh rewards every day', Icon: CalendarDays, open: onDaily },
      { name: 'Achievements', detail: 'Five milestones · Lifetime progress', Icon: Award, open: onAchievements }].map(({ name, detail, Icon, open }) =>
      <button key={name} type="button" onClick={() => { sound.sfx('click'); open(); }} className="flex min-h-20 items-center gap-3 rounded-2xl border border-primary/30 bg-card/80 p-5 text-left transition-colors hover:bg-primary/10"><Icon size={23} className="shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block font-heading text-[11px] uppercase tracking-widest">{name}</span><span className="mt-1 block text-[10px] text-muted-foreground">{detail}</span></span><ChevronRight size={15} className="text-primary" /></button>)}
  </div>;
}