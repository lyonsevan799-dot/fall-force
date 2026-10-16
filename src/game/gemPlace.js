// Shared gem-placement helpers used by Career levels (levels.js) and the
// Endless generator (endlessEngine.js). Gems are placed in reachable "lanes"
// — floor and ceiling are collected while running; mid lanes during a switch.
// Every candidate is checked against static hazard/solid bounding boxes so a
// gem never spawns inside an obstacle, and the lanes themselves are reachable
// by the player's normal movement, so every gem can be collected.
//
// Large rows (4+ gems) are tagged with a shared groupId + rowLen + rowDir so
// the engine can offer the Gem Rush hold-to-follow mechanic on them.

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

let _gid = 1;

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

// True if a gem-sized spot at (x, y) is clear of every hazard and solid in
// `items` (ignoring other gems). Used to verify a row's path doesn't cross an
// obstacle — sibling gems along the row are expected and must not block it.
function hazardsClear(items, x, y, r) {
  const pad = 8;
  const gx = x - r - pad, gy = y - r - pad, gw = r * 2 + pad * 2, gh = r * 2 + pad * 2;
  for (const it of items) {
    if (!HAZARD.has(it.type) && !SOLID.has(it.type)) continue;
    const b = boxOf(it);
    if (!b) continue;
    if (SOLID.has(it.type)) {
      const sx = b.x - 2, sy = b.y - 2, sw = b.w + 4, sh = b.h + 4;
      if (overlap(gx, gy, gw, gh, sx, sy, sw, sh)) return false;
    } else if (overlap(gx, gy, gw, gh, b.x, b.y, b.w, b.h)) return false;
  }
  return true;
}

// Sample a segment between two points and ensure no hazard/solid blocks the
// path, so a gem row never crosses an obstacle the player would clip through.
function pathClear(items, x1, y1, x2, y2) {
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    const k = i / steps;
    const px = x1 + (x2 - x1) * k;
    const py = y1 + (y2 - y1) * k;
    if (!hazardsClear(items, px, py, 10)) return false;
  }
  return true;
}

function rollback(items, gems) {
  for (const g of gems) {
    const idx = items.indexOf(g);
    if (idx >= 0) items.splice(idx, 1);
  }
}

// Place a straight row of `count` gems starting at (x, y) moving in direction
// (dirX, dirY) with `spacing` between each gem. All gems share a groupId so
// the engine can offer Gem Rush on rows of 4+. Returns the placed gems, or
// null (and removes any partial row) if any position or path segment is blocked.
export function placeRow(items, x, y, count, dirX, dirY, spacing) {
  const len = Math.hypot(dirX, dirY) || 1;
  const nx = dirX / len, ny = dirY / len;
  const groupId = `placed_${_gid++}`;
  const gems = [];
  let prevX = x, prevY = y;
  // Rows of 4+ start with an oversized trigger gem: collecting it auto-
  // engages Gem Rush along the rest of the row (no hold required).
  const hasTrigger = count >= 4;
  const triggerR = 24;
  if (hasTrigger) {
    if (y < CEIL_Y + 8 || y > FLOOR_Y - 8) return null;
    if (!gemClear(items, x, y, triggerR)) return null;
    const trigger = { type: 'gem', x, y, r: triggerR, groupId, trigger: true, rowLen: count, rowDir: { x: nx, y: ny } };
    gems.push(trigger);
    items.push(trigger);
    prevX = x; prevY = y;
  }
  for (let i = 0; i < count; i++) {
    const off = hasTrigger ? i + 1 : i;
    const gx = x + nx * spacing * off;
    const gy = y + ny * spacing * off;
    if (gy < CEIL_Y + 8 || gy > FLOOR_Y - 8) { rollback(items, gems); return null; }
    if (!gemClear(items, gx, gy)) { rollback(items, gems); return null; }
    if ((i > 0 || hasTrigger) && !pathClear(items, prevX, prevY, gx, gy)) { rollback(items, gems); return null; }
    const gem = { type: 'gem', x: gx, y: gy, r: 13, groupId, rowLen: count, rowDir: { x: nx, y: ny } };
    gems.push(gem);
    items.push(gem);
    prevX = gx; prevY = gy;
  }
  return gems;
}

