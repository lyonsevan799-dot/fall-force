import { useEffect, useRef, useState } from 'react';
import { EndlessEngine } from '@/game/endlessEngine';
import SurvivalEngine from '@/game/SurvivalEngine';
import { render } from '@/game/render';
import { flushProgressEvents, recordRunOutcome } from '@/game/meta/events';
import { setGameplay, setLevelContext } from '@/game/platform/gameEvents';
import createRunLoop from '@/game/procedural/createRunLoop';
import useAdGameplay from '@/hooks/useAdGameplay';
import { isAdBusy } from '@/game/platform/ads/session';

export default function useProceduralRun(props, mode, wrapRef, canvasRef, leaderboard) {
  const engineRef = useRef(null), actionsRef = useRef(null), latest = useRef({ props, leaderboard });
  latest.current = { props, leaderboard };
  const [ui, setUi] = useState({ state: 'intro', score: 0, gems: 0, time: 0 });
  const [paused, setPaused] = useState(false), [ready, setReady] = useState(mode === 'survival');
  const [bank, setBank] = useState('idle');
  useAdGameplay(engineRef, setPaused);
  useEffect(() => {
    const EngineClass = mode === 'survival' ? SurvivalEngine : EndlessEngine;
    const engine = new EngineClass({ sound: props.sound, settings: props.displaySettings || props.settings });
    engineRef.current = engine;
    let disposed = false, isReady = mode === 'survival', reported = null, bankEpoch = 0, focusPaused = false;
    let width = 1, height = 1, dpr = 1;
    const canvas = canvasRef.current, ctx = canvas.getContext('2d', { alpha: false });
    const draw = () => render(ctx, engine, width, height, dpr);
    const publish = () => {
      flushProgressEvents(engine);
      setUi({ ...engine.ui, isNewBest: engine.score > engine.best && engine.score > 0 });
      if (!focusPaused || !engine.paused) {
        focusPaused = false; setGameplay(!engine.paused && ['intro', 'playing'].includes(engine.state));
      }
    };
    const bankRun = (result) => {
      const epoch = ++bankEpoch;
      setBank('saving');
      return Promise.resolve(latest.current.props.onResult(result.score, result.gems, result.records)).then((saved) => {
        if (!disposed && epoch === bankEpoch) setBank(saved ? 'saved' : 'error');
      }).catch(() => { if (!disposed && epoch === bankEpoch) setBank('error'); });
    };
    const finish = (reason = 'death') => {
      if (reported?.records.runId === engine.runId) return;
      flushProgressEvents(engine);
      if (reason !== 'death') recordRunOutcome(engine, 'quit');
      reported = { score: Math.floor(engine.score), gems: engine.gems,
        records: { runId: engine.runId, time: engine.attemptTime, distance: Math.floor(engine.distanceTravelled / 10),
          maxStreak: engine.maxStreak, reason } };
      setGameplay(false);
      if (reason === 'death' && mode === 'endless') latest.current.leaderboard?.finish(engine);
      void bankRun(reported);
    };
    const loop = createRunLoop({ engine, draw, publish, onEnd: finish });
    const resize = () => {
      if (disposed || !wrapRef.current) return;
      width = Math.max(1, wrapRef.current.clientWidth); height = Math.max(1, wrapRef.current.clientHeight);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
      engine.lookAhead = Math.min(12000, Math.max(4000, width / height * 700 + 1000));
      draw();
    };
    const load = (retry = false) => {
      loop.stop(); bankEpoch++; focusPaused = false;
      const best = Math.max(latest.current.props.best || 0, engine.score || 0);
      engine.loadEndless(best, retry); engine.skinId = latest.current.props.skinId;
      engine.paused = isReady; reported = null;
      setBank('idle'); setPaused(false); setReady(isReady);
      if (mode === 'endless') latest.current.leaderboard?.begin(engine);
      publish(); draw(); loop.start();
    };
    const pause = () => {
      if (isAdBusy()) return;
      if (isReady || engine.paused || !['intro', 'playing'].includes(engine.state)) return;
      focusPaused = true; engine.paused = true; setPaused(true);
    };
    const visibility = () => { if (document.hidden) pause(); };
    actionsRef.current = {
      isReady: () => isReady,
      start: () => { props.sound.init(); props.sound.resume(); isReady = false; engine.paused = false; setReady(false); },
      togglePause: () => {
        if (isReady || !['intro', 'playing'].includes(engine.state)) return;
        focusPaused = false; engine.paused = !engine.paused; setPaused(engine.paused);
        setGameplay(!engine.paused);
      },
      restart: () => {
        if (['playing', 'dying'].includes(engine.state)) finish('restart');
        props.sound.init(); props.sound.resume(); isReady = false; load(true);
      },
      retrySave: () => { if (reported) void bankRun(reported); },
      exit: () => {
        loop.stop();
        if (engine.state !== 'dead' && !isReady) finish('exit');
        setGameplay(false); latest.current.props.onExit();
      },
    };
    engine.loadEndless(props.best || 0); engine.skinId = props.skinId; engine.paused = isReady;
    resize();
    if (mode === 'endless') latest.current.leaderboard?.begin(engine);
    publish(); loop.start(); setLevelContext(null);
    const observer = new ResizeObserver(resize); observer.observe(wrapRef.current);
    window.addEventListener('resize', resize); window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      disposed = true; bankEpoch++; loop.dispose(); observer.disconnect();
      window.removeEventListener('resize', resize); window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', visibility);
      setGameplay(false); engineRef.current = null; actionsRef.current = null;
    };
  }, [mode, props.sound]);
  useEffect(() => {
    if (engineRef.current) { engineRef.current.settings = props.displaySettings || props.settings; engineRef.current.skinId = props.skinId; }
  }, [props.displaySettings, props.settings, props.skinId]);
  return { engineRef, actionsRef, ui, paused, setPaused, ready, bank };
}