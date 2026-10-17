import React, { useState } from 'react';
import { X, Gem } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RARITY_STYLE } from '@/game/skins/catalog';
import SkinPreview from '@/components/game/shop/SkinPreview';

export default function SkinDetail({ skin, targetLabel, owned, equipped, balance, pending, message, error, reduced, onBuy, onEquip, onClose }) {
  const [confirm, setConfirm] = useState(false), [rotation, setRotation] = useState(0);
  const missing = Math.max(0, skin.price - balance);
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <DialogContent className="shop-shell max-h-[92dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-3xl border-border bg-card p-5 text-foreground [&>button:last-child]:hidden" onEscapeKeyDown={(e) => { if (pending) e.preventDefault(); }} onPointerDownOutside={(e) => { if (pending) e.preventDefault(); }}>
        <button type="button" disabled={pending} onClick={onClose} aria-label="Close skin preview" className="absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border"><X size={18} /></button>
        <span className={`mr-auto rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${RARITY_STYLE[skin.rarity]}`}>{skin.rarity}</span>
        <DialogTitle className="font-heading text-2xl">{skin.name}</DialogTitle>
        <DialogDescription className="text-xs leading-relaxed text-muted-foreground">{skin.detail} Cosmetic only: identical speed, movement and hitbox.</DialogDescription>
        <div key={`${skin.id}-${owned}`} className={`gs-pop rounded-2xl border ${RARITY_STYLE[skin.rarity]}`}><SkinPreview skinId={skin.id} large rotation={rotation} reduced={reduced} /></div>
        <label className="flex items-center gap-3 text-xs text-muted-foreground">Rotate preview<input aria-label="Rotate skin preview" type="range" min="-180" max="180" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="h-8 min-w-0 flex-1 accent-primary" /></label>
        {error && <p role="alert" className="rounded-xl border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="gs-pop rounded-xl border border-primary/50 bg-primary/10 p-3 text-sm text-primary">{message}</p>}
        {confirm && !owned && <div className="rounded-xl border border-primary/40 bg-background p-3 text-sm"><strong>Buy {skin.name} for {skin.price.toLocaleString()} gems?</strong><p className="mt-1 text-xs text-muted-foreground">{missing ? `You need ${missing.toLocaleString()} more gems to continue.` : `Balance after purchase: ${(balance - skin.price).toLocaleString()} gems.`} This purchase does not change the equipped skin. No real money is used.</p></div>}
        {owned ? <button type="button" disabled={pending || equipped} onClick={onEquip} className="min-h-12 rounded-xl bg-primary p-3 font-bold text-primary-foreground disabled:opacity-50">{pending ? 'Saving…' : equipped ? 'Equipped' : `Equip for ${targetLabel}`}</button> : <button type="button" disabled={pending || missing > 0} onClick={() => skin.price > 0 && !confirm ? setConfirm(true) : onBuy()} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary p-3 font-bold text-primary-foreground disabled:opacity-50">{pending ? 'Saving…' : missing ? `Need ${missing.toLocaleString()} more gems` : skin.price === 0 ? 'Claim Free Classic' : <><Gem size={17} />{confirm ? 'Confirm Purchase' : 'Buy'} · {skin.price.toLocaleString()}</>}</button>}
        {confirm && !owned && <button type="button" disabled={pending} onClick={() => setConfirm(false)} className="min-h-11 text-xs text-muted-foreground">Cancel Purchase</button>}
      </DialogContent>
    </Dialog>
  );
}