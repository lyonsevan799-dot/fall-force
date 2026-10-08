import {
  GRAVITY, LAUNCH_V, MAX_VY, PLAYER_SIZE, CEIL_Y, FLOOR_Y,
  THEMES, clamp, rand, starsFor,
} from './config';
import { LEVELS } from './levels';
import { Particles } from './particles';
import {
  sawGeom, bladeGeom, crusherGeom, laserGeom, platGeom, vanishGeom, spikeGeom,
  rectHit, circleHit, segmentHit,
} from './geom';

const SUB = 1 / 120;

export class Engine {
  constructor({ sound, settings }) {
    this.sound = sound;
    this.settings = settings || {};
    this.particles = new Particles(760);
    this.trail = [];
    this.state = 'intro';
    this.paused = false;
    this.levelIndex = 0;
    this.mode = 'career';
    this.px = 0; this.py = FLOOR_Y - PLAYER_SIZE; this.vy = 0;
    this.dir = 1; this.grounded = true; this.groundPlat = null;
    this.sx = 1; this.sy = 1; this.rot = 0; this.rotV = 0;
    this.shakeMag = 0; this.shakeDur = 1; this.shakeT = 0; this.shakeX = 0; this.shakeY = 0;
    this.flash = 0; this.zoom = 1; this.zoomTarget = 1; this.timeScale = 1;
    this.hitstop = 0;     this.dieT = 0; this.completeT = 0; this.introT = 0; this.spawnT = 0;
    this.t = 0; this.attemptTime = 0; this.deaths = 0; this.cpIndex = -1;
    this.speedMult = 1; this.gateIndex = 0;
    this.finishReached = false;
    this.stars = 3;
    this.ui = { state: 'intro', deaths: 0, time: 0, progress: 0, checkpoint: 0, level: 0 };
  }

  get level() { return LEVELS[this.levelIndex]; }
  get theme() { return THEMES[this.level.theme]; }

  load(index) {
    this.levelIndex = index;
    const L = this.level;
    this.hazards = L.items.filter((i) => i.type === 'spike' || i.type === 'saw' || i.type === 'blade' || i.type === 'crusher' || i.type === 'laser');
    this.solids = L.items.filter((i) => i.type === 'plat' || i.type === 'vanish');
    this.zones = L.items.filter((i) => i.type === 'zone');
    this.portals = L.items.filter((i) => i.type === 'portal');
    this.gates = L.items.filter((i) => i.type === 'speed');
    this.checkpointItems = L.items.filter((i) => i.type === 'checkpoint');
    this.collectibles = L.items.filter((i) => i.type === 'gem');
    L.checkpoints.forEach((c) => { c.done = false; });
    this.deaths = 0;
    this.cpIndex = -1;
    this.particles.clear();
    this.restart(true);
    this.state = 'intro';
    this.introT = 0;
    this.timeScale = 0.3;
    this.ui = { state: 'intro', deaths: 0, time: 0, progress: 0, checkpoint: 0, level: index };
  }

  restart(full = true) {
    if (full || this.cpIndex < 0) {
      if (full) { this.deaths = 0; this.cpIndex = -1; }
      this.px = this.level.startX;
      this.dir = 1;
    } else {
      const cp = this.level.checkpoints[this.cpIndex];
      this.px = cp.x - 34;
      this.dir = cp.dir || 1;
    }
    if (this.cpIndex < 0) this.deaths = full ? 0 : this.deaths;
    this.py = this.dir === 1 ? FLOOR_Y - PLAYER_SIZE : CEIL_Y;
    this.vy = 0;
    this.grounded = true;
    this.groundPlat = null;
    this.sx = 1; this.sy = 1; this.rot = 0; this.rotV = 0;
    this.t = 0;
    this.attemptTime = 0;
    this.speedMult = 1;
    this.gateIndex = 0;
    this.finishReached = false;
    this.hitstop = 0;
    this.flash = 0;
    this.shakeMag = 0;
    this.zoom = 1; this.zoomTarget = 1;
    this.timeScale = 1;
    this.dieT = 0; this.completeT = 0;
    this.trail.length = 0;
    this.particles.clear();
    this.portals.forEach((p) => { p.used = false; });
    this.solids.forEach((s) => { s._ly = undefined; });
    this.spawnT = 0;
    if (!full) {
      // Quick respawn-in: the player materialises at the checkpoint with a
      // short scale-up animation so retry feels instant, not jarring.
      this.spawnT = 0.42;
      const cx = this.px + PLAYER_SIZE / 2;
      const cy = this.py + PLAYER_SIZE / 2;
      const theme = this.theme;
      this.particles.ring(cx, cy, { r: 5, rv: 460, life: 0.42, color: theme.accent, w: 4 });
      if (!this.settings.reduced) {
        this.particles.burst(cx, cy, 14, { color: [theme.accent, '#ffffff'], speed: 210, size: 3.6, life: 0.5, drag: 2.6, shape: 'spark' });
      }
      this.flash = 0.3;
      this.zoomTarget = 1.04;
      this.sound.sfx('spawn');
    }
    this.state = this.state === 'intro' ? 'intro' : 'playing';
    this.syncUi();
  }

