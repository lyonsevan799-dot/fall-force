import React from 'react';
import { ArrowLeft, Gem, ShoppingBag } from 'lucide-react';
import { RARITIES } from '@/game/skins/catalog';

export default function ShopHeader({ save, target, setTarget, view, setView, rarity, setRarity, onBack }) {
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><button type="button" onClick={onBack} aria-label="Back to main menu" className="min-h-11 min-w-11 rounded-xl border border-border bg-card"><ArrowLeft className="mx-auto" size={18} /></button><div><h1 className="flex items-center gap-2 font-heading text-xl sm:text-3xl"><ShoppingBag className="text-primary" />Skin Shop</h1><p className="mt-1 text-xs text-muted-foreground">A new look. The same gravity-defying runner.</p></div></div>
        <div className="rounded-2xl border border-primary/40 bg-primary/10 px-5 py-3"><span className="text-[9px] uppercase tracking-widest text-muted-foreground">Your saved gems</span><div className="flex items-center gap-2 font-heading text-xl text-primary"><Gem size={22} />{save.totalGems.toLocaleString()}</div></div>
      </header>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-border bg-card p-1">{['Shop', 'My Skins'].map((v) => <button type="button" key={v} aria-pressed={view === v} onClick={() => setView(v)} className={`min-h-11 rounded-lg px-4 text-xs font-bold ${view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{v}{v === 'My Skins' ? ` (${new Set(['classic', ...save.ownedSkins]).size})` : ''}</button>)}</div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">Equip for <select value={target} onChange={(e) => setTarget(e.target.value)} className="min-h-11 rounded-xl border border-border bg-card px-3 text-foreground"><option value="solo">Solo (Career / Endless / Tutorial)</option><option value="p1">Race Player 1</option><option value="p2">Race Player 2</option></select></label>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">Race players keep independent skins. Changing Solo or one Race player's skin never changes the other selections.</p>
      <nav aria-label="Skin rarity" className="mt-4 flex gap-2 overflow-x-auto pb-2">{RARITIES.map((r) => <button type="button" key={r} aria-pressed={rarity === r} onClick={() => setRarity(r)} className={`min-h-11 shrink-0 rounded-full border px-4 text-[11px] ${rarity === r ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>{r}</button>)}</nav>
    </>
  );
}