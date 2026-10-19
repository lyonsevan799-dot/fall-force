import React, { useState } from 'react';
import { ArrowLeft, Play, ShoppingBag } from 'lucide-react';
import { LEVELS } from '@/game/levels';
import { groupForLevel } from '@/game/groups';
import { shouldRecommend, recordStruggle } from '@/game/powers/struggle';
import { canSkip } from '@/game/powers/catalog';
import DoubleGemsCard from '@/components/game/powers/DoubleGemsCard';
import SkipLevelControl from '@/components/game/powers/SkipLevelControl';
import SkipRecommendation from '@/components/game/powers/SkipRecommendation';
export default function LevelStartScreen({ save, levelIndex, challenge, powers, updateSave, commitGame, onStart, onBack, onShop, onSkipped }) {
  const [dismissed, setDismissed] = useState(false);
  const dismiss = () => { setDismissed(true); const id = crypto.randomUUID(); void commitGame((latest) => recordStruggle(latest, levelIndex, { kind: 'dismiss', id })); };
  return <section className="shop-shell relative mx-auto min-h-screen max-w-4xl bg-background px-4 py-6 text-foreground sm:px-8">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <button type="button" disabled={powers.pending} onClick={onBack} className="flex min-h-11 items-center gap-2 text-sm disabled:opacity-50"><ArrowLeft size={18} />Levels</button>
      <button type="button" disabled={powers.pending} onClick={onShop} className="flex min-h-11 items-center gap-2 text-sm text-primary disabled:opacity-50"><ShoppingBag size={18} />Item Shop</button>
    </header>
    <p className="mt-6 text-xs uppercase tracking-widest text-primary">{groupForLevel(levelIndex).name} · Level {levelIndex + 1}</p>
    <h1 className="mt-2 font-heading text-2xl">{LEVELS[levelIndex].name}</h1>
    {challenge && <p className="mt-2 text-sm text-race-two">{challenge.name}: {challenge.objective}. Skipping will not complete this challenge.</p>}
    <p className="my-4 text-sm text-muted-foreground">Choose an optional power before starting. Opening this screen never consumes a use.</p>
    {!dismissed && canSkip(save, levelIndex) && shouldRecommend(save, levelIndex) && <div className="mb-4"><SkipRecommendation save={save} levelIndex={levelIndex} updateSave={updateSave} onSkipped={onSkipped} onDismiss={dismiss} /></div>}
    <DoubleGemsCard save={save} updateSave={updateSave} selected={powers.selected} onSelect={powers.setSelected} disabled={powers.pending} />
    <SkipLevelControl save={save} levelIndex={levelIndex} updateSave={updateSave} onSkipped={onSkipped} disabled={powers.pending} />
    {save.levels?.[levelIndex]?.skipped && <p className="mt-3 text-xs text-muted-foreground">Previously skipped. Play it to earn a real completion and stars.</p>}
    {powers.error && <p role="alert" className="mt-4 text-sm text-race-two">{powers.error}</p>}
    <button type="button" disabled={powers.pending} onClick={onStart} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-heading text-sm text-primary-foreground disabled:opacity-50"><Play size={18} />{powers.pending ? 'Saving power use…' : powers.selected ? 'Start Level · Use Double Gems' : 'Start Level'}</button>
  </section>;
}