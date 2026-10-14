import { GRAVITY, LAUNCH_V, MAX_VY, PLAYER_SIZE, CEIL_Y, FLOOR_Y, THEMES, clamp, rand } from './config';
import { Particles } from './particles';
import {
  sawGeom, bladeGeom, crusherGeom, laserGeom, platGeom, vanishGeom, spikeGeom,
  mspikeGeom, dropGeom, wallGeom, bounceGeom, trapGeom,
  rectHit, circleHit, segmentHit,
} from './geom';
import { RACE_LEVELS } from './raceLevels';

const SUB = 1 / 120;
const GRACE = 2.6; // seconds the loser keeps moving after the winner finishes

// RaceEngine: two independent players share one world and one clock so the
// hazards stay perfectly synchronised and fair. Each player has their own
// physics state, gravity-switch input, death/respawn, and finish detection.
// (Internal term "gravity switch" refers to the mechanic, not the game name.)
// The first player to cross the finish line wins; the loser gets a short
// grace period to keep racing before the result screen appears.
export class RaceEngine {
  constructor({ sound, settings, levelIndex = 0 }) {
    this.sound = sound;
    this.settings = settings || {};
    this.mode = 'race';
    this.particles = new Particles(900);
    this.shakeMag = 0; this.shakeDur = 1; this.shakeT = 0; this.shakeX = 0; this.shakeY = 0;
    this.flash = 0; this.zoom = 1; this.zoomTarget = 1; this.timeScale = 1; this.hitstop = 0;
    this.t = 0;
    this.state = 'ready';
    this.paused = false;
    this.countdown = 3;
    this._lastBeep = 3;
    this.raceTime = 0;
    this.winner = -1;
    this.finishT = 0;
    this.players = [];
    this.levelIndex = 0;
    this.load(levelIndex);
  }

  get level() { return RACE_LEVELS[this.levelIndex]; }
  get theme() { return THEMES[this.level.theme]; }

  load(index) {
    this.levelIndex = index;
    const L = this.level;
    this.hazards = L.items.filter((i) => i.type === 'spike' || i.type === 'saw' || i.type === 'blade' || i.type === 'crusher' || i.type === 'laser' || i.type === 'mspike' || i.type === 'drop' || i.type === 'wall' || i.type === 'bounce' || i.type === 'trap');
    for (const h of this.hazards) {
      if (h.type === 'drop' || h.type === 'trap') { h._triggered = false; h._phase = 'idle'; h._triggerT = 0; }
    }
    this.solids = L.items.filter((i) => i.type === 'plat' || i.type === 'vanish');
    this.zones = L.items.filter((i) => i.type === 'zone');
    this.portals = L.items.filter((i) => i.type === 'portal');
    this.gates = L.items.filter((i) => i.type === 'speed');
    this.players = [this._mkPlayer(0), this._mkPlayer(1)];
    this.particles.clear();
    this.state = 'ready';
    this.countdown = 3;
    this._lastBeep = 3;
    this.raceTime = 0;
    this.winner = -1;
    this.finishT = 0;
    this.t = 0;
    this.timeScale = 1;
    this.zoom = 1; this.zoomTarget = 1;
    this.flash = 0; this.shakeMag = 0;
    this.hitstop = 0;
  }

  _mkPlayer(i) {
    return {
      index: i,
      px: this.level.startX,
      py: FLOOR_Y - PLAYER_SIZE,
      vy: 0, dir: 1, grounded: true, groundPlat: null,
      sx: 1, sy: 1, rot: 0, rotV: 0,
      speedMult: 1, gateIndex: 0,
      alive: true, deadT: 0, invuln: 0,
      finished: false, finishTime: null, finalProgress: 0,
      portalsUsed: this.portals.map(() => false),
      trail: [],
    };
  }

  start() { if (this.state === 'ready') { this.state = 'countdown'; this.countdown = 3; this._lastBeep = 3; this.sound.sfx('beep'); } }

  addShake(mag, dur) {
    if (this.settings.shake === false) return;
    if (this.settings.reduced) mag *= 0.5;
    if (mag > this.shakeMag) { this.shakeMag = mag; this.shakeDur = Math.max(0.08, dur); this.shakeT = 0; }
  }

  switchPlayer(p) {
    if (!this._isActive() || !p.alive || p.finished) return;
    p.dir = -p.dir;
    p.vy = p.dir * LAUNCH_V;
    p.grounded = false; p.groundPlat = null;
    p.sx = 0.76; p.sy = 1.3; p.rotV = rand(-5, 5);
    const cx = p.px + PLAYER_SIZE / 2, cy = p.py + PLAYER_SIZE / 2;
    const theme = this.theme;
    const reduced = this.settings.reduced;
    this.particles.burst(cx, cy, reduced ? 5 : 12, { color: [theme.accent, '#ffffff'], speed: 200, size: 4, life: 0.4, drag: 2.8, shape: 'spark' });
    if (!reduced) this.particles.ring(cx, cy, { r: 7, rv: 300, life: 0.3, color: theme.accent, w: 3 });
    this.flash = Math.min(1, this.flash + 0.1);
    this.addShake(3, 0.14);
    this.sound.sfx('switch');
  }

