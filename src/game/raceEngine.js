import { GRAVITY, LAUNCH_V, MAX_VY, PLAYER_SIZE, CEIL_Y, FLOOR_Y, THEMES, clamp, rand } from './config';
import { Particles } from './particles';
import { platGeom, vanishGeom } from './geom';
import createRaceCourse from '@/game/race/course';
import hitRaceHazard from '@/game/race/hazards';
import { RACE_LEVELS } from './raceLevels';
import { raceWinner } from '@/game/raceOutcome';
import resolveSurfaceCollision, { carryPlatform } from '@/game/surfaceCollision';

const SUB = 1 / 240;
const GRACE = 2.6; // Frozen winner celebration; neither player keeps racing.

// Local players have identical independent course copies and a synchronized
// clock. Both are stepped before finish comparison, then the round freezes.
export class RaceEngine {
  constructor({ sound, settings, levelIndex = 0 }) {
    this.sound = sound;
    this.settings = settings || {};
    this.mode = 'race';
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
    this.paused = false;
    const L = this.level;
    this.solids = L.items.filter((i) => i.type === 'plat' || i.type === 'vanish');
    this.zones = L.items.filter((i) => i.type === 'zone');
    this.portals = L.items.filter((i) => i.type === 'portal');
    this.gates = L.items.filter((i) => i.type === 'speed');
    this.runId = crypto.randomUUID();
    this.result = null;
    this.players = [this._mkPlayer(0), this._mkPlayer(1)];
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
      ...createRaceCourse(this.level), particles: new Particles(450), flash: 0, deaths: 0,
      index: i,
      px: this.level.startX,
      py: FLOOR_Y - PLAYER_SIZE,
      vy: 0, dir: 1, grounded: true, groundPlat: null, groundY: null,
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
    if (this._isActive() || this.settings.shake === false) return;
    if (this.settings.reduced) mag *= 0.5;
    if (mag > this.shakeMag) { this.shakeMag = mag; this.shakeDur = Math.max(0.08, dur); this.shakeT = 0; }
  }

  switchPlayer(p) {
    if (this.paused || !this._isActive() || !p.alive || p.finished) return;
    if (this.zones.some((zone) => p.px + PLAYER_SIZE > zone.x && p.px < zone.x + zone.w && -p.dir !== zone.dir)) return;
    p.dir = -p.dir;
    p.vy = p.dir * LAUNCH_V;
    p.grounded = false; p.groundPlat = null;
    p.sx = 0.76; p.sy = 1.3; p.rotV = rand(-5, 5);
    const cx = p.px + PLAYER_SIZE / 2, cy = p.py + PLAYER_SIZE / 2;
    const theme = this.theme;
    const reduced = this.settings.reduced;
    p.particles.burst(cx, cy, reduced ? 5 : 12, { color: [theme.accent, '#ffffff'], speed: 200, size: 4, life: 0.4, drag: 2.8, shape: 'spark' });
    if (!reduced) p.particles.ring(cx, cy, { r: 7, rv: 300, life: 0.3, color: theme.accent, w: 3 });
    p.flash = Math.min(1, p.flash + 0.1);
    this.addShake(3, 0.14);
    this.sound.sfx('switch');
  }

  _isActive() { return this.state === 'racing'; }

  stepPlayer(p, h) {
    const prevX = p.px, prevY = p.py;
    const L = this.level;
    this.physicsStep = h;
    if (p.gateIndex < this.gates.length && p.px >= this.gates[p.gateIndex].x) {
      p.speedMult = this.gates[p.gateIndex].mult;
      p.gateIndex++;
    }
    carryPlatform(p, h, this.t);
    if (this._isActive()) p.px += L.speed * p.speedMult * h;
    if (!p.grounded) {
      p.vy += GRAVITY * p.dir * h;
      p.vy = clamp(p.vy, -MAX_VY, MAX_VY);
      p.py += p.vy * h;
    }
    this.checkTriggersPlayer(p);
    this.resolveSurfacesPlayer(p, prevY, prevX);
    if (p.invuln > 0) p.invuln -= h;
    if (p.alive && p.invuln <= 0 && !p.finished) this.checkHazardsPlayer(p);
    if (p.alive && !p.finished && p.px >= L.length) {
      const crossing = clamp((L.length - prevX) / (p.px - prevX || 1), 0, 1);
      this.playerFinish(p, this._stepTime + crossing * h);
    }
  }

