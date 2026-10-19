import React, { useRef, useState } from 'react';
import { SKINS } from '@/game/skins/catalog';
import { equipSkin, purchaseSkin, skinForTarget, ownsSkin } from '@/game/skins/inventory';
import ShopHeader from '@/components/game/shop/ShopHeader';
import SkinCard from '@/components/game/shop/SkinCard';
import SkinDetail from '@/components/game/shop/SkinDetail';
import RewardedGemOffer from '@/components/game/ads/RewardedGemOffer';
import MenuBanner from '@/components/game/ads/MenuBanner';
import ShopPowers from '@/components/game/powers/ShopPowers';

export default function SkinShop({ save, updateSave, sound, onBack, powers, levelIndex, onSkipped }) {
  const [view, setView] = useState('Shop'), [rarity, setRarity] = useState('All Skins'), [target, setTarget] = useState('solo');
  const [selected, setSelected] = useState(null), [pending, setPending] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const busy = useRef(false);
  const targetLabel = target === 'solo' ? 'Solo modes' : target === 'p1' ? 'Race Player 1' : 'Race Player 2';
  const select = (skin) => { setSelected(skin); setMessage(''); setError(''); sound.init(); sound.resume(); sound.sfx('click'); };
  const perform = async (buy) => {
    if (busy.current || !selected) return;
    busy.current = true; setPending(true); setError(''); setMessage('');
    try {
      let charged = 0, alreadyOwned = false;
      await updateSave((latest) => { if (buy) { alreadyOwned = ownsSkin(latest, selected.id); charged = alreadyOwned ? 0 : selected.price; return purchaseSkin(latest, selected.id); } return equipSkin(latest, selected.id, target); });
      setMessage(buy ? `${selected.name} ${alreadyOwned ? 'is already owned · no gems spent' : `added to My Skins${charged ? ` · −${charged.toLocaleString()} gems` : ' · Free'}`}. Your collection is saved.` : `${selected.name} equipped for ${targetLabel}.`);
      // Optional sound must never turn a committed purchase into a failure.
      try { sound.init(); sound.resume(); sound.sfx(buy ? 'rush' : 'switch'); } catch (_) { /* audio may be unavailable */ }
    } catch (e) { setError(e.message); }
    finally { busy.current = false; setPending(false); }
  };
  const visible = SKINS.filter((s) => (rarity === 'All Skins' || s.rarity === rarity) && (view === 'Shop' || ownsSkin(save, s.id)));
  return (
    <section className="shop-shell relative min-h-screen bg-background text-foreground">
      <div className="gs-grid pointer-events-none absolute inset-0 opacity-20" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        <ShopHeader save={save} target={target} setTarget={setTarget} view={view} setView={setView} rarity={rarity} setRarity={setRarity} onBack={onBack} />
        <RewardedGemOffer updateSave={updateSave} />
        <ShopPowers save={save} updateSave={updateSave} powers={powers} levelIndex={levelIndex} onSkipped={onSkipped} />
        {!selected ? <MenuBanner /> : null}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{visible.map((skin) => <SkinCard key={skin.id} skin={skin} owned={ownsSkin(save, skin.id)} equipped={skinForTarget(save, target) === skin.id && ownsSkin(save, skin.id)} onSelect={() => select(skin)} reduced={save.settings.reduced} />)}</div>
        {!visible.length && <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">No owned skins in this category yet. Browse Shop to find your next look.</p>}
        <p className="mt-6 text-center text-xs text-muted-foreground">Earn optional gems in runs and challenges. Gems, purchases and equipped skins share the same game save across modes.</p>
      </div>
      {selected && <SkinDetail key={selected.id} skin={selected} targetLabel={targetLabel} owned={ownsSkin(save, selected.id)} equipped={skinForTarget(save, target) === selected.id} balance={save.totalGems} pending={pending} message={message} error={error} reduced={save.settings.reduced} onBuy={() => perform(true)} onEquip={() => perform(false)} onClose={() => { if (!busy.current) setSelected(null); }} />}
    </section>
  );
}