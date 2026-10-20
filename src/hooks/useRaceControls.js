import { useEffect } from 'react';

export default function useRaceControls(engineRef, actionsRef, sound) {
  const flip = (index) => {
    const engine = engineRef.current;
    if (!engine || engine.paused || engine.state !== 'racing') return;
    sound.init(); sound.resume(); engine.switchPlayer(engine.players[index]);
  };
  useEffect(() => {
    const key = (event) => {
      const engine = engineRef.current, actions = actionsRef.current;
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || !engine || !actions) return;
      if (event.target instanceof Element && event.target.closest('input, select, textarea, [contenteditable="true"]')) return;
      if (event.code === 'KeyP') {
        event.preventDefault();
        if (engine.state === 'raceover' || engine.state === 'ready') actions.exit(); else actions.togglePause();
        return;
      }
      if (event.code === 'KeyR') { event.preventDefault(); actions.rematch(); return; }
      if (event.target instanceof Element && event.target.closest('button, a, [role="button"]') && ['Space', 'Enter'].includes(event.code)) return;
      const playerOne = event.code === 'Space' || ['w', 'z'].includes(event.key?.toLowerCase());
      if (playerOne || ['ArrowUp', 'Enter'].includes(event.code)) {
        event.preventDefault();
        if (engine.state === 'ready') actions.start();
        else if (playerOne) flip(0); else flip(1);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [engineRef, actionsRef, sound]);
  return (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    flip(event.clientX - bounds.left < bounds.width / 2 ? 0 : 1);
  };
}