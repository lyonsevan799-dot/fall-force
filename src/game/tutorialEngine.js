import { Engine } from '@/game/engine';
import tutorialLevel from '@/game/tutorialLevel';

export default class TutorialEngine extends Engine {
  get level() { return this.tutorialLevel; }
  loadTutorial() {
    this.tutorialLevel = tutorialLevel();
    this.mode = 'tutorial';
    super.load(0);
    this.phase = 1;
    this.waiting = false;
    this.state = 'playing';
    this.timeScale = 1;
  }
  cue(phase) { this.phase = phase; this.waiting = true; }
  proceed() {
    if (!this.paused && this.waiting && [0, 10, 12, 14].includes(this.phase)) {
      this.phase++;
      this.waiting = false;
    }
  }
  switchGravity() {
    if (this.paused || this.state !== 'playing') return;
    if (this.phase === 1) this.cue(2);
    if (this.waiting && [2, 4, 6, 8].includes(this.phase)) {
      super.switchGravity();
      this.phase++;
      this.waiting = false;
    } else if ([11, 13, 15].includes(this.phase)) super.switchGravity();
  }
  reachFinish() {
    if (this.phase === 15) super.reachFinish();
  }
  step(h) {
    if (this.waiting) return;
    super.step(h);
    if (this.state !== 'playing') return;
    const x = this.px;
    if (this.phase === 1 && x >= 1100) this.cue(2);
    else if (this.phase === 3 && x >= 1900 && this.grounded) this.cue(4);
    else if (this.phase === 5 && x >= 2400 && this.grounded) this.cue(6);
    else if (this.phase === 7 && x >= 3300 && this.grounded) this.cue(8);
    else if (this.phase === 9 && x >= 3800 && this.grounded) this.cue(10);
    else if (this.phase === 11 && x >= 4700) this.cue(12);
    else if (this.phase === 13 && x >= 5700 && !this.rush) this.cue(14);
  }
  update(dt) {
    if (this.paused) return;
    if (this.waiting && this.state === 'playing') {
      this.updateFx(Math.min(0.05, dt));
      return;
    }
    super.update(dt);
  }
}