import React, { useEffect, useRef, useState } from 'react';
import { Engine } from '@/game/engine';
import { flushProgressEvents } from '@/game/meta/events';
import { render } from '@/game/render';
import Hud from './Hud';
import LevelIntro from './LevelIntro';
import DeathOverlay from './DeathOverlay';
import LevelComplete from './LevelComplete';
import PauseMenu from './PauseMenu';
import SettingsPanel from './SettingsPanel';
import RotateOverlay from './RotateOverlay';
import ChallengeComplete from './ChallengeComplete';
import { useTapHoldControl } from '@/hooks/useTapHoldControl';
import { useGameLifecycle } from '@/hooks/useGameLifecycle';
import MiddleAttempt from '@/game/middleAttempt';
import MiddleChallengeIntro from '@/components/game/MiddleChallengeIntro';
import ChallengeRunStatus from '@/components/game/ChallengeRunStatus';
import useAdBreak from '@/hooks/useAdBreak';
import useCareerCompletion from '@/hooks/useCareerCompletion';
import useLevelStruggle from '@/hooks/useLevelStruggle';
import { canSkip } from '@/game/skipLevel/catalog';
import SkipRecommendation from '@/components/game/skipLevel/SkipRecommendation';
import restartChallengeAttempt from '@/game/restartChallengeAttempt';

