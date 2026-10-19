import React from 'react';
import DoubleGemsBadge from '@/components/game/powers/DoubleGemsBadge';
import usePowerAction from '@/hooks/usePowerAction';
import { buyDoubleGems } from '@/game/powers/purchases';
import { ownedDoubleGems } from '@/game/powers/catalog';
export default function DoubleGemsCard({ save, updateSave, selected, onSelect, disabled = false }) {
  const action = usePowerAction(updateSave), owned = ownedDoubleGems(save);
  const buy = () => { const id = crypto.randomUUID(); return action.perform((latest) => buyDoubleGems(latest, id), 'One Double Gems use added and saved.'); };
  return <article className="rounded-2xl border border-primary/30 bg-card p-5">
    <DoubleGemsBadge reduced={save.settings.reduced} />
    <p className="mt-4 text-sm text-muted-foreground">Double every pickup, including Gem Rush, in one Career or challenge level. Bonus rewards stay unchanged.</p>
    <p className="mt-3 text-sm font-bold">100 gems per use · {owned.toLocaleString()} owned</p>
    <p className="mt-1 text-xs text-muted-foreground">Select before starting. One use lasts through deaths and restarts until completion or leaving.</p>
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" disabled={disabled || action.pending || save.totalGems < 100} onClick={buy} className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50">{action.pending ? 'Saving…' : 'Buy for 100 Gems'}</button>
      <button type="button" aria-pressed={selected} disabled={disabled || action.pending || (!owned && !selected)} onClick={() => onSelect(!selected)} className="min-h-11 rounded-xl border border-primary/40 px-4 text-sm text-primary disabled:opacity-50">{selected ? 'Selected · Cancel' : 'Use'}</button>
    </div>
    {save.totalGems < 100 && <p className="mt-2 text-xs text-muted-foreground">Need {(100 - save.totalGems).toLocaleString()} more gems to buy.</p>}
    {selected && <p role="status" className="mt-3 text-xs text-primary">Ready for your next level. Not consumed until Start Level.</p>}
    {action.message && <p role="status" className="gs-pop mt-3 text-xs text-primary">{action.message}</p>}
    {action.error && <p role="alert" className="mt-3 text-xs text-race-two">{action.error}</p>}
  </article>;
}