  _isActive() { return this.state === 'racing' || this.state === 'finished'; }

  stepPlayer(p, h) {
    const L = this.level;
    const size = PLAYER_SIZE;
    if (p.gateIndex < this.gates.length && p.px >= this.gates[p.gateIndex].x) {
      p.speedMult = this.gates[p.gateIndex].mult;
      p.gateIndex++;
    }
    if (p.grounded && p.groundPlat) {
      const it = p.groundPlat;
      const g = it.type === 'vanish' ? vanishGeom(it, this.t) : platGeom(it, this.t);
      const dy = g.y - (it._ly == null ? g.y : it._ly);
      const ox = p.px + size - 6 > g.x && p.px + 6 < g.x + g.w;
      if (g.solid && ox) p.py += dy;
      else { p.grounded = false; p.groundPlat = null; p.vy = 0; }
      it._ly = g.y;
    }
    if (this._isActive()) p.px += L.speed * p.speedMult * h;
    const prevY = p.py;
    if (!p.grounded) {
      p.vy += GRAVITY * p.dir * h;
      p.vy = clamp(p.vy, -MAX_VY, MAX_VY);
      p.py += p.vy * h;
    }
    this.checkTriggersPlayer(p);
    this.resolveSurfacesPlayer(p, prevY);
    if (p.invuln > 0) p.invuln -= h;
    if (p.alive && p.invuln <= 0 && !p.finished) this.checkHazardsPlayer(p);
    if (!p.finished && p.px >= L.length) this.playerFinish(p);
  }

  checkTriggersPlayer(p) {
    const size = PLAYER_SIZE;
    for (const z of this.zones) {
      if (p.px + size > z.x && p.px < z.x + z.w && p.dir !== z.dir) {
        p.dir = z.dir; p.vy = p.dir * 240; p.grounded = false; p.groundPlat = null;
        p.sx = 0.85; p.sy = 1.2;
        const cx = p.px + size / 2, cy = p.py + size / 2;
        this.particles.burst(cx, cy, this.settings.reduced ? 6 : 12, { color: [this.theme.accent, '#ffffff'], speed: 180, size: 4, life: 0.5, drag: 2.4, shape: 'spark' });
        this.addShake(3, 0.16); this.sound.sfx('switch');
      }
    }
    for (let i = 0; i < this.portals.length; i++) {
      const pt = this.portals[i];
      if (p.portalsUsed[i]) continue;
      if (Math.abs(p.px + size / 2 - pt.x) < 26) {
        p.portalsUsed[i] = true;
        p.dir = pt.dir; p.vy = p.dir * LAUNCH_V * 1.1; p.grounded = false; p.groundPlat = null;
        p.speedMult += pt.boost; p.sx = 0.7; p.sy = 1.35;
        this.flash = 0.8; this.addShake(8, 0.3); this.sound.sfx('portal');
        const cx = p.px + size / 2, cy = p.py + size / 2;
        this.particles.ring(cx, cy, { r: 8, rv: 680, life: 0.45, color: '#ffffff', w: 5 });
        this.particles.ring(cx, cy, { r: 14, rv: 400, life: 0.7, color: this.theme.accent, w: 3 });
      }
    }
  }

  resolveSurfacesPlayer(p, prevY) {
    const size = PLAYER_SIZE;
    if (p.dir === 1) {
      if (p.py + size >= FLOOR_Y) { p.py = FLOOR_Y - size; this.landPlayer(p, null); }
    } else if (p.py <= CEIL_Y) { p.py = CEIL_Y; this.landPlayer(p, null); }
    for (const it of this.solids) {
      const g = it.type === 'vanish' ? vanishGeom(it, this.t) : platGeom(it, this.t);
      if (it !== p.groundPlat) it._ly = g.y;
      if (!g.solid) continue;
      if (!(p.px + size - 6 > g.x && p.px + 6 < g.x + g.w)) continue;
      if (p.dir === 1) {
        const pb = prevY + size, nb = p.py + size;
        if (nb >= g.y && pb <= g.y + 8) { p.py = g.y - size; this.landPlayer(p, it); }
      } else {
        const bottom = g.y + g.h;
        if (p.py <= bottom && prevY >= bottom - 8) { p.py = bottom; this.landPlayer(p, it); }
      }
    }
  }

