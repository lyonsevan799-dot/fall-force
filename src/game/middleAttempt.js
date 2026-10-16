import { CEIL_Y, FLOOR_Y, PLAYER_SIZE } from '@/game/config';

// Observe the same unscaled square used by boundary collision resolution.
// Never use rendered scale, rotation, particles, or obstacle contacts.
export default class MiddleAttempt {
  constructor(onFailure) {
    this.started = false; this.failed = false; this.settled = false;
    this.reason = ''; this.succeeded = false; this.onFailure = onFailure;
  }
  fail(reason) {
    if (!this.started || this.failed || this.settled) return;
    this.failed = true; this.reason = reason;
    this.onFailure?.(reason);
  }
  sample(engine, y = engine.py) {
    if (y <= CEIL_Y) this.fail('Touched the top boundary');
    else if (y + PLAYER_SIZE >= FLOOR_Y) this.fail('Touched the bottom boundary');
  }
  position(engine) {
    engine.py = (CEIL_Y + FLOOR_Y - PLAYER_SIZE) / 2;
    engine.vy = 0; engine.dir = 1; engine.grounded = false; engine.groundPlat = null;
  }
  start(engine) {
    if (this.started) return;
    this.started = true; engine.state = 'playing'; engine.paused = false; engine.timeScale = 1;
    this.sample(engine);
  }
  finish(engine) {
    if (this.settled) return;
    this.sample(engine);
    if (engine.deaths > 0) this.fail('Died during this attempt');
    this.succeeded = this.started && !this.failed && engine.state === 'playing';
    this.settled = true;
  }
}