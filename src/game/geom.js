// Single source of truth for hazard geometry — used by both collision and rendering.
import { CEIL_Y, FLOOR_Y } from './config';

export const SPIKE_W = 34;
export const SPIKE_H = 30;
export const SPIKE_HIT_H = 24;
export const SPIKE_HIT_INSET = 5;
export const LASER_W = 14;
export const PLAT_H = 20;

const wrap = (v, period) => ((v % period) + period) % period;

export function sawGeom(it, t) {
  if (!it.move) return { x: it.x, y: it.y, r: it.r };
  const u = Math.sin(wrap(t + (it.phase || 0), it.period) / it.period * Math.PI * 2) * 0.5 + 0.5;
  if (it.move === 'v') return { x: it.x, y: it.y0 + (it.y1 - it.y0) * u, r: it.r };
  return { x: it.x0 + (it.x1 - it.x0) * u, y: it.y, r: it.r };
}

export function bladeGeom(it, t) {
  const a = (t + (it.phase || 0)) * Math.PI * 2 * (it.spin || 0.8) + (it.a0 || 0);
  const dx = Math.cos(a), dy = Math.sin(a);
  const L = it.arm || 120;
  return {
    x1: it.x - dx * L * 0.5, y1: it.y - dy * L * 0.5,
    x2: it.x + dx * L * 0.5, y2: it.y + dy * L * 0.5,
    a, L,
  };
}

// Crusher: retracted into its housing, warns, then slams across the corridor.
export function crusherGeom(it, t) {
  const P = it.period || 2.6;
  const u = wrap(t + (it.phase || 0), P) / P;
  const down = it.side === 'floor';
  const rest = down ? FLOOR_Y - 4 : CEIL_Y + 4;
  const far = down ? CEIL_Y + 4 : FLOOR_Y - 4;
  let front = rest;
  let phase = 'idle';
  let warn = 0;
  if (u < 0.10) {
    phase = 'retract';
    front = rest + (far - rest) * (1 - u / 0.10);
  } else if (u < 0.55) {
    phase = 'idle';
  } else if (u < 0.90) {
    phase = 'warn';
    warn = (u - 0.55) / 0.35;
  } else if (u < 0.97) {
    phase = 'slam';
    const k = (u - 0.90) / 0.07;
    front = rest + (far - rest) * (k * k);
  } else {
    phase = 'hold';
    front = far;
  }
  const thick = 62;
  const y = down ? Math.max(CEIL_Y, front - thick) : Math.min(FLOOR_Y - thick, front);
  return { x: it.x, y: y, w: it.w || 54, h: thick, phase, warn, bottom: front };
}

export function laserGeom(it, t) {
  const on = it.on || 1.2;
  const off = it.off || 1.1;
  const cycle = on + off;
  const u = wrap(t + (it.phase || 0), cycle);
  const active = u < on;
  const warnTime = Math.min(0.55, off * 0.6);
  const warn = !active && u > cycle - warnTime;
  const warnK = warn ? (u - (cycle - warnTime)) / warnTime : 0;
  const host = it.host || 'floor';
  const h = it.h || 320;
  return {
    x: it.x - LASER_W / 2,
    y: host === 'floor' ? FLOOR_Y - h : CEIL_Y,
    w: LASER_W,
    h,
    active, warn, warnK, u: active ? u / on : 0,
  };
}

export function platGeom(it, t) {
  const amp = it.amp || 0;
  const period = it.period || 3.2;
  const k = Math.sin(wrap(t + (it.phase || 0), period) / period * Math.PI * 2);
  let x = it.x, y = it.y;
  if (it.axis === 'y') y += amp * k;
  else if (it.axis === 'x') x += amp * k;
  return { x, y, w: it.w || 150, h: PLAT_H, solid: true, k };
}

export function vanishGeom(it, t) {
  const on = it.on || 1.8;
  const off = it.off || 1.2;
  const cycle = on + off;
  const u = wrap(t + (it.phase || 0), cycle);
  const solid = u < on;
  const warning = !solid && u > cycle - 0.45;
  return {
    x: it.x, y: it.y, w: it.w || 150, h: PLAT_H,
    solid, warning, warnK: warning ? 1 - (cycle - u) / 0.45 : 0,
  };
}

export function spikeGeom(it) {
  const floor = it.side === 'floor';
  const hitH = it.h ? it.h * 0.8 : SPIKE_HIT_H;
  return {
    x: it.x + SPIKE_HIT_INSET,
    y: floor ? FLOOR_Y - hitH : CEIL_Y,
    w: Math.max(6, it.w - SPIKE_HIT_INSET * 2),
    h: hitH,
  };
}

// Moving spike: extends/retracts from floor or ceiling on a rhythmic timer.
export function mspikeGeom(it, t) {
  const period = it.period || 2.4;
  const onFrac = it.on || 0.5;
  const u = wrap(t + (it.phase || 0), period) / period;
  let ext;
  if (u < onFrac) {
    const k = u / onFrac;
    ext = k < 0.14 ? k / 0.14 : 1;
  } else {
    const k = (u - onFrac) / (1 - onFrac);
    ext = k < 0.14 ? 1 - k / 0.14 : 0;
  }
  const floor = it.side === 'floor';
  const hitH = SPIKE_HIT_H * ext;
  return {
    x: it.x + SPIKE_HIT_INSET,
    y: floor ? FLOOR_Y - hitH : CEIL_Y,
    w: Math.max(6, it.w - SPIKE_HIT_INSET * 2),
    h: hitH, ext, drawH: SPIKE_H * ext, floor, active: ext > 0.35,
  };
}

