import React from 'react';
import { Check, Gem, Lock } from 'lucide-react';
import { RARITY_STYLE } from '@/game/skins/catalog';
import SkinPreview from '@/components/game/shop/SkinPreview';

export default function SkinCard({ skin, owned, equipped, onSelect, reduced }) {
  return (
    <button type="button" onClick={onSelect} aria-label={`Inspect ${skin.name}, ${equipped ? 'equipped' : owned ? 'owned' : `${skin.price} gems`}`}
      className={`group relative overflow-hidden rounded-2xl border text-left transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${RARITY_STYLE[skin.rarity]}`}>
      <div className="flex items-center justify-between px-3 pt-3 text-[9px] font-bold uppercase tracking-widest"><span>{skin.rarity}</span>{owned && <Check size={14} />}</div>
      <SkinPreview skinId={skin.id} reduced={reduced} />
      <div className="border-t border-border/50 bg-card/80 p-3">
        <h3 className="font-heading text-xs text-foreground sm:text-sm">{skin.name}</h3>
        <div className="mt-2 flex items-center gap-1 text-xs"><Gem size={13} />{skin.price === 0 ? 'Free' : `${skin.price.toLocaleString()} gems`}</div>
        <div className="mt-2 flex items-center gap-1 text-[11px]">
          {equipped && owned ? <><Check size={13} />Equipped</> : owned ? 'Owned · Equip' : skin.price === 0 ? 'Default · Claim free' : <><Lock size={12} />Not owned</>}
        </div>
        <span className="mt-2 block text-[10px] text-muted-foreground">Inspect skin →</span>
      </div>
    </button>
  );
}