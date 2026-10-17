import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameLifecycle } from '@/hooks/useGameLifecycle';
import createTrialScene from '@/game/timeTrial/scene';

const ready = { state: 'ready', timeMs: 0, bestMs: null, splitDelta: null, ghostAvailable: false, ghostHint: 'Preparing personal recording…' };
export default function useTimeTrial(options) {
  const engineRef = useRef(null), canvasRef = useRef(null), wrapRef = useRef(null), current = useRef(options);
  current.current = options;
  const [ui, setUi] = useState(ready), [paused, setPaused] = useState(false), [attempt, setAttempt] = useState(0);
  useGameLifecycle(engineRef, setPaused, options.levelIndex + 1);
  useEffect(() => {
    const scene = createTrialScene({ canvas: canvasRef.current, wrap: wrapRef.current,
      options: () => current.current, onUi: setUi, onPaused: setPaused, onFinish: (run) => current.current.onFinish(run) });
    engineRef.current = scene.engine; setPaused(false);
    return () => { scene.destroy(); engineRef.current = null; };
  }, [options.levelIndex, options.sound, attempt]);
  const retry = useCallback(() => { setUi(ready); setPaused(false); setAttempt((value) => value + 1); }, []);
  return { engineRef, canvasRef, wrapRef, ui, paused, setPaused, retry };
}