import { BASE_SPEED, CROSS_TIME, START_X, FLOOR_Y, CEIL_Y, MID_Y } from './config';
import { SPIKE_W } from './geom';

// ---- Level composer -------------------------------------------------------
// Levels are described as a list of sections. Every gap is expressed in
// "crossings" (how long the player takes to flip across the corridor), so the
// spacing stays fair as the run speed grows level by level.

export function emit(d, x, out, ctx) {
  const { step, gap } = ctx;
  const f = d.f == null ? gap : d.f;
  switch (d.t) {
    case 'run':
      return x + step * (d.n || 1) * (d.f == null ? 1 : d.f);

    case 'spike': {
      const n = d.n || 2;
      out.push({ type: 'spike', side: d.side || 'floor', x, w: SPIKE_W * n });
      return x + SPIKE_W * n + step * f;
    }

    case 'alt': {
      let side = d.side || 'floor';
      const c = d.c || 2;
      for (let i = 0; i < (d.n || 3); i++) {
        out.push({ type: 'spike', side, x, w: SPIKE_W * c });
        x += SPIKE_W * c + step * f;
        side = side === 'floor' ? 'ceil' : 'floor';
      }
      return x;
    }

    case 'saw': {
      const n = d.n || 1;
      const r = d.r || 26;
      for (let i = 0; i < n; i++) {
        const base = {
          type: 'saw', x, r, spin: d.spin == null ? 3.4 : d.spin,
          phase: (d.phase || 0) + i * 0.6, teeth: 8,
        };
        if (d.move === 'v') {
          base.move = 'v';
          base.y0 = FLOOR_Y - r - 10;
          base.y1 = CEIL_Y + r + 10;
          base.y = (base.y0 + base.y1) / 2;
          base.period = d.period || 2.9;
          base.phase = (d.phase || 0) + i * 0.9;
        } else {
          base.y = d.at === 'ceil' ? CEIL_Y + r * 0.55 : d.at === 'mid' ? MID_Y : FLOOR_Y - r * 0.55;
        }
        out.push(base);
        x += step * f;
      }
      return x;
    }

    case 'blade': {
      for (let i = 0; i < (d.n || 1); i++) {
        out.push({
          type: 'blade', x,
          y: d.at === 'high' ? CEIL_Y + 130 : d.at === 'low' ? FLOOR_Y - 130 : MID_Y,
          arm: d.arm || 120, spin: d.spin || 0.85,
          a0: (d.a0 || 0) + i * 1.2, phase: d.phase || 0,
        });
        x += step * f;
      }
      return x;
    }

    case 'crusher': {
      for (let i = 0; i < (d.n || 1); i++) {
        out.push({
          type: 'crusher', x, w: d.w || 56, side: d.side || 'ceil',
          period: d.period || 2.6, phase: (d.phase || 0) + i * 1.4,
        });
        x += step * f;
      }
      return x;
    }

    case 'laser': {
      for (let i = 0; i < (d.n || 1); i++) {
        out.push({
          type: 'laser', x, host: d.host || 'floor', h: d.h || 330,
          on: d.on || 1.2, off: d.off || 1.0, phase: (d.phase || 0) + i * 0.55,
        });
        x += step * f;
      }
      return x;
    }

    case 'plat': {
      const w = d.w || 150;
      for (let i = 0; i < (d.n || 1); i++) {
        out.push({
          type: 'plat', x: x - w / 2, y: d.y || MID_Y, w,
          amp: d.amp || 0, period: d.period || 3.2, phase: d.phase || 0,
          axis: d.axis || 'y',
        });
        x += step * f;
      }
      return x;
    }

    case 'vanish': {
      const w = d.w || 150;
      for (let i = 0; i < (d.n || 1); i++) {
        out.push({
          type: 'vanish', x: x - w / 2, y: d.y || MID_Y, w,
          on: d.on || 1.8, off: d.off || 1.2, phase: d.phase || 0,
        });
        x += step * f;
      }
      return x;
    }

    case 'zone': {
      const len = step * (d.len || 2);
      out.push({ type: 'zone', x, w: len, dir: d.dir || -1 });
      return x + len + step * 0.45;
    }

    case 'portal': {
      out.push({ type: 'portal', x, y: d.y || MID_Y, dir: d.dir || 1, boost: d.boost || 0.08 });
      return x + step * f;
    }

    case 'speed': {
      out.push({ type: 'speed', x, mult: d.mult || 1.1 });
      return x;
    }

    case 'gem': {
      const n = d.n || 1;
      const spacing = d.spacing || 0.5;
      for (let i = 0; i < n; i++) {
        out.push({ type: 'gem', x: x + i * step * spacing, y: d.y || MID_Y, r: 13 });
      }
      return x + n * step * spacing;
    }

    case 'over': {
      const xa = emit({ ...d.a, f: d.a.f == null ? f : d.a.f }, x, out, ctx);
      const xb = emit({ ...d.b, f: d.b.f == null ? f : d.b.f }, x, out, ctx);
      return Math.max(xa, xb);
    }

    default:
      return x;
  }
}