export default function GameCanvas({ skinId = 'classic', levelIndex, totalLevels, settings, displaySettings, sound, totalGems, groupJustCompleted, nextGroupName, isFinalGroup, onExit, onComplete, onNext, onEnterNextGroup, onUpdateSettings, onResetProgress, challenge, challengeReward, onClearReward, onChallengeFailure, onNewChallengeAttempt, skipTools = null }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const cbRef = useRef({});
  const continueAfterAd = useAdBreak(engineRef);
  const completedRef = useRef(false);
  const completion = useCareerCompletion(onComplete, levelIndex);
  const struggle = useLevelStruggle(levelIndex, skipTools?.save, skipTools?.commitGame);
  const recommendation = useRef(false);
  recommendation.current = !!skipTools && struggle.eligible && canSkip(skipTools.save, levelIndex);
  const [middleReady, setMiddleReady] = useState(challenge?.type === 'middle' && !skipTools);

  const [ui, setUi] = useState({ state: 'intro', deaths: 0, time: 0, progress: 0, checkpoint: 0, stars: 3, gems: 0, rush: false, rushAvailable: false });
  const [paused, setPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(false);
  const [needsRotate, setNeedsRotate] = useState(false);
  const [rotateDismissed, setRotateDismissed] = useState(false);

  cbRef.current = { onExit, onComplete, onNext, onChallengeFailure };
  useGameLifecycle(engineRef, setPaused, levelIndex + 1);

  // ---- main loop -----------------------------------------------------------
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });
    const eng = new Engine({ sound, settings });
    eng.skinId = skinId;
    eng.load(levelIndex);
    if (challenge?.type === 'middle') {
      eng.middleAttempt = new MiddleAttempt((reason) => cbRef.current.onChallengeFailure?.(challenge.id, reason));
      eng.middleAttempt.position(eng);
      if (skipTools) eng.middleAttempt.start(eng);
      else eng.paused = true;
    }
    setMiddleReady(challenge?.type === 'middle' && !skipTools);
    engineRef.current = eng;
    completedRef.current = false;
    setPaused(false);
    setShowSettings(false);


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
      middleFailed: !!eng.middleAttempt?.failed, middleReason: eng.middleAttempt?.reason,
    });

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = (now - last) / 1000;
      last = now;
      if (!eng.paused) eng.update(dt);
      let suggestAfterFailure = struggle.sample(eng, dt);
      flushProgressEvents(eng);
      if (challenge && (eng.middleAttempt?.failed || eng.deaths > 0)) {
        if (eng.deaths === 0 && eng.middleAttempt?.reason !== 'Restarted the level') suggestAfterFailure = struggle.failure() || suggestAfterFailure;
        restartChallengeAttempt(eng, challenge, (reason) => cbRef.current.onChallengeFailure?.(challenge.id, reason));
        completedRef.current = false;
        eng.skipOffer = suggestAfterFailure;
        if (suggestAfterFailure) { eng.paused = true; setPaused(true); }
        deadAt = null;
        lastCp = eng.ui.checkpoint;
        setToast(false);
        push();
      }
      render(ctx, eng, cssW, cssH, dpr);

      if (eng.state === 'complete' && !completedRef.current) {
        completedRef.current = true;
        if (cbRef.current.onComplete) {
          void completion.submit({ runId: eng.runId, deaths: eng.deaths, time: eng.attemptTime, stars: eng.stars, gems: eng.gems, middleSuccess: eng.middleAttempt?.succeeded === true });
        }
      }
      // Auto-respawn shortly after death so the player is back in the action
      // almost immediately — no need to wait for a tap. Tapping still skips
      // the pause for impatient players.
      if (eng.state === 'dead' && !eng.paused && !recommendation.current) {
        if (deadAt == null) deadAt = now;
        if (now - deadAt > 150) { deadAt = null; eng.respawn(); }
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

  useEffect(() => { if (engineRef.current) engineRef.current.skinId = skinId; }, [skinId]);


  // ---- actions -------------------------------------------------------------
  const startMiddle = () => {
    const eng = engineRef.current;
    if (!eng?.middleAttempt || eng.middleAttempt.started) return;
    sound.init(); sound.resume();
    eng.middleAttempt.start(eng);
    setMiddleReady(false);
  };

  const primary = () => {
    const eng = engineRef.current;
    if (!eng || eng.paused || (recommendation.current && eng.state === 'dead')) return;
    sound.init();
    sound.resume();
    if (eng.state === 'playing' || eng.state === 'intro') eng.switchGravity();
    else if (eng.state === 'dead') eng.respawn();
  };

  const restart = () => {
    const eng = engineRef.current;
    if (!eng) return;
    if (eng.middleAttempt && !eng.middleAttempt.started) return;
    if (!completion.clear()) return;
    const finished = eng.state === 'complete';
    const suggest = !finished && struggle.restart() && !!skipTools;
    eng.skipOffer = suggest;
    completedRef.current = false;
    eng.paused = false;
    restartChallengeAttempt(eng, challenge, (reason) => cbRef.current.onChallengeFailure?.(challenge?.id, reason));
    eng.paused = suggest;
    setPaused(suggest);
    setShowSettings(false);
  };

  const togglePause = () => {
    const eng = engineRef.current;
    if (!eng || (eng.middleAttempt && !eng.middleAttempt.started) || eng.state === 'dead' || eng.state === 'complete') return;
    const next = !eng.paused;
    eng.paused = next;
    setPaused(next);
    setShowSettings(false);
  };

  // ---- input ---------------------------------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const eng = engineRef.current;
      if (!eng) return;
      if (e.target instanceof Element && e.target.closest('button, input, select, textarea, a, [role="button"], [contenteditable="true"]')) return;
      if (eng.middleAttempt && !eng.middleAttempt.started) return;
      if (recommendation.current && (eng.state === 'dead' || (eng.paused && eng.skipOffer))) return;
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
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
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
  const deadTap = () => { const eng = engineRef.current; if (eng && eng.state === 'dead' && !recommendation.current) eng.respawn(); };
  const pointer = useTapHoldControl({ engineRef, sound, onFlip: flip, onDeadTap: deadTap });

  const showRotate = needsRotate && !rotateDismissed;
  const showRecommendation = recommendation.current && (ui.state === 'dead' || (paused && engineRef.current?.skipOffer && !showSettings));
  const dismissRecommendation = () => {
    struggle.dismiss();
    const eng = engineRef.current;
    if (eng?.state === 'dead') eng.respawn();
    if (eng) { eng.paused = false; eng.skipOffer = false; }
    setPaused(false);
  };

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

      {challenge && !middleReady && (ui.state === 'playing' || ui.state === 'intro') ? (
        <ChallengeRunStatus challenge={challenge} failed={ui.middleFailed} reason={ui.middleReason} onNewAttempt={onNewChallengeAttempt} sound={sound} />
      ) : null}

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

      {middleReady ? <MiddleChallengeIntro challenge={challenge} sound={sound} onStart={startMiddle} onExit={onExit} /> : ui.state === 'intro' ? <LevelIntro levelIndex={levelIndex} /> : null}

      {toast ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-20 flex justify-center">
          <div className="gs-pop rounded-2xl border border-cyan-300/40 bg-black/60 px-6 py-3 font-heading text-xs uppercase tracking-[0.4em] text-cyan-100 backdrop-blur">
            Checkpoint
          </div>
        </div>
      ) : null}

      {showRecommendation && <div role="dialog" aria-modal="true" aria-label="Optional skip recommendation" className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-background/80 p-4"><div className="my-auto w-full max-w-sm"><SkipRecommendation save={skipTools.save} levelIndex={levelIndex} updateSave={skipTools.updateSave} onSkipped={skipTools.onSkipped} onDismiss={dismissRecommendation} /></div></div>}

      {ui.state === 'dead' && !showRecommendation ? (
        <DeathOverlay
          deaths={ui.deaths}
          levelIndex={levelIndex}
          sound={sound}
          onRetry={() => { completedRef.current = false; const e = engineRef.current; if (e && (e.state === 'dead' || e.state === 'dying')) e.respawn(); }}
          onExit={onExit}
        />
      ) : null}

      {ui.state === 'complete' ? (
        challengeReward ? (
          <ChallengeComplete
            reward={challengeReward.amount}
            challengeName={challengeReward.name}
            totalGems={challenge?.type === 'middle' ? totalGems : undefined}
            sound={sound}
            onContinue={onExit}
            onPlayAgain={() => { if (onClearReward) onClearReward(); if (challenge?.type === 'middle') onNewChallengeAttempt(); else restart(); }}
          />
        ) : (
          <LevelComplete
            completion={completion}
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
            challengeMode={!!challenge}
            challengeFailure={challenge?.type === 'middle' && ui.middleFailed ? ui.middleReason : null}
            exitLabel={challenge ? 'Challenges' : 'Levels'}
            onNext={() => continueAfterAd(() => cbRef.current.onNext())}
            onRetry={challenge?.type === 'middle' ? onNewChallengeAttempt : restart}
            onExit={onExit}
            onEnterNextGroup={() => continueAfterAd(onEnterNextGroup)}
          />
        )
      ) : null}

      {paused && !showSettings && !showRecommendation ? (
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
            if (!import.meta.env.CRAZYGAMES && el.requestFullscreen) el.requestFullscreen().catch(() => {});
          }}
        />
      ) : null}
    </div>
  );
}