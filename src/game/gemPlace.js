// Shared gem-placement helpers used by Career levels (levels.js) and the
// Endless generator (endlessEngine.js). Gems are placed in reachable "lanes"
// — floor and ceiling are collected while running; mid lanes during a switch.
// Every candidate is checked against static hazard/solid bounding boxes so a
// gem never spawns inside an obstacle, and the lanes themselves are reachable
// by the player's normal movement, so every gem can be collected.

import { CEIL_Y, FLOOR_Y, MID_Y, PLAYER_SIZE } from './config';

// Lanes the player can collect from. Floor/ceiling lanes sit just inside the
// player's running center so they are gathered without switching; mid lanes
// are gathered mid-flip, rewarding a well-timed gravity switch.
export const LANE = {
  floor: FLOOR_Y - PLAYER_SIZE / 2 - 6,   // ~601 — collected while running on the floor
  ceil: CEIL_Y + PLAYER_SIZE / 2 + 6,     // ~143 — collected while running on the ceiling
  mid: MID_Y,                              // 380 — collected during a switch
  midLow: 460,                             // lower-mid, collected on the way up/down
  midHigh: 300,                            // upper-mid, collected on the way up/down
};

const HAZARD = new Set(['spike', 'saw', 'blade', 'crusher', 'laser', 'mspike', 'drop', 'wall', 'bounce', 'trap']);
const SOLID = new Set(['plat', 'vanish']);

// Worst-case static bounding box for a hazard or solid item. Moving hazards
// (crusher, drop, wall) are treated as full-height columns so a gem is never
// placed where the hazard could sweep through at any phase.
function boxOf(it) {
  switch (it.type) {
    case 'spike':
    case 'mspike': {
      const h = it.h || 26;
      if (it.side === 'ceil') return { x: it.x, y: CEIL_Y, w: it.w, h };
      return { x: it.x, y: FLOOR_Y - h, w: it.w, h };
    }
    case 'saw': {
      const r = it.r || 26;
      if (it.move === 'v') {
        const y0 = Math.min(it.y0, it.y1), y1 = Math.max(it.y0, it.y1);
        return { x: it.x - r, y: y0 - r, w: r * 2, h: (y1 - y0) + r * 2 };
      }
      return { x: it.x - r, y: it.y - r, w: r * 2, h: r * 2 };
    }
    case 'blade': {
      const arm = it.arm || 120;
      const cy = it.y || MID_Y;
      return { x: it.x - arm, y: cy - arm, w: arm * 2, h: arm * 2 };
    }
    case 'crusher':
      return { x: it.x - it.w / 2, y: CEIL_Y, w: it.w, h: FLOOR_Y - CEIL_Y };
    case 'laser': {
      const h = it.h || 320;
      if (it.host === 'ceil') return { x: it.x - 10, y: CEIL_Y, w: 20, h };
      return { x: it.x - 10, y: FLOOR_Y - h, w: 20, h };
    }
    case 'drop':
      return { x: it.x, y: CEIL_Y, w: it.w, h: FLOOR_Y - CEIL_Y };
    case 'wall':
      return { x: it.x, y: CEIL_Y, w: it.w, h: FLOOR_Y - CEIL_Y };
    case 'bounce': {
      const r = it.r || 22;
      const y0 = Math.min(it.y0, it.y1), y1 = Math.max(it.y0, it.y1);
      return { x: it.x - r, y: y0 - r, w: r * 2, h: (y1 - y0) + r * 2 };
    }
    case 'trap': {
      const h = 110;
      if (it.side === 'ceil') return { x: it.x, y: CEIL_Y, w: it.w, h };
      return { x: it.x, y: FLOOR_Y - h, w: it.w, h };
    }
    case 'plat':
    case 'vanish':
      return { x: it.x, y: it.y - 8, w: it.w, h: 16 };
    default:
      return null;
  }
}

function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// True if a gem of radius r at (x, y) is clear of every hazard and solid in
// `items` (with a small safety pad so it never clips an obstacle edge) and is
// not stacked on top of an existing gem.
export function gemClear(items, x, y, r = 13) {
  const pad = 8;
  const gx = x - r - pad, gy = y - r - pad, gw = r * 2 + pad * 2, gh = r * 2 + pad * 2;
  for (const it of items) {
    if (it.type === 'gem') {
      if (Math.abs(x - it.x) < r * 2 && Math.abs(y - it.y) < r * 2) return false;
      continue;
    }
    if (!HAZARD.has(it.type) && !SOLID.has(it.type)) continue;
    const b = boxOf(it);
    if (!b) continue;
    // solids use a tiny pad so a gem can sit just above a platform surface
    if (SOLID.has(it.type)) {
      const sx = b.x - 2, sy = b.y - 2, sw = b.w + 4, sh = b.h + 4;
      if (overlap(gx, gy, gw, gh, sx, sy, sw, sh)) return false;
    } else if (overlap(gx, gy, gw, gh, b.x, b.y, b.w, b.h)) return false;
  }
  return true;
}

// Enrich a level's item list with a varied gem layout: a frequent alternating
// stream across floor/ceiling/mid lanes, periodic 3-gem clusters, a gem just
// above every platform, and a trail of gems through every gravity tunnel.
// Deterministic (no randomness) so a given level always plays the same way.
// Mutates `items` and returns the array of gems added.
export function enrichGems(items, x0, length, step) {
  const added = [];
  const place = (g) => { items.push(g); added.push(g); };

  // 1. Baseline stream — frequent single gems cycling through reachable lanes
  //    so the player collects a steady rhythm while running and switching.
  const baseSpacing = step * 1.5;
  let i = 0;
  for (let cx = x0 + step * 1.5; cx < length - step * 1.5; cx += baseSpacing, i++) {
    const m = i % 5;
    const y = m === 0 ? LANE.floor : m === 1 ? LANE.ceil : m === 2 ? LANE.mid : m === 3 ? LANE.midLow : LANE.midHigh;
    if (gemClear(items, cx, y)) place({ type: 'gem', x: cx, y, r: 13 });
  }

  // 2. Clusters — every ~7 steps a tight line of 3 gems in the first safe
  //    lane, making collection bursts feel satisfying.
  let ci = 0;
  for (let cx = x0 + step * 4; cx < length - step * 2; cx += step * 7, ci++) {
    const lanes = [LANE.floor, LANE.ceil, LANE.mid];
    const ly = lanes[ci % 3];
    if (!gemClear(items, cx, ly)) continue;
    const dx = step * 0.34;
    for (let k = -1; k <= 1; k++) {
      const gx = cx + k * dx;
      if (gemClear(items, gx, ly)) place({ type: 'gem', x: gx, y: ly, r: 13 });
    }
  }

  // 3. Platform gems — one gem hovering just above each platform/vanish pad,
  //    rewarding players who land on it.
  for (const it of items) {
    if (it.type !== 'plat' && it.type !== 'vanish') continue;
    const cx = it.x + it.w / 2;
    const gy = it.y - 34;
    if (cx < x0 || cx > length - step) continue;
    if (gemClear(items, cx, gy)) place({ type: 'gem', x: cx, y: gy, r: 13 });
  }

  // 4. Zone trails — a line of gems through every gravity tunnel at mid y,
  //    gathered while the tunnel carries the player across.
  for (const it of items) {
    if (it.type !== 'zone') continue;
    const zstep = step * 0.55;
    for (let cx = it.x + zstep; cx < it.x + it.w - zstep; cx += zstep) {
      if (gemClear(items, cx, LANE.mid)) place({ type: 'gem', x: cx, y: LANE.mid, r: 13 });
    }
  }

  return added;
}