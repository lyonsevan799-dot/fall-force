import React from 'react';
import { ArrowLeft } from 'lucide-react';
import GemCounter from '@/components/game/GemCounter';

export default function MetaScreenHeader({ title, subtitle, save, sound, onBack }) {
  return <header><div className="mb-7 flex items-center justify-between gap-4"><button type="button" onClick={() => { sound.sfx('click'); onBack(); }} className="flex min-h-11 items-center gap-2 text-xs text-muted-foreground hover:text-primary"><ArrowLeft size={16} />Main Menu</button><GemCounter total={save.totalGems} count={0} size="lg" /></div><h1 className="font-heading text-2xl uppercase tracking-[0.08em] sm:text-3xl">{title}</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{subtitle}</p></header>;
}