  checkTriggersPlayer(p) {
    const size = PLAYER_SIZE;
    for (const z of this.zones) {
      if (p.px + size > z.x && p.px < z.x + z.w && p.dir !== z.dir) {
        p.dir = z.dir; p.vy = p.dir * 240; p.grounded = false; p.groundPlat = null;
        p.sx = 0.85; p.sy = 1.2;
        const cx = p.px + size / 2, cy = p.py + size / 2;
        p.particles.burst(cx, cy, this.settings.reduced ? 6 : 12, { color: [this.theme.accent, '#ffffff'], speed: 180, size: 4, life: 0.5, drag: 2.4, shape: 'spark' });
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
        p.flash = 0.8; this.addShake(8, 0.3); this.sound.sfx('portal');
        const cx = p.px + size / 2, cy = p.py + size / 2;
        p.particles.ring(cx, cy, { r: 8, rv: 680, life: 0.45, color: '#ffffff', w: 5 });
        p.particles.ring(cx, cy, { r: 14, rv: 400, life: 0.7, color: this.theme.accent, w: 3 });
      }
    }

  }

  resolveSurfacesPlayer(p, prevY, prevX) {
    return resolveSurfaceCollision(p, prevY, prevX, { solids: p.solids, t: this.t, physicsStep: this.physicsStep }, (item) => this.landPlayer(p, item));
  }

  landPlayer(p, plat) {
    const impact = Math.abs(p.vy);
    const wasAir = !p.grounded;
    p.grounded = true; p.groundPlat = plat || null; p.vy = 0; p.rotV = 0;
    p.groundY = plat ? (plat.type === 'vanish' ? vanishGeom(plat, this.t) : platGeom(plat, this.t)).y : null;
    if (wasAir) {
      p.sx = 1.32; p.sy = 0.7;
      const cx = p.px + PLAYER_SIZE / 2;
      const cy = p.dir === 1 ? p.py + PLAYER_SIZE : p.py;
      if (!this.settings.reduced) {
        p.particles.burst(cx, cy, 7, { color: [this.theme.accent, this.theme.groundTop], speed: 140, size: 3, life: 0.3, angle: p.dir === 1 ? -Math.PI / 2 : Math.PI / 2, spread: 2.4, add: true, drag: 2.6 });
      }
      this.sound.sfx('land');
      this.addShake(Math.min(4, impact / 330), 0.12);
    }
  }

  checkHazardsPlayer(p) {
    for (const item of p.hazards) {
      if (hitRaceHazard(item, this.t, p)) { this.diePlayer(p); return; }
    }
  }

