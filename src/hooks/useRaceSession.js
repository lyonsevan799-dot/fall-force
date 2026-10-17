import { useEffect, useRef, useState } from 'react';
import { RaceEngine } from '@/game/raceEngine';
import { renderRace } from '@/game/render';
import { createRaceSeries, recordRaceRound } from '@/game/race/series';
import { setGameplay, setLevelContext } from '@/game/platform/gameEvents';
import useAdGameplay from '@/hooks/useAdGameplay';
import { isAdBusy } from '@/game/platform/ads/session';

export default function useRaceSession(options, wrapRef, canvasRef) {
  const engineRef = useRef(null), actionsRef = useRef(null), latest = useRef(options);
  latest.current = options;
  const seriesRef = useRef(createRaceSeries());
  const [series, setSeries] = useState(seriesRef.current), [ui, setUi] = useState({ state: 'ready', countdown: 3 });
  const [paused, setPaused] = useState(false), [bank, setBank] = useState('idle');
  const [touch, setTouch] = useState(false), [rotate, setRotate] = useState(false);
  useAdGameplay(engineRef, setPaused);
  useEffect(() => {
    const engine = new RaceEngine({ sound: options.sound, settings: options.displaySettings || options.settings, levelIndex: options.levelIndex });
    engine.skinIds = latest.current.skinIds; engineRef.current = engine;
    let disposed = false, raf = 0, epoch = 0, bankEpoch = 0, reported = null, last = 0, sync = 0, state = '';
    let width = 1, height = 1, dpr = 1;
    const ctx = canvasRef.current.getContext('2d', { alpha: false });
    const draw = () => renderRace(ctx, engine, width, height, dpr);
    const publish = () => {
      const [a, b] = engine.players;
      setUi({ state: engine.state, countdown: engine.countdown, raceTime: engine.raceTime, winner: engine.winner,
        p1: engine.getProgress(a), p2: engine.getProgress(b), p1Alive: a.alive, p2Alive: b.alive,
        p1Finished: a.finished, p2Finished: b.finished, p1Time: a.finishTime, p2Time: b.finishTime,
        p1Deaths: a.deaths, p2Deaths: b.deaths, ...engine.result });
      setGameplay(!engine.paused && ['countdown', 'racing'].includes(engine.state));
    };
    const save = () => {
      if (!engine.result) return;
      const result = engine.result, token = ++bankEpoch;
      setBank('saving');
      Promise.resolve().then(() => latest.current.onRaceWin(result)).then((saved) => {
        if (!disposed && token === bankEpoch) setBank(saved ? 'saved' : 'error');
      }).catch(() => { if (!disposed && token === bankEpoch) setBank('error'); });
    };
    const stop = () => { epoch++; cancelAnimationFrame(raf); raf = 0; };
    const run = () => {
      stop(); const token = epoch; last = performance.now(); sync = 0; state = '';
      const tick = (now) => {
        if (disposed || token !== epoch) return;
        engine.update((now - last) / 1000); last = now; draw();
        if (state !== engine.state || now - sync >= 70) { state = engine.state; sync = now; publish(); }
        if (engine.state === 'raceover') {
          if (reported !== engine.runId) {
            reported = engine.runId;
            seriesRef.current = recordRaceRound(seriesRef.current, engine.result); setSeries(seriesRef.current); save();
          }
          return; // No simulation or frame chain behind results.
        }
        if (!disposed && token === epoch) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      if (isAdBusy()) return;
      if (!['countdown', 'racing'].includes(engine.state) || engine.paused) return;
      engine.paused = true; setPaused(true); setGameplay(false);
    };
    const resize = () => {
      if (disposed || !wrapRef.current) return;
      width = Math.max(1, wrapRef.current.clientWidth); height = Math.max(1, wrapRef.current.clientHeight);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvasRef.current.width = Math.floor(width * dpr); canvasRef.current.height = Math.floor(height * dpr);
      const coarse = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
      setTouch(coarse); setRotate(coarse && height > width);
      if (coarse && height > width) pause();
      draw();
    };
    const visibility = () => { if (document.hidden) pause(); };
    actionsRef.current = {
      start: () => { options.sound.init(); options.sound.resume(); engine.start(); publish(); },
      togglePause: () => {
        if (!['countdown', 'racing'].includes(engine.state)) return;
        engine.paused = !engine.paused; setPaused(engine.paused); publish();
      },
      rematch: () => {
        if (engine.state === 'finished') return;
        stop(); bankEpoch++;
        if (seriesRef.current.complete) { seriesRef.current = createRaceSeries(seriesRef.current.bestOfThree); setSeries(seriesRef.current); }
        options.sound.init(); options.sound.resume(); engine.load(options.levelIndex); engine.skinIds = latest.current.skinIds;
        reported = null; setPaused(false); setBank('idle'); engine.start(); publish(); run();
      },
      setFormat: (bestOfThree) => {
        if (engine.state !== 'ready' || seriesRef.current.rounds.length) return;
        seriesRef.current = createRaceSeries(bestOfThree); setSeries(seriesRef.current);
      },
      retrySave: save,
      exit: () => { stop(); setGameplay(false); latest.current.onExit(); },
      dismissRotate: () => setRotate(false),
    };
    resize(); publish(); run(); setLevelContext(options.levelIndex + 1);
    const observer = new ResizeObserver(resize); observer.observe(wrapRef.current);
    window.addEventListener('resize', resize); window.addEventListener('orientationchange', resize); window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      disposed = true; bankEpoch++; stop(); observer.disconnect();
      window.removeEventListener('resize', resize); window.removeEventListener('orientationchange', resize); window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', visibility);
      setGameplay(false); setLevelContext(null); engineRef.current = null; actionsRef.current = null;
    };
  }, [options.levelIndex, options.sound]);
  useEffect(() => {
    if (engineRef.current) { engineRef.current.settings = options.displaySettings || options.settings; engineRef.current.skinIds = options.skinIds; }
  }, [options.displaySettings, options.settings, options.skinIds]);
  return { engineRef, actionsRef, ui, series, paused, bank, touch, rotate };
}