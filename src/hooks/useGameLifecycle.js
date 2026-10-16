import { useEffect } from 'react';

// Pause every active mode on focus loss; require an explicit resume afterward.
export function useGameLifecycle(engineRef, setPaused) {
  useEffect(() => {
    const pause = () => {
      const engine = engineRef.current;
      if (!engine || engine.paused || !['intro', 'playing', 'dying', 'racing', 'countdown', 'finished'].includes(engine.state)) return;
      engine.paused = true;
      setPaused(true);
    };
    const visibility = () => { if (document.hidden) pause(); };
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [engineRef, setPaused]);
}