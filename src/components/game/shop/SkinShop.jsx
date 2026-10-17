import React, { useRef, useState } from 'react';
import { SKINS } from '@/game/skins/catalog';
import { equipSkin, purchaseSkin, skinForTarget } from '@/game/skins/inventory';
import ShopHeader from '@/components/game/shop/ShopHeader';
import SkinCard from '@/components/game/shop/SkinCard';
import SkinDetail from '@/components/game/shop/SkinDetail';

export default function SkinShop({ save, updateSave, sound, onBack }) {
  const [view, setView] = useState('Shop'), [rarity, setRarity] = useState('All Skins'), [target, setTarget] = useState('solo');
  const [selected, setSelected] = useState(null), [pending, setPending] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const busy = useRef(false);
  const select = (skin) => { setSelected(skin); setMessage(''); setError(''); sound.init(); sound.resume(); sound.sfx('click'); };
  const perform = async (buy) => {
    if (busy.current || !selected) return;
    busy.current = true; setPending(true); setError(''); setMessage('');
    try {
      let charged = 0, alreadyOwned = false;
      await updateSave((latest) => { if (buy) { alreadyOwned = latest.ownedSkins.includes(selected.id); charged = alreadyOwned ? 0 : selected.price; return purchaseSkin(latest, selected.id); } return equipSkin(latest, selected.id, target); });
      setMessage(buy ? `${selected.name} ${alreadyOwned ? 'is already owned · no gems spent' : `added to My Skins${charged ? ` · −${charged.toLocaleString()} gems` : ' · Free'}`}. Your collection is saved.` : `${selected.name} equipped for ${target === 'solo' ? 'Solo / Tutorial' : target === 'p1' ? 'Race Player 1' : 'Race Player 2'}.`);
      // Optional sound must never turn a committed purchase into a failure.
      try { sound.init(); sound.resume(); sound.sfx(buy ? 'rush' : 'switch'); } catch (_) { /* audio may be unavailable */ }
    } catch (e) { setError(e.message); }
    finally { busy.current = false; setPending(false); }
  };
  const visible = SKINS.filter((s) => (rarity === 'All Skins' || s.rarity === rarity) && (view === 'Shop' || s.id === 'classic' || save.ownedSkins.includes(s.id)));
  return (
    <section className="shop-shell relative min-h-screen bg-background text-foreground">
      <div className="gs-grid pointer-events-none absolute inset-0 opacity-20" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        <ShopHeader save={save} target={target} setTarget={setTarget} view={view} setView={setView} rarity={rarity} setRarity={setRarity} onBack={onBack} />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{visible.map((skin) => <SkinCard key={skin.id} skin={skin} owned={save.ownedSkins.includes(skin.id)} equipped={skinForTarget(save, target) === skin.id && (skin.id === 'classic' || save.ownedSkins.includes(skin.id))} onSelect={() => select(skin)} reduced={save.settings.reduced} />)}</div>
        {!visible.length && <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No owned skins in this category yet. Browse Shop to find your next look.</p>}
        <p className="mt-6 text-center text-xs text-muted-foreground">Earn gems in levels, Gem Rush and challenges. Purchases and skins stay in this browser's existing game save.</p>
      </div>
      {selected && <SkinDetail key={selected.id} skin={selected} owned={save.ownedSkins.includes(selected.id)} equipped={skinForTarget(save, target) === selected.id} balance={save.totalGems} pending={pending} message={message} error={error} reduced={save.settings.reduced} onBuy={() => perform(true)} onEquip={() => perform(false)} onClose={() => { if (!busy.current) setSelected(null); }} />}
    </section>
  );
}