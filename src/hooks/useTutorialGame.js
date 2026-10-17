import { useCallback, useEffect, useRef, useState } from 'react';
import TutorialEngine from '@/game/tutorialEngine';
import { render } from '@/game/render';
import { flushProgressEvents } from '@/game/meta/events';
import { useGameLifecycle } from '@/hooks/useGameLifecycle';

export default function useTutorialGame({ sound, settings, skinId = 'classic', onComplete }) {
  const canvasRef = useRef(null), wrapRef = useRef(null), engineRef = useRef(null), completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const [ui, setUi] = useState({ state: 'playing', phase: 0, gems: 0, paused: false });
  const sync = () => {
    const e = engineRef.current;
    if (e) setUi((u) => u.state === e.state && u.phase === e.phase && u.gems === e.gems && u.paused === e.paused
      ? u : { state: e.state, phase: e.phase, gems: e.gems, paused: e.paused });
  };
  const setPaused = useCallback((paused) => setUi((u) => ({ ...u, paused })), []);
  useGameLifecycle(engineRef, setPaused, 0);
  useEffect(() => {
    const engine = new TutorialEngine({ sound, settings });
    engine.loadTutorial(); engine.skinId = skinId; engineRef.current = engine;
    const canvas = canvasRef.current, context = canvas.getContext('2d', { alpha: false });
    let width, height, dpr, raf, last = performance.now(), lastSync = 0, reported = false;
    const resize = () => {
      width = Math.max(1, wrapRef.current.clientWidth); height = Math.max(1, wrapRef.current.clientHeight);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
    };
    resize();
    const observer = new ResizeObserver(resize); observer.observe(wrapRef.current);
    const loop = (now) => {
      engine.update((now - last) / 1000); last = now;
      flushProgressEvents(engine);
      render(context, engine, width, height, dpr);
      if (engine.state === 'complete' && !reported) { reported = true; completeRef.current(engine.gems); }
      if (engine.state !== 'complete') reported = false;
      if (now - lastSync > 60) { sync(); lastSync = now; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); engineRef.current = null; };
  }, [sound]);
  useEffect(() => { if (engineRef.current) engineRef.current.settings = settings; }, [settings]);
  useEffect(() => { if (engineRef.current) engineRef.current.skinId = skinId; }, [skinId]);
  const act = (method) => {
    const e = engineRef.current; if (!e) return;
    sound.init(); sound.resume(); e[method](); sync();
  };
  const pause = () => { const e = engineRef.current; if (!e || e.state === 'complete') return; e.paused = !e.paused; sync(); };
  const restart = () => { const e = engineRef.current; if (!e) return; e.paused = false; act('loadTutorial'); };
  const flip = () => act('switchGravity');
  useEffect(() => {
    const onKey = (event) => {
      if (event.repeat || event.target instanceof Element && event.target.closest('button,input,select,textarea')) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'Enter'].includes(event.code)) { event.preventDefault(); flip(); }
      else if (['Escape', 'KeyP'].includes(event.code)) { event.preventDefault(); pause(); }
      else if (event.code === 'KeyR') { event.preventDefault(); restart(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sound]);
  return { canvasRef, wrapRef, ui, flip, pause, restart, proceed: () => act('proceed') };
}