  respawn() { this.restart(false); }

  syncUi() {
    this.ui.state = this.state;
    this.ui.deaths = this.deaths;
    this.ui.time = this.attemptTime;
    this.ui.progress = clamp(this.px / this.level.length, 0, 1);
    this.ui.checkpoint = this.cpIndex + 1;
    this.ui.level = this.levelIndex;
  }

  addShake(mag, dur) {
    if (this.settings.shake === false) return;
    if (this.settings.reduced) mag *= 0.5;
    if (mag > this.shakeMag) { this.shakeMag = mag; this.shakeDur = Math.max(0.08, dur); this.shakeT = 0; }
  }

  switchGravity() {
    if (this.state !== 'playing' && this.state !== 'intro') return;
    this.dir = -this.dir;
    this.vy = this.dir * LAUNCH_V;
    this.grounded = false;
    this.groundPlat = null;
    this.sx = 0.76; this.sy = 1.3;
    this.rotV = rand(-5, 5);
    const cx = this.px + PLAYER_SIZE / 2;
    const cy = this.py + PLAYER_SIZE / 2;
    const theme = this.theme;
    const reduced = this.settings.reduced;
    this.particles.burst(cx, cy, reduced ? 5 : 14, {
      color: [theme.accent, theme.player, '#ffffff'],
      speed: 215, size: 4.4, life: 0.42, drag: 2.8, shape: 'spark',
    });
    if (!reduced) {
      this.particles.ring(cx, cy, { r: 7, rv: 330, life: 0.3, color: theme.accent, w: 3 });
      this.particles.burst(cx, cy + this.dir * 14, 5, {
        color: theme.accent, speed: 90, size: 3, life: 0.35, add: true, angle: this.dir > 0 ? Math.PI / 2 : -Math.PI / 2, spread: 1.2,
      });
    }
    this.flash = Math.min(1, this.flash + 0.13);
    this.addShake(4.5, 0.16);
    this.sound.sfx('switch');
  }

