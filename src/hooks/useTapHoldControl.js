import { useCallback } from 'react';

// Tap to flip gravity. Gem Rush is now activated automatically by collecting
// a special trigger gem — no hold gesture is needed, so every tap just flips.
export function useTapHoldControl({ engineRef, sound, onFlip, onDeadTap }) {
  const onPointerDown = useCallback((e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target instanceof Element && e.target.closest('button, input, select, textarea, a, [role="button"]')) return;
    e.preventDefault();
    const eng = engineRef.current;
    if (!eng || eng.paused) return;
    sound.init();
    sound.resume();
    if (eng.state === 'complete') return;
    if (eng.state === 'dead') { if (onDeadTap) onDeadTap(); return; }
    if (eng.state === 'dying') return;
    if (onFlip) onFlip();
  }, [engineRef, sound, onFlip, onDeadTap]);

  const noop = useCallback(() => {}, []);

  return {
    onPointerDown,
    onPointerUp: noop,
    onPointerCancel: noop,
    onPointerLeave: noop,
  };
}