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
  const a = wrap(t + (it.phase || 0), 1) * Math.PI * 2 * (it.spin || 0.8) + (it.a0 || 0);
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
  return {
    x: it.x + SPIKE_HIT_INSET,
    y: floor ? FLOOR_Y - SPIKE_HIT_H : CEIL_Y,
    w: Math.max(6, it.w - SPIKE_HIT_INSET * 2),
    h: SPIKE_HIT_H,
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