  diePlayer(p) {
    if (!this._isActive() || !p.alive || p.finished) return;
    p.alive = false; p.deadT = 0; p.deaths++;
    p.flash = 0.8; // A death must never stop or flash the opponent's screen.
    this.addShake(13, 0.45);
    this.sound.sfx('death');
    const cx = p.px + PLAYER_SIZE / 2, cy = p.py + PLAYER_SIZE / 2;
    const theme = this.theme;
    const cols = [theme.player, theme.accent, '#ffffff'];
    const n = this.settings.reduced ? 16 : 26;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28; const sp = rand(140, 560);
      p.particles.spawn({ x: cx + rand(-10, 10), y: cy + rand(-10, 10), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.6, 1.2), size: rand(5, 11), color: cols[i % cols.length], shape: 'frag', rot: Math.random() * 6.28, vr: rand(-12, 12), grav: 1500 * p.dir, drag: 0.85, add: false });
    }
    p.particles.ring(cx, cy, { r: 10, rv: 680, life: 0.34, color: '#ffffff', w: 6 });
  }

  // Death costs ground (respawn a few steps back) with brief invulnerability so
  // a player can recover and still catch up — never a full reset.
  respawnPlayer(p) {
    p.alive = true; p.deadT = 0; p.invuln = 1.2;
    p.px = Math.max(this.level.startX, p.px - 600);
    p.py = FLOOR_Y - PLAYER_SIZE; p.vy = 0; p.dir = 1;
    p.grounded = true; p.groundPlat = null;
    p.sx = 0.6; p.sy = 0.6; p.rot = 0; p.rotV = 0;
    p.speedMult = 1; p.gateIndex = 0;
    while (p.gateIndex < this.gates.length && this.gates[p.gateIndex].x <= p.px) {
      p.speedMult = this.gates[p.gateIndex++].mult;
    }
    p.trail.length = 0;
    const cx = p.px + PLAYER_SIZE / 2, cy = p.py + PLAYER_SIZE / 2;
    const accent = p.index === 0 ? '#38e8ff' : '#ff3ea5';
    p.particles.ring(cx, cy, { r: 5, rv: 460, life: 0.42, color: accent, w: 4 });
    if (!this.settings.reduced) p.particles.burst(cx, cy, 14, { color: [accent, '#ffffff'], speed: 210, size: 3.6, life: 0.5, drag: 2.6, shape: 'spark' });
    this.sound.sfx('spawn');
  }

  playerFinish(p, time) {
    if (!this._isActive() || !p.alive || p.finished || p.px < this.level.length || !Number.isFinite(time)) return;
    p.finished = true;
    p.finishTime = time;
    p.px = this.level.length;
  }

  resolveFinish() {
    const [p1, p2] = this.players;
    if (!p1.finished && !p2.finished) return;
    this.winner = raceWinner({ p1Finished: p1.finished, p2Finished: p2.finished, p1Time: p1.finishTime, p2Time: p2.finishTime });
    if (this.state === 'racing') {
      const p = this.players[this.winner] || p1;
      this.state = 'finished';
      this.raceTime = Math.min(...this.players.filter((player) => player.finished).map((player) => player.finishTime));
      for (const player of this.players) player.finalProgress = player.finished ? 1 : this.getProgress(player);
      this.finishT = 0;
      this.flash = 0.7; this.addShake(12, 0.5);
      this.sound.sfx(this.winner === -1 ? 'complete' : 'victory');
      if (this.winner === -1) return;
      const cx = p.px + PLAYER_SIZE / 2, cy = p.py + PLAYER_SIZE / 2;
      const theme = this.theme;
      for (let i = 0; i < (this.settings.reduced ? 24 : 60); i++) {
        const a = rand(-Math.PI, 0); const sp = rand(180, 680);
        p.particles.spawn({ x: cx, y: cy - 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.8, 1.8), size: rand(4, 10), color: [theme.accent, theme.accent2, '#ffffff'][i % 3], shape: i % 3 ? 'spark' : 'frag', rot: Math.random() * 6.28, vr: rand(-10, 10), grav: 500, drag: 0.5, add: i % 3 !== 0 });
      }
      p.particles.ring(cx, cy, { r: 12, rv: 640, life: 0.6, color: '#ffffff', w: 6 });
      p.particles.ring(cx, cy, { r: 8, rv: 380, life: 0.9, color: theme.accent, w: 3 });
    }
  }

  update(dtRaw) {
    if (this.paused || this.state === 'ready' || this.state === 'raceover' || !Number.isFinite(dtRaw) || dtRaw <= 0) return;
    let dt = Math.min(0.25, dtRaw);
    this.dt = dt;
    if (this.state === 'countdown') {
      const before = Math.ceil(this.countdown);
      const consumed = Math.min(dt, this.countdown);
      this.countdown = Math.max(0, this.countdown - consumed); dt -= consumed;
      if (Math.ceil(this.countdown) < before && this.countdown > 0) this.sound.sfx('beep');
      if (this.countdown > 0) { this.updateFx(consumed); return; }
      this.state = 'racing'; this.raceTime = 0; this.sound.sfx('go');
    }
    if (this.state === 'racing') {
      let remaining = dt, budget = 64;
      while (remaining > 0.0000001 && budget-- > 0 && this.state === 'racing') {
        const h = Math.min(remaining, SUB);
        this._stepTime = this.raceTime; this.t += h;
        for (const p of this.players) {
          if (p.alive && !p.finished) this.stepPlayer(p, h);
          else if (!p.alive && !p.finished) { p.deadT += h; if (p.deadT >= 0.55) this.respawnPlayer(p); }
        }
        this.raceTime += h;
        this.resolveFinish();
        remaining -= h;
      }
    } else if (this.state === 'finished') {
      this.finishT += dt;
      if (this.finishT >= GRACE) {
        this.state = 'raceover';
        this.result = Object.freeze({
          runId: this.runId, status: 'raceover', winner: this.winner,
          p1Finished: this.players[0].finished, p2Finished: this.players[1].finished,
          p1Time: this.players[0].finishTime, p2Time: this.players[1].finishTime,
          p1Final: this.players[0].finalProgress, p2Final: this.players[1].finalProgress,
          p1Deaths: this.players[0].deaths, p2Deaths: this.players[1].deaths,
        });
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
    for (const p of this.players) {
      p.particles.update(dt); p.flash = Math.max(0, p.flash - dt * 2.6);
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

  getProgress(p) { return clamp((p.px - this.level.startX) / (this.level.length - this.level.startX), 0, 1); }
}