  landPlayer(p, plat) {
    const impact = Math.abs(p.vy);
    const wasAir = !p.grounded;
    p.grounded = true; p.groundPlat = plat || null; p.vy = 0; p.rotV = 0;
    if (wasAir) {
      p.sx = 1.32; p.sy = 0.7;
      const cx = p.px + PLAYER_SIZE / 2;
      const cy = p.dir === 1 ? p.py + PLAYER_SIZE : p.py;
      if (!this.settings.reduced) {
        this.particles.burst(cx, cy, 7, { color: [this.theme.accent, this.theme.groundTop], speed: 140, size: 3, life: 0.3, angle: p.dir === 1 ? -Math.PI / 2 : Math.PI / 2, spread: 2.4, add: true, drag: 2.6 });
      }
      this.sound.sfx('land');
      this.addShake(Math.min(4, impact / 330), 0.12);
    }
  }

  checkHazardsPlayer(p) {
    const size = PLAYER_SIZE;
    const bx = p.px + 5, by = p.py + 5, bw = size - 10, bh = size - 10;
    const t = this.t;
    for (const it of this.hazards) {
      switch (it.type) {
        case 'spike': { const g = spikeGeom(it); if (rectHit(bx, by, bw, bh, g.x, g.y, g.w, g.h)) return this.diePlayer(p); break; }
        case 'saw': { const g = sawGeom(it, t); if (circleHit(g.x, g.y, g.r - 3, bx, by, bw, bh)) return this.diePlayer(p); break; }
        case 'blade': { const g = bladeGeom(it, t); if (segmentHit(g.x1, g.y1, g.x2, g.y2, bx, by, bw, bh, 7)) return this.diePlayer(p); break; }
        case 'crusher': { const g = crusherGeom(it, t); if (rectHit(bx, by, bw, bh, g.x - g.w / 2 + 4, g.y + 4, g.w - 8, g.h - 8)) return this.diePlayer(p); break; }
        case 'laser': { const g = laserGeom(it, t); if (g.active && rectHit(bx, by, bw, bh, g.x + 3, g.y, g.w - 6, g.h)) return this.diePlayer(p); break; }
        case 'mspike': { const g = mspikeGeom(it, t); if (g.active && rectHit(bx, by, bw, bh, g.x, g.y, g.w, g.h)) return this.diePlayer(p); break; }
        case 'drop': { const g = dropGeom(it, t, p.px); if (g.active && rectHit(bx, by, bw, bh, g.x + 3, g.y + 3, g.w - 6, g.h - 6)) return this.diePlayer(p); break; }
        case 'wall': { const g = wallGeom(it, t); if (g.topH > 4 && rectHit(bx, by, bw, bh, g.x, CEIL_Y, g.w, g.topH)) return this.diePlayer(p); if (g.botH > 4 && rectHit(bx, by, bw, bh, g.x, FLOOR_Y - g.botH, g.w, g.botH)) return this.diePlayer(p); break; }
        case 'bounce': { const g = bounceGeom(it, t); if (circleHit(g.x, g.y, g.r - 3, bx, by, bw, bh)) return this.diePlayer(p); break; }
        case 'trap': { const g = trapGeom(it, t, p.px); if (g.active && rectHit(bx, by, bw, bh, g.x, g.y, g.w, g.h)) return this.diePlayer(p); break; }
        default: break;
      }
    }
  }

