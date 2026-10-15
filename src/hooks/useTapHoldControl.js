import { useRef, useCallback } from 'react';

// Unified tap/hold control: a quick tap flips gravity; pressing and holding
// near a gem row engages Gem Rush. When no row is nearby, taps flip instantly
// with no delay — the hold threshold only applies when a rush is possible, so
// normal play stays responsive.
const HOLD_MS = 150;

export function useTapHoldControl({ engineRef, sound, onFlip, onDeadTap }) {
  const pressRef = useRef(null);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    const eng = engineRef.current;
    if (!eng || eng.paused) return;
    sound.init();
    sound.resume();
    if (eng.state === 'complete') return;
    if (eng.state === 'dead') { if (onDeadTap) onDeadTap(); return; }
    if (eng.state === 'dying') return;
    const canRush = eng.rushAvailable || !!eng.rush;
    if (!canRush) {
      if (onFlip) onFlip();
      pressRef.current = { didFlip: true, holdTimer: null, holdConfirmed: false };
      return;
    }
    eng.rushHeld = true;
    const p = { didFlip: false, holdTimer: null, holdConfirmed: false };
    p.holdTimer = setTimeout(() => { p.holdConfirmed = true; }, HOLD_MS);
    pressRef.current = p;
  }, [engineRef, sound, onFlip, onDeadTap]);

  const onPointerUp = useCallback(() => {
    const p = pressRef.current;
    const eng = engineRef.current;
    if (eng) eng.rushHeld = false;
    if (!p) return;
    if (p.holdTimer) { clearTimeout(p.holdTimer); p.holdTimer = null; }
    if (!p.didFlip && !p.holdConfirmed) {
      if (eng && !eng.paused && (eng.state === 'playing' || eng.state === 'intro') && onFlip) onFlip();
    }
    pressRef.current = null;
  }, [engineRef, onFlip]);

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onPointerLeave: onPointerUp,
  };
}