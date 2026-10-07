import React, { useEffect, useRef, useState } from 'react';
import { RaceEngine } from '@/game/raceEngine';
import { renderRace } from '@/game/render';
import RaceHud from './RaceHud';
import RaceIntro from './RaceIntro';
import RaceResult from './RaceResult';
import PauseMenu from './PauseMenu';
import SettingsPanel from './SettingsPanel';
import RotateOverlay from './RotateOverlay';

export default function RaceCanvas({ levelIndex, settings, displaySettings, sound, onExit, onUpdateSettings, onResetProgress }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const cbRef = useRef({});
  const [ui, setUi] = useState({ state: 'ready', countdown: 3, raceTime: 0, winner: -1, p1: 0, p2: 0 });
  const [paused, setPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [needsRotate, setNeedsRotate] = useState(false);
  const [rotateDismissed, setRotateDismissed] = useState(false);

  cbRef.current = { onExit };

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const eng = new RaceEngine({ sound, settings, levelIndex });
    engineRef.current = eng;
    setPaused(false);
    setShowSettings(false);

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

    let raf = 0, last = performance.now(), lastSync = 0, lastState = eng.state;
    const push = () => setUi({
      state: eng.state, countdown: eng.countdown, raceTime: eng.raceTime, winner: eng.winner,
      p1: eng.getProgress(eng.players[0]), p2: eng.getProgress(eng.players[1]),
    });

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = (now - last) / 1000;
      last = now;
      if (!eng.paused) eng.update(dt);
      renderRace(ctx, eng, cssW, cssH, dpr);
      if (eng.state !== lastState) { lastState = eng.state; push(); lastSync = now; }
      else if (now - lastSync > 100) { lastSync = now; push(); }
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener('resize', resize);
    let ro = null;
    if (window.ResizeObserver && wrap) { ro = new ResizeObserver(resize); ro.observe(wrap); }
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); if (ro) ro.disconnect(); engineRef.current = null; };
  }, [levelIndex, sound, settings]);

  const startRace = () => { const eng = engineRef.current; if (!eng) return; sound.init(); sound.resume(); eng.start(); };
  const p1Switch = () => { const eng = engineRef.current; if (!eng) return; sound.init(); sound.resume(); eng.switchPlayer(eng.players[0]); };
  const p2Switch = () => { const eng = engineRef.current; if (!eng) return; sound.init(); sound.resume(); eng.switchPlayer(eng.players[1]); };

  const restart = () => { const eng = engineRef.current; if (!eng) return; eng.paused = false; eng.load(levelIndex); setPaused(false); setShowSettings(false); };
  const togglePause = () => { const eng = engineRef.current; if (!eng || eng.state === 'finished') return; const next = !eng.paused; eng.paused = next; setPaused(next); setShowSettings(false); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return;
      const eng = engineRef.current;
      if (!eng) return;
      sound.init(); sound.resume();
      if (e.code === 'KeyW' || e.code === 'Space') {
        e.preventDefault();
        if (eng.state === 'ready') startRace();
        else if (eng.state === 'racing') p1Switch();
      } else if (e.code === 'ArrowUp' || e.code === 'Enter') {
        e.preventDefault();
        if (eng.state === 'ready') startRace();
        else if (eng.state === 'racing') p2Switch();
      } else if (e.code === 'KeyR') {
        e.preventDefault(); restart();
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault(); togglePause();
      }
    };
    const onVis = () => { const eng = engineRef.current; if (document.hidden && eng && !eng.paused && eng.state === 'racing') { eng.paused = true; setPaused(true); } };
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis); };
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
  const showGo = ui.state === 'racing' && ui.raceTime < 0.6;

  return (
    <div ref={wrapRef} className="fixed inset-0 touch-none select-none overflow-hidden bg-[#04050c]">
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full touch-none" onContextMenu={(e) => e.preventDefault()} />

      {ui.state === 'racing' || ui.state === 'countdown' || ui.state === 'finished' ? (
        <RaceHud ui={ui} onPause={togglePause} sound={sound} />
      ) : null}

      {ui.state === 'ready' ? (
        <RaceIntro sound={sound} onStart={startRace} isTouch={isTouch} />
      ) : null}

      {ui.state === 'countdown' ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div key={Math.ceil(ui.countdown)} className="gs-pop font-heading text-7xl uppercase tracking-[0.2em] text-white sm:text-8xl"
            style={{ textShadow: '0 0 40px rgba(56,232,255,0.6)' }}>
            {Math.ceil(ui.countdown)}
          </div>
        </div>
      ) : null}

      {showGo ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="gs-pop font-heading text-6xl uppercase tracking-[0.3em] text-cyan-200 sm:text-7xl"
            style={{ textShadow: '0 0 50px rgba(56,232,255,0.8)' }}>GO!</div>
        </div>
      ) : null}

      {ui.state === 'finished' ? (
        <RaceResult ui={ui} sound={sound} onRestart={restart} onExit={() => cbRef.current.onExit()} />
      ) : null}

      {isTouch && ui.state === 'racing' ? (
        <>
          <button type="button" aria-label="Player 1 switch gravity"
            className="pointer-events-auto absolute bottom-6 left-5 z-20 flex h-24 w-24 items-center justify-center rounded-full border border-cyan-200/35 bg-cyan-400/10 font-heading text-sm uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_50px_-12px_rgba(56,232,255,0.85)] backdrop-blur-md transition-transform duration-100 active:scale-90"
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); p1Switch(); }}
            onContextMenu={(e) => e.preventDefault()}>P1</button>
          <button type="button" aria-label="Player 2 switch gravity"
            className="pointer-events-auto absolute bottom-6 right-5 z-20 flex h-24 w-24 items-center justify-center rounded-full border border-pink-300/35 bg-pink-400/10 font-heading text-sm uppercase tracking-[0.16em] text-pink-100 shadow-[0_0_50px_-12px_rgba(255,62,165,0.85)] backdrop-blur-md transition-transform duration-100 active:scale-90"
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); p2Switch(); }}
            onContextMenu={(e) => e.preventDefault()}>P2</button>
        </>
      ) : null}

      {paused && !showSettings ? (
        <PauseMenu title="Race" exitLabel="Exit to Menu" sound={sound} onResume={togglePause} onRestart={restart} onSettings={() => setShowSettings(true)} onExit={() => cbRef.current.onExit()} />
      ) : null}

      {showSettings ? (
        <SettingsPanel settings={displaySettings} sound={sound} onChange={onUpdateSettings} onReset={onResetProgress} onClose={() => setShowSettings(false)} />
      ) : null}

      {showRotate ? (
        <RotateOverlay onDismiss={() => { setRotateDismissed(true); const el = document.documentElement; if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); }} />
      ) : null}
    </div>
  );
}