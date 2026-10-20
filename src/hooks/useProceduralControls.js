import { useEffect } from 'react';

export default function useProceduralControls(engineRef, actionsRef, sound) {
  const flip = () => {
    const engine = engineRef.current;
    if (!engine || engine.paused || !['intro', 'playing'].includes(engine.state)) return;
    sound.init(); sound.resume(); engine.switchGravity();
  };
  useEffect(() => {
    const key = (event) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || !actionsRef.current) return;
      const focused = event.target instanceof Element && event.target.closest('button, input, textarea, select, a, [role="button"], [contenteditable="true"]');
      if (focused && !['Escape', 'KeyP'].includes(event.code)) return;
      const actions = actionsRef.current, engine = engineRef.current;
      if (['Space', 'ArrowUp', 'ArrowDown', 'Enter'].includes(event.code)) {
        event.preventDefault();
        if (actions.isReady()) actions.start();
        else if (engine?.state === 'dead') actions.restart();
        else flip();
      } else if (event.code === 'KeyR') { event.preventDefault(); actions.restart(); }
      else if (['Escape', 'KeyP'].includes(event.code)) { event.preventDefault(); actions.togglePause(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [engineRef, actionsRef, sound]);
  return (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    if (!actionsRef.current?.isReady()) flip();
  };
}