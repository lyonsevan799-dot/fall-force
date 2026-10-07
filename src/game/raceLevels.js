import { buildLevel } from './levels';

// Short, exciting race tracks (roughly 30-90s). Built with the exact same
// composer as Career levels, so spacing and fairness are identical. The
// 'over' and 'plat' sections create multiple routes and catch-up openings.
const SPECS = [
  {
    name: 'Sprint', theme: 'neon', speed: 0.72, gap: 2.7,
    sections: [
      { t: 'run', n: 2 },
      { t: 'alt', n: 4, c: 2, f: 2.8 },
      { t: 'run', n: 1 },
      { t: 'saw', at: 'floor', r: 24, f: 2.6 },
      { t: 'run', n: 0.8 },
      { t: 'saw', at: 'ceil', r: 24, f: 2.6 },
      { t: 'run', n: 1 },
      { t: 'spike', side: 'floor', n: 3, f: 2.7 },
      { t: 'run', n: 0.8 },
      { t: 'spike', side: 'ceil', n: 3, f: 2.7 },
      { t: 'run', n: 1 },
      { t: 'alt', n: 5, c: 2, f: 2.6 },
      { t: 'run', n: 1.4 },
    ],
  },
  {
    name: 'Duel', theme: 'industrial', speed: 0.80, gap: 2.4,
    sections: [
      { t: 'run', n: 1.6 },
      { t: 'saw', at: 'floor', r: 26, n: 2, f: 2.5 },
      { t: 'run', n: 0.8 },
      { t: 'crusher', period: 2.8, f: 2.9 },
      { t: 'run', n: 0.8 },
      { t: 'blade', arm: 110, spin: 0.85, f: 2.3 },
      { t: 'run', n: 0.8 },
      { t: 'alt', n: 4, c: 2, f: 2.3 },
      { t: 'run', n: 0.8 },
      { t: 'saw', at: 'ceil', r: 26, n: 2, f: 2.3 },
      { t: 'run', n: 0.8 },
      { t: 'spike', side: 'floor', n: 3, f: 2.3 },
      { t: 'spike', side: 'ceil', n: 3, f: 2.3 },
      { t: 'run', n: 1.4 },
    ],
  },
  {
    name: 'Crossroads', theme: 'cyber', speed: 0.86, gap: 2.2,
    sections: [
      { t: 'run', n: 1.6 },
      { t: 'over', a: { t: 'spike', side: 'floor', n: 3 }, b: { t: 'saw', at: 'ceil', r: 28 }, f: 2.7 },
      { t: 'run', n: 0.8 },
      { t: 'plat', y: 360, amp: 100, period: 3.2, w: 160, f: 2.6 },
      { t: 'run', n: 0.8 },
      { t: 'laser', host: 'floor', h: 320, on: 1.3, off: 1.1, f: 2.5 },
      { t: 'run', n: 0.8 },
      { t: 'alt', n: 5, c: 2, f: 2.2 },
      { t: 'run', n: 0.8 },
      { t: 'blade', arm: 120, spin: 1.0, f: 2.1 },
      { t: 'run', n: 0.8 },
      { t: 'vanish', y: 360, w: 150, on: 1.7, off: 1.2, f: 2.3 },
      { t: 'run', n: 1.4 },
    ],
  },
  {
    name: 'Final Dash', theme: 'energy', speed: 0.92, gap: 2.05,
    sections: [
      { t: 'run', n: 1.6 },
      { t: 'crusher', period: 2.6, f: 2.8 },
      { t: 'run', n: 0.7 },
      { t: 'over', a: { t: 'saw', at: 'floor', r: 26 }, b: { t: 'spike', side: 'ceil', n: 3 }, f: 2.5 },
      { t: 'run', n: 0.7 },
      { t: 'blade', arm: 125, spin: 1.05, f: 2.1 },
      { t: 'run', n: 0.7 },
      { t: 'laser', host: 'ceil', h: 340, on: 1.2, off: 1.0, f: 2.3 },
      { t: 'run', n: 0.7 },
      { t: 'alt', n: 6, c: 2, f: 2.0 },
      { t: 'run', n: 0.7 },
      { t: 'saw', move: 'v', r: 28, period: 2.8, f: 2.9 },
      { t: 'run', n: 0.7 },
      { t: 'spike', side: 'floor', n: 3, f: 2.0 },
      { t: 'spike', side: 'ceil', n: 3, f: 2.0 },
      { t: 'run', n: 1.4 },
    ],
  },
];

export const RACE_LEVELS = SPECS.map((s, i) => buildLevel(s, i));
export const RACE_COUNT = RACE_LEVELS.length;