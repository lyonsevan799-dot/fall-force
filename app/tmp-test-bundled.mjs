// src/game/config.js
var BASE_SPEED = 340;
var CROSS_TIME = 0.44;
var GRAVITY = 2500;
var LAUNCH_V = 660;
var MAX_VY = 1600;
var PLAYER_SIZE = 34;
var CEIL_Y = 120;
var FLOOR_Y = 640;
var MID_Y = (CEIL_Y + FLOOR_Y) / 2;
var START_X = 560;
var clamp = (v, a, b) => v < a ? a : v > b ? b : v;
var rand = (a, b) => a + Math.random() * (b - a);
function starsFor(deaths) {
  if (deaths === 0) return 3;
  if (deaths <= 2) return 2;
  return 1;
}
var THEMES = {
  neon: {
    bg: ["#060a1e", "#0d1740", "#04050f"],
    accent: "#3ae8ff",
    accent2: "#ff3ea5",
    hazard: "#ff2f6d",
    ground: "#0d1734",
    groundTop: "#16244c",
    edge: "#3ae8ff",
    grid: "#3ae8ff",
    star: "#a8f2ff",
    plat: "#1b2c58",
    player: "#7ff4ff"
  },
  industrial: {
    bg: ["#170c05", "#301b09", "#0b0603"],
    accent: "#ffab33",
    accent2: "#ff6b2e",
    hazard: "#ff4a2e",
    ground: "#2a180a",
    groundTop: "#3d2410",
    edge: "#ffab33",
    grid: "#ffab33",
    star: "#ffd79a",
    plat: "#42280f",
    player: "#ffc978"
  },
  space: {
    bg: ["#0a0718", "#1c1145", "#06040e"],
    accent: "#a77bff",
    accent2: "#5b8cff",
    hazard: "#ff59e6",
    ground: "#181040",
    groundTop: "#241a5c",
    edge: "#a77bff",
    grid: "#a77bff",
    star: "#d9c8ff",
    plat: "#2a1f60",
    player: "#cbb2ff"
  },
  cyber: {
    bg: ["#03130f", "#062c22", "#020a08"],
    accent: "#2bf5a0",
    accent2: "#38e8ff",
    hazard: "#ff2f6d",
    ground: "#06231c",
    groundTop: "#0a3529",
    edge: "#2bf5a0",
    grid: "#2bf5a0",
    star: "#a8ffdd",
    plat: "#0c3227",
    player: "#8dffd0"
  },
  energy: {
    bg: ["#180410", "#3a0a20", "#0b0208"],
    accent: "#ffd23f",
    accent2: "#ff7a3f",
    hazard: "#ff5470",
    ground: "#2c0817",
    groundTop: "#410c22",
    edge: "#ffd23f",
    grid: "#ffd23f",
    star: "#ffe9a8",
    plat: "#3a0f22",
    player: "#ffe08a"
  },
  void: {
    bg: ["#04040a", "#0e0b20", "#020206"],
    accent: "#e6ecff",
    accent2: "#ff6b9d",
    hazard: "#ff3b5c",
    ground: "#0b0a1a",
    groundTop: "#151230",
    edge: "#9aa6e0",
    grid: "#8f9bd8",
    star: "#ffffff",
    plat: "#161436",
    player: "#f2f5ff"
  }
};

// src/game/geom.js
var SPIKE_W = 34;
var SPIKE_H = 30;
var SPIKE_HIT_H = 24;
var SPIKE_HIT_INSET = 5;
var LASER_W = 14;
var PLAT_H = 20;
var wrap = (v, period) => (v % period + period) % period;
function sawGeom(it, t) {
  if (!it.move) return { x: it.x, y: it.y, r: it.r };
  const u = Math.sin(wrap(t + (it.phase || 0), it.period) / it.period * Math.PI * 2) * 0.5 + 0.5;
  if (it.move === "v") return { x: it.x, y: it.y0 + (it.y1 - it.y0) * u, r: it.r };
  return { x: it.x0 + (it.x1 - it.x0) * u, y: it.y, r: it.r };
}
function bladeGeom(it, t) {
  const a = wrap(t + (it.phase || 0), 1) * Math.PI * 2 * (it.spin || 0.8) + (it.a0 || 0);
  const dx = Math.cos(a), dy = Math.sin(a);
  const L = it.arm || 120;
  return {
    x1: it.x - dx * L * 0.5,
    y1: it.y - dy * L * 0.5,
    x2: it.x + dx * L * 0.5,
    y2: it.y + dy * L * 0.5,
    a,
    L
  };
}
function crusherGeom(it, t) {
  const P = it.period || 2.6;
  const u = wrap(t + (it.phase || 0), P) / P;
  const down = it.side === "floor";
  const rest = down ? FLOOR_Y - 4 : CEIL_Y + 4;
  const far = down ? CEIL_Y + 4 : FLOOR_Y - 4;
  let front = rest;
  let phase = "idle";
  let warn = 0;
  if (u < 0.1) {
    phase = "retract";
    front = rest + (far - rest) * (1 - u / 0.1);
  } else if (u < 0.55) {
    phase = "idle";
  } else if (u < 0.9) {
    phase = "warn";
    warn = (u - 0.55) / 0.35;
  } else if (u < 0.97) {
    phase = "slam";
    const k = (u - 0.9) / 0.07;
    front = rest + (far - rest) * (k * k);
  } else {
    phase = "hold";
    front = far;
  }
  const thick = 62;
  const y = down ? Math.max(CEIL_Y, front - thick) : Math.min(FLOOR_Y - thick, front);
  return { x: it.x, y, w: it.w || 54, h: thick, phase, warn, bottom: front };
}
function laserGeom(it, t) {
  const on = it.on || 1.2;
  const off = it.off || 1.1;
  const cycle = on + off;
  const u = wrap(t + (it.phase || 0), cycle);
  const active = u < on;
  const warnTime = Math.min(0.55, off * 0.6);
  const warn = !active && u > cycle - warnTime;
  const warnK = warn ? (u - (cycle - warnTime)) / warnTime : 0;
  const host = it.host || "floor";
  const h = it.h || 320;
  return {
    x: it.x - LASER_W / 2,
    y: host === "floor" ? FLOOR_Y - h : CEIL_Y,
    w: LASER_W,
    h,
    active,
    warn,
    warnK,
    u: active ? u / on : 0
  };
}
function platGeom(it, t) {
  const amp = it.amp || 0;
  const period = it.period || 3.2;
  const k = Math.sin(wrap(t + (it.phase || 0), period) / period * Math.PI * 2);
  let x = it.x, y = it.y;
  if (it.axis === "y") y += amp * k;
  else if (it.axis === "x") x += amp * k;
  return { x, y, w: it.w || 150, h: PLAT_H, solid: true, k };
}
function vanishGeom(it, t) {
  const on = it.on || 1.8;
  const off = it.off || 1.2;
  const cycle = on + off;
  const u = wrap(t + (it.phase || 0), cycle);
  const solid = u < on;
  const warning = !solid && u > cycle - 0.45;
  return {
    x: it.x,
    y: it.y,
    w: it.w || 150,
    h: PLAT_H,
    solid,
    warning,
    warnK: warning ? 1 - (cycle - u) / 0.45 : 0
  };
}
function spikeGeom(it) {
  const floor = it.side === "floor";
  const hitH = it.h ? it.h * 0.8 : SPIKE_HIT_H;
  return {
    x: it.x + SPIKE_HIT_INSET,
    y: floor ? FLOOR_Y - hitH : CEIL_Y,
    w: Math.max(6, it.w - SPIKE_HIT_INSET * 2),
    h: hitH
  };
}
function mspikeGeom(it, t) {
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
  const floor = it.side === "floor";
  const hitH = SPIKE_HIT_H * ext;
  return {
    x: it.x + SPIKE_HIT_INSET,
    y: floor ? FLOOR_Y - hitH : CEIL_Y,
    w: Math.max(6, it.w - SPIKE_HIT_INSET * 2),
    h: hitH,
    ext,
    drawH: SPIKE_H * ext,
    floor,
    active: ext > 0.35
  };
}
function dropGeom(it, t, px) {
  const trigger = it.trigger || 280;
  const dist = it.x - px;
  const fromCeil = it.side !== "floor";
  const y0 = fromCeil ? CEIL_Y - it.h : FLOOR_Y;
  const y1 = fromCeil ? FLOOR_Y - it.h : CEIL_Y;
  if (dist > trigger + 120) {
    it._triggered = false;
    it._phase = "idle";
  }
  if (!it._triggered && dist < trigger) {
    it._triggered = true;
    it._triggerT = t;
    it._phase = "shake";
  }
  if (!it._triggered) return { x: it.x, y: y0, w: it.w, h: it.h, phase: "idle", active: false, fromCeil };
  const dt = t - it._triggerT;
  const shakeDur = it.shake || 0.45;
  if (dt < shakeDur) {
    const shake = Math.sin(dt * 90) * 3;
    return { x: it.x + shake, y: y0, w: it.w, h: it.h, phase: "shake", active: false, fromCeil };
  }
  const ft = dt - shakeDur;
  const g = it.g || 1800;
  const fallDist = 0.5 * g * ft * ft;
  const y = fromCeil ? y0 + fallDist : y0 - fallDist;
  const reached = fromCeil ? y >= y1 : y <= y1;
  if (reached) {
    it._phase = "landed";
    return { x: it.x, y: y1, w: it.w, h: it.h, phase: "landed", active: true, fromCeil };
  }
  it._phase = "fall";
  return { x: it.x, y, w: it.w, h: it.h, phase: "fall", active: false, fromCeil };
}
function wallGeom(it, t) {
  const P = it.period || 3.2;
  const u = wrap(t + (it.phase || 0), P) / P;
  const gap = it.gap || 150;
  const maxDepth = (FLOOR_Y - CEIL_Y - gap) / 2;
  let depth = 0, phase = "open", warn = 0;
  if (u < 0.12) {
    phase = "warn";
    warn = u / 0.12;
  } else if (u < 0.18) {
    phase = "close";
    const k = (u - 0.12) / 0.06;
    depth = maxDepth * (k * k);
  } else if (u < 0.72) {
    phase = "hold";
    depth = maxDepth;
  } else if (u < 0.8) {
    phase = "open";
    const k = (u - 0.72) / 0.08;
    depth = maxDepth * (1 - k);
  } else {
    phase = "open";
    depth = 0;
  }
  return { x: it.x, w: it.w || 50, topH: depth, botH: depth, phase, warn, gap, maxDepth };
}
function bounceGeom(it, t) {
  const period = it.period || 2.4;
  const u = wrap(t + (it.phase || 0), period) / period;
  const y0 = it.y0 != null ? it.y0 : CEIL_Y + 50;
  const y1 = it.y1 != null ? it.y1 : FLOOR_Y - 50;
  const tri = u < 0.5 ? u * 2 : 2 - u * 2;
  const y = y0 + (y1 - y0) * tri;
  return { x: it.x, y, r: it.r || 22 };
}
function trapGeom(it, t, px) {
  const trigger = it.trigger || 220;
  const dist = it.x - px;
  const floor = it.side !== "ceil";
  if (dist > trigger + 120) {
    it._triggered = false;
    it._phase = "idle";
  }
  if (!it._triggered && dist < trigger) {
    it._triggered = true;
    it._triggerT = t;
    it._phase = "warn";
  }
  if (!it._triggered) return { x: it.x, y: floor ? FLOOR_Y : CEIL_Y, w: it.w, h: 0, ext: 0, phase: "idle", floor, active: false };
  const dt = t - it._triggerT;
  const warnDur = it.warn || 0.32;
  const upDur = it.up || 1;
  let ext = 0, phase = "warn";
  if (dt < warnDur) {
    phase = "warn";
    ext = 0;
  } else if (dt < warnDur + 0.07) {
    phase = "pop";
    ext = (dt - warnDur) / 0.07;
  } else if (dt < warnDur + upDur) {
    phase = "up";
    ext = 1;
  } else if (dt < warnDur + upDur + 0.1) {
    phase = "down";
    ext = 1 - (dt - warnDur - upDur) / 0.1;
  } else {
    phase = "idle";
    ext = 0;
    it._triggered = false;
  }
  const hitH = SPIKE_HIT_H * ext;
  return {
    x: it.x + SPIKE_HIT_INSET,
    y: floor ? FLOOR_Y - hitH : CEIL_Y,
    w: Math.max(6, it.w - SPIKE_HIT_INSET * 2),
    h: hitH,
    ext,
    drawH: SPIKE_H * ext,
    phase,
    floor,
    active: ext > 0.35
  };
}
function rectHit(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
function circleHit(cx, cy, r, bx, by, bw, bh) {
  const nx = Math.max(bx, Math.min(cx, bx + bw));
  const ny = Math.max(by, Math.min(cy, by + bh));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}
function segmentHit(x1, y1, x2, y2, bx, by, bw, bh, r) {
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const px = x1 + (x2 - x1) * k;
    const py = y1 + (y2 - y1) * k;
    if (px > bx - r && px < bx + bw + r && py > by - r && py < by + bh + r) return true;
  }
  return false;
}