// Falling block: shakes when the player approaches, then drops and lands as a
// persistent hazard on the opposite surface. Stateful (proximity-triggered).
export function dropGeom(it, t, px) {
  const trigger = it.trigger || 280;
  const dist = it.x - px;
  const fromCeil = it.side !== 'floor';
  const y0 = fromCeil ? CEIL_Y - it.h : FLOOR_Y;
  const y1 = fromCeil ? FLOOR_Y - it.h : CEIL_Y;
  if (dist > trigger + 120) { it._triggered = false; it._phase = 'idle'; }
  if (!it._triggered && dist < trigger) {
    it._triggered = true; it._triggerT = t; it._phase = 'shake';
  }
  if (!it._triggered) return { x: it.x, y: y0, w: it.w, h: it.h, phase: 'idle', active: false, fromCeil };
  const dt = t - it._triggerT;
  const shakeDur = it.shake || 0.45;
  if (dt < shakeDur) {
    const shake = Math.sin(dt * 90) * 3;
    return { x: it.x + shake, y: y0, w: it.w, h: it.h, phase: 'shake', active: false, fromCeil };
  }
  const ft = dt - shakeDur;
  const g = it.g || 1800;
  const fallDist = 0.5 * g * ft * ft;
  const y = fromCeil ? y0 + fallDist : y0 - fallDist;
  const reached = fromCeil ? y >= y1 : y <= y1;
  if (reached) {
    it._phase = 'landed';
    return { x: it.x, y: y1, w: it.w, h: it.h, phase: 'landed', active: true, fromCeil };
  }
  it._phase = 'fall';
  return { x: it.x, y, w: it.w, h: it.h, phase: 'fall', active: false, fromCeil };
}

// Crushing walls: two walls slide in from the top and bottom, leaving a timed
// gap in the middle. The player must be on the correct surface to pass.
export function wallGeom(it, t) {
  const P = it.period || 3.2;
  const u = wrap(t + (it.phase || 0), P) / P;
  const gap = it.gap || 150;
  const maxDepth = (FLOOR_Y - CEIL_Y - gap) / 2;
  let depth = 0, phase = 'open', warn = 0;
  if (u < 0.12) { phase = 'warn'; warn = u / 0.12; }
  else if (u < 0.18) { phase = 'close'; const k = (u - 0.12) / 0.06; depth = maxDepth * (k * k); }
  else if (u < 0.72) { phase = 'hold'; depth = maxDepth; }
  else if (u < 0.80) { phase = 'open'; const k = (u - 0.72) / 0.08; depth = maxDepth * (1 - k); }
  else { phase = 'open'; depth = 0; }
  return { x: it.x, w: it.w || 50, topH: depth, botH: depth, phase, warn, gap, maxDepth };
}

// Bouncing hazard: an orb that bounces between two y-points with a triangular
// (linear) wave, giving a predictable rhythm distinct from the sine-based saw.
export function bounceGeom(it, t) {
  const period = it.period || 2.4;
  const u = wrap(t + (it.phase || 0), period) / period;
  const y0 = it.y0 != null ? it.y0 : CEIL_Y + 50;
  const y1 = it.y1 != null ? it.y1 : FLOOR_Y - 50;
  const tri = u < 0.5 ? u * 2 : 2 - u * 2;
  const y = y0 + (y1 - y0) * tri;
  return { x: it.x, y, r: it.r || 22 };
}

// Pop-up trap (fake safe zone): a spike that shoots up from the floor or
// ceiling when the player approaches, with a brief warning flash first.
export function trapGeom(it, t, px) {
  const trigger = it.trigger || 220;
  const dist = it.x - px;
  const floor = it.side !== 'ceil';
  if (dist > trigger + 120) { it._triggered = false; it._phase = 'idle'; }
  if (!it._triggered && dist < trigger) {
    it._triggered = true; it._triggerT = t; it._phase = 'warn';
  }
  if (!it._triggered) return { x: it.x, y: floor ? FLOOR_Y : CEIL_Y, w: it.w, h: 0, ext: 0, phase: 'idle', floor, active: false };
  const dt = t - it._triggerT;
  const warnDur = it.warn || 0.32;
  const upDur = it.up || 1.0;
  let ext = 0, phase = 'warn';
  if (dt < warnDur) { phase = 'warn'; ext = 0; }
  else if (dt < warnDur + 0.07) { phase = 'pop'; ext = (dt - warnDur) / 0.07; }
  else if (dt < warnDur + upDur) { phase = 'up'; ext = 1; }
  else if (dt < warnDur + upDur + 0.1) { phase = 'down'; ext = 1 - (dt - warnDur - upDur) / 0.1; }
  else { phase = 'idle'; ext = 0; it._triggered = false; }
  const hitH = SPIKE_HIT_H * ext;
  return {
    x: it.x + SPIKE_HIT_INSET,
    y: floor ? FLOOR_Y - hitH : CEIL_Y,
    w: Math.max(6, it.w - SPIKE_HIT_INSET * 2),
    h: hitH, ext, drawH: SPIKE_H * ext, phase, floor, active: ext > 0.35,
  };
}

export function rectHit(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function circleHit(cx, cy, r, bx, by, bw, bh) {
  const nx = Math.max(bx, Math.min(cx, bx + bw));
  const ny = Math.max(by, Math.min(cy, by + bh));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}

export function segmentHit(x1, y1, x2, y2, bx, by, bw, bh, r) {
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const px = x1 + (x2 - x1) * k;
    const py = y1 + (y2 - y1) * k;
    if (px > bx - r && px < bx + bw + r && py > by - r && py < by + bh + r) return true;
  }
  return false;
}