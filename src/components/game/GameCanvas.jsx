import React, { useEffect, useRef, useState } from 'react';
import { Engine } from '@/game/engine';
import { render } from '@/game/render';
import Hud from './Hud';
import LevelIntro from './LevelIntro';
import DeathOverlay from './DeathOverlay';
import LevelComplete from './LevelComplete';
import PauseMenu from './PauseMenu';
import SettingsPanel from './SettingsPanel';
import RotateOverlay from './RotateOverlay';
import { useTapHoldControl } from '@/hooks/useTapHoldControl';

export default function GameCanvas({ levelIndex, totalLevels, settings, displaySettings, sound, totalGems, groupJustCompleted, nextGroupName, isFinalGroup, onExit, onComplete, onNext, onEnterNextGroup, onUpdateSettings, onResetProgress }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const cbRef = useRef({});
  const completedRef = useRef(false);

  const [ui, setUi] = useState({ state: 'intro', deaths: 0, time: 0, progress: 0, checkpoint: 0, stars: 3, gems: 0, rush: false, rushAvailable: false });
  const [paused, setPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(false);
  const [needsRotate, setNeedsRotate] = useState(false);
  const [rotateDismissed, setRotateDismissed] = useState(false);

  cbRef.current = { onExit, onComplete, onNext };

  // ---- main loop -----------------------------------------------------------
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const eng = new Engine({ sound, settings });
    eng.load(levelIndex);
    engineRef.current = eng;
    completedRef.current = false;
    setPaused(false);
    setShowSettings(false);

    // Read-only diagnostics handle (used by automated gameplay checks).
    window.__GRAVITY_SWITCH__ = {
      get state() { return eng.state; },
      get dir() { return eng.dir; },
      get deaths() { return eng.deaths; },
      get progress() { return eng.ui.progress; },
      get checkpoint() { return eng.cpIndex; },
      get stars() { return eng.stars; },
      get length() { return eng.level.length; },
      get checkpoints() { return eng.level.checkpoints.map((c) => Math.round(c.x)); },
      get x() { return Math.round(eng.px); },
      warp: (x) => { eng.px = x; },
    };

    let dpr = Math.min(2, window.devicePixelRatio || 1);
    let cssW = 800;
    let cssH = 600;

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

    let raf = 0;
    let last = performance.now();
    let lastSync = 0;
    let lastState = eng.ui.state;
    let lastCp = eng.ui.checkpoint;
    let deadAt = null;

    const push = () => setUi({
      state: eng.state, deaths: eng.deaths, time: eng.attemptTime,
      progress: eng.ui.progress, checkpoint: eng.ui.checkpoint, stars: eng.stars,
      gems: eng.gems, rush: !!eng.rush, rushAvailable: eng.rushAvailable,
    });

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = (now - last) / 1000;
      last = now;
      if (!eng.paused) eng.update(dt);
      render(ctx, eng, cssW, cssH, dpr);

      if (eng.state === 'complete' && !completedRef.current) {
        completedRef.current = true;
        if (cbRef.current.onComplete) {
          cbRef.current.onComplete(levelIndex, { deaths: eng.deaths, time: eng.attemptTime, stars: eng.stars, gems: eng.gems });
        }
      }
      // Auto-respawn shortly after death so the player is back in the action
      // almost immediately — no need to wait for a tap. Tapping still skips
      // the pause for impatient players.
      if (eng.state === 'dead') {
        if (deadAt == null) deadAt = now;
        if (now - deadAt > 550) { deadAt = null; eng.respawn(); }
      } else if (eng.state !== 'dying') {
        deadAt = null;
      }
      if (eng.state !== lastState) {
        lastState = eng.state;
        lastCp = eng.ui.checkpoint;
        push();
        lastSync = now;
      } else if (eng.ui.checkpoint !== lastCp) {
        lastCp = eng.ui.checkpoint;
        push();
        setToast(true);
      } else if (now - lastSync > 100) {
        lastSync = now;
        push();
      }
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener('resize', resize);
    let ro = null;
    if (window.ResizeObserver && wrap) {
      ro = new ResizeObserver(resize);
      ro.observe(wrap);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      if (ro) ro.disconnect();
      engineRef.current = null;
    };
  }, [levelIndex, sound]);

  // Live-update engine settings (volume, shake, reduced effects) without
  // restarting the run — changing a setting mid-level must not reset progress.
  useEffect(() => {
    const eng = engineRef.current;
    if (eng) eng.settings = displaySettings;
  }, [displaySettings]);

  // ---- actions -------------------------------------------------------------
  const primary = () => {
    const eng = engineRef.current;
    if (!eng || eng.paused) return;
    sound.init();
    sound.resume();
    if (eng.state === 'playing' || eng.state === 'intro') eng.switchGravity();
    else if (eng.state === 'dead') eng.respawn();
  };

  const restart = () => {
    const eng = engineRef.current;
    if (!eng) return;
    completedRef.current = false;
    eng.paused = false;
    eng.restart(true);
    setPaused(false);
    setShowSettings(false);
  };

  const togglePause = () => {
    const eng = engineRef.current;
    if (!eng || eng.state === 'dead' || eng.state === 'complete') return;
    const next = !eng.paused;
    eng.paused = next;
    setPaused(next);
    setShowSettings(false);
  };

  // ---- input ---------------------------------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return;
      const eng = engineRef.current;
      if (!eng) return;
      sound.init();
      sound.resume();
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Enter') {
        e.preventDefault();
        if (eng.state === 'complete') return;
        primary();
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        e.preventDefault();
        eng.rushHeld = true;
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        restart();
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        togglePause();
      }
    };
    const onKeyUp = (e) => {
      const eng = engineRef.current;
      if (!eng) return;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') eng.rushHeld = false;
    };
    const onVis = () => {
      const eng = engineRef.current;
      if (document.hidden && eng && !eng.paused && eng.state === 'playing') {
        eng.paused = true;
        setPaused(true);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('visibilitychange', onVis);
    };
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
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(false), 1500);
    return () => clearTimeout(id);
  }, [toast]);

  const flip = () => { const eng = engineRef.current; if (eng && (eng.state === 'playing' || eng.state === 'intro')) eng.switchGravity(); };
  const deadTap = () => { const eng = engineRef.current; if (eng && eng.state === 'dead') eng.respawn(); };
  const pointer = useTapHoldControl({ engineRef, sound, onFlip: flip, onDeadTap: deadTap });

  const showRotate = needsRotate && !rotateDismissed;

  return (
    <div ref={wrapRef} className="gs-screen-in fixed inset-0 touch-none select-none overflow-hidden bg-[#04050c]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full touch-none"
        onPointerDown={pointer.onPointerDown}
        onPointerUp={pointer.onPointerUp}
        onPointerCancel={pointer.onPointerCancel}
        onPointerLeave={pointer.onPointerLeave}
        onContextMenu={(e) => e.preventDefault()}
      />

      <Hud levelIndex={levelIndex} ui={ui} totalGems={totalGems} onPause={togglePause} sound={sound} />

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

      {ui.state === 'intro' ? <LevelIntro levelIndex={levelIndex} /> : null}

      {toast ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-20 flex justify-center">
          <div className="gs-pop rounded-2xl border border-cyan-300/40 bg-black/60 px-6 py-3 font-heading text-xs uppercase tracking-[0.4em] text-cyan-100 backdrop-blur">
            Checkpoint
          </div>
        </div>
      ) : null}

      {ui.state === 'dead' ? (
        <DeathOverlay
          deaths={ui.deaths}
          levelIndex={levelIndex}
          sound={sound}
          onRetry={() => { completedRef.current = false; const e = engineRef.current; if (e && (e.state === 'dead' || e.state === 'dying')) e.respawn(); }}
          onExit={onExit}
        />
      ) : null}

      {ui.state === 'complete' ? (
        <LevelComplete
          levelIndex={levelIndex}
          stars={ui.stars}
          deaths={ui.deaths}
          time={ui.time}
          gems={ui.gems}
          totalGems={totalGems}
          isLast={levelIndex >= totalLevels - 1}
          groupJustCompleted={groupJustCompleted}
          nextGroupName={nextGroupName}
          isFinalGroup={isFinalGroup}
          sound={sound}
          onNext={() => cbRef.current.onNext()}
          onRetry={restart}
          onExit={onExit}
          onEnterNextGroup={onEnterNextGroup}
        />
      ) : null}

      {paused && !showSettings ? (
        <PauseMenu
          levelIndex={levelIndex}
          sound={sound}
          onResume={togglePause}
          onRestart={restart}
          onSettings={() => setShowSettings(true)}
          onExit={onExit}
        />
      ) : null}

      {showSettings ? (
        <SettingsPanel
          settings={displaySettings}
          sound={sound}
          onChange={onUpdateSettings}
          onReset={onResetProgress}
          onClose={() => setShowSettings(false)}
        />
      ) : null}

      {showRotate ? (
        <RotateOverlay
          onDismiss={() => {
            setRotateDismissed(true);
            const el = document.documentElement;
            if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
          }}
        />
      ) : null}
    </div>
  );
}