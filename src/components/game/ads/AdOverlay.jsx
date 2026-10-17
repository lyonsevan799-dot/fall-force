import React, { useEffect, useSyncExternalStore } from 'react';
import { LoaderCircle } from 'lucide-react';
import { getAdState, isAdBusy, subscribeAds } from '@/game/platform/ads/session';

export default function AdOverlay() {
  const state = useSyncExternalStore(subscribeAds, getAdState);
  useEffect(() => {
    const blockKeys = (event) => { if (isAdBusy()) { event.preventDefault(); event.stopImmediatePropagation(); } };
    window.addEventListener('keydown', blockKeys, true);
    return () => window.removeEventListener('keydown', blockKeys, true);
  }, []);
  if (!state.busy) return null;
  return <div role="status" aria-live="polite" aria-busy="true" className="meta-shell fixed inset-0 z-[100] flex touch-none items-center justify-center bg-background/95 p-6 text-center text-foreground">
    <div><LoaderCircle className="mx-auto mb-4 h-6 w-6 motion-safe:animate-spin text-primary" /><p>{state.playing ? 'Advertisement in progress' : 'Checking advertisement availability…'}</p><p className="mt-2 text-xs text-muted-foreground">Your game progress is preserved.</p></div>
  </div>;
}