export function buildLevel(spec, index) {
  const speed = BASE_SPEED * spec.speed;
  const step = speed * CROSS_TIME;
  const items = [];
  const checkpoints = [];
  const ctx = { step, gap: spec.gap };
  // Guarantee a safe runway before the first hazard (the player is frozen
  // during the level intro, so this is the full reaction window). The earliest
  // levels get a longer runway so beginners have more time to react.
  let x = START_X + step * (spec.startRun || 3);

  for (const d of spec.sections) {
    if (d.t === 'checkpoint') {
      const cp = { x, dir: 1, index: checkpoints.length };
      checkpoints.push(cp);
      items.push({ type: 'checkpoint', x, index: cp.index });
      x += step * (d.n || 2);
      continue;
    }
    x = emit(d, x, items, ctx);
  }

  const length = x + step * 2.2;
  // Tag the first few spike hazards as "hint" obstacles in tutorial levels so
  // the renderer can show a subtle switch-gravity arrow over them.
  if (spec.hints) {
    let h = spec.hints;
    for (const it of items) {
      if (it.type === 'spike' && h > 0) { it.hint = true; h--; }
    }
  }
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
    tip: spec.tip || null,
  };
}

const SPECS = [
  // ---------- 1-3 : tutorial / easy ----------
  {
    name: 'First Flip', theme: 'neon', speed: 0.60, gap: 3.0, startRun: 4.5, hints: 5,
    tip: 'Tap or press Space to flip gravity',
    sections: [
      { t: 'run', n: 2 },
      { t: 'spike', side: 'floor', n: 2, f: 3.2 },
      { t: 'run', n: 0.8 },
      { t: 'spike', side: 'ceil', n: 2, f: 3.2 },
      { t: 'run', n: 0.8 },
      { t: 'alt', n: 3, c: 2, f: 3.0 },
      { t: 'run', n: 1 },
      { t: 'checkpoint' },
      { t: 'spike', side: 'floor', n: 3, f: 2.9 },
      { t: 'run', n: 1 },
      { t: 'spike', side: 'ceil', n: 3, f: 2.9 },
      { t: 'run', n: 1 },
      { t: 'checkpoint' },
      { t: 'alt', n: 4, c: 2, f: 2.9 },
      { t: 'run', n: 1.5 },
    ],
  },
  {
    name: 'Higher Ground', theme: 'neon', speed: 0.65, gap: 2.8, startRun: 3.5, hints: 3,
    tip: 'Switch to the opposite wall to dodge spikes',
    sections: [
      { t: 'run', n: 2 },
      { t: 'spike', side: 'floor', n: 4, f: 3.0 },
      { t: 'run', n: 0.8 },
      { t: 'spike', side: 'ceil', n: 4, f: 3.0 },
      { t: 'run', n: 0.8 },
      { t: 'alt', n: 4, c: 3, f: 2.85 },
      { t: 'run', n: 1 },
      { t: 'checkpoint' },
      { t: 'spike', side: 'floor', n: 6, f: 2.7 },
      { t: 'run', n: 0.7 },
      { t: 'spike', side: 'ceil', n: 2, f: 2.7 },
      { t: 'run', n: 0.7 },
      { t: 'alt', n: 5, c: 2, f: 2.8 },
      { t: 'run', n: 0.8 },
      { t: 'checkpoint' },
      { t: 'spike', side: 'floor', n: 3, f: 2.7 },
      { t: 'spike', side: 'ceil', n: 3, f: 2.7 },
      { t: 'alt', n: 4, c: 1, f: 2.8 },
      { t: 'run', n: 1.2 },
    ],
  },
  {
    name: 'Rhythm', theme: 'neon', speed: 0.70, gap: 2.55, hints: 1,
    tip: 'Find the rhythm — flip with the spikes',
    sections: [
      { t: 'run', n: 2 },
      { t: 'alt', n: 6, c: 1, f: 2.6 },
      { t: 'run', n: 0.9 },
      { t: 'spike', side: 'floor', n: 4, f: 2.5 },
      { t: 'run', n: 0.7 },
      { t: 'spike', side: 'ceil', n: 4, f: 2.5 },
      { t: 'run', n: 0.7 },
      { t: 'checkpoint' },
      { t: 'alt', n: 6, c: 2, f: 2.45 },
      { t: 'run', n: 0.9 },
      { t: 'spike', side: 'floor', n: 2, f: 2.5 },
      { t: 'spike', side: 'ceil', n: 2, f: 2.5 },
      { t: 'spike', side: 'floor', n: 2, f: 2.5 },
      { t: 'spike', side: 'ceil', n: 2, f: 2.5 },
      { t: 'run', n: 1.1 },
    ],
  },

  // ---------- 4-6 : medium ----------
  {
    name: 'Sawmill', theme: 'industrial', speed: 0.77, gap: 2.3,
    tip: 'Saws spin — time your passage',
    sections: [
      { t: 'run', n: 1.2 },
      { t: 'saw', at: 'floor', r: 26, n: 2, f: 2.5 },
      { t: 'run', n: 0.9 },
      { t: 'saw', at: 'ceil', r: 26, n: 2, f: 2.5 },
      { t: 'run', n: 0.9 },
      { t: 'alt', n: 3, c: 2, f: 2.45 },
      { t: 'checkpoint' },
      { t: 'saw', at: 'floor', r: 30, n: 1, f: 2.3 },
      { t: 'spike', side: 'ceil', n: 2, f: 2.3 },
      { t: 'saw', at: 'ceil', r: 30, n: 1, f: 2.3 },
      { t: 'spike', side: 'floor', n: 2, f: 2.3 },
      { t: 'alt', n: 3, c: 2, f: 2.4 },
      { t: 'saw', at: 'floor', r: 24, n: 2, f: 2.3 },
      { t: 'run', n: 1 },
    ],
  },
  {
    name: 'Moving Parts', theme: 'industrial', speed: 0.83, gap: 2.15,
    tip: 'Watch the moving blades — find the gap',
    sections: [
      { t: 'run', n: 1.2 },
      { t: 'saw', move: 'v', r: 26, period: 3.0, f: 3.0 },
      { t: 'run', n: 0.9 },
      { t: 'blade', arm: 110, spin: 0.8, f: 2.5 },
      { t: 'run', n: 0.9 },
      { t: 'checkpoint' },
      { t: 'saw', at: 'floor', r: 26, n: 2, f: 2.3 },
      { t: 'saw', at: 'ceil', r: 26, n: 2, f: 2.3 },
      { t: 'saw', move: 'v', r: 28, period: 2.8, f: 2.9 },
      { t: 'blade', arm: 130, spin: 0.95, f: 2.3 },
      { t: 'alt', n: 3, c: 2, f: 2.3 },
      { t: 'saw', at: 'floor', r: 26, f: 2.2 },
      { t: 'spike', side: 'ceil', n: 3, f: 2.2 },
      { t: 'run', n: 1.1 },
    ],
  },
  {
    name: 'Gatekeeper', theme: 'industrial', speed: 0.88, gap: 2.0,
    tip: 'Crushers slam — wait for the gap',
    sections: [
      { t: 'run', n: 1.4 },
      { t: 'crusher', period: 2.9, f: 3.0 },
      { t: 'run', n: 1 },
      { t: 'blade', arm: 115, spin: 0.85, f: 2.2 },
      { t: 'saw', at: 'floor', r: 26, n: 2, f: 2.2 },
      { t: 'checkpoint' },
      { t: 'crusher', period: 2.7, f: 2.9 },
      { t: 'alt', n: 4, c: 2, f: 2.15 },
      { t: 'saw', at: 'ceil', r: 28, n: 2, f: 2.15 },
      { t: 'crusher', period: 2.6, f: 2.8 },
      { t: 'saw', at: 'floor', r: 26, f: 2.1 },
      { t: 'spike', side: 'ceil', n: 2, f: 2.15 },
      { t: 'run', n: 1.2 },
    ],
  },

  // ---------- 7-9 : hard ----------
  {
    name: 'Shifting Ground', theme: 'space', speed: 0.93, gap: 1.95,
    tip: 'Lasers pulse — dash through the gaps',
    sections: [
      { t: 'run', n: 1.2 },
      { t: 'laser', host: 'floor', h: 320, on: 1.6, off: 1.3, f: 2.5 },
      { t: 'saw', at: 'floor', r: 26, f: 2.2 },
      { t: 'plat', y: 360, amp: 110, period: 3.4, w: 160, f: 2.6 },
      { t: 'spike', side: 'floor', n: 3, f: 2.1 },
      { t: 'laser', host: 'ceil', h: 320, on: 1.5, off: 1.2, f: 2.5 },
      { t: 'plat', y: 420, amp: 100, period: 3.2, w: 170, f: 2.6 },
      { t: 'spike', side: 'ceil', n: 3, f: 2.1 },
      { t: 'saw', at: 'ceil', r: 26, f: 2.2 },
      { t: 'alt', n: 3, c: 2, f: 2.1 },
      { t: 'run', n: 1.4 },
      { t: 'checkpoint' },
      { t: 'run', n: 1.4 },
      { t: 'laser', host: 'floor', h: 340, on: 1.3, off: 1.1, f: 2.4 },
      { t: 'plat', y: 380, amp: 130, period: 3.0, w: 150, f: 2.6 },
      { t: 'spike', side: 'floor', n: 4, f: 2.0 },
      { t: 'run', n: 1.2 },
    ],
  },
  {
    name: 'Blackout', theme: 'space', speed: 0.98, gap: 1.9,
    tip: 'Vanish platforms fade — keep moving',
    sections: [
      { t: 'run', n: 1.2 },
      { t: 'vanish', y: 360, w: 160, on: 1.8, off: 1.2, f: 2.3 },
      { t: 'laser', host: 'floor', h: 340, on: 1.2, off: 1.0, f: 2.4 },
      { t: 'over', a: { t: 'vanish', y: 380, w: 150, on: 1.7, off: 1.3 }, b: { t: 'spike', side: 'floor', n: 2 }, f: 2.3 },
      { t: 'saw', move: 'v', r: 26, period: 2.9, f: 3.0 },
      { t: 'laser', host: 'ceil', h: 340, on: 1.1, off: 1.0, f: 2.4 },
      { t: 'over', a: { t: 'vanish', y: 400, w: 160, on: 1.6, off: 1.2 }, b: { t: 'saw', at: 'ceil', r: 28 }, f: 2.4 },
      { t: 'saw', at: 'floor', r: 28, n: 2, f: 2.1 },
      { t: 'alt', n: 4, c: 2, f: 2.0 },
      { t: 'run', n: 1.3 },
      { t: 'checkpoint' },
      { t: 'run', n: 1.3 },
      { t: 'over', a: { t: 'laser', host: 'floor', h: 360, on: 1.2, off: 0.9 }, b: { t: 'vanish', y: 360, w: 150, on: 1.8, off: 1.1 }, f: 2.4 },
      { t: 'spike', side: 'ceil', n: 3, f: 2.0 },
      { t: 'saw', move: 'v', r: 28, period: 2.8, f: 3.0 },
      { t: 'run', n: 1.2 },
    ],
  },
  {
    name: 'Crush Depth', theme: 'space', speed: 1.02, gap: 1.85,
    tip: 'Gravity zones flip you — ride the current',
    sections: [
      { t: 'run', n: 1.4 },
      { t: 'zone', dir: -1, len: 2.2 },
      { t: 'run', n: 1.5 },
      { t: 'crusher', period: 2.7, f: 2.9 },
      { t: 'blade', arm: 120, spin: 0.9, f: 2.2 },
      { t: 'over', a: { t: 'laser', host: 'floor', h: 360, on: 1.2, off: 1.0 }, b: { t: 'saw', at: 'floor', r: 26 }, f: 2.5 },
      { t: 'over', a: { t: 'crusher', period: 2.5 }, b: { t: 'spike', side: 'ceil', n: 2 }, f: 3.0 },
      { t: 'plat', y: 340, amp: 140, period: 3.2, w: 160, f: 2.6 },
      { t: 'zone', dir: 1, len: 2.0 },
      { t: 'run', n: 1 },
      { t: 'saw', move: 'v', r: 28, period: 2.8, f: 3.0 },
      { t: 'alt', n: 4, c: 2, f: 1.95 },
      { t: 'run', n: 1.4 },
      { t: 'checkpoint' },
      { t: 'run', n: 1.4 },
      { t: 'over', a: { t: 'laser', host: 'ceil', h: 380, on: 1.1, off: 0.9 }, b: { t: 'saw', at: 'ceil', r: 30 }, f: 2.5 },
      { t: 'crusher', period: 2.4, f: 2.9 },
      { t: 'alt', n: 4, c: 2, f: 1.9 },
      { t: 'run', n: 1.2 },
    ],
  },

  // ---------- 10-12 : very hard ----------
  {
    name: 'Crossfire', theme: 'cyber', speed: 1.07, gap: 1.8,
    sections: [
      { t: 'run', n: 1.2 },
      { t: 'over', a: { t: 'spike', side: 'floor', n: 3 }, b: { t: 'saw', move: 'v', r: 28, period: 2.9 }, f: 2.9 },
      { t: 'laser', host: 'floor', h: 360, on: 1.2, off: 1.0, f: 2.3 },
      { t: 'plat', y: 360, amp: 120, period: 3.0, w: 160, f: 2.5 },
      { t: 'over', a: { t: 'spike', side: 'ceil', n: 3 }, b: { t: 'saw', at: 'ceil', r: 30 }, f: 2.3 },
      { t: 'blade', arm: 130, spin: 1.1, f: 2.1 },
      { t: 'laser', host: 'ceil', h: 360, on: 1.1, off: 0.9, f: 2.3 },
      { t: 'vanish', y: 380, w: 150, on: 1.7, off: 1.2, f: 2.2 },
      { t: 'saw', move: 'v', r: 30, period: 2.7, f: 3.0 },
      { t: 'alt', n: 5, c: 2, f: 1.9 },
      { t: 'run', n: 1.4 },
      { t: 'checkpoint' },
      { t: 'run', n: 1.4 },
      { t: 'over', a: { t: 'crusher', period: 2.5 }, b: { t: 'spike', side: 'floor', n: 3 }, f: 3.0 },
      { t: 'saw', at: 'floor', r: 28, n: 2, f: 2.0 },
      { t: 'alt', n: 5, c: 2, f: 1.85 },
      { t: 'run', n: 1.2 },
    ],
  },
  {
    name: 'Overload', theme: 'cyber', speed: 1.12, gap: 1.78,
    sections: [
      { t: 'run', n: 1.4 },
      { t: 'over', a: { t: 'crusher', period: 2.6 }, b: { t: 'spike', side: 'floor', n: 2 }, f: 3.0 },
      { t: 'over', a: { t: 'blade', arm: 130, spin: 1.05 }, b: { t: 'vanish', y: 380, w: 150, on: 1.7, off: 1.2 }, f: 2.4 },
      { t: 'saw', move: 'v', r: 28, period: 2.7, f: 3.0 },
      { t: 'over', a: { t: 'laser', host: 'floor', h: 380, on: 1.1, off: 0.9 }, b: { t: 'spike', side: 'ceil', n: 2 }, f: 2.4 },
      { t: 'portal', dir: 1, boost: 0.1, y: MID_Y, f: 2.6 },
      { t: 'saw', at: 'floor', r: 28, n: 3, f: 1.95 },
      { t: 'over', a: { t: 'saw', move: 'v', r: 30, period: 2.6 }, b: { t: 'spike', side: 'floor', n: 3 }, f: 3.0 },
      { t: 'blade', arm: 120, spin: 1.15, f: 2.1 },
      { t: 'alt', n: 6, c: 2, f: 1.8 },
      { t: 'run', n: 1.4 },
      { t: 'checkpoint' },
      { t: 'run', n: 1.4 },
      { t: 'over', a: { t: 'crusher', period: 2.4 }, b: { t: 'laser', host: 'ceil', h: 360, on: 1.0, off: 0.8 }, f: 3.0 },
      { t: 'alt', n: 5, c: 2, f: 1.78 },
      { t: 'run', n: 1.2 },
    ],
  },
  {
    name: 'Pulse', theme: 'cyber', speed: 1.17, gap: 1.75,
    sections: [
      { t: 'run', n: 1.2 },
      { t: 'laser', host: 'floor', h: 380, on: 0.9, off: 0.85, f: 2.2 },
      { t: 'laser', host: 'ceil', h: 380, on: 0.9, off: 0.85, f: 2.2 },
      { t: 'alt', n: 8, c: 1, f: 1.85 },
      { t: 'blade', arm: 130, spin: 1.2, f: 1.95 },
      { t: 'over', a: { t: 'saw', move: 'v', r: 26, period: 2.6 }, b: { t: 'spike', side: 'ceil', n: 2 }, f: 3.0 },
      { t: 'crusher', period: 2.5, f: 2.9 },
      { t: 'vanish', y: 360, w: 150, on: 1.6, off: 1.1, f: 2.1 },
      { t: 'over', a: { t: 'spike', side: 'floor', n: 3 }, b: { t: 'laser', host: 'ceil', h: 360, on: 1.0, off: 0.85 }, f: 2.3 },
      { t: 'alt', n: 4, c: 2, f: 1.8 },
      { t: 'run', n: 1.4 },
      { t: 'checkpoint' },
      { t: 'run', n: 1.4 },
      { t: 'saw', at: 'floor', r: 28, n: 3, f: 1.9 },
      { t: 'over', a: { t: 'blade', arm: 120, spin: 1.25 }, b: { t: 'spike', side: 'floor', n: 3 }, f: 2.1 },
      { t: 'alt', n: 5, c: 2, f: 1.78 },
      { t: 'run', n: 1.2 },
    ],
  },

  // ---------- 13-15 : expert ----------
  {
    name: 'Gauntlet', theme: 'energy', speed: 1.22, gap: 1.73,
    sections: [
      { t: 'run', n: 1.4 },
      { t: 'over', a: { t: 'spike', side: 'floor', n: 3 }, b: { t: 'saw', move: 'v', r: 28, period: 2.7 }, f: 2.9 },
      { t: 'laser', host: 'floor', h: 380, on: 1.0, off: 0.9, f: 2.2 },
      { t: 'blade', arm: 130, spin: 1.1, f: 2.0 },
      { t: 'over', a: { t: 'crusher', period: 2.5 }, b: { t: 'spike', side: 'ceil', n: 3 }, f: 3.0 },
      { t: 'alt', n: 6, c: 2, f: 1.85 },
      { t: 'plat', y: 340, amp: 150, period: 3.0, w: 150, f: 2.5 },
      { t: 'over', a: { t: 'laser', host: 'ceil', h: 380, on: 1.0, off: 0.85 }, b: { t: 'saw', at: 'ceil', r: 30 }, f: 2.4 },
      { t: 'vanish', y: 380, w: 140, on: 1.6, off: 1.1, f: 2.1 },
      { t: 'run', n: 1.4 },
      { t: 'checkpoint' },
      { t: 'run', n: 1.4 },
      { t: 'over', a: { t: 'spike', side: 'floor', n: 4 }, b: { t: 'blade', arm: 120, spin: 1.2 }, f: 2.1 },
      { t: 'saw', move: 'v', r: 30, period: 2.5, f: 2.9 },
      { t: 'over', a: { t: 'crusher', period: 2.4 }, b: { t: 'saw', at: 'floor', r: 26 }, f: 3.0 },
      { t: 'alt', n: 6, c: 2, f: 1.8 },
      { t: 'run', n: 1.4 },
      { t: 'checkpoint' },
      { t: 'run', n: 1.4 },
      { t: 'over', a: { t: 'laser', host: 'floor', h: 400, on: 0.9, off: 0.8 }, b: { t: 'spike', side: 'ceil', n: 3 }, f: 2.3 },
      { t: 'blade', arm: 140, spin: 1.15, f: 2.0 },
      { t: 'alt', n: 5, c: 2, f: 1.75 },
      { t: 'run', n: 1.2 },
    ],
  },
  {
    name: 'Singularity', theme: 'energy', speed: 1.28, gap: 1.70,
    sections: [
      { t: 'run', n: 1.4 },
      { t: 'portal', dir: -1, boost: 0.08, y: 380, f: 2.6 },
      { t: 'over', a: { t: 'saw', move: 'v', r: 28, period: 2.6 }, b: { t: 'spike', side: 'floor', n: 3 }, f: 2.9 },
      { t: 'laser', host: 'ceil', h: 380, on: 1.0, off: 0.8, f: 2.2 },
      { t: 'over', a: { t: 'blade', arm: 135, spin: 1.2 }, b: { t: 'vanish', y: 380, w: 140, on: 1.6, off: 1.0 }, f: 2.3 },
      { t: 'crusher', period: 2.4, f: 2.9 },
      { t: 'alt', n: 8, c: 2, f: 1.8 },
      { t: 'saw', at: 'floor', r: 28, n: 3, f: 1.85 },
      { t: 'over', a: { t: 'laser', host: 'floor', h: 400, on: 0.9, off: 0.8 }, b: { t: 'saw', at: 'floor', r: 26 }, f: 2.3 },
      { t: 'run', n: 1.4 },
      { t: 'checkpoint' },
      { t: 'run', n: 1.4 },
      { t: 'plat', y: 340, amp: 160, period: 2.8, w: 140, f: 2.5 },
      { t: 'over', a: { t: 'crusher', period: 2.3 }, b: { t: 'spike', side: 'ceil', n: 3 }, f: 3.0 },
      { t: 'blade', arm: 145, spin: 1.25, f: 2.1 },
      { t: 'saw', move: 'v', r: 30, period: 2.4, f: 2.9 },
      { t: 'alt', n: 6, c: 2, f: 1.75 },
      { t: 'run', n: 1.2 },
    ],
  },
  {
    name: "Gravity's End", theme: 'void', speed: 1.34, gap: 1.65,
    sections: [
      { t: 'run', n: 1.6 },
      { t: 'alt', n: 4, c: 2, f: 2.4 },
      { t: 'speed', mult: 1.08 },
      { t: 'over', a: { t: 'spike', side: 'floor', n: 4 }, b: { t: 'saw', move: 'v', r: 28, period: 2.6 }, f: 2.8 },
      { t: 'laser', host: 'floor', h: 400, on: 0.95, off: 0.8, f: 2.2 },
      { t: 'over', a: { t: 'crusher', period: 2.4 }, b: { t: 'spike', side: 'ceil', n: 3 }, f: 2.9 },
      { t: 'blade', arm: 130, spin: 1.15, f: 2.0 },
      { t: 'over', a: { t: 'laser', host: 'ceil', h: 380, on: 0.9, off: 0.8 }, b: { t: 'saw', at: 'ceil', r: 30 }, f: 2.3 },
      { t: 'run', n: 1.4 },
      { t: 'checkpoint' },
      { t: 'run', n: 1.4 },
      { t: 'portal', dir: -1, boost: 0.12, y: 360, f: 2.6 },
      { t: 'saw', move: 'v', r: 30, period: 2.4, f: 2.8 },
      { t: 'over', a: { t: 'crusher', period: 2.3 }, b: { t: 'laser', host: 'floor', h: 400, on: 0.9, off: 0.75 }, f: 3.0 },
      { t: 'alt', n: 8, c: 2, f: 1.75 },
      { t: 'over', a: { t: 'blade', arm: 145, spin: 1.25 }, b: { t: 'vanish', y: 380, w: 140, on: 1.5, off: 1.0 }, f: 2.2 },
      { t: 'saw', at: 'floor', r: 28, n: 3, f: 1.8 },
      { t: 'run', n: 1.4 },
      { t: 'checkpoint' },
      { t: 'run', n: 1.4 },
      { t: 'over', a: { t: 'laser', host: 'floor', h: 400, on: 0.9, off: 0.75 }, b: { t: 'spike', side: 'ceil', n: 4 }, f: 2.2 },
      { t: 'over', a: { t: 'crusher', period: 2.2 }, b: { t: 'saw', move: 'v', r: 30, period: 2.3 }, f: 2.9 },
      { t: 'alt', n: 8, c: 2, f: 1.7 },
      { t: 'over', a: { t: 'blade', arm: 150, spin: 1.3 }, b: { t: 'spike', side: 'floor', n: 4 }, f: 2.0 },
      { t: 'portal', dir: 1, boost: 0.1, y: 360, f: 2.6 },
      { t: 'alt', n: 6, c: 2, f: 1.68 },
      { t: 'run', n: 1.4 },
    ],
  },
];

export const LEVELS = SPECS.map((s, i) => buildLevel(s, i));
export const LEVEL_COUNT = LEVELS.length;