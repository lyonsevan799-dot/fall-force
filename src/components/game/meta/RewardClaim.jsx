import React, { useState } from 'react';
import { Check, Gem, Loader2 } from 'lucide-react';

export default function RewardClaim({ reward, completed, claimed, onClaim }) {
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  const claim = async () => {
    if (pending) return;
    setPending(true); setError('');
    try { if (!await onClaim()) setError('Reward could not be saved. Nothing was credited; please try again.'); }
    catch { setError('Reward could not be saved. Please try again.'); }
    finally { setPending(false); }
  };
  return <div className="mt-5"><button type="button" disabled={!completed || claimed || pending} onClick={claim}
    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 font-heading text-[10px] uppercase tracking-widest text-primary transition-colors hover:bg-primary/20 disabled:opacity-50">
    {pending ? <Loader2 size={14} className="animate-spin" /> : claimed ? <Check size={14} /> : <Gem size={14} />}
    {claimed ? `Claimed · ${reward.toLocaleString()} gems` : pending ? 'Saving…' : `${completed ? 'Claim' : 'Reward'} ${reward.toLocaleString()} gems`}
  </button>{error ? <p role="alert" className="mt-2 text-xs text-destructive">{error}</p> : null}</div>;
}