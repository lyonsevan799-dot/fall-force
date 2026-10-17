import React, { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { bannersEnabled, clearBanner, requestMenuBanner } from '@/game/platform/ads/bannerAds';
import { getAdState, subscribeAds } from '@/game/platform/ads/session';

export default function MenuBanner() {
  const id = `shop-ad-${useId().replace(/:/g, '')}`, ref = useRef(null);
  const [failed, setFailed] = useState(false), state = useSyncExternalStore(subscribeAds, getAdState);
  const enabled = bannersEnabled() && !state.busy && !failed;
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const element = ref.current;
    let disposed = false, requested = false, timer;
    const observer = new IntersectionObserver(([entry]) => {
      clearTimeout(timer);
      if (!entry.isIntersecting || entry.intersectionRatio < 1 || document.hidden) { clearBanner(id); if (requested) setFailed(true); return; }
      if (requested) return;
      timer = setTimeout(async () => {
        if (disposed) return;
        requested = true;
        const shown = await requestMenuBanner(element);
        if (disposed) clearBanner(id); else if (!shown) setFailed(true);
      }, 5000); // Useful menu content has been visible, not a transient gameplay break.
    }, { threshold: [0, 1] });
    const hide = () => { if (document.hidden) { clearTimeout(timer); clearBanner(id); if (requested) setFailed(true); } };
    observer.observe(element); document.addEventListener('visibilitychange', hide);
    return () => { disposed = true; clearTimeout(timer); observer.disconnect(); document.removeEventListener('visibilitychange', hide); clearBanner(id); };
  }, [enabled, id]);
  if (!enabled) return null;
  return <aside className="mx-auto mt-5 w-80 max-w-full" aria-label="Advertisement"><p className="mb-1 text-center text-[10px] text-muted-foreground">Advertisement</p><div ref={ref} id={id} className="h-[50px] w-80 max-w-full" /></aside>;
}