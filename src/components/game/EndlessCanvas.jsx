import React, { useEffect, useRef, useState } from 'react';
import { EndlessEngine } from '@/game/endlessEngine';
import { render } from '@/game/render';
import EndlessHud from './EndlessHud';
import EndlessGameOver from './EndlessGameOver';
import MilestoneToast from './MilestoneToast';
import PauseMenu from './PauseMenu';
import SettingsPanel from './SettingsPanel';
import RotateOverlay from './RotateOverlay';
import { useTapHoldControl } from '@/hooks/useTapHoldControl';

export default function EndlessCanvas({ settings, displaySettings, sound, best, totalGems, onResult, onExit, onUpdateSettings, onResetProgress }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const cbRef = useRef({});
  const reportedRef = useRef(false);
  const bestRef = useRef(best || 0);
  const runStartBestRef = useRef(best || 0);

  const [ui, setUi] = useState({ state: 'intro', score: 0, distance: 0, gems: 0, streak: 1, sectionName: 'Training', speed: 0.62, rush: false, rushAvailable: false });
  const [milestone, setMilestone] = useState(null);
  const [paused, setPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [needsRotate, setNeedsRotate] = useState(false);
  const [rotateDismissed, setRotateDismissed] = useState(false);

  cbRef.current = { onResult, onExit };
  bestRef.current = best || 0;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const eng = new EndlessEngine({ sound, settings });
    eng.loadEndless(bestRef.current);
    runStartBestRef.current = bestRef.current;
    engineRef.current = eng;
    reportedRef.current = false;
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
      state: eng.state,
      score: Math.floor(eng.score),
      distance: Math.floor(eng.px / 10),
      best: eng.best,
      gems: eng.gems,
      streak: eng.streak,
      maxStreak: eng.maxStreak,
      sectionName: eng.sectionName,
      speed: eng._gen ? eng._gen.speed : 0.62,
      rush: !!eng.rush,
      rushAvailable: eng.rushAvailable,
    });

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = (now - last) / 1000;
      last = now;
      if (!eng.paused) eng.update(dt);
      render(ctx, eng, cssW, cssH, dpr);
      if (eng.milestoneEvent) {
        setMilestone(eng.milestoneEvent);
        eng.milestoneEvent = null;
      }
      if (eng.state === 'dead' && !reportedRef.current) {
        reportedRef.current = true;
        if (cbRef.current.onResult) cbRef.current.onResult(Math.floor(eng.score), eng.gems);
      }
      if (eng.state !== lastState) { lastState = eng.state; push(); lastSync = now; }
      else if (now - lastSync > 100) { lastSync = now; push(); }
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener('resize', resize);
    let ro = null;
    if (window.ResizeObserver && wrap) { ro = new ResizeObserver(resize); ro.observe(wrap); }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      if (ro) ro.disconnect();
      engineRef.current = null;
    };
  }, [sound]);

  // Live-update engine settings without restarting the run.
  useEffect(() => {
    const eng = engineRef.current;
    if (eng) eng.settings = displaySettings;
  }, [displaySettings]);

  const primary = () => {
    const eng = engineRef.current;
    if (!eng || eng.paused) return;
    sound.init(); sound.resume();
    if (eng.state === 'playing' || eng.state === 'intro') eng.switchGravity();
  };

  const restart = () => {
    const eng = engineRef.current;
    if (!eng) return;
    reportedRef.current = false;
    eng.paused = false;
    eng.loadEndless(bestRef.current, true);
    runStartBestRef.current = bestRef.current;
    setPaused(false);
    setShowSettings(false);
  };

  const togglePause = () => {
    const eng = engineRef.current;
    if (!eng || eng.state === 'dead') return;
    const next = !eng.paused;
    eng.paused = next;
    setPaused(next);
    setShowSettings(false);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return;
      const eng = engineRef.current;
      if (!eng) return;
      sound.init(); sound.resume();
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Enter') {
        e.preventDefault();
        if (eng.state === 'dead') { restart(); }
        else { primary(); }
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        eng.rushHeld = true;
      } else if (e.code === 'KeyR') { e.preventDefault(); restart(); }
      else if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); togglePause(); }
    };
    const onKeyUp = (e) => {
      const eng = engineRef.current;
      if (!eng) return;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') eng.rushHeld = false;
    };
    const onVis = () => {
      const eng = engineRef.current;
      if (document.hidden && eng && !eng.paused && eng.state === 'playing') { eng.paused = true; setPaused(true); }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('visibilitychange', onVis);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); document.removeEventListener('visibilitychange', onVis); };
  }, [sound]);

  useEffect(() => {
    const check = () => {
      const coarse = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
      const touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || coarse;
      setNeedsRotate(touch && window.innerWidth < 720 && window.innerHeight > window.innerWidth);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => { window.removeEventListener('resize', check); window.removeEventListener('orientationchange', check); };
  }, []);

  const flip = () => { const eng = engineRef.current; if (eng && (eng.state === 'playing' || eng.state === 'intro')) eng.switchGravity(); };
  const pointer = useTapHoldControl({ engineRef, sound, onFlip: flip, onDeadTap: restart });

  const showRotate = needsRotate && !rotateDismissed;
  const prevBest = runStartBestRef.current;
  const finalBest = Math.max(prevBest, ui.score);
  const isNewBest = ui.state === 'dead' && ui.score > prevBest && ui.score > 0;

  return (
    <div ref={wrapRef} className="gs-screen-in fixed inset-0 touch-none select-none overflow-hidden bg-[#04050c]">
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full touch-none"
        onPointerDown={pointer.onPointerDown}
        onPointerUp={pointer.onPointerUp}
        onPointerCancel={pointer.onPointerCancel}
        onPointerLeave={pointer.onPointerLeave}
        onContextMenu={(e) => e.preventDefault()} />

      <EndlessHud ui={ui} best={finalBest} totalGems={totalGems} onPause={togglePause} sound={sound} />

      <MilestoneToast event={milestone} />

      {ui.rushAvailable && !ui.rush && ui.state === 'playing' ? (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
          <div className="gs-pop rounded-full border border-fuchsia-300/40 bg-black/50 px-4 py-2 font-heading text-[10px] uppercase tracking-[0.28em] text-fuchsia-100/90 backdrop-blur">
            Grab the glowing gem to rush
          </div>
        </div>
      ) : null}

      {ui.rush ? (
        <div className="pointer-events-none absolute inset-x-0 top-24 z-20 flex justify-center">
          <div className="gs-pop rounded-full border border-fuchsia-300/40 bg-black/50 px-4 py-1.5 font-heading text-[10px] uppercase tracking-[0.3em] text-fuchsia-100 backdrop-blur">
            Gem Rush
          </div>
        </div>
      ) : null}

      {ui.state === 'intro' ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="gs-intro flex flex-col items-center gap-2 px-6 text-center">
            <div className="font-heading text-[11px] uppercase tracking-[0.6em] text-cyan-200/80">Endless</div>
            <div className="font-heading text-2xl uppercase tracking-[0.24em] text-white sm:text-4xl">Survive</div>
            <div className="mt-1 h-[2px] w-24 bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
          </div>
        </div>
      ) : null}

      {ui.state === 'dead' ? (
        <EndlessGameOver
          score={ui.score}
          best={finalBest}
          distance={ui.distance}
          gems={ui.gems}
          maxStreak={ui.maxStreak}
          isNewBest={isNewBest}
          sound={sound}
          onRestart={restart}
          onExit={() => cbRef.current.onExit()}
        />
      ) : null}

      {paused && !showSettings ? (
        <PauseMenu title="Endless" exitLabel="Main Menu" sound={sound} onResume={togglePause} onRestart={restart} onSettings={() => setShowSettings(true)} onExit={() => cbRef.current.onExit()} />
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