  diePlayer(p) {
    if (!this._isActive() || !p.alive || p.finished) return;
    p.alive = false; p.deadT = 0;
    this.hitstop = 0.06; this.flash = 0.8;
    this.addShake(13, 0.45);
    this.sound.sfx('death');
    const cx = p.px + PLAYER_SIZE / 2, cy = p.py + PLAYER_SIZE / 2;
    const theme = this.theme;
    const cols = [theme.player, theme.accent, '#ffffff'];
    const n = this.settings.reduced ? 16 : 26;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28; const sp = rand(140, 560);
      this.particles.spawn({ x: cx + rand(-10, 10), y: cy + rand(-10, 10), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.6, 1.2), size: rand(5, 11), color: cols[i % cols.length], shape: 'frag', rot: Math.random() * 6.28, vr: rand(-12, 12), grav: 1500 * p.dir, drag: 0.85, add: false });
    }
    this.particles.ring(cx, cy, { r: 10, rv: 680, life: 0.34, color: '#ffffff', w: 6 });
  }

  // Death costs ground (respawn a few steps back) with brief invulnerability so
  // a player can recover and still catch up — never a full reset.
  respawnPlayer(p) {
    p.alive = true; p.deadT = 0; p.invuln = 1.2;
    p.px = Math.max(this.level.startX, p.px - 600);
    p.py = FLOOR_Y - PLAYER_SIZE; p.vy = 0; p.dir = 1;
    p.grounded = true; p.groundPlat = null;
    p.sx = 1; p.sy = 1; p.rot = 0; p.rotV = 0;
    p.speedMult = 1;
    p.trail.length = 0;
  }

  playerFinish(p) {
    p.finished = true;
    p.finishTime = this.raceTime;
    if (this.winner < 0) {
      this.winner = p.index;
      this.state = 'finished';
      this.finishT = 0;
      this.flash = 0.7; this.addShake(12, 0.5);
      this.sound.sfx('victory');
      const cx = p.px + PLAYER_SIZE / 2, cy = p.py + PLAYER_SIZE / 2;
      const theme = this.theme;
      for (let i = 0; i < (this.settings.reduced ? 24 : 60); i++) {
        const a = rand(-Math.PI, 0); const sp = rand(180, 680);
        this.particles.spawn({ x: cx, y: cy - 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.8, 1.8), size: rand(4, 10), color: [theme.accent, theme.accent2, '#ffffff'][i % 3], shape: i % 3 ? 'spark' : 'frag', rot: Math.random() * 6.28, vr: rand(-10, 10), grav: 500, drag: 0.5, add: i % 3 !== 0 });
      }
      this.particles.ring(cx, cy, { r: 12, rv: 640, life: 0.6, color: '#ffffff', w: 6 });
      this.particles.ring(cx, cy, { r: 8, rv: 380, life: 0.9, color: theme.accent, w: 3 });
    }
  }

  update(dtRaw) {
    if (this.paused) return;
    const dt = Math.min(0.05, dtRaw);
    this.dt = dt;
    if (this.hitstop > 0) { this.hitstop -= dt; this.updateFx(dt); return; }

    if (this.state === 'countdown') {
      const prevCeil = Math.ceil(this.countdown);
      this.countdown -= dt;
      const newCeil = Math.ceil(this.countdown);
      if (newCeil < prevCeil && newCeil > 0) this.sound.sfx('beep');
      if (this.countdown <= 0) { this.state = 'racing'; this.raceTime = 0; this.sound.sfx('go'); }
    }

    if (this.state === 'racing' || this.state === 'finished') {
      this.t += dt * this.timeScale;
      if (this.state === 'racing') this.raceTime += dt * this.timeScale;
      let rem = dt * this.timeScale; let guard = 0;
      while (rem > 0.0005 && guard++ < 16) {
        const h = Math.min(rem, SUB);
        for (const p of this.players) { if (p.alive && !p.finished) this.stepPlayer(p, h); }
        rem -= h;
      }
      for (const p of this.players) {
        if (!p.alive && !p.finished) { p.deadT += dt; if (p.deadT > 0.6) this.respawnPlayer(p); }
      }
    }

    if (this.state === 'finished') {
      this.finishT += dt;
      if (this.finishT >= GRACE) {
        for (const p of this.players) {
          if (!p.finished) p.finalProgress = this.getProgress(p);
        }
        this.state = 'raceover';
      }
    }

    for (const p of this.players) {
      const k = Math.min(1, dt * 13);
      p.sx += (1 - p.sx) * k; p.sy += (1 - p.sy) * k;
      p.rotV *= Math.max(0, 1 - dt * 6);
      const targetRot = clamp(p.vy / 2600, -0.32, 0.32) * p.dir;
      p.rot += (targetRot - p.rot) * Math.min(1, dt * 10) + p.rotV * dt;
      if (this._isActive() && p.alive) {
        if (!p.trail.length || p.trail[p.trail.length - 1].x < p.px - 9) {
          p.trail.push({ x: p.px, y: p.py, life: 0.24, max: 0.24, dir: p.dir });
          if (p.trail.length > 12) p.trail.shift();
        }
      }
    }
    this.updateFx(dt);
  }

  updateFx(dt) {
    this.particles.update(dt);
    for (const p of this.players) {
      for (let i = p.trail.length - 1; i >= 0; i--) {
        p.trail[i].life -= dt;
        if (p.trail[i].life <= 0) p.trail.splice(i, 1);
      }
    }
    if (this.shakeMag > 0) {
      this.shakeT += dt;
      const k = Math.max(0, 1 - this.shakeT / this.shakeDur);
      const m = this.shakeMag * k * k;
      this.shakeX = rand(-m, m); this.shakeY = rand(-m, m);
      if (k <= 0) { this.shakeMag = 0; this.shakeX = 0; this.shakeY = 0; }
    } else { this.shakeX = 0; this.shakeY = 0; }
    this.flash = Math.max(0, this.flash - dt * 2.6);
    this.zoom += (this.zoomTarget - this.zoom) * Math.min(1, dt * 5);
  }

  getProgress(p) { return clamp(p.px / this.level.length, 0, 1); }
}