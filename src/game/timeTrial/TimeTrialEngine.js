import { Engine } from '@/game/engine';
import { cloneTrialCourse, COURSE_SIGNATURES, SPLIT_DISTANCE, trialSplits } from '@/game/timeTrial/courses';
import TrialRecorder from '@/game/timeTrial/TrialRecorder';

const STEP = 1 / 120;
export default class TimeTrialEngine extends Engine {
  constructor(options) { super(options); this.mode = 'time_trial'; this.skinId = options.skinId || 'classic'; }
  get level() { return this.course; }
  loadTrial(index, record) {
    this.course = cloneTrialCourse(index);
    super.load(index);
    this.state = 'ready'; this.timeScale = 1; this.t = 0; this.attemptTime = 0;
    this.accumulator = 0; this.steps = 0; this.splitTimes = []; this.splitDelta = null;
    this.referenceSplits = trialSplits(record, this.course);
    this.result = null; this.recorder = new TrialRecorder(this); this.syncUi();
  }
  start() {
    if (this.state !== 'ready' || this.paused) return;
    this.state = 'playing'; this.accumulator = 0; this.resetFrameAt = performance.now(); this.sound.sfx('go'); this.syncUi();
  }
  step(h) {
    this.trialStep = { x: this.px, y: this.py, time: this.attemptTime - h, h };
    super.step(h);
    if (this.state === 'playing' && this.px >= this.level.length) this.reachFinish();
    const start = this.trialStep;
    let marker = this.level.startX + (this.splitTimes.length + 1) * SPLIT_DISTANCE;
    while (marker <= this.px && marker <= this.level.length) {
      const fraction = Math.max(0, Math.min(1, (marker - start.x) / (this.px - start.x || 1)));
      const time = Math.round((start.time + (this.attemptTime - start.time) * fraction) * 1000);
      const index = this.splitTimes.length;
      this.splitTimes.push(time);
      if (this.referenceSplits?.[index] != null) this.splitDelta = time - this.referenceSplits[index];
      marker += SPLIT_DISTANCE;
    }
    this.steps++;
    if (this.state === 'complete' && !this.result) {
      this.result = Object.freeze({ runId: this.runId, completed: true, deaths: this.deaths,
        levelIndex: this.levelIndex, signature: COURSE_SIGNATURES[this.levelIndex],
        timeMs: Math.round(this.attemptTime * 1000), splits: this.splitTimes.slice(), ghost: this.recorder.finish(this) });
    } else if (this.state === 'playing' && this.steps % 12 === 0) this.recorder.sample(this);
  }
  die() {
    super.die();
    if (this.state === 'dying') { this.state = 'dead'; this.syncUi(); }
  }
  reachFinish() {
    if (this.state !== 'playing' || this.finishReached || !this.trialStep) return;
    const start = this.trialStep;
    const fraction = Math.max(0, Math.min(1, (this.level.length - start.x) / (this.px - start.x || 1)));
    this.attemptTime = start.time + start.h * fraction;
    this.py = start.y + (this.py - start.y) * fraction; this.px = this.level.length;
    super.reachFinish();
  }
  update(elapsed) {
    if (this.paused || !Number.isFinite(elapsed) || elapsed < 0) return;
    if (this.state !== 'playing') { this.updateFx(Math.min(0.05, elapsed)); return; }
    // Focus/visibility interruptions use the common lifecycle hook. A long frame
    // is also an explicit suspension: neither physics nor stopwatch races ahead.
    if (elapsed > 0.25) { this.paused = true; return; }
    this.accumulator += elapsed;
    while (this.accumulator + 1e-9 >= STEP && this.state === 'playing') {
      super.update(STEP); this.accumulator = Math.max(0, this.accumulator - STEP);
    }
    if (this.state !== 'playing') this.accumulator = 0;
  }
}