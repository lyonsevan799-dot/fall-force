import {
  GRAVITY, LAUNCH_V, MAX_VY, PLAYER_SIZE, CEIL_Y, FLOOR_Y,
  THEMES, clamp, rand, starsFor,
} from './config';
import { LEVELS } from './levels';
import { Particles } from './particles';
import resolveSurfaceCollision, { carryPlatform } from '@/game/surfaceCollision';
import createRush, { nextRushSegment } from '@/game/rushMotion';
import { startProgressRun, recordGemPickup, recordRunOutcome } from '@/game/meta/events';
import {
  sawGeom, bladeGeom, crusherGeom, laserGeom, platGeom, vanishGeom, spikeGeom,
  mspikeGeom, dropGeom, wallGeom, bounceGeom, trapGeom,
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
    this.gems = 0;
    this.rush = null;
    this.rushHeld = false;
    this.rushCandidate = null;
    this.gemGroups = {};
    this.ui = { state: 'intro', deaths: 0, time: 0, progress: 0, checkpoint: 0, level: 0, gems: 0, rush: false, rushAvailable: false };
  }

  get level() { return LEVELS[this.levelIndex]; }
  get theme() { return THEMES[this.level.theme]; }

  load(index) {
    this.levelIndex = index;
    const L = this.level;
    this.hazards = L.items.filter((i) => i.type === 'spike' || i.type === 'saw' || i.type === 'blade' || i.type === 'crusher' || i.type === 'laser' || i.type === 'mspike' || i.type === 'drop' || i.type === 'wall' || i.type === 'bounce' || i.type === 'trap');
    this.solids = L.items.filter((i) => i.type === 'plat' || i.type === 'vanish');
    this.zones = L.items.filter((i) => i.type === 'zone');
    this.portals = L.items.filter((i) => i.type === 'portal');
    this.gates = L.items.filter((i) => i.type === 'speed');
    this.checkpointItems = L.items.filter((i) => i.type === 'checkpoint');
    this.collectibles = L.items.filter((i) => i.type === 'gem');
    this.collectibles.forEach((g) => { g.collected = false; });
    this.buildGemGroups();
    this.rush = null;
    this.rushCandidate = null;
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
    this.middleAttempt?.fail(full ? 'Restarted the level' : 'Respawned during this attempt');
    if (full || this.cpIndex < 0) {
      if (full) {
        this.deaths = 0; this.cpIndex = -1; this.gems = 0;
        this.level.checkpoints.forEach((cp) => { cp.done = false; cp.collected = null; });
      }
      this.px = this.level.startX;
      this.dir = 1;
    } else {
      const cp = this.level.checkpoints[this.cpIndex];
      this.px = cp.x - 34;
      this.dir = cp.dir || 1;
      this.gems = cp.gems || 0;
      this.collectibles.forEach((g, index) => { g.collected = cp.collected ? cp.collected[index] === true : g.x < cp.x; });
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
    this.hazards.forEach((h) => {
      if (h.type === 'drop' || h.type === 'trap') { h._triggered = false; h._phase = 'idle'; h._triggerT = 0; }
    });
    if (full) this.collectibles.forEach((g) => { g.collected = false; });
    this.spawnT = 0;
    this.rush = null;
    this.rushCandidate = null;
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
    this.middleAttempt?.position(this);
    this.state = this.state === 'intro' ? 'intro' : 'playing';
    startProgressRun(this, full);
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
    this.ui.gems = this.gems;
    this.ui.rush = !!this.rush;
    this.ui.rushAvailable = this.rushAvailable;
  }

  buildGemGroups() {
    this.gemGroups = {};
    for (const g of this.collectibles) {
      if (g.groupId == null) continue;
      if (!this.gemGroups[g.groupId]) this.gemGroups[g.groupId] = [];
      this.gemGroups[g.groupId].push(g);
    }
  }

  get rushAvailable() {
    if (this.rush) return true;
    for (const g of this.collectibles) {
      if (g.collected || !g.trigger) continue;
      if (g.x > this.px && g.x - this.px < 560) return true;
    }
    return false;
  }

  addShake(mag, dur) {
    if (this.settings.shake === false) return;
    if (this.settings.reduced) mag *= 0.5;
    if (mag > this.shakeMag) { this.shakeMag = mag; this.shakeDur = Math.max(0.08, dur); this.shakeT = 0; }
  }

  switchGravity() {
    if (this.paused || this.rush || (this.state !== 'playing' && this.state !== 'intro')) return;
    // A forced field owns gravity until the body fully exits its marked bounds.
    if (this.zones?.some((zone) => this.px + PLAYER_SIZE > zone.x && this.px < zone.x + zone.w && -this.dir !== zone.dir)) return;
    this.middleAttempt?.sample(this);
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
    this.middleAttempt?.fail('Died during this attempt');
    this.state = 'dying';
    this.dieT = 0;
    this.deaths++;
    this.rush = null;
    this.rushCandidate = null;
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
    if (this.state !== 'playing' || this.finishReached) return;
    this.middleAttempt?.finish(this);
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
    recordRunOutcome(this, 'complete');
    this.syncUi();
  }

  triggerCheckpoint(i) {
    const cp = this.level.checkpoints[i];
    cp.done = true;
    cp.dir = this.dir;
    cp.gems = this.gems;
    cp.collected = this.collectibles.map((gem) => gem.collected === true);
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
    if (gem.collected || (this.state !== 'playing' && this.state !== 'intro')) return;
    gem.collected = true;
    this.gems++;
    recordGemPickup(this, gem);
    this.sound.sfx('gem');
    const theme = this.theme;
    const rushing = !!this.rush;
    this.particles.burst(gem.x, gem.y, rushing ? 14 : 10, {
      color: [theme.accent, '#ffffff', theme.accent2],
      speed: rushing ? 230 : 180, size: 3.5, life: 0.5, drag: 2.5, shape: 'spark',
    });
    this.particles.ring(gem.x, gem.y, { r: 5, rv: rushing ? 360 : 280, life: 0.35, color: theme.accent, w: 3 });
    this.flash = Math.min(1, this.flash + (rushing ? 0.14 : 0.1));
    // Special trigger gem: immediately engage Gem Rush along its row — no
    // hold required. The rush auto-follows the row and ends on its own.
    if (gem.trigger && gem.groupId != null && !this.rush && this.state === 'playing') {
      this.activateRush(gem.groupId);
    }
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
    if (this.state !== 'playing' && this.state !== 'intro') return;
    this.middleAttempt?.sample(this);
    if (this.rush) { this.stepRush(h); return; }
    const L = this.level;
    const size = PLAYER_SIZE;

    if (this.gateIndex < this.gates.length && this.px >= this.gates[this.gateIndex].x) {
      this.speedMult = this.gates[this.gateIndex].mult;
      this.gateIndex++;
    }

    const prevX = this.px, prevY = this.py;
    this.physicsStep = h;
    carryPlatform(this, h);

    // the player holds position during the level intro and launches on go
    if (this.state !== 'intro') this.px += L.speed * this.speedMult * h;

    if (!this.grounded) {
      this.vy += GRAVITY * this.dir * h;
      this.vy = clamp(this.vy, -MAX_VY, MAX_VY);
      this.py += this.vy * h;
    }

    this.middleAttempt?.sample(this);
    this.checkTriggers();
    this.resolveSurfaces(prevY, prevX);
    this.middleAttempt?.sample(this);
    this.checkHazards();

    if (this.state === 'playing' && !this.finishReached && this.px >= L.length) this.reachFinish();
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
    this.collectGems();
    for (let i = 0; i < this.level.checkpoints.length; i++) {
      const cp = this.level.checkpoints[i];
      if (!cp.done && this.px + size > cp.x) this.triggerCheckpoint(i);
    }
  }

  collectGems() {
    const size = PLAYER_SIZE;
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

  resolveSurfaces(prevY, prevX = this.px) {
    return resolveSurfaceCollision(this, prevY, prevX);
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
        case 'mspike': {
          const g = mspikeGeom(it, t);
          if (g.active && rectHit(bx, by, bw, bh, g.x, g.y, g.w, g.h)) return this.die();
          break;
        }
        case 'drop': {
          const prev = it._phase;
          const g = dropGeom(it, t, this.px);
          if (prev !== 'landed' && g.phase === 'landed') {
            this.addShake(8, 0.3);
            this.sound.sfx('land');
            const cx = g.x + g.w / 2;
            const cy = g.fromCeil ? FLOOR_Y : CEIL_Y;
            if (!this.settings.reduced) {
              this.particles.burst(cx, cy, 12, { color: [this.theme.accent, this.theme.groundTop, '#ffffff'], speed: 200, size: 4, life: 0.5, drag: 2.4, angle: g.fromCeil ? -Math.PI / 2 : Math.PI / 2, spread: 2.2 });
              this.particles.ring(cx, cy, { r: 6, rv: 320, life: 0.4, color: this.theme.accent, w: 3 });
            }
          }
          if (g.active && rectHit(bx, by, bw, bh, g.x + 3, g.y + 3, g.w - 6, g.h - 6)) return this.die();
          break;
        }
        case 'wall': {
          const g = wallGeom(it, t);
          if (g.topH > 4 && rectHit(bx, by, bw, bh, g.x, CEIL_Y, g.w, g.topH)) return this.die();
          if (g.botH > 4 && rectHit(bx, by, bw, bh, g.x, FLOOR_Y - g.botH, g.w, g.botH)) return this.die();
          break;
        }
        case 'bounce': {
          const g = bounceGeom(it, t);
          if (circleHit(g.x, g.y, g.r - 3, bx, by, bw, bh)) return this.die();
          break;
        }
        case 'trap': {
          const g = trapGeom(it, t, this.px);
          if (g.active && rectHit(bx, by, bw, bh, g.x, g.y, g.w, g.h)) return this.die();
          break;
        }
        default: break;
      }
    }
    return null;
  }

  // ---- Gem Rush: oversized trigger automatically follows every row gem ----
  activateRush(groupId) {
    const size = PLAYER_SIZE;
    const cx = this.px + size / 2, cy = this.py + size / 2;
    const rush = createRush(this.gemGroups[groupId], cx, cy);
    if (!rush) return;
    this.rush = rush;
    this.rushCandidate = null;
    this.grounded = false; this.groundPlat = null; this.vy = 0;
    this.sx = 0.8; this.sy = 1.2;
    this.sound.sfx('rush');
    this.flash = Math.min(1, this.flash + 0.3);
    this.addShake(5, 0.2);
    const theme = this.theme;
    this.particles.ring(cx, cy, { r: 8, rv: 420, life: 0.4, color: theme.accent, w: 4 });
  }

  endRush() {
    if (!this.rush) return;
    this.rush = null;
    this.grounded = false;
    this.groundPlat = null;
    this.flash = Math.min(1, this.flash + 0.12);
  }

  solidBlocksRush() {
    const size = PLAYER_SIZE;
    const bx = this.px + 4, by = this.py + 4, bw = size - 8, bh = size - 8;
    for (const it of this.solids) {
      const g = it.type === 'vanish' ? vanishGeom(it, this.t) : platGeom(it, this.t);
      if (!g.solid) continue;
      if (rectHit(bx, by, bw, bh, g.x, g.y, g.w, g.h)) return true;
    }
    return false;
  }

  stepRush(h) {
    const size = PLAYER_SIZE;
    const r = this.rush;
    const baseSpeed = this.level.speed * this.speedMult;
    const dirX = r.dir.x;
    let rushSpeed = dirX > 0.05 ? baseSpeed / dirX : baseSpeed * 2;
    rushSpeed = Math.min(rushSpeed, baseSpeed * 2.4);
    const prevX = this.px, prevY = this.py;
    this.physicsStep = h;
    r.s = Math.min(r.totalLen, r.s + rushSpeed * h);
    const ncx = r.startX + r.dir.x * r.s;
    const ncy = r.startY + r.dir.y * r.s;
    this.px = ncx - size / 2;
    this.middleAttempt?.sample(this, ncy - size / 2);
    this.py = clamp(ncy - size / 2, CEIL_Y, FLOOR_Y - size);
    if (this.gateIndex < this.gates.length && this.px >= this.gates[this.gateIndex].x) {
      this.speedMult = this.gates[this.gateIndex].mult;
      this.gateIndex++;
    }
    this.checkTriggers();
    const blocked = this.resolveSurfaces(prevY, prevX);
    this.checkHazards();
    if (!this.rush || this.state !== 'playing') return;
    if (blocked) { this.endRush(); return; }
    if (!this.finishReached && this.px >= this.level.length) { this.reachFinish(); return; }
    if (r.s >= r.totalLen && !nextRushSegment(r)) this.endRush();
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
      if (this.dieT > 0.5) { this.state = 'dead'; recordRunOutcome(this, 'death'); }
    } else if (this.state === 'complete') {
      this.completeT += dt;
      this.timeScale = Math.max(0.3, 0.32 + this.completeT * 0.5);
      this.zoomTarget = 1.06;
    }

    const worldDt = dt * this.timeScale;
    if (this.state === 'playing' || this.state === 'intro') {
      let rem = worldDt;
      let guard = 0;
      while (rem > 0.0005 && guard++ < 12) {
        const h = Math.min(rem, SUB);
        this.t += h;
        if (this.state === 'playing') this.attemptTime += h;
        this.step(h);
        rem -= h;
        if (this.state !== 'playing' && this.state !== 'intro') break;
      }
    }

    // squash / stretch spring
    const k = Math.min(1, dt * 13);
    this.sx += (1 - this.sx) * k;
    this.sy += (1 - this.sy) * k;
    this.rotV *= Math.max(0, 1 - dt * 6);
    const targetRot = this.rush
      ? clamp(this.rush.dir.y * 0.5, -0.32, 0.32)
      : clamp(this.vy / 2600, -0.32, 0.32) * this.dir;
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