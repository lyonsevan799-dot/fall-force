import { useCallback, useEffect } from 'react';
import { useTapHoldControl } from '@/hooks/useTapHoldControl';

export default function useTrialControls({ engineRef, sound, setPaused, retry, pending }) {
  const primary = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.paused) return;
    sound.init(); sound.resume();
    if (engine.state === 'ready') engine.start();
    else if (engine.state === 'playing') engine.switchGravity();
  }, [engineRef, sound]);
  const pause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || !['ready', 'playing'].includes(engine.state)) return;
    engine.paused = !engine.paused;
    if (!engine.paused) engine.resetFrameAt = performance.now();
    setPaused(engine.paused);
  }, [engineRef, setPaused]);
  useEffect(() => {
    const key = (event) => {
      if (event.repeat || event.target instanceof Element && event.target.closest('input,select,textarea,[contenteditable=true]')) return;
      if (['Escape', 'KeyP'].includes(event.code)) { event.preventDefault(); pause(); }
      else if (event.code === 'KeyR') { event.preventDefault(); if (!pending) retry(); }
      else if (['Space', 'ArrowUp', 'ArrowDown', 'Enter'].includes(event.code)
        && !(event.target instanceof Element && event.target.closest('button'))) { event.preventDefault(); primary(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [primary, pause, retry, pending]);
  const pointer = useTapHoldControl({ engineRef, sound, onFlip: primary });
  return { primary, pause, pointer };
}