// Enrich a level's item list with a varied gem layout: large rows first (so
// they get clear space), then a frequent alternating stream across
// floor/ceiling/mid lanes, periodic 3-gem clusters, a gem just above every
// platform, and a trail of gems through every gravity tunnel.
// Deterministic (no randomness) so a given level always plays the same way.
// Mutates `items` and returns the array of gems added.
export function enrichGems(items, x0, length, step) {
  const added = [];
  const placeSingle = (g) => { items.push(g); added.push(g); };

  // 1. Large gem rows — straight lines of 4-6 gems that enable Gem Rush.
  //    Horizontal rows sit on floor/ceiling lanes; diagonal rows glide from
  //    floor toward mid (or ceiling toward mid). Placed first so they get
  //    priority on clear space; the stream below fills around them.
  let ri = 0;
  for (let cx = x0 + step * 6; cx < length - step * 4; cx += step * 6, ri++) {
    const count = 4 + (ri % 3); // 4, 5, 6
    const spacing = step * 0.5;
    const m = ri % 4;
    let row = null;
    if (m === 0) row = placeRow(items, cx, LANE.floor, count, 1, 0, spacing);
    else if (m === 1) row = placeRow(items, cx, LANE.ceil, count, 1, 0, spacing);
    else if (m === 2) row = placeRow(items, cx, LANE.floor, count, 1, -1, spacing);
    else row = placeRow(items, cx, LANE.ceil, count, 1, 1, spacing);
    if (row) for (const g of row) added.push(g);
  }

  // 2. Baseline stream — frequent single gems cycling through reachable lanes
  //    so the player collects a steady rhythm while running and switching.
  const baseSpacing = step * 1.5;
  let i = 0;
  for (let cx = x0 + step * 1.5; cx < length - step * 1.5; cx += baseSpacing, i++) {
    const m = i % 5;
    const y = m === 0 ? LANE.floor : m === 1 ? LANE.ceil : m === 2 ? LANE.mid : m === 3 ? LANE.midLow : LANE.midHigh;
    if (gemClear(items, cx, y)) placeSingle({ type: 'gem', x: cx, y, r: 13 });
  }

  // 3. Clusters — every ~7 steps a tight line of 3 gems in the first safe
  //    lane, making collection bursts feel satisfying.
  let ci = 0;
  for (let cx = x0 + step * 4; cx < length - step * 2; cx += step * 7, ci++) {
    const lanes = [LANE.floor, LANE.ceil, LANE.mid];
    const ly = lanes[ci % 3];
    if (!gemClear(items, cx, ly)) continue;
    const dx = step * 0.34;
    for (let k = -1; k <= 1; k++) {
      const gx = cx + k * dx;
      if (gemClear(items, gx, ly)) placeSingle({ type: 'gem', x: gx, y: ly, r: 13 });
    }
  }

  // 4. Platform gems — one gem hovering just above each platform/vanish pad,
  //    rewarding players who land on it.
  for (const it of items) {
    if (it.type !== 'plat' && it.type !== 'vanish') continue;
    const cx = it.x + it.w / 2;
    const gy = it.y - 34;
    if (cx < x0 || cx > length - step) continue;
    if (gemClear(items, cx, gy)) placeSingle({ type: 'gem', x: cx, y: gy, r: 13 });
  }

  // 5. Zone trails — a line of gems through every gravity tunnel at mid y,
  //    gathered while the tunnel carries the player across.
  for (const it of items) {
    if (it.type !== 'zone') continue;
    const zstep = step * 0.55;
    for (let cx = it.x + zstep; cx < it.x + it.w - zstep; cx += zstep) {
      if (gemClear(items, cx, LANE.mid)) placeSingle({ type: 'gem', x: cx, y: LANE.mid, r: 13 });
    }
  }

  return added;
}