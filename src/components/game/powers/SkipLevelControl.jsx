import React, { useState } from 'react';
import { FastForward } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { LEVELS } from '@/game/levels';
import { groupForLevel } from '@/game/groups';
import { skipLevel } from '@/game/powers/purchases';
import { skipPrice, canSkip } from '@/game/powers/catalog';
import usePowerAction from '@/hooks/usePowerAction';
export default function SkipLevelControl({ save, levelIndex, updateSave, onSkipped, disabled = false }) {
  const [open, setOpen] = useState(false), action = usePowerAction(updateSave);
  const valid = Number.isInteger(levelIndex) && !!LEVELS[levelIndex], price = valid ? skipPrice(levelIndex) : 0;
  const eligible = valid && canSkip(save, levelIndex), affordable = save.totalGems >= price;
  const confirm = async () => {
    const id = crypto.randomUUID();
    const next = await action.perform((latest) => skipLevel(latest, levelIndex, id), 'Level skipped and progress saved.');
    if (next) { setOpen(false); onSkipped?.(levelIndex); }
  };
  return <div className="mt-3">
    <button type="button" disabled={disabled || action.pending || !eligible || !affordable} onClick={() => setOpen(true)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-race-two/50 bg-race-two/10 px-4 text-sm font-bold text-race-two disabled:opacity-50"><FastForward size={17} />{action.pending ? 'Saving…' : valid ? `Skip for ${price.toLocaleString()} Gems` : 'No level to skip'}</button>
    <p className="mt-2 text-xs text-muted-foreground">Balance: {save.totalGems.toLocaleString()} gems{!eligible ? ' · Only unlocked, unfinished levels can be skipped.' : affordable ? ' · You can afford this skip.' : ` · Need ${(price - save.totalGems).toLocaleString()} more gems.`}</p>
    {action.error && <p role="alert" className="mt-2 text-xs text-race-two">{action.error}</p>}
    <AlertDialog open={open} onOpenChange={(value) => { if (!action.pending) setOpen(value); }}>
      <AlertDialogContent className="shop-shell max-h-[90dvh] overflow-y-auto border-border bg-card text-foreground">
        <AlertDialogHeader><AlertDialogTitle>Skip Level {levelIndex + 1}?</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground">{valid && `${LEVELS[levelIndex].name} · ${groupForLevel(levelIndex).name}`}<br />Spend exactly {price.toLocaleString()} gems to skip only this level. No level gems, stars, completion achievements or challenge rewards are awarded. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
        <p className="text-sm">After purchase: {Math.max(0, save.totalGems - price).toLocaleString()} gems</p>
        {action.error && <p role="alert" className="text-sm text-race-two">{action.error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={action.pending} className="min-h-11 rounded-xl border border-border px-4 disabled:opacity-50">Keep Trying</AlertDialogCancel>
          <button type="button" disabled={disabled || action.pending || !eligible || !affordable} onClick={confirm} className="min-h-11 rounded-xl bg-primary px-4 font-bold text-primary-foreground disabled:opacity-50">{action.pending ? 'Saving…' : `Confirm · ${price.toLocaleString()} Gems`}</button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}