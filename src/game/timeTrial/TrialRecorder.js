import { encodeGhost, GHOST_STEP_MS, MAX_GHOST_POINTS } from '@/game/timeTrial/ghostCodec';

export default class TrialRecorder {
  constructor(engine) { this.points = [[engine.px, engine.py, engine.rot]]; this.overflow = false; }
  sample(engine) {
    if (this.points.length >= MAX_GHOST_POINTS) { this.overflow = true; return; }
    this.points.push([engine.px, engine.py, engine.rot]);
  }
  finish(engine) {
    if (this.overflow) return null;
    const timeMs = Math.round(engine.attemptTime * 1000);
    if (timeMs === (this.points.length - 1) * GHOST_STEP_MS) this.points[this.points.length - 1] = [engine.px, engine.py, engine.rot];
    else this.sample(engine);
    return this.overflow ? null : encodeGhost(this.points, engine.skinId);
  }
}