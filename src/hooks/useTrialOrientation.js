import { useEffect, useState } from 'react';

export default function useTrialOrientation(engineRef, setPaused) {
  const [portrait, setPortrait] = useState(false), [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const pause = () => {
      const engine = engineRef.current;
      if (engine?.state === 'playing') { engine.paused = true; setPaused(true); }
    };
    const check = () => {
      const touch = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
      const needed = touch && window.innerHeight > window.innerWidth;
      setPortrait(needed);
      if (needed) pause();
    };
    check();
    window.addEventListener('resize', check); window.addEventListener('orientationchange', check); window.addEventListener('pagehide', pause);
    return () => { window.removeEventListener('resize', check); window.removeEventListener('orientationchange', check); window.removeEventListener('pagehide', pause); };
  }, [engineRef, setPaused]);
  return { needsRotate: portrait && !dismissed, dismiss: () => setDismissed(true) };
}