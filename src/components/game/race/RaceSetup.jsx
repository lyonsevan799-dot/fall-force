import React, { useRef, useState } from 'react';
import { SKINS } from '@/game/skins/catalog';

export default function RaceSetup({ series, onFormat, skinIds, ownedSkins, onEquipSkin, onBusy }) {
  const busy = useRef(false), [pending, setPending] = useState(false), [error, setError] = useState('');
  const equip = async (target, id) => {
    if (busy.current) return;
    busy.current = true; setPending(true); onBusy(true); setError('');
    try { if (!await onEquipSkin(target, id)) throw new Error('Could not save this skin selection. Please try again.'); }
    catch (cause) { setError(cause.message); }
    finally { busy.current = false; setPending(false); onBusy(false); }
  };
  return <div className="mt-4 space-y-3 text-left text-xs">
    <label className="block">Match format
      <select aria-label="Match format" value={series.bestOfThree ? 'series' : 'single'} disabled={series.rounds.length > 0} onChange={(event) => onFormat(event.target.value === 'series')} className="mt-1 w-full rounded-lg border border-border bg-card p-2 text-foreground">
        <option value="single">Single race</option><option value="series">Best of three · first to 2 wins</option>
      </select>
    </label>
    <div className="grid grid-cols-2 gap-3">{['p1', 'p2'].map((target, index) => <label key={target} className={index === 0 ? 'text-race-one' : 'text-race-two'}>Player {index + 1} skin
      <select aria-label={`Player ${index + 1} skin`} value={skinIds?.[index] || 'classic'} disabled={pending} onChange={(event) => equip(target, event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card p-2 text-foreground">
        {SKINS.filter((skin) => skin.id === 'classic' || ownedSkins?.includes(skin.id)).map((skin) => <option key={skin.id} value={skin.id}>{skin.name}</option>)}
      </select>
    </label>)}</div>
    <p className="text-muted-foreground">Owned skins only. P1 and P2 are saved independently; solo skins stay unchanged.</p>
    {pending ? <p role="status">Saving selection…</p> : null}{error ? <p role="alert">{error}</p> : null}
  </div>;
}