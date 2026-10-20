import React, { useEffect, useRef, useState } from 'react';
import { Film } from 'lucide-react';
import { AD_CONFIG } from '@/game/platform/ads/config';
import { getSaveSession } from '@/game/platform/saveStore';
import { requestVideoAd, videoAvailability } from '@/game/platform/ads/videoAds';
import creditAdReward, { getPendingAdReward, keepPendingAdReward, clearPendingAdReward } from '@/game/platform/ads/rewards';

export default function RewardedGemOffer({ updateSave }) {
  const busy = useRef(false), receipt = useRef(getPendingAdReward()), mounted = useRef(false), session = useRef(getSaveSession());
  const [pending, setPending] = useState(false), [message, setMessage] = useState(''), [retry, setRetry] = useState(!!getPendingAdReward()), [, refresh] = useState(0);
  useEffect(() => {
    mounted.current = true;
    const timer = AD_CONFIG.approved && AD_CONFIG.rewarded ? setInterval(() => refresh((value) => value + 1), 1000) : null;
    return () => { mounted.current = false; clearInterval(timer); };
  }, []);
  const access = videoAvailability('rewarded');
  const claim = async () => {
    if (busy.current) return;
    busy.current = true; setPending(true); setMessage('');
    try {
      const result = receipt.current || await requestVideoAd('rewarded');
      if (session.current !== getSaveSession()) return;
      if (result.status !== 'finished') { if (mounted.current) setMessage(`${result.message || 'Keep playing normally.'} No bonus gems were granted.`); return; }
      receipt.current = result; keepPendingAdReward(result);
      await updateSave((save) => creditAdReward(save, result));
      receipt.current = null; clearPendingAdReward(result.id);
      if (mounted.current) { setRetry(false); setMessage(`${AD_CONFIG.rewardGems} bonus gems added to your balance.`); }
    } catch { if (mounted.current) { setRetry(!!receipt.current); setMessage('The completed reward could not be saved. Retry saving without watching another ad.'); } }
    finally { busy.current = false; if (mounted.current) setPending(false); }
  };
  if (!retry && (!AD_CONFIG.approved || !AD_CONFIG.rewarded)) return null;
  return <section className="mt-5 rounded-2xl border border-border bg-card p-4" aria-label="Optional advertisement reward">
    <h2 className="font-heading text-sm">Optional bonus · {AD_CONFIG.rewardGems} gems</h2>
    <p className="mt-2 text-xs text-muted-foreground">Watch one advertisement to completion for {AD_CONFIG.rewardGems} bonus gems. All existing content stays playable without ads; gems can also be earned in runs.</p>
    <button type="button" disabled={pending || (!retry && !access.available)} onClick={claim} className="mt-3 flex min-h-11 items-center gap-2 rounded-xl border border-primary/50 px-4 py-2 text-sm text-primary disabled:cursor-not-allowed disabled:opacity-60"><Film size={16} />{pending ? 'Please wait…' : retry ? 'Save completed reward' : `Watch advertisement · +${AD_CONFIG.rewardGems} gems`}</button>
    <p role="status" className="mt-2 text-xs text-muted-foreground">{message || (!access.available ? access.message : 'Entirely optional. No gems are granted for failed advertisements.')}</p>
  </section>;
}