  die() {
    if (this.state !== 'playing' && this.state !== 'intro') return;
    this.state = 'dying';
    this.dieT = 0;
    this.deaths++;
    this.hitstop = 0.075;
    this.flash = 0.95;
    this.addShake(17, 0.55);
    this.timeScale = 0.55;
    this.zoomTarget = 1.15;
    this.sound.sfx('death');
    const cx = this.px + PLAYER_SIZE / 2;
    const cy = this.py + PLAYER_SIZE / 2;
    const theme = this.theme;
    const cols = [theme.player, theme.accent, '#ffffff', theme.accent2];
    const n = this.settings.reduced ? 20 : 34;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(150, 640);
      this.particles.spawn({
        x: cx + rand(-11, 11), y: cy + rand(-11, 11),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.65, 1.3), size: rand(5, 13), color: cols[i % cols.length],
        shape: 'frag', rot: Math.random() * 6.28, vr: rand(-14, 14),
        grav: 1500 * this.dir, drag: 0.85, add: false,
      });
    }
    this.particles.ring(cx, cy, { r: 10, rv: 720, life: 0.34, color: '#ffffff', w: 6 });
    this.particles.ring(cx, cy, { r: 6, rv: 430, life: 0.5, color: theme.accent, w: 4 });
    if (!this.settings.reduced) {
      this.particles.ring(cx, cy, { r: 4, rv: 260, life: 0.65, color: theme.accent2, w: 2 });
      this.particles.burst(cx, cy, 16, { color: ['#ffffff', theme.accent], speed: 330, size: 3.6, life: 0.5, drag: 2.2, shape: 'spark' });
    }
    this.syncUi();
  }

  reachFinish() {
    this.finishReached = true;
    this.state = 'complete';
    this.completeT = 0;
    this.timeScale = 0.32;
    this.zoomTarget = 1.06;
    this.flash = 0.6;
    this.addShake(10, 0.4);
    this.sound.sfx('complete');
    this.stars = starsFor(this.deaths);
    const theme = this.theme;
    const cx = this.px + PLAYER_SIZE / 2;
    const cy = this.py + PLAYER_SIZE / 2;
    const cols = [theme.accent, theme.accent2, '#ffffff', theme.player];
    for (let i = 0; i < (this.settings.reduced ? 26 : 60); i++) {
      const a = rand(-Math.PI, 0);
      const sp = rand(200, 700);
      this.particles.spawn({
        x: cx, y: cy - 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.9, 1.8), size: rand(4, 10), color: cols[i % cols.length],
        shape: i % 3 === 0 ? 'frag' : 'spark', rot: Math.random() * 6.28, vr: rand(-12, 12),
        grav: 520, drag: 0.5, add: i % 3 !== 0,
      });
    }
    this.particles.ring(cx, cy, { r: 12, rv: 640, life: 0.6, color: '#ffffff', w: 6 });
    this.particles.ring(cx, cy, { r: 8, rv: 380, life: 0.9, color: theme.accent, w: 3 });
    this.syncUi();
  }

  triggerCheckpoint(i) {
    const cp = this.level.checkpoints[i];
    cp.done = true;
    cp.dir = this.dir;
    this.cpIndex = i;
    this.sound.sfx('checkpoint');
    this.flash = Math.min(1, this.flash + 0.25);
    this.addShake(5, 0.25);
    const theme = this.theme;
    const cx = this.px + PLAYER_SIZE / 2;
    const cy = this.py + PLAYER_SIZE / 2;
    this.particles.ring(cx, cy, { r: 10, rv: 520, life: 0.45, color: theme.accent, w: 5 });
    this.particles.burst(cx, cy, this.settings.reduced ? 10 : 22, { color: [theme.accent, '#ffffff'], speed: 280, size: 4, life: 0.6, drag: 2.2, shape: 'spark' });
    this.syncUi();
  }

  collectGem(gem) {
    gem.collected = true;
    this.sound.sfx('gem');
  }

  land(plat) {
    const impact = Math.abs(this.vy);
    const wasAir = !this.grounded;
    this.grounded = true;
    this.groundPlat = plat || null;
    this.vy = 0;
    this.rotV = 0;
    if (wasAir) {
      this.sx = 1.32; this.sy = 0.7;
      const theme = this.theme;
      const cx = this.px + PLAYER_SIZE / 2;
      const cy = this.dir === 1 ? this.py + PLAYER_SIZE : this.py;
      if (!this.settings.reduced) {
        this.particles.burst(cx, cy, 8, {
          color: [theme.accent, theme.groundTop], speed: 150, size: 3.4, life: 0.3,
          angle: this.dir === 1 ? -Math.PI / 2 : Math.PI / 2, spread: 2.4, add: true, drag: 2.6,
        });
        this.particles.ring(cx, cy, { r: 4, rv: 190, life: 0.26, color: theme.accent, w: 2, alpha: 0.6 });
      }
      this.sound.sfx('land');
      this.addShake(Math.min(4.5, impact / 330), 0.13);
    }
  }

  step(h) {
    const L = this.level;
    const size = PLAYER_SIZE;

    if (this.gateIndex < this.gates.length && this.px >= this.gates[this.gateIndex].x) {
      this.speedMult = this.gates[this.gateIndex].mult;
      this.gateIndex++;
    }

    // carried by a platform that is moving vertically
    if (this.grounded && this.groundPlat) {
      const it = this.groundPlat;
      const g = it.type === 'vanish' ? vanishGeom(it, this.t) : platGeom(it, this.t);
      const dy = g.y - (it._ly == null ? g.y : it._ly);
      const ox = this.px + size - 6 > g.x && this.px + 6 < g.x + g.w;
      if (g.solid && ox) {
        this.py += dy;
      } else {
        this.grounded = false;
        this.groundPlat = null;
        this.vy = 0;
      }
      it._ly = g.y;
    }

    // the player holds position during the level intro and launches on go
    if (this.state !== 'intro') this.px += L.speed * this.speedMult * h;

    const prevY = this.py;
    if (!this.grounded) {
      this.vy += GRAVITY * this.dir * h;
      this.vy = clamp(this.vy, -MAX_VY, MAX_VY);
      this.py += this.vy * h;
    }

    this.checkTriggers();
    this.resolveSurfaces(prevY);
    this.checkHazards();

    if (!this.finishReached && this.px >= L.length) this.reachFinish();
  }

  checkTriggers() {
    const size = PLAYER_SIZE;
    for (let i = 0; i < this.zones.length; i++) {
      const z = this.zones[i];
      if (this.px + size > z.x && this.px < z.x + z.w && this.dir !== z.dir) {
        this.dir = z.dir;
        this.vy = this.dir * 240;
        this.grounded = false;
        this.groundPlat = null;
        this.sx = 0.85; this.sy = 1.2;
        const cx = this.px + size / 2, cy = this.py + size / 2;
        this.particles.burst(cx, cy, this.settings.reduced ? 6 : 14, { color: [this.theme.accent, '#ffffff'], speed: 190, size: 4, life: 0.5, drag: 2.4, shape: 'spark' });
        this.addShake(4, 0.18);
        this.sound.sfx('switch');
      }
    }
    for (let i = 0; i < this.portals.length; i++) {
      const p = this.portals[i];
      if (p.used) continue;
      if (Math.abs(this.px + size / 2 - p.x) < 26) {
        p.used = true;
        this.dir = p.dir;
        this.vy = this.dir * LAUNCH_V * 1.1;
        this.grounded = false;
        this.groundPlat = null;
        this.speedMult += p.boost;
        this.sx = 0.7; this.sy = 1.35;
        this.flash = 0.9;
        this.addShake(9, 0.35);
        this.sound.sfx('portal');
        const cx = this.px + size / 2, cy = this.py + size / 2;
        const theme = this.theme;
        this.particles.ring(cx, cy, { r: 8, rv: 700, life: 0.45, color: '#ffffff', w: 5 });
        this.particles.ring(cx, cy, { r: 14, rv: 420, life: 0.7, color: theme.accent, w: 3 });
        if (!this.settings.reduced) {
          this.particles.burst(cx, cy, 26, { color: [theme.accent, theme.accent2, '#ffffff'], speed: 360, size: 4, life: 0.7, drag: 2, shape: 'spark' });
        }
      }
    }
    for (let i = 0; i < this.level.checkpoints.length; i++) {
      const cp = this.level.checkpoints[i];
      if (!cp.done && this.px + size > cp.x) this.triggerCheckpoint(i);
    }
    for (let i = 0; i < this.collectibles.length; i++) {
      const gem = this.collectibles[i];
      if (gem.collected) continue;
      const cx = this.px + size / 2;
      const cy = this.py + size / 2;
      const dx = cx - gem.x;
      const dy = cy - gem.y;
      const rr = (gem.r || 13) + size * 0.4;
      if (dx * dx + dy * dy < rr * rr) this.collectGem(gem);
    }
  }

  resolveSurfaces(prevY) {
    const size = PLAYER_SIZE;
    if (this.dir === 1) {
      if (this.py + size >= FLOOR_Y) {
        this.py = FLOOR_Y - size;
        this.land(null);
      }
    } else if (this.py <= CEIL_Y) {
      this.py = CEIL_Y;
      this.land(null);
    }

    for (let i = 0; i < this.solids.length; i++) {
      const it = this.solids[i];
      const g = it.type === 'vanish' ? vanishGeom(it, this.t) : platGeom(it, this.t);
      it._last = g;
      if (it !== this.groundPlat) it._ly = g.y;
      if (!g.solid) continue;
      if (!(this.px + size - 6 > g.x && this.px + 6 < g.x + g.w)) continue;
      if (this.dir === 1) {
        const pb = prevY + size;
        const nb = this.py + size;
        if (nb >= g.y && pb <= g.y + 8) { this.py = g.y - size; this.land(it); }
      } else {
        const bottom = g.y + g.h;
        if (this.py <= bottom && prevY >= bottom - 8) { this.py = bottom; this.land(it); }
      }
    }
  }

  checkHazards() {
    const size = PLAYER_SIZE;
    const bx = this.px + 5;
    const by = this.py + 5;
    const bw = size - 10;
    const bh = size - 10;
    const t = this.t;
    for (let i = 0; i < this.hazards.length; i++) {
      const it = this.hazards[i];
      switch (it.type) {
        case 'spike': {
          const g = spikeGeom(it);
          if (rectHit(bx, by, bw, bh, g.x, g.y, g.w, g.h)) return this.die();
          break;
        }
        case 'saw': {
          const g = sawGeom(it, t);
          if (circleHit(g.x, g.y, g.r - 3, bx, by, bw, bh)) return this.die();
          break;
        }
        case 'blade': {
          const g = bladeGeom(it, t);
          if (segmentHit(g.x1, g.y1, g.x2, g.y2, bx, by, bw, bh, 7)) return this.die();
          break;
        }
        case 'crusher': {
          const g = crusherGeom(it, t);
          if (rectHit(bx, by, bw, bh, g.x - g.w / 2 + 4, g.y + 4, g.w - 8, g.h - 8)) return this.die();
          break;
        }
        case 'laser': {
          const g = laserGeom(it, t);
          if (g.active && rectHit(bx, by, bw, bh, g.x + 3, g.y, g.w - 6, g.h)) return this.die();
          break;
        }
        default: break;
      }
    }
    return null;
  }

  update(dtRaw) {
    if (this.paused) return;
    const dt = Math.min(0.05, dtRaw);
    this.dt = dt;

    if (this.hitstop > 0) {
      this.hitstop -= dt;
      this.updateFx(dt);
      return;
    }

    if (this.state === 'intro') {
      this.introT += dt;
      const k = Math.min(1, this.introT / 1.5);
      this.timeScale = 0.3 + 0.7 * k;
      if (this.introT >= 1.5) {
        this.state = 'playing';
        this.timeScale = 1;
        this.attemptTime = 0;
      }
    } else if (this.state === 'dying') {
      this.dieT += dt;
      this.timeScale = Math.max(0.05, this.timeScale - dt * 1.8);
      this.zoomTarget = 1.15;
      if (this.dieT > 0.5) { this.state = 'dead'; }
    } else if (this.state === 'complete') {
      this.completeT += dt;
      this.timeScale = Math.max(0.3, 0.32 + this.completeT * 0.5);
      this.zoomTarget = 1.06;
    }

    const worldDt = dt * this.timeScale;
    if (this.state === 'playing' || this.state === 'intro' || this.state === 'complete') {
      this.t += worldDt;
      this.attemptTime += worldDt;
      let rem = worldDt;
      let guard = 0;
      while (rem > 0.0005 && guard++ < 12) {
        const h = Math.min(rem, SUB);
        this.step(h);
        rem -= h;
      }
    }

    // squash / stretch spring
    const k = Math.min(1, dt * 13);
    this.sx += (1 - this.sx) * k;
    this.sy += (1 - this.sy) * k;
    this.rotV *= Math.max(0, 1 - dt * 6);
    const targetRot = clamp(this.vy / 2600, -0.32, 0.32) * this.dir;
    this.rot += (targetRot - this.rot) * Math.min(1, dt * 10) + this.rotV * dt;

    // speed trail
    if (this.state === 'playing' || this.state === 'intro') {
      if (!this.trail.length || this.trail[this.trail.length - 1].x < this.px - 9) {
        this.trail.push({ x: this.px, y: this.py, life: 0.24, max: 0.24, dir: this.dir });
        if (this.trail.length > 16) this.trail.shift();
      }
    }

    this.updateFx(dt);
    this.syncUi();
  }

  updateFx(dt) {
    this.particles.update(dt);
    if (this.spawnT > 0) this.spawnT = Math.max(0, this.spawnT - dt);
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
    if (this.shakeMag > 0) {
      this.shakeT += dt;
      const k = Math.max(0, 1 - this.shakeT / this.shakeDur);
      const m = this.shakeMag * k * k;
      this.shakeX = rand(-m, m);
      this.shakeY = rand(-m, m);
      if (k <= 0) { this.shakeMag = 0; this.shakeX = 0; this.shakeY = 0; }
    } else {
      this.shakeX = 0; this.shakeY = 0;
    }
    this.flash = Math.max(0, this.flash - dt * 2.6);
    this.zoom += (this.zoomTarget - this.zoom) * Math.min(1, dt * 5);
  }
}