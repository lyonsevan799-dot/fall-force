import React, { useState } from 'react';
import { FastForward, Zap } from 'lucide-react';
import { availableSkipLevels } from '@/game/powers/catalog';
import { groupForLevel } from '@/game/groups';
import { tutorialAccessibleCareer } from '@/game/tutorialProgress';
import DoubleGemsCard from '@/components/game/powers/DoubleGemsCard';
import SkipLevelControl from '@/components/game/powers/SkipLevelControl';
export default function ShopPowers({ save, updateSave, powers, levelIndex, onSkipped }) {
  const [chosen, setChosen] = useState(levelIndex);
  const levels = availableSkipLevels(save), selected = levels.some((level) => level.index === chosen) ? chosen : levels[0]?.index;
  return <section aria-label="Powers" className="mt-6">
    <h2 className="flex items-center gap-2 font-heading text-lg"><Zap className="text-primary" size={20} />Powers</h2>
    <p className="mt-2 text-xs text-muted-foreground">Use your existing gems. All purchases save with your skins and progress.</p>
    {!tutorialAccessibleCareer(save) && <p className="mt-2 text-xs text-primary">Complete or skip the tutorial before using level powers.</p>}
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <DoubleGemsCard save={save} updateSave={updateSave} selected={powers.selected} onSelect={powers.setSelected} />
      <article className="rounded-2xl border border-race-two/30 bg-card p-5">
        <h3 className="flex items-center gap-2 font-heading text-sm text-race-two"><FastForward size={26} />Skip Level</h3>
        <p className="mt-4 text-sm text-muted-foreground">Move past one unfinished Career level. Counts for unlocks, but earns no completion rewards.</p>
        <p className="mt-2 text-xs text-muted-foreground">Easy 500 · Medium 1,500 · Hard 3,000 gems</p>
        <label className="mt-4 block text-xs">Selected level
          <select aria-label="Level to skip" value={selected ?? ''} disabled={!levels.length} onChange={(event) => setChosen(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-foreground">
            {!levels.length && <option value="">No unlocked unfinished levels</option>}
            {levels.map((level) => <option key={level.index} value={level.index}>Level {level.index + 1} · {groupForLevel(level.index).name} · {level.name}</option>)}
          </select>
        </label>
        <SkipLevelControl save={save} levelIndex={selected} updateSave={updateSave} onSkipped={onSkipped} />
      </article>
    </div>
    <h2 className="mt-8 font-heading text-lg">Skins</h2>
  </section>;
}