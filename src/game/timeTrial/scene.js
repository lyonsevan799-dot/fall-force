import TimeTrialEngine from '@/game/timeTrial/TimeTrialEngine';
import { trialRecord } from '@/game/timeTrial/courses';
import { decodeGhost } from '@/game/timeTrial/ghostCodec';
import drawTrialGhost from '@/game/timeTrial/ghostPlayback';
import { render } from '@/game/render';

export default function createTrialScene({ canvas, wrap, options, onUi, onPaused, onFinish }) {
  const initial = options(), best = trialRecord(initial.records, initial.levelIndex);
  const engine = new TimeTrialEngine({ sound: initial.sound, settings: initial.settings, skinId: initial.skinId });
  engine.loadTrial(initial.levelIndex, best);
  const ghost = decodeGhost(best, engine.level), ctx = canvas.getContext('2d', { alpha: false });
  let width, height, dpr, frame, last = performance.now(), lastSync = 0, lastState = '', lastPaused = false, reported = false;
  const resize = () => {
    width = Math.max(1, wrap.clientWidth); height = Math.max(1, wrap.clientHeight); dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
  };
  const snapshot = () => onUi({ state: engine.state, timeMs: Math.round(engine.attemptTime * 1000),
    bestMs: best?.timeMs ?? null, splitDelta: engine.splitDelta, ghostAvailable: !!ghost,
    ghostHint: ghost ? 'Visual recording · 10 samples/second · no gameplay interactions' : best ? 'Ghost recording unavailable; your saved best remains usable.' : 'No ghost yet. Finish a valid run to record one.' });
  resize(); snapshot();
  const observer = new ResizeObserver(resize); observer.observe(wrap);
  const loop = (now) => {
    const current = options(); engine.settings = current.settings; engine.skinId = current.skinId;
    const from = Math.max(last, engine.resetFrameAt || 0);
    engine.update(Math.max(0, (now - from) / 1000)); last = now;
    if (now >= (engine.resetFrameAt || 0)) engine.resetFrameAt = null;
    onPaused(engine.paused);
    render(ctx, engine, width, height, dpr, current.ghostEnabled && ghost ? (context) => drawTrialGhost(context, engine, ghost) : null);
    if (engine.state !== lastState || engine.paused !== lastPaused || now - lastSync >= 50) { snapshot(); lastState = engine.state; lastPaused = engine.paused; lastSync = now; }
    if (engine.result && !reported) { reported = true; onFinish(engine.result); }
    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);
  return { engine, destroy: () => { cancelAnimationFrame(frame); observer.disconnect(); } };
}