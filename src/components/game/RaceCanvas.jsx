import React, { useEffect, useRef, useState } from 'react';
import { RaceEngine } from '@/game/raceEngine';
import { renderRace } from '@/game/render';
import RaceHud from './RaceHud';
import RaceIntro from './RaceIntro';
import RaceResult from './RaceResult';
import PauseMenu from './PauseMenu';
import SettingsPanel from './SettingsPanel';
import RotateOverlay from './RotateOverlay';
import { useGameLifecycle } from '@/hooks/useGameLifecycle';

export default function RaceCanvas({ skinIds, levelIndex, settings, displaySettings, sound, totalGems, onRaceWin, onExit, onUpdateSettings, onResetProgress }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const cbRef = useRef({});
  const [ui, setUi] = useState({ state: 'ready', countdown: 3, raceTime: 0, winner: -1, p1: 0, p2: 0, p1Finished: false, p2Finished: false, p1Time: null, p2Time: null, p1Final: 0, p2Final: 0 });
  const [paused, setPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [needsRotate, setNeedsRotate] = useState(false);
  const [rotateDismissed, setRotateDismissed] = useState(false);
  const reportedWinRef = useRef(false);

  cbRef.current = { onExit, onRaceWin };
  useGameLifecycle(engineRef, setPaused, levelIndex + 1);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const eng = new RaceEngine({ sound, settings, levelIndex });
    eng.skinIds = skinIds;
    engineRef.current = eng;
    setPaused(false);
    setShowSettings(false);
    reportedWinRef.current = false;

    let dpr = Math.min(2, window.devicePixelRatio || 1);
    let cssW = 800, cssH = 600;
    const resize = () => {
      if (!wrap) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cssW = Math.max(1, wrap.clientWidth);
      cssH = Math.max(1, wrap.clientHeight);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    };
    resize();

    let raf = 0, last = performance.now(), lastSync = 0, lastState = '';
    const push = () => setUi({
      state: eng.state, countdown: eng.countdown, raceTime: eng.raceTime, winner: eng.winner,
      p1: eng.getProgress(eng.players[0]), p2: eng.getProgress(eng.players[1]),
      p1Finished: eng.players[0].finished, p2Finished: eng.players[1].finished,
      p1Time: eng.players[0].finishTime, p2Time: eng.players[1].finishTime,
      p1Final: eng.players[0].finalProgress, p2Final: eng.players[1].finalProgress,
      ...eng.result,
    });

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = (now - last) / 1000;
      last = now;
      if (!eng.paused) eng.update(dt);
      renderRace(ctx, eng, cssW, cssH, dpr);
      if (eng.state !== lastState) {
        lastState = eng.state; push(); lastSync = now;
        if (eng.state === 'raceover' && !reportedWinRef.current) {
          reportedWinRef.current = true;
          if (cbRef.current.onRaceWin && eng.result) cbRef.current.onRaceWin(eng.result);
        }
      } else if (now - lastSync > 100) { lastSync = now; push(); }
    };
    raf = requestAnimationFrame(loop);
    push();

    window.addEventListener('resize', resize);
    let ro = null;
    if (window.ResizeObserver && wrap) { ro = new ResizeObserver(resize); ro.observe(wrap); }
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); if (ro) ro.disconnect(); engineRef.current = null; };
  }, [levelIndex, sound]);

  // Live-update engine settings without restarting the race.
  useEffect(() => {
    const eng = engineRef.current;
    if (eng) eng.settings = displaySettings;
  }, [displaySettings]);

  useEffect(() => { if (engineRef.current) engineRef.current.skinIds = skinIds; }, [skinIds]);

  const startRace = () => { const eng = engineRef.current; if (!eng) return; sound.init(); sound.resume(); eng.start(); };
  const p1Switch = () => { const eng = engineRef.current; if (!eng) return; sound.init(); sound.resume(); eng.switchPlayer(eng.players[0]); };
  const p2Switch = () => { const eng = engineRef.current; if (!eng) return; sound.init(); sound.resume(); eng.switchPlayer(eng.players[1]); };

  const restart = () => { const eng = engineRef.current; if (!eng) return; eng.paused = false; eng.load(levelIndex); reportedWinRef.current = false; setPaused(false); setShowSettings(false); };
  const togglePause = () => { const eng = engineRef.current; if (!eng || eng.state === 'ready' || eng.state === 'raceover') return; const next = !eng.paused; eng.paused = next; setPaused(next); setShowSettings(false); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return;
      const eng = engineRef.current;
      if (!eng) return;
      if (e.target instanceof Element && e.target.closest('button, input, select, textarea')) return;
      if (eng.paused && e.code !== 'Escape' && e.code !== 'KeyP') return;
      sound.init(); sound.resume();
      if (e.code === 'KeyW' || e.code === 'Space') {
        e.preventDefault();
        if (eng.state === 'ready') startRace();
        else if (eng.state === 'racing' || eng.state === 'finished') p1Switch();
      } else if (e.code === 'ArrowUp' || e.code === 'Enter') {
        e.preventDefault();
        if (eng.state === 'ready') startRace();
        else if (eng.state === 'racing' || eng.state === 'finished') p2Switch();
      } else if (e.code === 'KeyR') {
        e.preventDefault(); restart();
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        if (eng.state === 'raceover') cbRef.current.onExit();
        else togglePause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [sound]);

  useEffect(() => {
    const check = () => {
      const coarse = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
      const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || coarse;
      setIsTouch(touch);
      setNeedsRotate(touch && window.innerWidth < 720 && window.innerHeight > window.innerWidth);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => { window.removeEventListener('resize', check); window.removeEventListener('orientationchange', check); };
  }, []);

  const showRotate = needsRotate && !rotateDismissed;
  const showGo = ui.state === 'racing' && ui.raceTime < 0.7;
  const countdownNum = Math.ceil(ui.countdown);
  const winnerColor = ui.winner === 0 ? '#7ff4ff' : '#ff9ec4';
  const winnerGlow = ui.winner === 0 ? '0 0 50px rgba(56,232,255,0.8)' : '0 0 50px rgba(255,62,165,0.8)';

  return (
    <div ref={wrapRef} className="gs-screen-in fixed inset-0 touch-none select-none overflow-hidden bg-[#04050c]">
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full touch-none"
        onPointerDown={(e) => {
          e.preventDefault();
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          const eng = engineRef.current;
          if (!eng || eng.paused) return;
          const bounds = e.currentTarget.getBoundingClientRect();
          if (e.clientX - bounds.left < bounds.width / 2) p1Switch(); else p2Switch();
        }} onContextMenu={(e) => e.preventDefault()} />

      {ui.state === 'racing' || ui.state === 'countdown' || ui.state === 'finished' ? (
        <RaceHud ui={ui} totalGems={totalGems} onPause={togglePause} sound={sound} />
      ) : null}

      {ui.state === 'ready' ? (
        <RaceIntro sound={sound} onStart={startRace} isTouch={isTouch} />
      ) : null}

      {ui.state === 'countdown' ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div key={countdownNum} className="gs-countdown font-heading text-8xl uppercase text-white sm:text-9xl"
            style={{ textShadow: '0 0 50px rgba(56,232,255,0.6), 0 0 100px rgba(255,62,165,0.3)' }}>
            {countdownNum}
          </div>
        </div>
      ) : null}

      {showGo ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="gs-go font-heading text-7xl uppercase tracking-[0.3em] text-cyan-200 sm:text-8xl"
            style={{ textShadow: '0 0 60px rgba(56,232,255,0.9), 0 0 120px rgba(56,232,255,0.4)' }}>GO!</div>
        </div>
      ) : null}

      {ui.state === 'finished' ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="gs-winner-banner font-heading text-5xl uppercase tracking-[0.15em] sm:text-6xl"
               style={{ color: winnerColor, textShadow: winnerGlow }}>
            {ui.winner === -1 ? 'Tie! No winner' : `Player ${ui.winner + 1} Wins!`}
          </div>
        </div>
      ) : null}

      {ui.state === 'raceover' ? (
        <RaceResult ui={ui} totalGems={totalGems} sound={sound} onRestart={restart} onExit={() => cbRef.current.onExit()} />
      ) : null}

      {isTouch && (ui.state === 'racing' || ui.state === 'finished') ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-around font-heading text-[10px] uppercase tracking-widest">
          <span className="text-cyan-200">P1 · Tap left half</span>
          <span className="text-pink-200">P2 · Tap right half</span>
        </div>
      ) : null}

      {paused && !showSettings ? (
        <PauseMenu title="Race" exitLabel="Exit to Menu" sound={sound} onResume={togglePause} onRestart={restart} onSettings={() => setShowSettings(true)} onExit={() => cbRef.current.onExit()} />
      ) : null}

      {showSettings ? (
        <SettingsPanel settings={displaySettings} sound={sound} onChange={onUpdateSettings} onReset={onResetProgress} onClose={() => setShowSettings(false)} />
      ) : null}

      {showRotate ? (
        <RotateOverlay onDismiss={() => { setRotateDismissed(true); const el = document.documentElement; if (!import.meta.env.CRAZYGAMES && el.requestFullscreen) el.requestFullscreen().catch(() => {}); }} />
      ) : null}
    </div>
  );
}