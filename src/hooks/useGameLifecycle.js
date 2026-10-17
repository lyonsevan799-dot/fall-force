import { useEffect } from 'react';
import { setGameplay, setLevelContext } from '@/game/platform/gameEvents';

// Pause every active mode on focus loss; require an explicit resume afterward.
export function useGameLifecycle(engineRef, setPaused, level = null) {
  useEffect(() => {
    let focusPaused = null, frame;
    setLevelContext(level);
    const observe = () => {
      const engine = engineRef.current;
      if (engine && !(focusPaused === engine && engine.paused)) {
        focusPaused = null;
        setGameplay(!engine.paused && !engine.waiting && ['intro', 'playing', 'racing', 'finished'].includes(engine.state));
      }
      frame = requestAnimationFrame(observe);
    };
    frame = requestAnimationFrame(observe);
    const pause = () => {
      const engine = engineRef.current;
      if (!engine || engine.paused || !['intro', 'playing', 'dying', 'racing', 'countdown', 'finished'].includes(engine.state)) return;
      // Preserve the SDK's lifecycle state on focus loss; CrazyGames handles focus itself.
      focusPaused = engine;
      engine.paused = true;
      setPaused(true);
    };
    const visibility = () => { if (document.hidden) pause(); };
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(frame);
      setGameplay(false); setLevelContext(null);
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [engineRef, setPaused, level]);
}