// src/game/gemPlace.js
var LANE = {
  floor: FLOOR_Y - PLAYER_SIZE / 2 - 6,
  // ~601 — collected while running on the floor
  ceil: CEIL_Y + PLAYER_SIZE / 2 + 6,
  // ~143 — collected while running on the ceiling
  mid: MID_Y,
  // 380 — collected during a switch
  midLow: 460,
  // lower-mid, collected on the way up/down
  midHigh: 300
  // upper-mid, collected on the way up/down
};
var _gid = 1;
var HAZARD = /* @__PURE__ */ new Set(["spike", "saw", "blade", "crusher", "laser", "mspike", "drop", "wall", "bounce", "trap"]);
var SOLID = /* @__PURE__ */ new Set(["plat", "vanish"]);
function boxOf(it) {
  switch (it.type) {
    case "spike":
    case "mspike": {
      const h = it.h || 26;
      if (it.side === "ceil") return { x: it.x, y: CEIL_Y, w: it.w, h };
      return { x: it.x, y: FLOOR_Y - h, w: it.w, h };
    }
    case "saw": {
      const r = it.r || 26;
      if (it.move === "v") {
        const y0 = Math.min(it.y0, it.y1), y1 = Math.max(it.y0, it.y1);
        return { x: it.x - r, y: y0 - r, w: r * 2, h: y1 - y0 + r * 2 };
      }
      return { x: it.x - r, y: it.y - r, w: r * 2, h: r * 2 };
    }
    case "blade": {
      const arm = it.arm || 120;
      const cy = it.y || MID_Y;
      return { x: it.x - arm, y: cy - arm, w: arm * 2, h: arm * 2 };
    }
    case "crusher":
      return { x: it.x - it.w / 2, y: CEIL_Y, w: it.w, h: FLOOR_Y - CEIL_Y };
    case "laser": {
      const h = it.h || 320;
      if (it.host === "ceil") return { x: it.x - 10, y: CEIL_Y, w: 20, h };
      return { x: it.x - 10, y: FLOOR_Y - h, w: 20, h };
    }
    case "drop":
      return { x: it.x, y: CEIL_Y, w: it.w, h: FLOOR_Y - CEIL_Y };
    case "wall":
      return { x: it.x, y: CEIL_Y, w: it.w, h: FLOOR_Y - CEIL_Y };
    case "bounce": {
      const r = it.r || 22;
      const y0 = Math.min(it.y0, it.y1), y1 = Math.max(it.y0, it.y1);
      return { x: it.x - r, y: y0 - r, w: r * 2, h: y1 - y0 + r * 2 };
    }
    case "trap": {
      const h = 110;
      if (it.side === "ceil") return { x: it.x, y: CEIL_Y, w: it.w, h };
      return { x: it.x, y: FLOOR_Y - h, w: it.w, h };
    }
    case "plat":
    case "vanish":
      return { x: it.x, y: it.y - 8, w: it.w, h: 16 };
    default:
      return null;
  }
}
function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
function gemClear(items, x, y, r = 13) {
  const pad = 8;
  const gx = x - r - pad, gy = y - r - pad, gw = r * 2 + pad * 2, gh = r * 2 + pad * 2;
  for (const it of items) {
    if (it.type === "gem") {
      if (Math.abs(x - it.x) < r * 2 && Math.abs(y - it.y) < r * 2) return false;
      continue;
    }
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
function placeRow(items, x, y, count, dirX, dirY, spacing) {
  const len = Math.hypot(dirX, dirY) || 1;
  const nx = dirX / len, ny = dirY / len;
  const groupId = _gid++;
  console.error("PLACEROW call gid=" + groupId + " x=" + x.toFixed(0) + " y=" + y.toFixed(0) + " count=" + count + " dir=(" + dirX + "," + dirY + ") spacing=" + spacing.toFixed(0));
  const gems = [];
  let prevX = x, prevY = y;
  const hasTrigger = count >= 4;
  const triggerR = 24;
  if (hasTrigger) {
    if (y < CEIL_Y + 8 || y > FLOOR_Y - 8) return null;
    if (!gemClear(items, x, y, triggerR)) return null;
    const trigger = { type: "gem", x, y, r: triggerR, groupId, trigger: true, rowLen: count, rowDir: { x: nx, y: ny } };
    gems.push(trigger);
    items.push(trigger);
    prevX = x;
    prevY = y;
  }
  for (let i = 0; i < count; i++) {
    const off = hasTrigger ? i + 1 : i;
    const gx = x + nx * spacing * off;
    const gy = y + ny * spacing * off;
    if (gy < CEIL_Y + 8 || gy > FLOOR_Y - 8) {
      rollback(items, gems);
      return null;
    }
    if (!gemClear(items, gx, gy)) {
      rollback(items, gems);
      return null;
    }
    if ((i > 0 || hasTrigger) && !pathClear(items, prevX, prevY, gx, gy)) {
      rollback(items, gems);
      return null;
    }
    const gem = { type: "gem", x: gx, y: gy, r: 13, groupId, rowLen: count, rowDir: { x: nx, y: ny } };
    gems.push(gem);
    items.push(gem);
    prevX = gx;
    prevY = gy;
  }
  console.error("PLACEROW ok gid=" + groupId + " placed=" + gems.length + " (trigger=" + !!gems[0].trigger + ") y0=" + gems[0].y.toFixed(0));
  return gems;
}
function enrichGems(items, x0, length, step) {
  const added = [];
  const place = (g) => {
    if (g) for (const gem of g) {
      items.push(gem);
      added.push(gem);
    }
  };
  const placeSingle = (g) => {
    items.push(g);
    added.push(g);
  };
  let ri = 0;
  for (let cx = x0 + step * 6; cx < length - step * 4; cx += step * 6, ri++) {
    const count = 4 + ri % 3;
    const spacing = step * 0.5;
    const m = ri % 4;
    let row = null;
    if (m === 0) row = placeRow(items, cx, LANE.floor, count, 1, 0, spacing);
    else if (m === 1) row = placeRow(items, cx, LANE.ceil, count, 1, 0, spacing);
    else if (m === 2) row = placeRow(items, cx, LANE.floor, count, 1, -1, spacing);
    else row = placeRow(items, cx, LANE.ceil, count, 1, 1, spacing);
    if (row) for (const g of row) added.push(g);
  }
  const baseSpacing = step * 1.5;
  let i = 0;
  for (let cx = x0 + step * 1.5; cx < length - step * 1.5; cx += baseSpacing, i++) {
    const m = i % 5;
    const y = m === 0 ? LANE.floor : m === 1 ? LANE.ceil : m === 2 ? LANE.mid : m === 3 ? LANE.midLow : LANE.midHigh;
    if (gemClear(items, cx, y)) placeSingle({ type: "gem", x: cx, y, r: 13 });
  }
  let ci = 0;
  for (let cx = x0 + step * 4; cx < length - step * 2; cx += step * 7, ci++) {
    const lanes = [LANE.floor, LANE.ceil, LANE.mid];
    const ly = lanes[ci % 3];
    if (!gemClear(items, cx, ly)) continue;
    const dx = step * 0.34;
    for (let k = -1; k <= 1; k++) {
      const gx = cx + k * dx;
      if (gemClear(items, gx, ly)) placeSingle({ type: "gem", x: gx, y: ly, r: 13 });
    }
  }
  for (const it of items) {
    if (it.type !== "plat" && it.type !== "vanish") continue;
    const cx = it.x + it.w / 2;
    const gy = it.y - 34;
    if (cx < x0 || cx > length - step) continue;
    if (gemClear(items, cx, gy)) placeSingle({ type: "gem", x: cx, y: gy, r: 13 });
  }
  for (const it of items) {
    if (it.type !== "zone") continue;
    const zstep = step * 0.55;
    for (let cx = it.x + zstep; cx < it.x + it.w - zstep; cx += zstep) {
      if (gemClear(items, cx, LANE.mid)) placeSingle({ type: "gem", x: cx, y: LANE.mid, r: 13 });
    }
  }
  return added;
}

// src/game/levels.js
var _gemGroupId = 1;
function emit(d, x, out, ctx) {
  const { step, gap } = ctx;
  const f = d.f == null ? gap : d.f;
  const fs = ctx.fScale == null ? 1 : ctx.fScale;
  const sf = f * fs;
  switch (d.t) {
    case "run":
      return x + step * (d.n || 1) * (d.f == null ? 1 : d.f);
    case "spike": {
      const n = d.n || 2;
      const item = { type: "spike", side: d.side || "floor", x, w: SPIKE_W * n };
      if (d.h) item.h = d.h;
      out.push(item);
      return x + SPIKE_W * n + step * sf;
    }
    case "alt": {
      let side = d.side || "floor";
      const c = d.c || 2;
      for (let i = 0; i < (d.n || 3); i++) {
        out.push({ type: "spike", side, x, w: SPIKE_W * c });
        x += SPIKE_W * c + step * sf;
        side = side === "floor" ? "ceil" : "floor";
      }
      return x;
    }
    case "saw": {
      const n = d.n || 1;
      const r = d.r || 26;
      for (let i = 0; i < n; i++) {
        const base = {
          type: "saw",
          x,
          r,
          spin: d.spin == null ? 3.4 : d.spin,
          phase: (d.phase || 0) + i * 0.6,
          teeth: 8
        };
        if (d.move === "v") {
          base.move = "v";
          base.y0 = FLOOR_Y - r - 10;
          base.y1 = CEIL_Y + r + 10;
          base.y = (base.y0 + base.y1) / 2;
          base.period = d.period || 2.9;
          base.phase = (d.phase || 0) + i * 0.9;
        } else {
          base.y = d.at === "ceil" ? CEIL_Y + r * 0.55 : d.at === "mid" ? MID_Y : FLOOR_Y - r * 0.55;
        }
        out.push(base);
        x += step * sf;
      }
      return x;
    }
    case "blade": {
      for (let i = 0; i < (d.n || 1); i++) {
        out.push({
          type: "blade",
          x,
          y: d.at === "high" ? CEIL_Y + 130 : d.at === "low" ? FLOOR_Y - 130 : MID_Y,
          arm: d.arm || 120,
          spin: d.spin || 0.85,
          a0: (d.a0 || 0) + i * 1.2,
          phase: d.phase || 0
        });
        x += step * sf;
      }
      return x;
    }
    case "crusher": {
      for (let i = 0; i < (d.n || 1); i++) {
        out.push({
          type: "crusher",
          x,
          w: d.w || 56,
          side: d.side || "ceil",
          period: d.period || 2.6,
          phase: (d.phase || 0) + i * 1.4
        });
        x += step * sf;
      }
      return x;
    }
    case "laser": {
      for (let i = 0; i < (d.n || 1); i++) {
        out.push({
          type: "laser",
          x,
          host: d.host || "floor",
          h: d.h || 330,
          on: d.on || 1.2,
          off: d.off || 1,
          phase: (d.phase || 0) + i * 0.55
        });
        x += step * sf;
      }
      return x;
    }
    case "plat": {
      const w = d.w || 150;
      for (let i = 0; i < (d.n || 1); i++) {
        out.push({
          type: "plat",
          x: x - w / 2,
          y: d.y || MID_Y,
          w,
          amp: d.amp || 0,
          period: d.period || 3.2,
          phase: d.phase || 0,
          axis: d.axis || "y"
        });
        x += step * sf;
      }
      return x;
    }
    case "vanish": {
      const w = d.w || 150;
      for (let i = 0; i < (d.n || 1); i++) {
        out.push({
          type: "vanish",
          x: x - w / 2,
          y: d.y || MID_Y,
          w,
          on: d.on || 1.8,
          off: d.off || 1.2,
          phase: d.phase || 0
        });
        x += step * sf;
      }
      return x;
    }
    case "zone": {
      const len = step * (d.len || 2);
      out.push({ type: "zone", x, w: len, dir: d.dir || -1 });
      return x + len + step * 0.45;
    }
    case "portal": {
      out.push({ type: "portal", x, y: d.y || MID_Y, dir: d.dir || 1, boost: d.boost || 0.08 });
      return x + step * sf;
    }
    case "speed": {
      out.push({ type: "speed", x, mult: d.mult || 1.1 });
      return x;
    }
    case "mspike": {
      const n = d.n || 1;
      const w = SPIKE_W * (d.c || 2);
      for (let i = 0; i < n; i++) {
        out.push({ type: "mspike", side: d.side || "floor", x, w, period: d.period || 2.4, on: d.on || 0.5, phase: (d.phase || 0) + i * 0.5 });
        x += step * sf;
      }
      return x;
    }
    case "drop": {
      for (let i = 0; i < (d.n || 1); i++) {
        out.push({ type: "drop", x, w: d.w || 60, h: d.h || 44, side: d.side || "ceil", trigger: d.trigger || 280, shake: d.shake || 0.45 });
        x += step * sf;
      }
      return x;
    }
    case "wall": {
      for (let i = 0; i < (d.n || 1); i++) {
        out.push({ type: "wall", x, w: d.w || 50, gap: d.gap || 150, period: d.period || 3.2, phase: (d.phase || 0) + i * 0.6 });
        x += step * sf;
      }
      return x;
    }
    case "bounce": {
      for (let i = 0; i < (d.n || 1); i++) {
        out.push({ type: "bounce", x, r: d.r || 22, y0: d.y0, y1: d.y1, period: d.period || 2.4, phase: (d.phase || 0) + i * 0.5 });
        x += step * sf;
      }
      return x;
    }
    case "trap": {
      for (let i = 0; i < (d.n || 1); i++) {
        out.push({ type: "trap", x, w: d.w || 40, side: d.side || "floor", trigger: d.trigger || 220, warn: d.warn || 0.32, up: d.up || 1 });
        x += step * sf;
      }
      return x;
    }
    case "gem": {
      const n = d.n || 1;
      const spacing = d.spacing || 0.5;
      const isRow = n >= 4;
      const groupId = isRow ? _gemGroupId++ : void 0;
      for (let i = 0; i < n; i++) {
        const gem = { type: "gem", x: x + i * step * spacing, y: d.y || MID_Y, r: 13 };
        if (isRow) {
          gem.groupId = groupId;
          gem.rowLen = n;
          gem.rowDir = { x: 1, y: 0 };
        }
        out.push(gem);
      }
      return x + n * step * spacing;
    }
    case "over": {
      const xa = emit({ ...d.a, f: d.a.f == null ? f : d.a.f }, x, out, ctx);
      const xb = emit({ ...d.b, f: d.b.f == null ? f : d.b.f }, x, out, ctx);
      return Math.max(xa, xb);
    }
    default:
      return x;
  }
}
function buildLevel(spec, index) {
  const speed = BASE_SPEED * spec.speed;
  const step = speed * CROSS_TIME;
  const items = [];
  const checkpoints = [];
  const ctx = { step, gap: spec.gap, fScale: spec.fScale || 1 };
  let x = START_X + step * (spec.startRun || 3);
  const x0 = x;
  for (const d of spec.sections) {
    if (d.t === "checkpoint") {
      const cp = { x, dir: 1, index: checkpoints.length };
      checkpoints.push(cp);
      items.push({ type: "checkpoint", x, index: cp.index });
      x += step * (d.n || 2);
      continue;
    }
    x = emit(d, x, items, ctx);
  }
  const length = x + step * 2.2;
  if (spec.hints) {
    let h = spec.hints;
    for (const it of items) {
      if (it.type === "spike" && h > 0) {
        it.hint = true;
        h--;
      }
    }
  }
  enrichGems(items, x0, length, step);
  return {
    index,
    name: spec.name,
    theme: spec.theme,
    speed,
    step,
    items,
    checkpoints,
    length,
    startX: START_X,
    hints: spec.hints || 0,
    tip: spec.tip || null
  };
}
var SPECS = [
  // ---------- 1-3 : tutorial / easy ----------
  {
    name: "First Flip",
    theme: "neon",
    speed: 0.6,
    gap: 3,
    startRun: 4.5,
    hints: 5,
    tip: "Tap or press Space to flip gravity",
    sections: [
      { t: "run", n: 2 },
      { t: "spike", side: "floor", n: 2, f: 3.2 },
      { t: "run", n: 0.8 },
      { t: "spike", side: "ceil", n: 2, f: 3.2 },
      { t: "run", n: 0.8 },
      { t: "alt", n: 3, c: 2, f: 3 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "spike", side: "floor", n: 3, f: 2.9 },
      { t: "run", n: 1 },
      { t: "spike", side: "ceil", n: 3, f: 2.9 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "alt", n: 4, c: 2, f: 2.9 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Higher Ground",
    theme: "neon",
    speed: 0.65,
    gap: 2.8,
    startRun: 3.5,
    hints: 3,
    tip: "Switch to the opposite wall to dodge spikes",
    sections: [
      { t: "run", n: 2 },
      { t: "spike", side: "floor", n: 4, f: 3 },
      { t: "run", n: 0.8 },
      { t: "spike", side: "ceil", n: 4, f: 3 },
      { t: "run", n: 0.8 },
      { t: "alt", n: 4, c: 3, f: 2.85 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "spike", side: "floor", n: 6, f: 2.7 },
      { t: "run", n: 0.7 },
      { t: "spike", side: "ceil", n: 2, f: 2.7 },
      { t: "run", n: 0.7 },
      { t: "alt", n: 5, c: 2, f: 2.8 },
      { t: "run", n: 0.8 },
      { t: "checkpoint" },
      { t: "spike", side: "floor", n: 3, f: 2.7 },
      { t: "spike", side: "ceil", n: 3, f: 2.7 },
      { t: "alt", n: 4, c: 1, f: 2.8 },
      { t: "run", n: 1.2 }
    ]
  },
  {
    name: "Rhythm",
    theme: "neon",
    speed: 0.7,
    gap: 2.55,
    hints: 1,
    tip: "Find the rhythm \u2014 flip with the spikes",
    sections: [
      { t: "run", n: 2 },
      { t: "alt", n: 6, c: 1, f: 2.6 },
      { t: "run", n: 0.9 },
      { t: "spike", side: "floor", n: 4, f: 2.5 },
      { t: "run", n: 0.7 },
      { t: "spike", side: "ceil", n: 4, f: 2.5 },
      { t: "run", n: 0.7 },
      { t: "checkpoint" },
      { t: "alt", n: 6, c: 2, f: 2.45 },
      { t: "run", n: 0.9 },
      { t: "spike", side: "floor", n: 2, f: 2.5 },
      { t: "spike", side: "ceil", n: 2, f: 2.5 },
      { t: "spike", side: "floor", n: 2, f: 2.5 },
      { t: "spike", side: "ceil", n: 2, f: 2.5 },
      { t: "mspike", side: "floor", c: 2, period: 2.6, on: 0.5, f: 2.8 },
      { t: "run", n: 1.1 }
    ]
  },
  // ---------- 4-6 : medium ----------
  {
    name: "Sawmill",
    theme: "industrial",
    speed: 0.77,
    gap: 2.3,
    tip: "Saws spin \u2014 time your passage",
    sections: [
      { t: "run", n: 1.2 },
      { t: "saw", at: "floor", r: 26, n: 2, f: 2.5 },
      { t: "run", n: 0.9 },
      { t: "saw", at: "ceil", r: 26, n: 2, f: 2.5 },
      { t: "run", n: 0.9 },
      { t: "alt", n: 3, c: 2, f: 2.45 },
      { t: "checkpoint" },
      { t: "saw", at: "floor", r: 30, n: 1, f: 2.3 },
      { t: "spike", side: "ceil", n: 2, f: 2.3 },
      { t: "saw", at: "ceil", r: 30, n: 1, f: 2.3 },
      { t: "spike", side: "floor", n: 2, f: 2.3 },
      { t: "alt", n: 3, c: 2, f: 2.4 },
      { t: "saw", at: "floor", r: 24, n: 2, f: 2.3 },
      { t: "bounce", r: 22, y0: 170, y1: 590, period: 2.6, f: 2.6 },
      { t: "drop", w: 60, h: 44, f: 2.8 },
      { t: "run", n: 1 }
    ]
  },
  {
    name: "Moving Parts",
    theme: "industrial",
    speed: 0.83,
    gap: 2.15,
    tip: "Watch the moving blades \u2014 find the gap",
    sections: [
      { t: "run", n: 1.2 },
      { t: "saw", move: "v", r: 26, period: 3, f: 3 },
      { t: "run", n: 0.9 },
      { t: "blade", arm: 110, spin: 0.8, f: 2.5 },
      { t: "run", n: 0.9 },
      { t: "checkpoint" },
      { t: "saw", at: "floor", r: 26, n: 2, f: 2.3 },
      { t: "saw", at: "ceil", r: 26, n: 2, f: 2.3 },
      { t: "saw", move: "v", r: 28, period: 2.8, f: 2.9 },
      { t: "blade", arm: 130, spin: 0.95, f: 2.3 },
      { t: "alt", n: 3, c: 2, f: 2.3 },
      { t: "saw", at: "floor", r: 26, f: 2.2 },
      { t: "spike", side: "ceil", n: 3, f: 2.2 },
      { t: "wall", gap: 150, period: 3, f: 2.8 },
      { t: "mspike", side: "floor", c: 2, period: 2.2, on: 0.55, f: 2.5 },
      { t: "run", n: 1.1 }
    ]
  },
  {
    name: "Gatekeeper",
    theme: "industrial",
    speed: 0.88,
    gap: 2,
    tip: "Crushers slam \u2014 wait for the gap",
    sections: [
      { t: "run", n: 1.4 },
      { t: "crusher", period: 2.9, f: 3 },
      { t: "run", n: 1 },
      { t: "blade", arm: 115, spin: 0.85, f: 2.2 },
      { t: "saw", at: "floor", r: 26, n: 2, f: 2.2 },
      { t: "checkpoint" },
      { t: "crusher", period: 2.7, f: 2.9 },
      { t: "alt", n: 4, c: 2, f: 2.15 },
      { t: "saw", at: "ceil", r: 28, n: 2, f: 2.15 },
      { t: "crusher", period: 2.6, f: 2.8 },
      { t: "saw", at: "floor", r: 26, f: 2.1 },
      { t: "spike", side: "ceil", n: 2, f: 2.15 },
      { t: "trap", side: "floor", w: 40, f: 2.6 },
      { t: "bounce", r: 24, y0: 160, y1: 600, period: 2.4, f: 2.6 },
      { t: "run", n: 1.2 }
    ]
  },
  // ---------- 7-9 : hard ----------
  {
    name: "Shifting Ground",
    theme: "space",
    speed: 0.93,
    gap: 1.95,
    tip: "Lasers pulse \u2014 dash through the gaps",
    sections: [
      { t: "run", n: 1.2 },
      { t: "laser", host: "floor", h: 320, on: 1.6, off: 1.3, f: 2.5 },
      { t: "saw", at: "floor", r: 26, f: 2.2 },
      { t: "plat", y: 360, amp: 110, period: 3.4, w: 160, f: 2.6 },
      { t: "spike", side: "floor", n: 3, f: 2.1 },
      { t: "laser", host: "ceil", h: 320, on: 1.5, off: 1.2, f: 2.5 },
      { t: "plat", y: 420, amp: 100, period: 3.2, w: 170, f: 2.6 },
      { t: "spike", side: "ceil", n: 3, f: 2.1 },
      { t: "saw", at: "ceil", r: 26, f: 2.2 },
      { t: "alt", n: 3, c: 2, f: 2.1 },
      { t: "run", n: 1.4 },
      { t: "checkpoint" },
      { t: "run", n: 1.4 },
      { t: "laser", host: "floor", h: 340, on: 1.3, off: 1.1, f: 2.4 },
      { t: "plat", y: 380, amp: 130, period: 3, w: 150, f: 2.6 },
      { t: "spike", side: "floor", n: 4, f: 2 },
      { t: "drop", w: 64, h: 46, f: 2.8 },
      { t: "mspike", side: "ceil", c: 3, period: 2, on: 0.5, f: 2.4 },
      { t: "run", n: 1.2 }
    ]
  },
  {
    name: "Blackout",
    theme: "space",
    speed: 0.98,
    gap: 1.9,
    tip: "Vanish platforms fade \u2014 keep moving",
    sections: [
      { t: "run", n: 1.2 },
      { t: "vanish", y: 360, w: 160, on: 1.8, off: 1.2, f: 2.3 },
      { t: "laser", host: "floor", h: 340, on: 1.2, off: 1, f: 2.4 },
      { t: "over", a: { t: "vanish", y: 380, w: 150, on: 1.7, off: 1.3 }, b: { t: "spike", side: "floor", n: 2 }, f: 2.3 },
      { t: "saw", move: "v", r: 26, period: 2.9, f: 3 },
      { t: "laser", host: "ceil", h: 340, on: 1.1, off: 1, f: 2.4 },
      { t: "over", a: { t: "vanish", y: 400, w: 160, on: 1.6, off: 1.2 }, b: { t: "saw", at: "ceil", r: 28 }, f: 2.4 },
      { t: "saw", at: "floor", r: 28, n: 2, f: 2.1 },
      { t: "alt", n: 4, c: 2, f: 2 },
      { t: "run", n: 1.3 },
      { t: "checkpoint" },
      { t: "run", n: 1.3 },
      { t: "over", a: { t: "laser", host: "floor", h: 360, on: 1.2, off: 0.9 }, b: { t: "vanish", y: 360, w: 150, on: 1.8, off: 1.1 }, f: 2.4 },
      { t: "spike", side: "ceil", n: 3, f: 2 },
      { t: "saw", move: "v", r: 28, period: 2.8, f: 3 },
      { t: "wall", gap: 140, period: 2.8, f: 2.6 },
      { t: "trap", side: "ceil", w: 40, f: 2.4 },
      { t: "run", n: 1.2 }
    ]
  },
  {
    name: "Crush Depth",
    theme: "space",
    speed: 1.02,
    gap: 1.85,
    tip: "Gravity zones flip you \u2014 ride the current",
    sections: [
      { t: "run", n: 1.4 },
      { t: "zone", dir: -1, len: 2.2 },
      { t: "run", n: 1.5 },
      { t: "crusher", period: 2.7, f: 2.9 },
      { t: "blade", arm: 120, spin: 0.9, f: 2.2 },
      { t: "over", a: { t: "laser", host: "floor", h: 360, on: 1.2, off: 1 }, b: { t: "saw", at: "floor", r: 26 }, f: 2.5 },
      { t: "over", a: { t: "crusher", period: 2.5 }, b: { t: "spike", side: "ceil", n: 2 }, f: 3 },
      { t: "plat", y: 340, amp: 140, period: 3.2, w: 160, f: 2.6 },
      { t: "zone", dir: 1, len: 2 },
      { t: "run", n: 1 },
      { t: "saw", move: "v", r: 28, period: 2.8, f: 3 },
      { t: "alt", n: 4, c: 2, f: 1.95 },
      { t: "run", n: 1.4 },
      { t: "checkpoint" },
      { t: "run", n: 1.4 },
      { t: "over", a: { t: "laser", host: "ceil", h: 380, on: 1.1, off: 0.9 }, b: { t: "saw", at: "ceil", r: 30 }, f: 2.5 },
      { t: "crusher", period: 2.4, f: 2.9 },
      { t: "alt", n: 4, c: 2, f: 1.9 },
      { t: "bounce", r: 24, y0: 150, y1: 610, period: 2.2, f: 2.5 },
      { t: "wall", gap: 140, period: 2.6, f: 2.8 },
      { t: "run", n: 1.2 }
    ]
  },
  // ---------- 10-12 : very hard ----------
  {
    name: "Crossfire",
    theme: "cyber",
    speed: 1.07,
    gap: 1.8,
    sections: [
      { t: "run", n: 1.2 },
      { t: "over", a: { t: "spike", side: "floor", n: 3 }, b: { t: "saw", move: "v", r: 28, period: 2.9 }, f: 2.9 },
      { t: "laser", host: "floor", h: 360, on: 1.2, off: 1, f: 2.3 },
      { t: "plat", y: 360, amp: 120, period: 3, w: 160, f: 2.5 },
      { t: "over", a: { t: "spike", side: "ceil", n: 3 }, b: { t: "saw", at: "ceil", r: 30 }, f: 2.3 },
      { t: "blade", arm: 130, spin: 1.1, f: 2.1 },
      { t: "laser", host: "ceil", h: 360, on: 1.1, off: 0.9, f: 2.3 },
      { t: "vanish", y: 380, w: 150, on: 1.7, off: 1.2, f: 2.2 },
      { t: "saw", move: "v", r: 30, period: 2.7, f: 3 },
      { t: "alt", n: 5, c: 2, f: 1.9 },
      { t: "run", n: 1.4 },
      { t: "checkpoint" },
      { t: "run", n: 1.4 },
      { t: "over", a: { t: "crusher", period: 2.5 }, b: { t: "spike", side: "floor", n: 3 }, f: 3 },
      { t: "saw", at: "floor", r: 28, n: 2, f: 2 },
      { t: "alt", n: 5, c: 2, f: 1.85 },
      { t: "drop", w: 66, h: 46, f: 2.8 },
      { t: "trap", side: "floor", w: 44, f: 2.4 },
      { t: "run", n: 1.2 }
    ]
  },
  {
    name: "Overload",
    theme: "cyber",
    speed: 1.12,
    gap: 1.78,
    sections: [
      { t: "run", n: 1.4 },
      { t: "over", a: { t: "crusher", period: 2.6 }, b: { t: "spike", side: "floor", n: 2 }, f: 3 },
      { t: "over", a: { t: "blade", arm: 130, spin: 1.05 }, b: { t: "vanish", y: 380, w: 150, on: 1.7, off: 1.2 }, f: 2.4 },
      { t: "saw", move: "v", r: 28, period: 2.7, f: 3 },
      { t: "over", a: { t: "laser", host: "floor", h: 380, on: 1.1, off: 0.9 }, b: { t: "spike", side: "ceil", n: 2 }, f: 2.4 },
      { t: "portal", dir: 1, boost: 0.1, y: MID_Y, f: 2.6 },
      { t: "saw", at: "floor", r: 28, n: 3, f: 1.95 },
      { t: "over", a: { t: "saw", move: "v", r: 30, period: 2.6 }, b: { t: "spike", side: "floor", n: 3 }, f: 3 },
      { t: "blade", arm: 120, spin: 1.15, f: 2.1 },
      { t: "alt", n: 6, c: 2, f: 1.8 },
      { t: "run", n: 1.4 },
      { t: "checkpoint" },
      { t: "run", n: 1.4 },
      { t: "over", a: { t: "crusher", period: 2.4 }, b: { t: "laser", host: "ceil", h: 360, on: 1, off: 0.8 }, f: 3 },
      { t: "alt", n: 5, c: 2, f: 1.78 },
      { t: "mspike", side: "floor", c: 3, period: 1.8, on: 0.55, f: 2.2 },
      { t: "bounce", r: 24, y0: 150, y1: 610, period: 2, f: 2.5 },
      { t: "run", n: 1.2 }
    ]
  },
  {
    name: "Pulse",
    theme: "cyber",
    speed: 1.17,
    gap: 1.75,
    sections: [
      { t: "run", n: 1.2 },
      { t: "laser", host: "floor", h: 380, on: 0.9, off: 0.85, f: 2.2 },
      { t: "laser", host: "ceil", h: 380, on: 0.9, off: 0.85, f: 2.2 },
      { t: "alt", n: 8, c: 1, f: 1.85 },
      { t: "blade", arm: 130, spin: 1.2, f: 1.95 },
      { t: "over", a: { t: "saw", move: "v", r: 26, period: 2.6 }, b: { t: "spike", side: "ceil", n: 2 }, f: 3 },
      { t: "crusher", period: 2.5, f: 2.9 },
      { t: "vanish", y: 360, w: 150, on: 1.6, off: 1.1, f: 2.1 },
      { t: "over", a: { t: "spike", side: "floor", n: 3 }, b: { t: "laser", host: "ceil", h: 360, on: 1, off: 0.85 }, f: 2.3 },
      { t: "alt", n: 4, c: 2, f: 1.8 },
      { t: "run", n: 1.4 },
      { t: "checkpoint" },
      { t: "run", n: 1.4 },
      { t: "saw", at: "floor", r: 28, n: 3, f: 1.9 },
      { t: "over", a: { t: "blade", arm: 120, spin: 1.25 }, b: { t: "spike", side: "floor", n: 3 }, f: 2.1 },
      { t: "alt", n: 5, c: 2, f: 1.78 },
      { t: "wall", gap: 130, period: 2.4, f: 2.6 },
      { t: "drop", w: 66, h: 46, side: "floor", f: 2.8 },
      { t: "run", n: 1.2 }
    ]
  },
  // ---------- 13-15 : expert ----------
  {
    name: "Gauntlet",
    theme: "energy",
    speed: 1.22,
    gap: 1.73,
    sections: [
      { t: "run", n: 1.4 },
      { t: "over", a: { t: "spike", side: "floor", n: 3 }, b: { t: "saw", move: "v", r: 28, period: 2.7 }, f: 2.9 },
      { t: "laser", host: "floor", h: 380, on: 1, off: 0.9, f: 2.2 },
      { t: "blade", arm: 130, spin: 1.1, f: 2 },
      { t: "over", a: { t: "crusher", period: 2.5 }, b: { t: "spike", side: "ceil", n: 3 }, f: 3 },
      { t: "alt", n: 6, c: 2, f: 1.85 },
      { t: "plat", y: 340, amp: 150, period: 3, w: 150, f: 2.5 },
      { t: "over", a: { t: "laser", host: "ceil", h: 380, on: 1, off: 0.85 }, b: { t: "saw", at: "ceil", r: 30 }, f: 2.4 },
      { t: "vanish", y: 380, w: 140, on: 1.6, off: 1.1, f: 2.1 },
      { t: "run", n: 1.4 },
      { t: "checkpoint" },
      { t: "run", n: 1.4 },
      { t: "over", a: { t: "spike", side: "floor", n: 4 }, b: { t: "blade", arm: 120, spin: 1.2 }, f: 2.1 },
      { t: "saw", move: "v", r: 30, period: 2.5, f: 2.9 },
      { t: "over", a: { t: "crusher", period: 2.4 }, b: { t: "saw", at: "floor", r: 26 }, f: 3 },
      { t: "alt", n: 6, c: 2, f: 1.8 },
      { t: "run", n: 1.4 },
      { t: "checkpoint" },
      { t: "run", n: 1.4 },
      { t: "over", a: { t: "laser", host: "floor", h: 400, on: 0.9, off: 0.8 }, b: { t: "spike", side: "ceil", n: 3 }, f: 2.3 },
      { t: "blade", arm: 140, spin: 1.15, f: 2 },
      { t: "alt", n: 5, c: 2, f: 1.75 },
      { t: "trap", side: "floor", w: 44, f: 2.3 },
      { t: "bounce", r: 24, y0: 150, y1: 610, period: 2, f: 2.4 },
      { t: "run", n: 1.2 }
    ]
  },
  {
    name: "Singularity",
    theme: "energy",
    speed: 1.28,
    gap: 1.7,
    sections: [
      { t: "run", n: 1.4 },
      { t: "portal", dir: -1, boost: 0.08, y: 380, f: 2.6 },
      { t: "over", a: { t: "saw", move: "v", r: 28, period: 2.6 }, b: { t: "spike", side: "floor", n: 3 }, f: 2.9 },
      { t: "laser", host: "ceil", h: 380, on: 1, off: 0.8, f: 2.2 },
      { t: "over", a: { t: "blade", arm: 135, spin: 1.2 }, b: { t: "vanish", y: 380, w: 140, on: 1.6, off: 1 }, f: 2.3 },
      { t: "crusher", period: 2.4, f: 2.9 },
      { t: "alt", n: 8, c: 2, f: 1.8 },
      { t: "saw", at: "floor", r: 28, n: 3, f: 1.85 },
      { t: "over", a: { t: "laser", host: "floor", h: 400, on: 0.9, off: 0.8 }, b: { t: "saw", at: "floor", r: 26 }, f: 2.3 },
      { t: "run", n: 1.4 },
      { t: "checkpoint" },
      { t: "run", n: 1.4 },
      { t: "plat", y: 340, amp: 160, period: 2.8, w: 140, f: 2.5 },
      { t: "over", a: { t: "crusher", period: 2.3 }, b: { t: "spike", side: "ceil", n: 3 }, f: 3 },
      { t: "blade", arm: 145, spin: 1.25, f: 2.1 },
      { t: "saw", move: "v", r: 30, period: 2.4, f: 2.9 },
      { t: "alt", n: 6, c: 2, f: 1.75 },
      { t: "wall", gap: 130, period: 2.4, f: 2.6 },
      { t: "drop", w: 66, h: 46, f: 2.8 },
      { t: "run", n: 1.2 }
    ]
  },
  {
    name: "Gravity's End",
    theme: "void",
    speed: 1.25,
    gap: 1.78,
    sections: [
      { t: "run", n: 2 },
      { t: "alt", n: 4, c: 2, f: 2.6 },
      { t: "run", n: 1.2 },
      { t: "saw", at: "floor", r: 28, n: 2, f: 2.4 },
      { t: "run", n: 1 },
      { t: "saw", at: "ceil", r: 28, n: 2, f: 2.4 },
      { t: "run", n: 1.2 },
      { t: "checkpoint" },
      { t: "run", n: 1.2 },
      { t: "laser", host: "floor", h: 360, on: 1.1, off: 1, f: 2.4 },
      { t: "run", n: 0.9 },
      { t: "laser", host: "ceil", h: 360, on: 1.1, off: 1, f: 2.4 },
      { t: "run", n: 1 },
      { t: "crusher", period: 2.8, f: 2.8 },
      { t: "run", n: 1 },
      { t: "blade", arm: 120, spin: 1, f: 2.2 },
      { t: "run", n: 1.2 },
      { t: "checkpoint" },
      { t: "run", n: 1.2 },
      { t: "over", a: { t: "spike", side: "floor", n: 3 }, b: { t: "saw", at: "ceil", r: 28 }, f: 2.6 },
      { t: "run", n: 1 },
      { t: "alt", n: 5, c: 2, f: 2.1 },
      { t: "run", n: 1 },
      { t: "over", a: { t: "crusher", period: 2.6 }, b: { t: "spike", side: "ceil", n: 2 }, f: 2.8 },
      { t: "run", n: 1 },
      { t: "vanish", y: 360, w: 150, on: 1.8, off: 1.2, f: 2.4 },
      { t: "run", n: 1.2 },
      { t: "checkpoint" },
      { t: "run", n: 1.2 },
      { t: "saw", move: "v", r: 28, period: 2.8, f: 2.8 },
      { t: "run", n: 0.9 },
      { t: "blade", arm: 130, spin: 1.1, f: 2.1 },
      { t: "run", n: 0.9 },
      { t: "over", a: { t: "laser", host: "floor", h: 360, on: 1, off: 0.9 }, b: { t: "spike", side: "ceil", n: 3 }, f: 2.4 },
      { t: "run", n: 1 },
      { t: "alt", n: 6, c: 2, f: 1.95 },
      { t: "mspike", side: "floor", c: 3, period: 1.8, on: 0.55, f: 2.2 },
      { t: "trap", side: "ceil", w: 44, f: 2.3 },
      { t: "run", n: 1.4 }
    ]
  },
  // ==========================================================================
  // STAGE 1 — LEARNING THE MECHANICS (16-20)
  // Introduces moving spikes (mspike) and spike clusters with forgiving spacing.
  // ==========================================================================
  {
    name: "Spike Surge",
    theme: "neon",
    speed: 1.26,
    gap: 1.75,
    fScale: 0.62,
    tip: "Moving spikes pulse \u2014 time your flip",
    sections: [
      { t: "run", n: 2 },
      { t: "mspike", side: "floor", c: 2, period: 3, on: 0.5, f: 3.2 },
      { t: "run", n: 1 },
      { t: "mspike", side: "ceil", c: 2, period: 3, on: 0.5, f: 3.2 },
      { t: "run", n: 1 },
      { t: "alt", n: 3, c: 2, f: 2.8 },
      { t: "run", n: 1.2 },
      { t: "checkpoint" },
      { t: "mspike", side: "floor", c: 3, period: 2.8, on: 0.5, f: 3 },
      { t: "run", n: 0.8 },
      { t: "mspike", side: "ceil", c: 3, period: 2.8, on: 0.5, f: 3 },
      { t: "run", n: 1 },
      { t: "alt", n: 4, c: 2, f: 2.7 },
      { t: "run", n: 1.2 },
      { t: "checkpoint" },
      { t: "mspike", side: "floor", c: 2, period: 2.6, f: 2.8 },
      { t: "mspike", side: "ceil", c: 2, period: 2.6, f: 2.8 },
      { t: "alt", n: 3, c: 2, f: 2.7 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Rising Threat",
    theme: "neon",
    speed: 1.28,
    gap: 1.73,
    fScale: 0.64,
    tip: "Different rhythms \u2014 watch the timing",
    sections: [
      { t: "run", n: 1.5 },
      { t: "mspike", side: "floor", c: 2, period: 3.2, on: 0.45, f: 3 },
      { t: "run", n: 0.8 },
      { t: "mspike", side: "ceil", c: 2, period: 2.6, on: 0.55, f: 2.8 },
      { t: "run", n: 0.8 },
      { t: "alt", n: 4, c: 2, f: 2.6 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "mspike", side: "floor", c: 3, period: 2.4, on: 0.5, f: 2.6 },
      { t: "run", n: 0.7 },
      { t: "spike", side: "ceil", n: 3, f: 2.5 },
      { t: "run", n: 0.7 },
      { t: "mspike", side: "ceil", c: 3, period: 2.4, on: 0.5, f: 2.6 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "alt", n: 5, c: 2, f: 2.5 },
      { t: "mspike", side: "floor", c: 2, period: 2.2, f: 2.6 },
      { t: "mspike", side: "ceil", c: 2, period: 2.2, f: 2.6 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Spike Garden",
    theme: "industrial",
    speed: 1.3,
    gap: 1.71,
    fScale: 0.66,
    tip: "Tall spikes need earlier flips",
    sections: [
      { t: "run", n: 1.5 },
      { t: "spike", side: "floor", n: 3, h: 36, f: 2.7 },
      { t: "run", n: 0.8 },
      { t: "spike", side: "ceil", n: 3, h: 36, f: 2.7 },
      { t: "run", n: 0.8 },
      { t: "mspike", side: "floor", c: 2, period: 2.8, f: 2.7 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "spike", side: "floor", n: 4, h: 42, f: 2.5 },
      { t: "mspike", side: "ceil", c: 2, period: 2.6, f: 2.6 },
      { t: "alt", n: 4, c: 2, f: 2.5 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "mspike", side: "floor", c: 3, period: 2.4, f: 2.5 },
      { t: "spike", side: "ceil", n: 3, h: 40, f: 2.5 },
      { t: "mspike", side: "ceil", c: 3, period: 2.4, f: 2.5 },
      { t: "alt", n: 4, c: 2, f: 2.4 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Pulse Floor",
    theme: "industrial",
    speed: 1.31,
    gap: 1.69,
    fScale: 0.67,
    tip: "Fast pulses mean quick switches",
    sections: [
      { t: "run", n: 1.5 },
      { t: "mspike", side: "floor", c: 2, period: 3, on: 0.4, f: 2.8 },
      { t: "mspike", side: "ceil", c: 2, period: 3, on: 0.4, f: 2.8 },
      { t: "run", n: 0.8 },
      { t: "alt", n: 4, c: 2, f: 2.5 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "mspike", side: "floor", c: 3, period: 2.4, on: 0.5, f: 2.5 },
      { t: "run", n: 0.6 },
      { t: "mspike", side: "ceil", c: 3, period: 2.4, on: 0.5, f: 2.5 },
      { t: "run", n: 0.8 },
      { t: "alt", n: 5, c: 2, f: 2.4 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "mspike", side: "floor", c: 2, period: 2, on: 0.55, f: 2.4 },
      { t: "mspike", side: "ceil", c: 2, period: 2, on: 0.55, f: 2.4 },
      { t: "mspike", side: "floor", c: 2, period: 2, on: 0.55, f: 2.4 },
      { t: "alt", n: 4, c: 2, f: 2.3 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Spike Mastery",
    theme: "industrial",
    speed: 1.32,
    gap: 1.67,
    fScale: 0.68,
    tip: "Spikes and saws \u2014 switch with care",
    sections: [
      { t: "run", n: 1.5 },
      { t: "mspike", side: "floor", c: 2, period: 2.6, f: 2.6 },
      { t: "saw", at: "ceil", r: 26, f: 2.5 },
      { t: "run", n: 0.8 },
      { t: "mspike", side: "ceil", c: 2, period: 2.6, f: 2.6 },
      { t: "saw", at: "floor", r: 26, f: 2.5 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "alt", n: 5, c: 2, f: 2.3 },
      { t: "mspike", side: "floor", c: 3, period: 2.2, f: 2.4 },
      { t: "saw", at: "ceil", r: 28, f: 2.3 },
      { t: "run", n: 0.8 },
      { t: "checkpoint" },
      { t: "mspike", side: "ceil", c: 3, period: 2.2, f: 2.4 },
      { t: "saw", at: "floor", r: 28, f: 2.3 },
      { t: "alt", n: 5, c: 2, f: 2.2 },
      { t: "mspike", side: "floor", c: 2, period: 2, f: 2.3 },
      { t: "mspike", side: "ceil", c: 2, period: 2, f: 2.3 },
      { t: "run", n: 1.5 }
    ]
  },
  // ==========================================================================
  // STAGE 2 — TIMING AND PRECISION (21-25)
  // Introduces falling blocks (drop), disappearing platforms (vanish), and
  // moving platforms (plat). Combines two obstacle types at a time.
  // ==========================================================================
  {
    name: "Falling Sky",
    theme: "industrial",
    speed: 1.34,
    gap: 1.65,
    fScale: 0.65,
    tip: "Blocks fall from above \u2014 switch to dodge",
    sections: [
      { t: "run", n: 1.5 },
      { t: "drop", w: 60, h: 44, side: "ceil", f: 3 },
      { t: "run", n: 1 },
      { t: "drop", w: 60, h: 44, side: "ceil", f: 3 },
      { t: "run", n: 1 },
      { t: "alt", n: 3, c: 2, f: 2.5 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "drop", w: 64, h: 46, side: "ceil", f: 2.8 },
      { t: "spike", side: "floor", n: 2, f: 2.4 },
      { t: "drop", w: 64, h: 46, side: "ceil", f: 2.8 },
      { t: "spike", side: "floor", n: 2, f: 2.4 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "drop", w: 66, h: 46, side: "ceil", f: 2.6 },
      { t: "drop", w: 66, h: 46, side: "ceil", f: 2.6 },
      { t: "alt", n: 4, c: 2, f: 2.3 },
      { t: "drop", w: 66, h: 46, side: "floor", f: 2.8 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Vanishing Act",
    theme: "space",
    speed: 1.35,
    gap: 1.63,
    fScale: 0.67,
    tip: "Platforms fade \u2014 don't linger",
    sections: [
      { t: "run", n: 1.5 },
      { t: "vanish", y: 360, w: 160, on: 1.8, off: 1.2, f: 2.6 },
      { t: "spike", side: "floor", n: 2, f: 2.4 },
      { t: "vanish", y: 400, w: 150, on: 1.7, off: 1.3, f: 2.6 },
      { t: "spike", side: "ceil", n: 2, f: 2.4 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "vanish", y: 360, w: 150, on: 1.6, off: 1.2, f: 2.4 },
      { t: "vanish", y: 420, w: 150, on: 1.6, off: 1.2, f: 2.4 },
      { t: "alt", n: 4, c: 2, f: 2.3 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "over", a: { t: "vanish", y: 380, w: 150, on: 1.5, off: 1.1 }, b: { t: "spike", side: "floor", n: 2 }, f: 2.5 },
      { t: "vanish", y: 400, w: 140, on: 1.5, off: 1, f: 2.3 },
      { t: "over", a: { t: "vanish", y: 360, w: 150, on: 1.4, off: 1 }, b: { t: "spike", side: "ceil", n: 2 }, f: 2.5 },
      { t: "alt", n: 4, c: 2, f: 2.2 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Moving Ground",
    theme: "space",
    speed: 1.36,
    gap: 1.61,
    fScale: 0.68,
    tip: "Ride the platforms \u2014 time your landing",
    sections: [
      { t: "run", n: 1.5 },
      { t: "plat", y: 360, amp: 100, period: 3.2, w: 160, f: 2.6 },
      { t: "spike", side: "floor", n: 2, f: 2.3 },
      { t: "plat", y: 420, amp: 90, period: 3, w: 150, f: 2.6 },
      { t: "spike", side: "ceil", n: 2, f: 2.3 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "plat", y: 340, amp: 120, period: 2.8, w: 150, f: 2.5 },
      { t: "drop", w: 60, h: 44, side: "ceil", f: 2.8 },
      { t: "plat", y: 440, amp: 110, period: 2.8, w: 150, f: 2.5 },
      { t: "alt", n: 4, c: 2, f: 2.2 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "plat", y: 360, amp: 140, period: 2.6, w: 140, f: 2.4 },
      { t: "spike", side: "floor", n: 3, f: 2.1 },
      { t: "plat", y: 400, amp: 130, period: 2.6, w: 140, f: 2.4 },
      { t: "spike", side: "ceil", n: 3, f: 2.1 },
      { t: "plat", y: 360, amp: 150, period: 2.4, w: 140, f: 2.4 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Precise Steps",
    theme: "space",
    speed: 1.38,
    gap: 1.59,
    fScale: 0.66,
    tip: "Vanish and fall \u2014 plan your path",
    sections: [
      { t: "run", n: 1.5 },
      { t: "vanish", y: 360, w: 150, on: 1.7, off: 1.2, f: 2.5 },
      { t: "drop", w: 60, h: 44, side: "ceil", f: 2.8 },
      { t: "vanish", y: 420, w: 150, on: 1.6, off: 1.1, f: 2.5 },
      { t: "drop", w: 60, h: 44, side: "ceil", f: 2.8 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "over", a: { t: "vanish", y: 380, w: 150, on: 1.5, off: 1.1 }, b: { t: "drop", w: 60, h: 44, side: "floor" }, f: 2.8 },
      { t: "alt", n: 4, c: 2, f: 2.2 },
      { t: "vanish", y: 360, w: 140, on: 1.4, off: 1, f: 2.3 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "drop", w: 64, h: 46, side: "ceil", f: 2.6 },
      { t: "vanish", y: 400, w: 140, on: 1.4, off: 1, f: 2.3 },
      { t: "drop", w: 64, h: 46, side: "floor", f: 2.6 },
      { t: "vanish", y: 360, w: 140, on: 1.3, off: 0.9, f: 2.2 },
      { t: "alt", n: 4, c: 2, f: 2.1 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Timing Trial",
    theme: "space",
    speed: 1.39,
    gap: 1.57,
    fScale: 0.68,
    tip: "Platforms, vanishes, drops \u2014 stay sharp",
    sections: [
      { t: "run", n: 1.5 },
      { t: "plat", y: 360, amp: 110, period: 3, w: 150, f: 2.5 },
      { t: "vanish", y: 400, w: 150, on: 1.6, off: 1.1, f: 2.4 },
      { t: "drop", w: 60, h: 44, side: "ceil", f: 2.7 },
      { t: "alt", n: 3, c: 2, f: 2.2 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "over", a: { t: "plat", y: 360, amp: 120, period: 2.8, w: 140 }, b: { t: "drop", w: 60, h: 44, side: "floor" }, f: 2.7 },
      { t: "vanish", y: 400, w: 140, on: 1.4, off: 1, f: 2.3 },
      { t: "over", a: { t: "vanish", y: 360, w: 140, on: 1.4, off: 1 }, b: { t: "spike", side: "floor", n: 2 }, f: 2.4 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "plat", y: 380, amp: 130, period: 2.6, w: 140, f: 2.3 },
      { t: "drop", w: 64, h: 46, side: "ceil", f: 2.6 },
      { t: "vanish", y: 420, w: 140, on: 1.3, off: 0.9, f: 2.2 },
      { t: "plat", y: 360, amp: 140, period: 2.4, w: 130, f: 2.3 },
      { t: "alt", n: 4, c: 2, f: 2 },
      { t: "run", n: 1.5 }
    ]
  },
  // ==========================================================================
  // STAGE 3 — ADVANCED CHALLENGES (26-30)
  // Introduces rotating blades (blade), timed laser gates (laser), and gravity
  // tunnels (zone). Longer sequences requiring multiple consecutive switches.
  // ==========================================================================
  {
    name: "Blade Dance",
    theme: "cyber",
    speed: 1.4,
    gap: 1.55,
    fScale: 0.74,
    tip: "Blades sweep \u2014 find the opening",
    sections: [
      { t: "run", n: 1.5 },
      { t: "blade", arm: 110, spin: 0.8, f: 2.4 },
      { t: "spike", side: "floor", n: 2, f: 2.2 },
      { t: "blade", arm: 120, spin: 0.9, f: 2.3 },
      { t: "spike", side: "ceil", n: 2, f: 2.2 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "blade", arm: 120, spin: 0.95, f: 2.2 },
      { t: "saw", at: "floor", r: 26, f: 2.1 },
      { t: "blade", arm: 130, spin: 1, f: 2.2 },
      { t: "saw", at: "ceil", r: 26, f: 2.1 },
      { t: "alt", n: 4, c: 2, f: 2 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "blade", arm: 130, spin: 1.05, f: 2.1 },
      { t: "spike", side: "floor", n: 3, f: 1.95 },
      { t: "blade", arm: 120, spin: 1.1, f: 2.1 },
      { t: "spike", side: "ceil", n: 3, f: 1.95 },
      { t: "blade", arm: 140, spin: 1, f: 2.1 },
      { t: "alt", n: 4, c: 2, f: 1.9 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Laser Grid",
    theme: "cyber",
    speed: 1.42,
    gap: 1.53,
    fScale: 0.73,
    tip: "Lasers pulse \u2014 dash through the dark",
    sections: [
      { t: "run", n: 1.5 },
      { t: "laser", host: "floor", h: 320, on: 1.4, off: 1.2, f: 2.4 },
      { t: "spike", side: "ceil", n: 2, f: 2.2 },
      { t: "laser", host: "ceil", h: 320, on: 1.4, off: 1.2, f: 2.4 },
      { t: "spike", side: "floor", n: 2, f: 2.2 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "laser", host: "floor", h: 340, on: 1.2, off: 1, f: 2.3 },
      { t: "blade", arm: 110, spin: 0.85, f: 2.2 },
      { t: "laser", host: "ceil", h: 340, on: 1.2, off: 1, f: 2.3 },
      { t: "blade", arm: 120, spin: 0.9, f: 2.2 },
      { t: "alt", n: 4, c: 2, f: 2 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "laser", host: "floor", h: 360, on: 1, off: 0.9, f: 2.2 },
      { t: "laser", host: "ceil", h: 360, on: 1, off: 0.9, f: 2.2 },
      { t: "spike", side: "floor", n: 3, f: 1.9 },
      { t: "laser", host: "ceil", h: 360, on: 0.9, off: 0.85, f: 2.2 },
      { t: "alt", n: 5, c: 2, f: 1.85 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Gravity Tunnel",
    theme: "cyber",
    speed: 1.43,
    gap: 1.51,
    fScale: 0.75,
    tip: "Tunnels flip you \u2014 ride the current",
    sections: [
      { t: "run", n: 1.5 },
      { t: "zone", dir: -1, len: 2 },
      { t: "run", n: 1 },
      { t: "spike", side: "floor", n: 3, f: 2.2 },
      { t: "zone", dir: 1, len: 2 },
      { t: "run", n: 1 },
      { t: "spike", side: "ceil", n: 3, f: 2.2 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "zone", dir: -1, len: 2.2 },
      { t: "laser", host: "floor", h: 340, on: 1.2, off: 1, f: 2.3 },
      { t: "zone", dir: 1, len: 2.2 },
      { t: "laser", host: "ceil", h: 340, on: 1.2, off: 1, f: 2.3 },
      { t: "alt", n: 4, c: 2, f: 2 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "zone", dir: -1, len: 2.4 },
      { t: "spike", side: "floor", n: 3, f: 1.95 },
      { t: "zone", dir: 1, len: 2.4 },
      { t: "spike", side: "ceil", n: 3, f: 1.95 },
      { t: "zone", dir: -1, len: 2 },
      { t: "alt", n: 5, c: 2, f: 1.85 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Convergence",
    theme: "cyber",
    speed: 1.44,
    gap: 1.49,
    fScale: 0.73,
    tip: "Blades, lasers, tunnels \u2014 all at once",
    sections: [
      { t: "run", n: 1.5 },
      { t: "blade", arm: 120, spin: 0.9, f: 2.2 },
      { t: "laser", host: "floor", h: 340, on: 1.2, off: 1, f: 2.3 },
      { t: "zone", dir: -1, len: 2 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "over", a: { t: "blade", arm: 130, spin: 1 }, b: { t: "laser", host: "ceil", h: 340, on: 1.1, off: 0.9 }, f: 2.4 },
      { t: "spike", side: "floor", n: 3, f: 1.95 },
      { t: "over", a: { t: "zone", dir: 1, len: 2 }, b: { t: "spike", side: "ceil", n: 2 }, f: 2.3 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "laser", host: "floor", h: 360, on: 1, off: 0.85, f: 2.2 },
      { t: "blade", arm: 130, spin: 1.1, f: 2.1 },
      { t: "zone", dir: -1, len: 2.2 },
      { t: "over", a: { t: "laser", host: "ceil", h: 360, on: 1, off: 0.85 }, b: { t: "spike", side: "floor", n: 2 }, f: 2.3 },
      { t: "alt", n: 5, c: 2, f: 1.8 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Advanced Gauntlet",
    theme: "cyber",
    speed: 1.46,
    gap: 1.47,
    fScale: 0.75,
    tip: "Long sequences \u2014 keep your rhythm",
    sections: [
      { t: "run", n: 1.5 },
      { t: "laser", host: "floor", h: 340, on: 1.1, off: 0.9, f: 2.2 },
      { t: "blade", arm: 120, spin: 0.95, f: 2.1 },
      { t: "zone", dir: -1, len: 2 },
      { t: "alt", n: 4, c: 2, f: 1.9 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "over", a: { t: "laser", host: "floor", h: 360, on: 1, off: 0.85 }, b: { t: "blade", arm: 130, spin: 1.05 }, f: 2.3 },
      { t: "spike", side: "ceil", n: 3, f: 1.9 },
      { t: "over", a: { t: "zone", dir: 1, len: 2 }, b: { t: "spike", side: "floor", n: 2 }, f: 2.2 },
      { t: "laser", host: "ceil", h: 360, on: 1, off: 0.85, f: 2.2 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "blade", arm: 130, spin: 1.1, f: 2 },
      { t: "laser", host: "floor", h: 360, on: 0.9, off: 0.8, f: 2.1 },
      { t: "zone", dir: -1, len: 2.2 },
      { t: "over", a: { t: "blade", arm: 140, spin: 1.15 }, b: { t: "spike", side: "ceil", n: 3 }, f: 2.1 },
      { t: "alt", n: 5, c: 2, f: 1.78 },
      { t: "laser", host: "floor", h: 380, on: 0.85, off: 0.8, f: 2.1 },
      { t: "run", n: 1.5 }
    ]
  },
  // ==========================================================================
  // STAGE 4 — EXPERT LEVELS (31-35)
  // Combines three or more obstacle types into challenging sequences with
  // complex floor-to-ceiling transitions. Requires precision and fast reactions.
  // ==========================================================================
  {
    name: "Chaos Engine",
    theme: "energy",
    speed: 1.48,
    gap: 1.45,
    fScale: 0.7,
    tip: "Spikes, drops, blades \u2014 chaos",
    sections: [
      { t: "run", n: 1.5 },
      { t: "over", a: { t: "mspike", side: "floor", c: 2, period: 2.4 }, b: { t: "drop", w: 60, h: 44, side: "ceil" }, f: 2.6 },
      { t: "blade", arm: 120, spin: 1, f: 2.1 },
      { t: "spike", side: "ceil", n: 3, f: 1.9 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "over", a: { t: "mspike", side: "ceil", c: 2, period: 2.2 }, b: { t: "blade", arm: 130, spin: 1.05 }, f: 2.3 },
      { t: "drop", w: 64, h: 46, side: "floor", f: 2.6 },
      { t: "spike", side: "floor", n: 3, f: 1.9 },
      { t: "over", a: { t: "mspike", side: "floor", c: 3, period: 2 }, b: { t: "spike", side: "ceil", n: 2 }, f: 2.2 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "blade", arm: 140, spin: 1.1, f: 2 },
      { t: "over", a: { t: "drop", w: 66, h: 46, side: "ceil" }, b: { t: "mspike", side: "floor", c: 2, period: 1.8 }, f: 2.5 },
      { t: "alt", n: 5, c: 2, f: 1.75 },
      { t: "blade", arm: 130, spin: 1.15, f: 2 },
      { t: "over", a: { t: "mspike", side: "ceil", c: 3, period: 1.8 }, b: { t: "drop", w: 66, h: 46, side: "floor" }, f: 2.4 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Crushing Depth",
    theme: "energy",
    speed: 1.5,
    gap: 1.43,
    fScale: 0.65,
    tip: "Walls crush \u2014 traps bite",
    sections: [
      { t: "run", n: 1.5 },
      { t: "wall", gap: 150, period: 3, f: 2.8 },
      { t: "crusher", period: 2.8, f: 2.6 },
      { t: "trap", side: "floor", w: 40, f: 2.5 },
      { t: "spike", side: "ceil", n: 2, f: 2 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "over", a: { t: "wall", gap: 140, period: 2.8 }, b: { t: "crusher", period: 2.6 }, f: 2.8 },
      { t: "trap", side: "ceil", w: 40, f: 2.4 },
      { t: "spike", side: "floor", n: 3, f: 1.9 },
      { t: "over", a: { t: "trap", side: "floor", w: 44 }, b: { t: "spike", side: "ceil", n: 2 }, f: 2.3 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "wall", gap: 130, period: 2.6, f: 2.6 },
      { t: "trap", side: "floor", w: 44, f: 2.3 },
      { t: "crusher", period: 2.4, f: 2.5 },
      { t: "over", a: { t: "wall", gap: 130, period: 2.4 }, b: { t: "trap", side: "ceil", w: 44 }, f: 2.6 },
      { t: "alt", n: 5, c: 2, f: 1.72 },
      { t: "over", a: { t: "crusher", period: 2.3 }, b: { t: "trap", side: "floor", w: 44 }, f: 2.6 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Bouncing Madness",
    theme: "energy",
    speed: 1.52,
    gap: 1.41,
    fScale: 0.69,
    tip: "Bounce, blade, laser \u2014 stay alive",
    sections: [
      { t: "run", n: 1.5 },
      { t: "bounce", r: 22, y0: 170, y1: 590, period: 2.6, f: 2.6 },
      { t: "blade", arm: 120, spin: 1, f: 2.1 },
      { t: "laser", host: "floor", h: 340, on: 1.1, off: 0.9, f: 2.2 },
      { t: "spike", side: "ceil", n: 2, f: 1.9 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "over", a: { t: "bounce", r: 22, y0: 160, y1: 600, period: 2.4 }, b: { t: "blade", arm: 130, spin: 1.05 }, f: 2.5 },
      { t: "laser", host: "ceil", h: 340, on: 1, off: 0.85, f: 2.2 },
      { t: "spike", side: "floor", n: 3, f: 1.85 },
      { t: "over", a: { t: "laser", host: "floor", h: 360, on: 1, off: 0.85 }, b: { t: "spike", side: "ceil", n: 2 }, f: 2.2 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "bounce", r: 24, y0: 150, y1: 610, period: 2.2, f: 2.4 },
      { t: "blade", arm: 130, spin: 1.1, f: 2 },
      { t: "over", a: { t: "bounce", r: 24, y0: 160, y1: 600, period: 2 }, b: { t: "laser", host: "ceil", h: 360, on: 0.9, off: 0.8 }, f: 2.4 },
      { t: "alt", n: 5, c: 2, f: 1.7 },
      { t: "bounce", r: 24, y0: 150, y1: 610, period: 2, f: 2.4 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "Singularity Drive",
    theme: "void",
    speed: 1.54,
    gap: 1.39,
    fScale: 0.67,
    tip: "Everything converges \u2014 find the path",
    sections: [
      { t: "run", n: 1.5 },
      { t: "portal", dir: 1, boost: 0.08, y: 380, f: 2.6 },
      { t: "over", a: { t: "mspike", side: "floor", c: 2, period: 2.2 }, b: { t: "drop", w: 64, h: 46, side: "ceil" }, f: 2.5 },
      { t: "over", a: { t: "blade", arm: 130, spin: 1.05 }, b: { t: "laser", host: "floor", h: 360, on: 1, off: 0.85 }, f: 2.3 },
      { t: "alt", n: 4, c: 2, f: 1.85 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "over", a: { t: "wall", gap: 140, period: 2.6 }, b: { t: "bounce", r: 22, y0: 170, y1: 590, period: 2.2 }, f: 2.6 },
      { t: "spike", side: "floor", n: 3, f: 1.85 },
      { t: "over", a: { t: "trap", side: "ceil", w: 44 }, b: { t: "zone", dir: -1, len: 2 }, f: 2.4 },
      { t: "blade", arm: 140, spin: 1.1, f: 2 },
      { t: "run", n: 1 },
      { t: "checkpoint" },
      { t: "over", a: { t: "crusher", period: 2.4 }, b: { t: "mspike", side: "floor", c: 3, period: 1.8 }, f: 2.5 },
      { t: "over", a: { t: "laser", host: "ceil", h: 380, on: 0.9, off: 0.8 }, b: { t: "drop", w: 66, h: 46, side: "floor" }, f: 2.4 },
      { t: "over", a: { t: "wall", gap: 130, period: 2.4 }, b: { t: "blade", arm: 130, spin: 1.15 }, f: 2.4 },
      { t: "alt", n: 5, c: 2, f: 1.68 },
      { t: "over", a: { t: "bounce", r: 24, y0: 150, y1: 610, period: 2 }, b: { t: "trap", side: "floor", w: 44 }, f: 2.4 },
      { t: "run", n: 1.5 }
    ]
  },
  {
    name: "The Final Flip",
    theme: "void",
    speed: 1.56,
    gap: 1.37,
    fScale: 0.64,
    tip: "The ultimate test \u2014 flip to the end",
    sections: [
      { t: "run", n: 1.8 },
      { t: "over", a: { t: "mspike", side: "floor", c: 2, period: 2.2 }, b: { t: "laser", host: "ceil", h: 360, on: 1, off: 0.85 }, f: 2.3 },
      { t: "over", a: { t: "drop", w: 64, h: 46, side: "ceil" }, b: { t: "blade", arm: 130, spin: 1.05 }, f: 2.3 },
      { t: "alt", n: 4, c: 2, f: 1.85 },
      { t: "run", n: 1.2 },
      { t: "checkpoint" },
      { t: "run", n: 1.2 },
      { t: "over", a: { t: "wall", gap: 130, period: 2.6 }, b: { t: "crusher", period: 2.4 }, f: 2.7 },
      { t: "over", a: { t: "bounce", r: 24, y0: 150, y1: 610, period: 2.2 }, b: { t: "trap", side: "floor", w: 44 }, f: 2.4 },
      { t: "zone", dir: -1, len: 2.2 },
      { t: "spike", side: "floor", n: 3, f: 1.82 },
      { t: "run", n: 1.2 },
      { t: "checkpoint" },
      { t: "run", n: 1.2 },
      { t: "over", a: { t: "laser", host: "floor", h: 380, on: 0.9, off: 0.8 }, b: { t: "blade", arm: 140, spin: 1.15 }, f: 2.3 },
      { t: "over", a: { t: "mspike", side: "ceil", c: 3, period: 1.8 }, b: { t: "spike", side: "floor", n: 3 }, f: 2.2 },
      { t: "over", a: { t: "drop", w: 66, h: 46, side: "ceil" }, b: { t: "wall", gap: 130, period: 2.4 }, f: 2.6 },
      { t: "alt", n: 5, c: 2, f: 1.72 },
      { t: "over", a: { t: "trap", side: "ceil", w: 44 }, b: { t: "bounce", r: 24, y0: 160, y1: 600, period: 2 }, f: 2.4 },
      { t: "portal", dir: 1, boost: 0.1, y: 380, f: 2.6 },
      { t: "over", a: { t: "crusher", period: 2.3 }, b: { t: "laser", host: "floor", h: 380, on: 0.85, off: 0.8 }, f: 2.4 },
      { t: "alt", n: 6, c: 2, f: 1.65 },
      { t: "run", n: 1.5 }
    ]
  }
];
var LEVELS = SPECS.map((s, i) => buildLevel(s, i));
var LEVEL_COUNT = LEVELS.length;

// src/game/particles.js
function makeParticle() {
  return {
    alive: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    max: 1,
    size: 3,
    color: "#fff",
    shape: "dot",
    rot: 0,
    vr: 0,
    grav: 0,
    drag: 0,
    add: true,
    r: 0,
    rv: 0,
    w: 2,
    alpha: 1,
    ease: 1
  };
}
var Particles = class {
  constructor(max = 720) {
    this.max = max;
    this.pool = new Array(max);
    for (let i = 0; i < max; i++) this.pool[i] = makeParticle();
    this.cursor = 0;
  }
  clear() {
    for (let i = 0; i < this.max; i++) this.pool[i].alive = false;
    this.cursor = 0;
  }
  spawn(o) {
    const p = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % this.max;
    p.alive = true;
    p.x = o.x;
    p.y = o.y;
    p.vx = o.vx || 0;
    p.vy = o.vy || 0;
    p.max = p.life = o.life || 0.5;
    p.size = o.size || 3;
    p.color = o.color || "#fff";
    p.shape = o.shape || "dot";
    p.rot = o.rot || 0;
    p.vr = o.vr || 0;
    p.grav = o.grav || 0;
    p.drag = o.drag || 0;
    p.add = o.add !== false;
    p.r = o.r || 0;
    p.rv = o.rv || 0;
    p.w = o.w || 2;
    p.alpha = o.alpha == null ? 1 : o.alpha;
    p.ease = o.ease == null ? 1 : o.ease;
    return p;
  }
  burst(x, y, n, o = {}) {
    const spread = o.spread == null ? Math.PI * 2 : o.spread;
    const base = o.angle == null ? 0 : o.angle;
    for (let i = 0; i < n; i++) {
      const a = base + (spread === Math.PI * 2 ? Math.random() * Math.PI * 2 : (Math.random() - 0.5) * spread);
      const sp = (o.speed || 120) * (0.45 + Math.random() * 0.85);
      this.spawn({
        x: x + (Math.random() - 0.5) * (o.jitterX || 6),
        y: y + (Math.random() - 0.5) * (o.jitterY || 6),
        vx: Math.cos(a) * sp + (o.vx || 0),
        vy: Math.sin(a) * sp + (o.vy || 0),
        life: (o.life || 0.45) * (0.7 + Math.random() * 0.6),
        size: (o.size || 4) * (0.6 + Math.random() * 0.8),
        color: Array.isArray(o.color) ? o.color[Math.random() * o.color.length | 0] : o.color,
        shape: o.shape || "dot",
        grav: o.grav || 0,
        drag: o.drag == null ? 1.6 : o.drag,
        add: o.add,
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 10,
        alpha: o.alpha
      });
    }
  }
  ring(x, y, o = {}) {
    this.spawn({
      x,
      y,
      shape: "ring",
      r: o.r || 8,
      rv: o.rv || 320,
      life: o.life || 0.35,
      w: o.w || 4,
      color: o.color || "#fff",
      add: o.add !== false,
      alpha: o.alpha == null ? 0.9 : o.alpha
    });
  }
  update(dt) {
    const pool = this.pool;
    for (let i = 0; i < this.max; i++) {
      const p = pool[i];
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        continue;
      }
      if (p.shape === "ring") {
        p.r += p.rv * dt;
        continue;
      }
      p.vy += p.grav * dt;
      if (p.drag) {
        const d = Math.max(0, 1 - p.drag * dt);
        p.vx *= d;
        p.vy *= d;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
  }
  get count() {
    let n = 0;
    for (let i = 0; i < this.max; i++) if (this.pool[i].alive) n++;
    return n;
  }
};

// src/game/engine.js
var SUB = 1 / 120;
var Engine = class {
  constructor({ sound: sound2, settings: settings2 }) {
    this.sound = sound2;
    this.settings = settings2 || {};
    this.particles = new Particles(760);
    this.trail = [];
    this.state = "intro";
    this.paused = false;
    this.levelIndex = 0;
    this.mode = "career";
    this.px = 0;
    this.py = FLOOR_Y - PLAYER_SIZE;
    this.vy = 0;
    this.dir = 1;
    this.grounded = true;
    this.groundPlat = null;
    this.sx = 1;
    this.sy = 1;
    this.rot = 0;
    this.rotV = 0;
    this.shakeMag = 0;
    this.shakeDur = 1;
    this.shakeT = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.flash = 0;
    this.zoom = 1;
    this.zoomTarget = 1;
    this.timeScale = 1;
    this.hitstop = 0;
    this.dieT = 0;
    this.completeT = 0;
    this.introT = 0;
    this.spawnT = 0;
    this.t = 0;
    this.attemptTime = 0;
    this.deaths = 0;
    this.cpIndex = -1;
    this.speedMult = 1;
    this.gateIndex = 0;
    this.finishReached = false;
    this.stars = 3;
    this.gems = 0;
    this.rush = null;
    this.rushHeld = false;
    this.rushCandidate = null;
    this.gemGroups = {};
    this.ui = { state: "intro", deaths: 0, time: 0, progress: 0, checkpoint: 0, level: 0, gems: 0, rush: false, rushAvailable: false };
  }
  get level() {
    return LEVELS[this.levelIndex];
  }
  get theme() {
    return THEMES[this.level.theme];
  }
  load(index) {
    this.levelIndex = index;
    const L = this.level;
    this.hazards = L.items.filter((i) => i.type === "spike" || i.type === "saw" || i.type === "blade" || i.type === "crusher" || i.type === "laser" || i.type === "mspike" || i.type === "drop" || i.type === "wall" || i.type === "bounce" || i.type === "trap");
    this.solids = L.items.filter((i) => i.type === "plat" || i.type === "vanish");
    this.zones = L.items.filter((i) => i.type === "zone");
    this.portals = L.items.filter((i) => i.type === "portal");
    this.gates = L.items.filter((i) => i.type === "speed");
    this.checkpointItems = L.items.filter((i) => i.type === "checkpoint");
    this.collectibles = L.items.filter((i) => i.type === "gem");
    this.collectibles.forEach((g) => {
      g.collected = false;
    });
    this.buildGemGroups();
    this.rush = null;
    this.rushCandidate = null;
    L.checkpoints.forEach((c) => {
      c.done = false;
    });
    this.deaths = 0;
    this.cpIndex = -1;
    this.particles.clear();
    this.restart(true);
    this.state = "intro";
    this.introT = 0;
    this.timeScale = 0.3;
    this.ui = { state: "intro", deaths: 0, time: 0, progress: 0, checkpoint: 0, level: index };
  }
  restart(full = true) {
    if (full || this.cpIndex < 0) {
      if (full) {
        this.deaths = 0;
        this.cpIndex = -1;
        this.gems = 0;
      }
      this.px = this.level.startX;
      this.dir = 1;
    } else {
      const cp = this.level.checkpoints[this.cpIndex];
      this.px = cp.x - 34;
      this.dir = cp.dir || 1;
      this.gems = cp.gems || 0;
      this.collectibles.forEach((g) => {
        if (g.x >= cp.x) g.collected = false;
      });
    }
    if (this.cpIndex < 0) this.deaths = full ? 0 : this.deaths;
    this.py = this.dir === 1 ? FLOOR_Y - PLAYER_SIZE : CEIL_Y;
    this.vy = 0;
    this.grounded = true;
    this.groundPlat = null;
    this.sx = 1;
    this.sy = 1;
    this.rot = 0;
    this.rotV = 0;
    this.t = 0;
    this.attemptTime = 0;
    this.speedMult = 1;
    this.gateIndex = 0;
    this.finishReached = false;
    this.hitstop = 0;
    this.flash = 0;
    this.shakeMag = 0;
    this.zoom = 1;
    this.zoomTarget = 1;
    this.timeScale = 1;
    this.dieT = 0;
    this.completeT = 0;
    this.trail.length = 0;
    this.particles.clear();
    this.portals.forEach((p) => {
      p.used = false;
    });
    this.solids.forEach((s) => {
      s._ly = void 0;
    });
    this.hazards.forEach((h) => {
      if (h.type === "drop" || h.type === "trap") {
        h._triggered = false;
        h._phase = "idle";
        h._triggerT = 0;
      }
    });
    if (full) this.collectibles.forEach((g) => {
      g.collected = false;
    });
    this.spawnT = 0;
    this.rush = null;
    this.rushCandidate = null;
    if (!full) {
      this.spawnT = 0.42;
      const cx = this.px + PLAYER_SIZE / 2;
      const cy = this.py + PLAYER_SIZE / 2;
      const theme = this.theme;
      this.particles.ring(cx, cy, { r: 5, rv: 460, life: 0.42, color: theme.accent, w: 4 });
      if (!this.settings.reduced) {
        this.particles.burst(cx, cy, 14, { color: [theme.accent, "#ffffff"], speed: 210, size: 3.6, life: 0.5, drag: 2.6, shape: "spark" });
      }
      this.flash = 0.3;
      this.zoomTarget = 1.04;
      this.sound.sfx("spawn");
    }
    this.state = this.state === "intro" ? "intro" : "playing";
    this.syncUi();
  }
  respawn() {
    this.restart(false);
  }
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
    if (mag > this.shakeMag) {
      this.shakeMag = mag;
      this.shakeDur = Math.max(0.08, dur);
      this.shakeT = 0;
    }
  }
  switchGravity() {
    if (this.state !== "playing" && this.state !== "intro") return;
    this.dir = -this.dir;
    this.vy = this.dir * LAUNCH_V;
    this.grounded = false;
    this.groundPlat = null;
    this.sx = 0.76;
    this.sy = 1.3;
    this.rotV = rand(-5, 5);
    const cx = this.px + PLAYER_SIZE / 2;
    const cy = this.py + PLAYER_SIZE / 2;
    const theme = this.theme;
    const reduced = this.settings.reduced;
    this.particles.burst(cx, cy, reduced ? 5 : 14, {
      color: [theme.accent, theme.player, "#ffffff"],
      speed: 215,
      size: 4.4,
      life: 0.42,
      drag: 2.8,
      shape: "spark"
    });
    if (!reduced) {
      this.particles.ring(cx, cy, { r: 7, rv: 330, life: 0.3, color: theme.accent, w: 3 });
      this.particles.burst(cx, cy + this.dir * 14, 5, {
        color: theme.accent,
        speed: 90,
        size: 3,
        life: 0.35,
        add: true,
        angle: this.dir > 0 ? Math.PI / 2 : -Math.PI / 2,
        spread: 1.2
      });
    }
    this.flash = Math.min(1, this.flash + 0.13);
    this.addShake(4.5, 0.16);
    this.sound.sfx("switch");
  }
  die() {
    if (this.state !== "playing" && this.state !== "intro") return;
    this.state = "dying";
    this.dieT = 0;
    this.deaths++;
    this.rush = null;
    this.rushCandidate = null;
    this.hitstop = 0.075;
    this.flash = 0.95;
    this.addShake(17, 0.55);
    this.timeScale = 0.55;
    this.zoomTarget = 1.15;
    this.sound.sfx("death");
    const cx = this.px + PLAYER_SIZE / 2;
    const cy = this.py + PLAYER_SIZE / 2;
    const theme = this.theme;
    const cols = [theme.player, theme.accent, "#ffffff", theme.accent2];
    const n = this.settings.reduced ? 20 : 34;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(150, 640);
      this.particles.spawn({
        x: cx + rand(-11, 11),
        y: cy + rand(-11, 11),
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.65, 1.3),
        size: rand(5, 13),
        color: cols[i % cols.length],
        shape: "frag",
        rot: Math.random() * 6.28,
        vr: rand(-14, 14),
        grav: 1500 * this.dir,
        drag: 0.85,
        add: false
      });
    }
    this.particles.ring(cx, cy, { r: 10, rv: 720, life: 0.34, color: "#ffffff", w: 6 });
    this.particles.ring(cx, cy, { r: 6, rv: 430, life: 0.5, color: theme.accent, w: 4 });
    if (!this.settings.reduced) {
      this.particles.ring(cx, cy, { r: 4, rv: 260, life: 0.65, color: theme.accent2, w: 2 });
      this.particles.burst(cx, cy, 16, { color: ["#ffffff", theme.accent], speed: 330, size: 3.6, life: 0.5, drag: 2.2, shape: "spark" });
    }
    this.syncUi();
  }
  reachFinish() {
    this.finishReached = true;
    this.state = "complete";
    this.completeT = 0;
    this.timeScale = 0.32;
    this.zoomTarget = 1.06;
    this.flash = 0.6;
    this.addShake(10, 0.4);
    this.sound.sfx("complete");
    this.stars = starsFor(this.deaths);
    const theme = this.theme;
    const cx = this.px + PLAYER_SIZE / 2;
    const cy = this.py + PLAYER_SIZE / 2;
    const cols = [theme.accent, theme.accent2, "#ffffff", theme.player];
    for (let i = 0; i < (this.settings.reduced ? 26 : 60); i++) {
      const a = rand(-Math.PI, 0);
      const sp = rand(200, 700);
      this.particles.spawn({
        x: cx,
        y: cy - 20,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.9, 1.8),
        size: rand(4, 10),
        color: cols[i % cols.length],
        shape: i % 3 === 0 ? "frag" : "spark",
        rot: Math.random() * 6.28,
        vr: rand(-12, 12),
        grav: 520,
        drag: 0.5,
        add: i % 3 !== 0
      });
    }
    this.particles.ring(cx, cy, { r: 12, rv: 640, life: 0.6, color: "#ffffff", w: 6 });
    this.particles.ring(cx, cy, { r: 8, rv: 380, life: 0.9, color: theme.accent, w: 3 });
    this.syncUi();
  }
  triggerCheckpoint(i) {
    const cp = this.level.checkpoints[i];
    cp.done = true;
    cp.dir = this.dir;
    cp.gems = this.gems;
    this.cpIndex = i;
    this.sound.sfx("checkpoint");
    this.flash = Math.min(1, this.flash + 0.25);
    this.addShake(5, 0.25);
    const theme = this.theme;
    const cx = this.px + PLAYER_SIZE / 2;
    const cy = this.py + PLAYER_SIZE / 2;
    this.particles.ring(cx, cy, { r: 10, rv: 520, life: 0.45, color: theme.accent, w: 5 });
    this.particles.burst(cx, cy, this.settings.reduced ? 10 : 22, { color: [theme.accent, "#ffffff"], speed: 280, size: 4, life: 0.6, drag: 2.2, shape: "spark" });
    this.syncUi();
  }
  collectGem(gem) {
    gem.collected = true;
    this.gems++;
    this.sound.sfx("gem");
    const theme = this.theme;
    const rushing = !!this.rush;
    this.particles.burst(gem.x, gem.y, rushing ? 14 : 10, {
      color: [theme.accent, "#ffffff", theme.accent2],
      speed: rushing ? 230 : 180,
      size: 3.5,
      life: 0.5,
      drag: 2.5,
      shape: "spark"
    });
    this.particles.ring(gem.x, gem.y, { r: 5, rv: rushing ? 360 : 280, life: 0.35, color: theme.accent, w: 3 });
    this.flash = Math.min(1, this.flash + (rushing ? 0.14 : 0.1));
    if (gem.trigger && gem.groupId != null && !this.rush && this.state === "playing") {
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
      this.sx = 1.32;
      this.sy = 0.7;
      const theme = this.theme;
      const cx = this.px + PLAYER_SIZE / 2;
      const cy = this.dir === 1 ? this.py + PLAYER_SIZE : this.py;
      if (!this.settings.reduced) {
        this.particles.burst(cx, cy, 8, {
          color: [theme.accent, theme.groundTop],
          speed: 150,
          size: 3.4,
          life: 0.3,
          angle: this.dir === 1 ? -Math.PI / 2 : Math.PI / 2,
          spread: 2.4,
          add: true,
          drag: 2.6
        });
        this.particles.ring(cx, cy, { r: 4, rv: 190, life: 0.26, color: theme.accent, w: 2, alpha: 0.6 });
      }
      this.sound.sfx("land");
      this.addShake(Math.min(4.5, impact / 330), 0.13);
    }
  }
  step(h) {
    if (this.rush) {
      this.stepRush(h);
      return;
    }
    const L = this.level;
    const size = PLAYER_SIZE;
    if (this.gateIndex < this.gates.length && this.px >= this.gates[this.gateIndex].x) {
      this.speedMult = this.gates[this.gateIndex].mult;
      this.gateIndex++;
    }
    if (this.grounded && this.groundPlat) {
      const it = this.groundPlat;
      const g = it.type === "vanish" ? vanishGeom(it, this.t) : platGeom(it, this.t);
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
    if (this.state !== "intro") this.px += L.speed * this.speedMult * h;
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
        this.sx = 0.85;
        this.sy = 1.2;
        const cx = this.px + size / 2, cy = this.py + size / 2;
        this.particles.burst(cx, cy, this.settings.reduced ? 6 : 14, { color: [this.theme.accent, "#ffffff"], speed: 190, size: 4, life: 0.5, drag: 2.4, shape: "spark" });
        this.addShake(4, 0.18);
        this.sound.sfx("switch");
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
        this.sx = 0.7;
        this.sy = 1.35;
        this.flash = 0.9;
        this.addShake(9, 0.35);
        this.sound.sfx("portal");
        const cx = this.px + size / 2, cy = this.py + size / 2;
        const theme = this.theme;
        this.particles.ring(cx, cy, { r: 8, rv: 700, life: 0.45, color: "#ffffff", w: 5 });
        this.particles.ring(cx, cy, { r: 14, rv: 420, life: 0.7, color: theme.accent, w: 3 });
        if (!this.settings.reduced) {
          this.particles.burst(cx, cy, 26, { color: [theme.accent, theme.accent2, "#ffffff"], speed: 360, size: 4, life: 0.7, drag: 2, shape: "spark" });
        }
      }
    }
    for (let i = 0; i < this.level.checkpoints.length; i++) {
      const cp = this.level.checkpoints[i];
      if (!cp.done && this.px + size > cp.x) this.triggerCheckpoint(i);
    }
    this.collectGems();
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
      const g = it.type === "vanish" ? vanishGeom(it, this.t) : platGeom(it, this.t);
      it._last = g;
      if (it !== this.groundPlat) it._ly = g.y;
      if (!g.solid) continue;
      if (!(this.px + size - 6 > g.x && this.px + 6 < g.x + g.w)) continue;
      if (this.dir === 1) {
        const pb = prevY + size;
        const nb = this.py + size;
        if (nb >= g.y && pb <= g.y + 8) {
          this.py = g.y - size;
          this.land(it);
        }
      } else {
        const bottom = g.y + g.h;
        if (this.py <= bottom && prevY >= bottom - 8) {
          this.py = bottom;
          this.land(it);
        }
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
        case "spike": {
          const g = spikeGeom(it);
          if (rectHit(bx, by, bw, bh, g.x, g.y, g.w, g.h)) return this.die();
          break;
        }
        case "saw": {
          const g = sawGeom(it, t);
          if (circleHit(g.x, g.y, g.r - 3, bx, by, bw, bh)) return this.die();
          break;
        }
        case "blade": {
          const g = bladeGeom(it, t);
          if (segmentHit(g.x1, g.y1, g.x2, g.y2, bx, by, bw, bh, 7)) return this.die();
          break;
        }
        case "crusher": {
          const g = crusherGeom(it, t);
          if (rectHit(bx, by, bw, bh, g.x - g.w / 2 + 4, g.y + 4, g.w - 8, g.h - 8)) return this.die();
          break;
        }
        case "laser": {
          const g = laserGeom(it, t);
          if (g.active && rectHit(bx, by, bw, bh, g.x + 3, g.y, g.w - 6, g.h)) return this.die();
          break;
        }
        case "mspike": {
          const g = mspikeGeom(it, t);
          if (g.active && rectHit(bx, by, bw, bh, g.x, g.y, g.w, g.h)) return this.die();
          break;
        }
        case "drop": {
          const prev = it._phase;
          const g = dropGeom(it, t, this.px);
          if (prev !== "landed" && g.phase === "landed") {
            this.addShake(8, 0.3);
            this.sound.sfx("land");
            const cx = g.x + g.w / 2;
            const cy = g.fromCeil ? FLOOR_Y : CEIL_Y;
            if (!this.settings.reduced) {
              this.particles.burst(cx, cy, 12, { color: [this.theme.accent, this.theme.groundTop, "#ffffff"], speed: 200, size: 4, life: 0.5, drag: 2.4, angle: g.fromCeil ? -Math.PI / 2 : Math.PI / 2, spread: 2.2 });
              this.particles.ring(cx, cy, { r: 6, rv: 320, life: 0.4, color: this.theme.accent, w: 3 });
            }
          }
          if (g.active && rectHit(bx, by, bw, bh, g.x + 3, g.y + 3, g.w - 6, g.h - 6)) return this.die();
          break;
        }
        case "wall": {
          const g = wallGeom(it, t);
          if (g.topH > 4 && rectHit(bx, by, bw, bh, g.x, CEIL_Y, g.w, g.topH)) return this.die();
          if (g.botH > 4 && rectHit(bx, by, bw, bh, g.x, FLOOR_Y - g.botH, g.w, g.botH)) return this.die();
          break;
        }
        case "bounce": {
          const g = bounceGeom(it, t);
          if (circleHit(g.x, g.y, g.r - 3, bx, by, bw, bh)) return this.die();
          break;
        }
        case "trap": {
          const g = trapGeom(it, t, this.px);
          if (g.active && rectHit(bx, by, bw, bh, g.x, g.y, g.w, g.h)) return this.die();
          break;
        }
        default:
          break;
      }
    }
    return null;
  }
  // ---- Gem Rush: hold to glide along a straight row of 4+ gems ----
  activateRush(groupId) {
    const group = this.gemGroups[groupId];
    if (!group || group.length < 4) return;
    const dir0 = group[0].rowDir || { x: 1, y: 0 };
    const len = Math.hypot(dir0.x, dir0.y) || 1;
    const nx = dir0.x / len, ny = dir0.y / len;
    const sorted = group.slice().sort((a, b) => a.x * nx + a.y * ny - (b.x * nx + b.y * ny));
    let startGem = null;
    for (const g of sorted) {
      if (!g.collected) {
        startGem = g;
        break;
      }
    }
    if (!startGem) return;
    const size = PLAYER_SIZE;
    const cx = this.px + size / 2, cy = this.py + size / 2;
    let s = (cx - startGem.x) * nx + (cy - startGem.y) * ny;
    if (s < 0) s = 0;
    const last = sorted[sorted.length - 1];
    const totalLen = Math.max(1, (last.x - startGem.x) * nx + (last.y - startGem.y) * ny);
    this.rush = { dir: { x: nx, y: ny }, startX: startGem.x, startY: startGem.y, s, totalLen };
    this.rushCandidate = null;
    this.grounded = false;
    this.groundPlat = null;
    this.vy = 0;
    this.sx = 0.8;
    this.sy = 1.2;
    this.sound.sfx("rush");
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
      const g = it.type === "vanish" ? vanishGeom(it, this.t) : platGeom(it, this.t);
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
    r.s += rushSpeed * h;
    const ncx = r.startX + r.dir.x * r.s;
    const ncy = r.startY + r.dir.y * r.s;
    this.px = ncx - size / 2;
    this.py = clamp(ncy - size / 2, CEIL_Y, FLOOR_Y - size);
    if (this.gateIndex < this.gates.length && this.px >= this.gates[this.gateIndex].x) {
      this.speedMult = this.gates[this.gateIndex].mult;
      this.gateIndex++;
    }
    this.collectGems();
    this.checkHazards();
    if (!this.rush || this.state !== "playing") return;
    if (this.solidBlocksRush()) {
      this.endRush();
      return;
    }
    if (r.s >= r.totalLen) {
      this.endRush();
      return;
    }
    if (!this.finishReached && this.px >= this.level.length) this.reachFinish();
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
    if (this.state === "intro") {
      this.introT += dt;
      const k2 = Math.min(1, this.introT / 1.5);
      this.timeScale = 0.3 + 0.7 * k2;
      if (this.introT >= 1.5) {
        this.state = "playing";
        this.timeScale = 1;
        this.attemptTime = 0;
      }
    } else if (this.state === "dying") {
      this.dieT += dt;
      this.timeScale = Math.max(0.05, this.timeScale - dt * 1.8);
      this.zoomTarget = 1.15;
      if (this.dieT > 0.5) {
        this.state = "dead";
      }
    } else if (this.state === "complete") {
      this.completeT += dt;
      this.timeScale = Math.max(0.3, 0.32 + this.completeT * 0.5);
      this.zoomTarget = 1.06;
    }
    const worldDt = dt * this.timeScale;
    if (this.state === "playing" || this.state === "intro" || this.state === "complete") {
      this.t += worldDt;
      if (this.state === "playing") this.attemptTime += worldDt;
      let rem = worldDt;
      let guard = 0;
      while (rem > 5e-4 && guard++ < 12) {
        const h = Math.min(rem, SUB);
        this.step(h);
        rem -= h;
      }
    }
    const k = Math.min(1, dt * 13);
    this.sx += (1 - this.sx) * k;
    this.sy += (1 - this.sy) * k;
    this.rotV *= Math.max(0, 1 - dt * 6);
    const targetRot = this.rush ? clamp(this.rush.dir.y * 0.5, -0.32, 0.32) : clamp(this.vy / 2600, -0.32, 0.32) * this.dir;
    this.rot += (targetRot - this.rot) * Math.min(1, dt * 10) + this.rotV * dt;
    if (this.state === "playing" || this.state === "intro") {
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
      if (k <= 0) {
        this.shakeMag = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      }
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
    this.flash = Math.max(0, this.flash - dt * 2.6);
    this.zoom += (this.zoomTarget - this.zoom) * Math.min(1, dt * 5);
  }
};

// src/game/endlessChunks.js
var ENDLESS_CHUNKS = [
  // ---- easy (tier 0) — Training ----
  [
    { name: "flipflop", sections: [{ t: "run", n: 1 }, { t: "spike", side: "floor", n: 2, f: 3.2 }, { t: "run", n: 0.8 }, { t: "spike", side: "ceil", n: 2, f: 3.2 }, { t: "run", n: 1 }] },
    { name: "alt-easy", sections: [{ t: "run", n: 1 }, { t: "alt", n: 3, c: 2, f: 3 }, { t: "run", n: 1 }] },
    { name: "saw-easy", sections: [{ t: "run", n: 1 }, { t: "saw", at: "floor", r: 24, f: 2.8 }, { t: "run", n: 0.8 }, { t: "saw", at: "ceil", r: 24, f: 2.8 }, { t: "run", n: 1 }] },
    { name: "spikes3", sections: [{ t: "run", n: 1 }, { t: "spike", side: "floor", n: 3, f: 3 }, { t: "run", n: 0.8 }, { t: "spike", side: "ceil", n: 3, f: 3 }, { t: "run", n: 1 }] },
    { name: "gem-run", sections: [{ t: "run", n: 1 }, { t: "gem", y: 560, n: 4, spacing: 0.6 }, { t: "run", n: 1 }] },
    { name: "saw-gem", sections: [{ t: "run", n: 1 }, { t: "over", a: { t: "saw", at: "floor", r: 24 }, b: { t: "gem", y: 200, n: 2, spacing: 0.7 }, f: 2.8 }, { t: "run", n: 1 }] },
    { name: "plat-gem", sections: [{ t: "run", n: 1 }, { t: "plat", y: 460, w: 150, f: 2.6 }, { t: "gem", y: 430, n: 2, spacing: 0.4 }, { t: "run", n: 1 }] },
    { name: "alt-gem", sections: [{ t: "run", n: 1 }, { t: "alt", n: 3, c: 2, f: 3 }, { t: "gem", y: 380, n: 3, spacing: 0.5 }, { t: "run", n: 1 }] },
    { name: "ceil-gem", sections: [{ t: "run", n: 1 }, { t: "spike", side: "floor", n: 3, f: 3 }, { t: "gem", y: 200, n: 3, spacing: 0.5 }, { t: "run", n: 1 }] },
    { name: "mspike-easy", sections: [{ t: "run", n: 1 }, { t: "mspike", side: "floor", c: 2, period: 2.6, on: 0.5, f: 3 }, { t: "run", n: 0.8 }, { t: "mspike", side: "ceil", c: 2, period: 2.6, on: 0.5, phase: 1.3, f: 3 }, { t: "run", n: 1 }] },
    { name: "bounce-easy", sections: [{ t: "run", n: 1 }, { t: "bounce", r: 22, y0: 200, y1: 560, period: 2.8, f: 3 }, { t: "run", n: 1 }] }
  ],
  // ---- medium (tier 1) — Factory ----
  [
    { name: "saw-pair", sections: [{ t: "run", n: 1 }, { t: "saw", at: "floor", r: 26, n: 2, f: 2.6 }, { t: "run", n: 0.8 }, { t: "alt", n: 3, c: 2, f: 2.5 }, { t: "run", n: 1 }] },
    { name: "crusher-blade", sections: [{ t: "run", n: 1 }, { t: "crusher", period: 2.8, f: 3 }, { t: "run", n: 0.8 }, { t: "blade", arm: 110, spin: 0.8, f: 2.5 }, { t: "run", n: 1 }] },
    { name: "laser-spike", sections: [{ t: "run", n: 1 }, { t: "laser", host: "floor", h: 320, on: 1.4, off: 1.2, f: 2.6 }, { t: "run", n: 0.8 }, { t: "spike", side: "ceil", n: 3, f: 2.4 }, { t: "run", n: 1 }] },
    { name: "plat-alt", sections: [{ t: "run", n: 1 }, { t: "plat", y: 360, amp: 90, period: 3.2, w: 150, f: 2.6 }, { t: "run", n: 0.8 }, { t: "alt", n: 4, c: 2, f: 2.4 }, { t: "run", n: 1 }] },
    { name: "vsaw", sections: [{ t: "run", n: 1 }, { t: "saw", move: "v", r: 26, period: 3, f: 3 }, { t: "run", n: 0.8 }, { t: "spike", side: "floor", n: 3, f: 2.4 }, { t: "run", n: 1 }] },
    { name: "gem-weave", sections: [{ t: "run", n: 1 }, { t: "saw", at: "floor", r: 24, f: 2.6 }, { t: "gem", y: 200, n: 2, spacing: 0.5 }, { t: "saw", at: "ceil", r: 24, f: 2.6 }, { t: "gem", y: 560, n: 2, spacing: 0.5 }, { t: "run", n: 1 }] },
    { name: "laser-gem", sections: [{ t: "run", n: 1 }, { t: "over", a: { t: "laser", host: "floor", h: 320, on: 1.4, off: 1.2 }, b: { t: "gem", y: 200, n: 2, spacing: 0.6 }, f: 2.6 }, { t: "run", n: 1 }] },
    { name: "crusher-gem", sections: [{ t: "run", n: 1 }, { t: "over", a: { t: "crusher", period: 2.8 }, b: { t: "gem", y: 560, n: 2, spacing: 0.5 }, f: 3 }, { t: "run", n: 1 }] },
    { name: "narrow-passage", sections: [{ t: "run", n: 1 }, { t: "plat", y: 300, w: 120, f: 2.6 }, { t: "run", n: 0.6 }, { t: "plat", y: 460, w: 120, f: 2.6 }, { t: "run", n: 1 }] },
    { name: "drop-run", sections: [{ t: "run", n: 1 }, { t: "drop", w: 60, h: 44, f: 3 }, { t: "run", n: 0.8 }, { t: "alt", n: 3, c: 2, f: 2.5 }, { t: "run", n: 1 }] },
    { name: "wall-gap", sections: [{ t: "run", n: 1 }, { t: "wall", gap: 160, period: 3, f: 2.8 }, { t: "run", n: 0.8 }, { t: "spike", side: "floor", n: 2, f: 2.5 }, { t: "run", n: 1 }] },
    { name: "trap-floor", sections: [{ t: "run", n: 1 }, { t: "trap", side: "floor", w: 40, f: 2.8 }, { t: "run", n: 0.8 }, { t: "spike", side: "ceil", n: 2, f: 2.5 }, { t: "run", n: 1 }] },
    { name: "bounce-gem", sections: [{ t: "run", n: 1 }, { t: "bounce", r: 22, y0: 200, y1: 560, period: 2.6, f: 2.8 }, { t: "gem", y: 380, n: 2, spacing: 0.5 }, { t: "run", n: 1 }] }
  ],
  // ---- hard (tier 2) — Neon / Space ----
  [
    { name: "over-saw", sections: [{ t: "run", n: 1 }, { t: "over", a: { t: "spike", side: "floor", n: 3 }, b: { t: "saw", at: "ceil", r: 28 }, f: 2.6 }, { t: "run", n: 0.8 }, { t: "blade", arm: 120, spin: 1, f: 2.2 }, { t: "run", n: 1 }] },
    { name: "dual-laser", sections: [{ t: "run", n: 1 }, { t: "laser", host: "floor", h: 340, on: 1.2, off: 1, f: 2.4 }, { t: "run", n: 0.7 }, { t: "laser", host: "ceil", h: 340, on: 1.2, off: 1, f: 2.4 }, { t: "run", n: 1 }] },
    { name: "vanish-alt", sections: [{ t: "run", n: 1 }, { t: "vanish", y: 360, w: 150, on: 1.7, off: 1.2, f: 2.4 }, { t: "run", n: 0.7 }, { t: "alt", n: 4, c: 2, f: 2.1 }, { t: "run", n: 1 }] },
    { name: "crush-vsaw", sections: [{ t: "run", n: 1 }, { t: "crusher", period: 2.6, f: 2.9 }, { t: "run", n: 0.7 }, { t: "saw", move: "v", r: 28, period: 2.8, f: 2.9 }, { t: "run", n: 0.7 }, { t: "spike", side: "ceil", n: 3, f: 2.1 }, { t: "run", n: 1 }] },
    { name: "zone-alt", sections: [{ t: "run", n: 1 }, { t: "zone", dir: -1, len: 1.8 }, { t: "run", n: 0.8 }, { t: "alt", n: 4, c: 2, f: 2 }, { t: "run", n: 1 }] },
    { name: "gem-maze", sections: [{ t: "run", n: 1 }, { t: "plat", y: 280, w: 100, f: 2.4 }, { t: "gem", y: 380, n: 3, spacing: 0.4 }, { t: "plat", y: 480, w: 100, f: 2.4 }, { t: "run", n: 1 }] },
    { name: "blade-gem", sections: [{ t: "run", n: 1 }, { t: "over", a: { t: "blade", arm: 120, spin: 1 }, b: { t: "gem", y: 560, n: 2, spacing: 0.6 }, f: 2.3 }, { t: "run", n: 1 }] },
    { name: "dual-laser-gem", sections: [{ t: "run", n: 1 }, { t: "laser", host: "floor", h: 340, on: 1.2, off: 1, f: 2.4 }, { t: "gem", y: 200, n: 2, spacing: 0.5 }, { t: "laser", host: "ceil", h: 340, on: 1.2, off: 1, f: 2.4 }, { t: "run", n: 1 }] },
    { name: "vanish-gem", sections: [{ t: "run", n: 1 }, { t: "vanish", y: 360, w: 140, on: 1.6, off: 1.1, f: 2.3 }, { t: "gem", y: 330, n: 2, spacing: 0.4 }, { t: "alt", n: 3, c: 2, f: 2.1 }, { t: "run", n: 1 }] },
    { name: "drop-wall", sections: [{ t: "run", n: 1 }, { t: "drop", w: 64, h: 46, f: 2.8 }, { t: "run", n: 0.7 }, { t: "wall", gap: 140, period: 2.8, f: 2.6 }, { t: "run", n: 1 }] },
    { name: "mspike-bounce", sections: [{ t: "run", n: 1 }, { t: "mspike", side: "floor", c: 3, period: 2, on: 0.5, f: 2.4 }, { t: "run", n: 0.7 }, { t: "bounce", r: 24, y0: 170, y1: 590, period: 2.4, f: 2.6 }, { t: "run", n: 1 }] },
    { name: "trap-wall", sections: [{ t: "run", n: 1 }, { t: "trap", side: "floor", w: 44, f: 2.5 }, { t: "run", n: 0.6 }, { t: "wall", gap: 140, period: 2.6, f: 2.6 }, { t: "run", n: 1 }] },
    { name: "hplat-gem", sections: [{ t: "run", n: 1 }, { t: "plat", y: 380, amp: 120, axis: "x", period: 3, w: 140, f: 2.6 }, { t: "gem", y: 350, n: 2, spacing: 0.4 }, { t: "alt", n: 3, c: 2, f: 2.1 }, { t: "run", n: 1 }] }
  ],
  // ---- expert (tier 3) — Extreme ----
  [
    { name: "over-crush", sections: [{ t: "run", n: 1 }, { t: "over", a: { t: "crusher", period: 2.5 }, b: { t: "spike", side: "floor", n: 3 }, f: 2.9 }, { t: "run", n: 0.7 }, { t: "blade", arm: 130, spin: 1.15, f: 2 }, { t: "run", n: 1 }] },
    { name: "laser-saw", sections: [{ t: "run", n: 1 }, { t: "over", a: { t: "laser", host: "floor", h: 360, on: 1, off: 0.9 }, b: { t: "saw", at: "ceil", r: 28 }, f: 2.4 }, { t: "run", n: 0.7 }, { t: "alt", n: 5, c: 2, f: 1.85 }, { t: "run", n: 1 }] },
    { name: "portal-run", sections: [{ t: "run", n: 1 }, { t: "portal", dir: 1, boost: 0.1, y: 380, f: 2.6 }, { t: "run", n: 0.8 }, { t: "saw", move: "v", r: 28, period: 2.6, f: 2.8 }, { t: "run", n: 0.7 }, { t: "spike", side: "ceil", n: 4, f: 1.9 }, { t: "run", n: 1 }] },
    { name: "blade-vanish", sections: [{ t: "run", n: 1 }, { t: "over", a: { t: "blade", arm: 130, spin: 1.2 }, b: { t: "vanish", y: 380, w: 140, on: 1.6, off: 1 }, f: 2.3 }, { t: "run", n: 0.7 }, { t: "crusher", period: 2.4, f: 2.8 }, { t: "run", n: 1 }] },
    { name: "zone-laser", sections: [{ t: "run", n: 1 }, { t: "zone", dir: -1, len: 1.6 }, { t: "run", n: 0.7 }, { t: "over", a: { t: "laser", host: "ceil", h: 360, on: 1, off: 0.85 }, b: { t: "spike", side: "floor", n: 3 }, f: 2.3 }, { t: "run", n: 1 }] },
    { name: "gem-gauntlet", sections: [{ t: "run", n: 1 }, { t: "over", a: { t: "crusher", period: 2.5 }, b: { t: "gem", y: 560, n: 3, spacing: 0.5 }, f: 2.9 }, { t: "run", n: 0.7 }, { t: "over", a: { t: "blade", arm: 125, spin: 1.1 }, b: { t: "gem", y: 200, n: 2, spacing: 0.6 }, f: 2.2 }, { t: "run", n: 1 }] },
    { name: "triple-threat", sections: [{ t: "run", n: 1 }, { t: "crusher", period: 2.5, f: 2.9 }, { t: "run", n: 0.6 }, { t: "blade", arm: 125, spin: 1.1, f: 2.1 }, { t: "run", n: 0.6 }, { t: "saw", move: "v", r: 28, period: 2.6, f: 2.8 }, { t: "run", n: 1 }] },
    { name: "portal-blade", sections: [{ t: "run", n: 1 }, { t: "portal", dir: -1, boost: 0.08, y: 380, f: 2.6 }, { t: "run", n: 0.7 }, { t: "blade", arm: 130, spin: 1.15, f: 2 }, { t: "run", n: 0.6 }, { t: "spike", side: "floor", n: 4, f: 1.85 }, { t: "run", n: 1 }] },
    { name: "laser-vanish-gem", sections: [{ t: "run", n: 1 }, { t: "over", a: { t: "laser", host: "floor", h: 360, on: 1, off: 0.85 }, b: { t: "vanish", y: 380, w: 140, on: 1.5, off: 1 }, f: 2.4 }, { t: "gem", y: 200, n: 2, spacing: 0.5 }, { t: "alt", n: 4, c: 2, f: 1.85 }, { t: "run", n: 1 }] },
    { name: "drop-trap-wall", sections: [{ t: "run", n: 1 }, { t: "drop", w: 66, h: 46, f: 2.8 }, { t: "run", n: 0.6 }, { t: "trap", side: "ceil", w: 44, f: 2.3 }, { t: "run", n: 0.6 }, { t: "wall", gap: 130, period: 2.4, f: 2.6 }, { t: "run", n: 1 }] },
    { name: "bounce-mspike", sections: [{ t: "run", n: 1 }, { t: "bounce", r: 24, y0: 150, y1: 610, period: 2, f: 2.4 }, { t: "run", n: 0.6 }, { t: "mspike", side: "floor", c: 3, period: 1.8, on: 0.55, f: 2.2 }, { t: "alt", n: 4, c: 2, f: 1.9 }, { t: "run", n: 1 }] },
    { name: "wall-drop-gem", sections: [{ t: "run", n: 1 }, { t: "over", a: { t: "wall", gap: 130, period: 2.4 }, b: { t: "gem", y: 380, n: 2, spacing: 0.5 }, f: 2.6 }, { t: "run", n: 0.6 }, { t: "drop", w: 66, h: 46, side: "floor", f: 2.8 }, { t: "run", n: 1 }] }
  ]
];

// src/game/endlessEngine.js
var SECTIONS = [
  { name: "Training", theme: "neon", diffMax: 0.15 },
  { name: "Factory", theme: "industrial", diffMax: 0.35 },
  { name: "Neon", theme: "cyber", diffMax: 0.55 },
  { name: "Space", theme: "space", diffMax: 0.75 },
  { name: "Extreme", theme: "energy", diffMax: 1.01 }
];
var DISTANCE_MILESTONES = [100, 250, 500, 750, 1e3, 1500, 2e3, 3e3, 5e3, 7500, 1e4, 15e3, 2e4, 3e4];
var PX_PER_METER = 10;
var EndlessEngine = class extends Engine {
  constructor({ sound: sound2, settings: settings2 }) {
    super({ sound: sound2, settings: settings2 });
    this.mode = "endless";
    this.levelIndex = -1;
    this.score = 0;
    this.best = 0;
    this.gems = 0;
    this.streakTime = 0;
    this.streak = 1;
    this.maxStreak = 1;
    this._gen = null;
    this._level = null;
    this.milestonesHit = /* @__PURE__ */ new Set();
    this.milestoneEvent = null;
    this.sectionIndex = -1;
    this.sectionName = "";
    this._newBestFired = false;
  }
  get level() {
    return this._level;
  }
  loadEndless(best = 0, skipIntro = false) {
    this.best = best || 0;
    this.score = 0;
    this.gems = 0;
    this.streakTime = 0;
    this.streak = 1;
    this.maxStreak = 1;
    this.milestonesHit = /* @__PURE__ */ new Set();
    this.milestoneEvent = null;
    this.sectionIndex = -1;
    this.sectionName = "";
    this._newBestFired = false;
    const startSpeed = 0.62;
    const step = startSpeed * BASE_SPEED * CROSS_TIME;
    this._gen = {
      x: START_X + step * 3,
      speed: startSpeed,
      gap: 3,
      difficulty: 0,
      items: [],
      chunkCount: 0
    };
    this._level = {
      index: -1,
      name: "Endless",
      theme: SECTIONS[0].theme,
      speed: startSpeed * BASE_SPEED,
      step,
      items: this._gen.items,
      checkpoints: [],
      length: this._gen.x + step * 4,
      startX: START_X,
      noFinish: true,
      hints: 0,
      tip: null
    };
    for (let i = 0; i < 5; i++) this._appendChunk();
    this.load(-1);
    if (skipIntro) {
      this.state = "playing";
      this.introT = 1.5;
      this.timeScale = 1;
      this.attemptTime = 0;
    } else {
      this.state = "intro";
      this.introT = 0;
      this.timeScale = 0.3;
    }
    this._updateSection();
  }
  _sectionForDifficulty(d) {
    for (let i = 0; i < SECTIONS.length; i++) {
      if (d < SECTIONS[i].diffMax) return i;
    }
    return SECTIONS.length - 1;
  }
  _appendChunk() {
    const g = this._gen;
    g.difficulty = clamp((g.x - START_X) / 22e3, 0, 1);
    g.speed = 0.62 + g.difficulty * 0.6;
    g.gap = 3 - g.difficulty * 1.3;
    const sectionIdx = this._sectionForDifficulty(g.difficulty);
    this._level.theme = SECTIONS[sectionIdx].theme;
    this._level.speed = g.speed * BASE_SPEED;
    const step = g.speed * BASE_SPEED * CROSS_TIME;
    this._level.step = step;
    const ctx = { step, gap: g.gap };
    const tier = g.difficulty < 0.25 ? 0 : g.difficulty < 0.55 ? 1 : g.difficulty < 0.85 ? 2 : 3;
    let pickTier = tier;
    const r = Math.random();
    if (r < 0.3 && tier > 0) pickTier = tier - 1;
    else if (r > 0.9 && tier < 3) pickTier = tier + 1;
    const pool = ENDLESS_CHUNKS[pickTier];
    const chunk = pool[Math.floor(Math.random() * pool.length)];
    let x = g.x;
    for (const d of chunk.sections) x = emit(d, x, g.items, ctx);
    this._scatterGems(g.x, x, g.items, step);
    g.x = x;
    g.chunkCount++;
    this._level.length = g.x + step * 4;
    this._rebuild();
  }
  _scatterGems(x0, x1, items, step) {
    const spacing = step * 1.5;
    const lanes = [LANE.floor, LANE.ceil, LANE.mid, LANE.midLow, LANE.midHigh];
    let i = 0;
    for (let cx = x0 + step; cx < x1 - step; cx += spacing, i++) {
      const y = lanes[i % lanes.length];
      if (gemClear(items, cx, y)) items.push({ type: "gem", x: cx, y, r: 13 });
    }
    for (let cx = x0 + step * 3; cx < x1 - step; cx += step * 6) {
      if (Math.random() > 0.5) continue;
      const ly = lanes[Math.floor(Math.random() * 3)];
      if (!gemClear(items, cx, ly)) continue;
      for (let k = -1; k <= 1; k++) {
        const gx = cx + k * step * 0.34;
        if (gemClear(items, gx, ly)) items.push({ type: "gem", x: gx, y: ly, r: 13 });
      }
    }
    for (let cx = x0 + step * 5; cx < x1 - step * 3; cx += step * 6) {
      if (Math.random() > 0.3) continue;
      const count = 4 + Math.floor(Math.random() * 3);
      const spacing2 = step * 0.5;
      const m = Math.floor(cx / step) % 4;
      if (m === 0) placeRow(items, cx, LANE.floor, count, 1, 0, spacing2);
      else if (m === 1) placeRow(items, cx, LANE.ceil, count, 1, 0, spacing2);
      else if (m === 2) placeRow(items, cx, LANE.floor, count, 1, -1, spacing2);
      else placeRow(items, cx, LANE.ceil, count, 1, 1, spacing2);
    }
  }
  _rebuild() {
    const L = this._level;
    this.hazards = L.items.filter((i) => i.type === "spike" || i.type === "saw" || i.type === "blade" || i.type === "crusher" || i.type === "laser" || i.type === "mspike" || i.type === "drop" || i.type === "wall" || i.type === "bounce" || i.type === "trap");
    this.solids = L.items.filter((i) => i.type === "plat" || i.type === "vanish");
    this.zones = L.items.filter((i) => i.type === "zone");
    this.portals = L.items.filter((i) => i.type === "portal");
    this.gates = L.items.filter((i) => i.type === "speed");
    this.collectibles = L.items.filter((i) => i.type === "gem");
    this.buildGemGroups();
  }
  _cull() {
    const items = this._gen.items;
    if (items.length < 160) return;
    const cutX = this.px - 900;
    let changed = false;
    for (let i = 0; i < items.length; i++) {
      if ((items[i].x || 0) < cutX && items[i].type !== "speed") {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    this._gen.items = items.filter((i) => (i.x || 0) >= cutX || i.type === "speed");
    this._level.items = this._gen.items;
    this._rebuild();
  }
  maybeGenerate() {
    const L = this._level;
    if (L.length - this.px < 1600) this._appendChunk();
    this._cull();
  }
  step(h) {
    const prevPx = this.px;
    super.step(h);
    this.maybeGenerate();
    if (this.state === "playing") {
      const distDelta = this.px - prevPx;
      if (distDelta > 0) {
        const diffBonus = 1 + (this._gen ? this._gen.difficulty : 0) * 1.5;
        this.score += distDelta * diffBonus * this.streak * 0.15;
      }
      this.streakTime += h;
      this.streak = 1 + Math.min(this.streakTime / 15, 3);
      this.maxStreak = Math.max(this.maxStreak, this.streak);
    }
    this._checkMilestones();
  }
  reachFinish() {
  }
  _updateSection() {
    const diff = clamp((this.px - START_X) / 22e3, 0, 1);
    const idx = this._sectionForDifficulty(diff);
    if (this.sectionIndex !== idx) {
      this.sectionIndex = idx;
      this.sectionName = SECTIONS[idx].name;
      if (idx > 0) this._fireMilestone(SECTIONS[idx].name.toUpperCase(), "section");
    }
  }
  _checkMilestones() {
    const distM = Math.floor(this.px / PX_PER_METER);
    for (const m of DISTANCE_MILESTONES) {
      if (!this.milestonesHit.has(m) && distM >= m) {
        this.milestonesHit.add(m);
        this._fireMilestone(m.toLocaleString() + " M", "distance");
      }
    }
    this._updateSection();
    if (!this._newBestFired && this.best > 0 && this.score > this.best) {
      this._newBestFired = true;
      this._fireMilestone("NEW BEST!", "best");
      this.sound.sfx("unlock");
    }
  }
  _fireMilestone(text, type) {
    this.milestoneEvent = { text, type, id: Date.now() + Math.random() };
  }
  collectGem(gem) {
    gem.collected = true;
    this.gems++;
    const value = 100 * (1 + (this._gen ? this._gen.difficulty : 0));
    this.score += value;
    this.sound.sfx("gem");
    const theme = this.theme;
    this.particles.burst(gem.x, gem.y, 12, {
      color: [theme.accent, "#ffffff", theme.accent2],
      speed: 200,
      size: 3.5,
      life: 0.5,
      drag: 2.5,
      shape: "spark"
    });
    this.particles.ring(gem.x, gem.y, { r: 5, rv: 300, life: 0.35, color: theme.accent, w: 3 });
    this.flash = Math.min(1, this.flash + 0.12);
    if (gem.trigger && gem.groupId != null && !this.rush && this.state === "playing") {
      this.activateRush(gem.groupId);
    }
  }
  syncUi() {
    super.syncUi();
    this.ui.score = Math.floor(this.score);
    this.ui.distance = Math.floor(this.px / PX_PER_METER);
    this.ui.best = this.best;
    this.ui.gems = this.gems;
    this.ui.streak = this.streak;
    this.ui.maxStreak = this.maxStreak;
    this.ui.sectionName = this.sectionName;
    this.ui.difficulty = this._gen ? this._gen.difficulty : 0;
    this.ui.speed = this._gen ? this._gen.speed : 0.62;
    this.ui.progress = this._gen ? this._gen.difficulty : 0;
  }
};

// app/tmp-test-endless.mjs
console.log("LANE:", JSON.stringify(LANE));
var sound = { init() {
}, resume() {
}, sfx() {
}, setMusicVolume() {
}, setSfxVolume() {
}, startMusic() {
}, stopMusic() {
} };
var settings = { musicVolume: 0.5, sfxVolume: 0.5, shake: true, reducedEffects: false };
var found = 0;
var dumped = false;
for (let run = 0; run < 40; run++) {
  if (dumped) break;
  const eng = new EndlessEngine({ sound, settings });
  eng.loadEndless(0, true);
  for (let i = 0; i < 60; i++) eng._appendChunk();
  const items = eng.level.items;
  const gems = items.filter((it) => it.type === "gem");
  const groups = {};
  for (const g of gems) {
    if (g.groupId != null) (groups[g.groupId] ||= []).push(g);
  }
  for (const [k, gs] of Object.entries(groups)) {
    if (gs.length >= 4 && !gs.find((g) => g.trigger)) {
      found++;
      if (found <= 2) {
        console.log("ALL gems with groupId==" + k + ":");
        gems.filter((g) => g.groupId != null && String(g.groupId) === String(k)).forEach((g) => console.log("   G x=" + g.x.toFixed(0) + " y=" + g.y.toFixed(0) + " r=" + g.r + " trig=" + !!g.trigger));
        console.log("run " + run + ": NO-TRIGGER group " + k + " size " + gs.length + ":");
        gs.forEach((g) => console.log("  x=" + g.x.toFixed(0) + " y=" + g.y.toFixed(0) + " r=" + g.r + " trig=" + !!g.trigger + " rowLen=" + g.rowLen + " dir=" + JSON.stringify(g.rowDir)));
        const xs = gs.map((g) => g.x);
        const lo = Math.min(...xs) - 120, hi = Math.max(...xs) + 120;
        const region = gems.filter((g) => g.x >= lo && g.x <= hi);
        console.log("  ALL gems in x[" + lo.toFixed(0) + "," + hi.toFixed(0) + "]:");
        region.forEach((g) => console.log("    x=" + g.x.toFixed(0) + " y=" + g.y.toFixed(0) + " r=" + g.r + " grp=" + g.groupId + " trig=" + !!g.trigger + " rowLen=" + g.rowLen));
        dumped = true;
      }
    }
  }
}
console.log("total no-trigger rows across 40 runs: " + found);
{
  const eng = new EndlessEngine({ sound, settings });
  eng.loadEndless(0, true);
  for (let i = 0; i < 65; i++) eng._appendChunk();
  const all = eng.level.items.filter((it) => it.type === "gem");
  const withGroup = all.filter((g) => g.groupId != null);
  console.log("RUN0-DBG total gems=" + all.length + " withGroup=" + withGroup.length);
  withGroup.slice(0, 8).forEach((g) => console.log("RUN0-DBG grp val=" + JSON.stringify(g.groupId) + " type=" + typeof g.groupId + " x=" + g.x.toFixed(0) + " y=" + g.y.toFixed(0) + " r=" + g.r + " trig=" + !!g.trigger + " rowLen=" + g.rowLen));
}
