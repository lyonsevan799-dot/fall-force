import React, { useRef, useState } from 'react';
import { FastForward } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { LEVELS } from '@/game/levels';
import { groupForLevel } from '@/game/groups';
import { skipLevel } from '@/game/skipLevel/purchases';
import { skipPrice, canSkip } from '@/game/skipLevel/catalog';
import useSkipPurchase from '@/hooks/useSkipPurchase';
export default function SkipLevelControl({ save, levelIndex, updateSave, onSkipped, onBusyChange }) {
  const [open, setOpen] = useState(false), action = useSkipPurchase(updateSave);
  const receipt = useRef(null);
  const price = skipPrice(levelIndex), eligible = canSkip(save, levelIndex), affordable = save.totalGems >= price;
  const confirm = async () => {
    if (!receipt.current) receipt.current = crypto.randomUUID();
    onBusyChange?.(true);
    const next = await action.perform((latest) => skipLevel(latest, levelIndex, receipt.current));
    onBusyChange?.(false);
    if (next) { setOpen(false); onSkipped?.(levelIndex); }
  };
  return <div className="mt-3">
    <button type="button" disabled={action.pending || !eligible || !affordable} onClick={() => setOpen(true)} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-race-two/50 bg-race-two/10 px-4 text-sm font-bold text-race-two disabled:opacity-50"><FastForward size={17} />{action.pending ? 'Saving…' : `Skip Level · ${price.toLocaleString()} gems`}</button>
    <p className="mt-2 text-xs text-muted-foreground">{groupForLevel(levelIndex).name} · Balance: {save.totalGems.toLocaleString()} gems{!affordable ? ` · You need ${(price - save.totalGems).toLocaleString()} more gems.` : ''}</p>
    {action.error && <p role="alert" className="mt-2 text-xs text-race-two">{action.error}</p>}
    <AlertDialog open={open} onOpenChange={(value) => { if (!action.pending) setOpen(value); }}>
      <AlertDialogContent className="shop-shell max-h-[90dvh] overflow-y-auto border-border bg-card text-foreground">
        <AlertDialogHeader><AlertDialogTitle>Skip Level {levelIndex + 1}?</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground">{LEVELS[levelIndex].name} · {groupForLevel(levelIndex).name}<br />Spend exactly {price.toLocaleString()} gems to skip only this level. No level gems, stars, completion achievements or challenge rewards are awarded. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
        <p className="text-sm">After purchase: {Math.max(0, save.totalGems - price).toLocaleString()} gems</p>
        {action.error && <p role="alert" className="text-sm text-race-two">{action.error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={action.pending} className="min-h-11 rounded-xl border border-border px-4 disabled:opacity-50">Keep Trying</AlertDialogCancel>
          <button type="button" disabled={action.pending || !eligible || !affordable} onClick={confirm} className="min-h-11 rounded-xl bg-primary px-4 font-bold text-primary-foreground disabled:opacity-50">{action.pending ? 'Saving…' : `Confirm · ${price.toLocaleString()} gems`}</button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}