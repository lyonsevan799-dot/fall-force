// Chunk definitions for Endless mode. Each chunk is an array of section
// descriptors using the same DSL as Career levels (see levels.js `emit`),
// so spacing and fairness are identical to the hand-authored levels.
// Tiers: 0 easy, 1 medium, 2 hard, 3 expert. Every chunk opens and closes
// with a safe runway so the player always has a readable reaction window.

export const ENDLESS_CHUNKS = [
  // ---- easy ----
  [
    { name: 'flipflop', sections: [{ t: 'run', n: 1 }, { t: 'spike', side: 'floor', n: 2, f: 3.2 }, { t: 'run', n: 0.8 }, { t: 'spike', side: 'ceil', n: 2, f: 3.2 }, { t: 'run', n: 1 }] },
    { name: 'alt-easy', sections: [{ t: 'run', n: 1 }, { t: 'alt', n: 3, c: 2, f: 3.0 }, { t: 'run', n: 1 }] },
    { name: 'saw-easy', sections: [{ t: 'run', n: 1 }, { t: 'saw', at: 'floor', r: 24, f: 2.8 }, { t: 'run', n: 0.8 }, { t: 'saw', at: 'ceil', r: 24, f: 2.8 }, { t: 'run', n: 1 }] },
    { name: 'spikes3', sections: [{ t: 'run', n: 1 }, { t: 'spike', side: 'floor', n: 3, f: 3.0 }, { t: 'run', n: 0.8 }, { t: 'spike', side: 'ceil', n: 3, f: 3.0 }, { t: 'run', n: 1 }] },
  ],
  // ---- medium ----
  [
    { name: 'saw-pair', sections: [{ t: 'run', n: 1 }, { t: 'saw', at: 'floor', r: 26, n: 2, f: 2.6 }, { t: 'run', n: 0.8 }, { t: 'alt', n: 3, c: 2, f: 2.5 }, { t: 'run', n: 1 }] },
    { name: 'crusher-blade', sections: [{ t: 'run', n: 1 }, { t: 'crusher', period: 2.8, f: 3.0 }, { t: 'run', n: 0.8 }, { t: 'blade', arm: 110, spin: 0.8, f: 2.5 }, { t: 'run', n: 1 }] },
    { name: 'laser-spike', sections: [{ t: 'run', n: 1 }, { t: 'laser', host: 'floor', h: 320, on: 1.4, off: 1.2, f: 2.6 }, { t: 'run', n: 0.8 }, { t: 'spike', side: 'ceil', n: 3, f: 2.4 }, { t: 'run', n: 1 }] },
    { name: 'plat-alt', sections: [{ t: 'run', n: 1 }, { t: 'plat', y: 360, amp: 90, period: 3.2, w: 150, f: 2.6 }, { t: 'run', n: 0.8 }, { t: 'alt', n: 4, c: 2, f: 2.4 }, { t: 'run', n: 1 }] },
    { name: 'vsaw', sections: [{ t: 'run', n: 1 }, { t: 'saw', move: 'v', r: 26, period: 3.0, f: 3.0 }, { t: 'run', n: 0.8 }, { t: 'spike', side: 'floor', n: 3, f: 2.4 }, { t: 'run', n: 1 }] },
  ],
  // ---- hard ----
  [
    { name: 'over-saw', sections: [{ t: 'run', n: 1 }, { t: 'over', a: { t: 'spike', side: 'floor', n: 3 }, b: { t: 'saw', at: 'ceil', r: 28 }, f: 2.6 }, { t: 'run', n: 0.8 }, { t: 'blade', arm: 120, spin: 1.0, f: 2.2 }, { t: 'run', n: 1 }] },
    { name: 'dual-laser', sections: [{ t: 'run', n: 1 }, { t: 'laser', host: 'floor', h: 340, on: 1.2, off: 1.0, f: 2.4 }, { t: 'run', n: 0.7 }, { t: 'laser', host: 'ceil', h: 340, on: 1.2, off: 1.0, f: 2.4 }, { t: 'run', n: 1 }] },
    { name: 'vanish-alt', sections: [{ t: 'run', n: 1 }, { t: 'vanish', y: 360, w: 150, on: 1.7, off: 1.2, f: 2.4 }, { t: 'run', n: 0.7 }, { t: 'alt', n: 4, c: 2, f: 2.1 }, { t: 'run', n: 1 }] },
    { name: 'crush-vsaw', sections: [{ t: 'run', n: 1 }, { t: 'crusher', period: 2.6, f: 2.9 }, { t: 'run', n: 0.7 }, { t: 'saw', move: 'v', r: 28, period: 2.8, f: 2.9 }, { t: 'run', n: 0.7 }, { t: 'spike', side: 'ceil', n: 3, f: 2.1 }, { t: 'run', n: 1 }] },
    { name: 'zone-alt', sections: [{ t: 'run', n: 1 }, { t: 'zone', dir: -1, len: 1.8 }, { t: 'run', n: 0.8 }, { t: 'alt', n: 4, c: 2, f: 2.0 }, { t: 'run', n: 1 }] },
  ],
  // ---- expert ----
  [
    { name: 'over-crush', sections: [{ t: 'run', n: 1 }, { t: 'over', a: { t: 'crusher', period: 2.5 }, b: { t: 'spike', side: 'floor', n: 3 }, f: 2.9 }, { t: 'run', n: 0.7 }, { t: 'blade', arm: 130, spin: 1.15, f: 2.0 }, { t: 'run', n: 1 }] },
    { name: 'laser-saw', sections: [{ t: 'run', n: 1 }, { t: 'over', a: { t: 'laser', host: 'floor', h: 360, on: 1.0, off: 0.9 }, b: { t: 'saw', at: 'ceil', r: 28 }, f: 2.4 }, { t: 'run', n: 0.7 }, { t: 'alt', n: 5, c: 2, f: 1.85 }, { t: 'run', n: 1 }] },
    { name: 'portal-run', sections: [{ t: 'run', n: 1 }, { t: 'portal', dir: 1, boost: 0.1, y: 380, f: 2.6 }, { t: 'run', n: 0.8 }, { t: 'saw', move: 'v', r: 28, period: 2.6, f: 2.8 }, { t: 'run', n: 0.7 }, { t: 'spike', side: 'ceil', n: 4, f: 1.9 }, { t: 'run', n: 1 }] },
    { name: 'blade-vanish', sections: [{ t: 'run', n: 1 }, { t: 'over', a: { t: 'blade', arm: 130, spin: 1.2 }, b: { t: 'vanish', y: 380, w: 140, on: 1.6, off: 1.0 }, f: 2.3 }, { t: 'run', n: 0.7 }, { t: 'crusher', period: 2.4, f: 2.8 }, { t: 'run', n: 1 }] },
    { name: 'zone-laser', sections: [{ t: 'run', n: 1 }, { t: 'zone', dir: -1, len: 1.6 }, { t: 'run', n: 0.7 }, { t: 'over', a: { t: 'laser', host: 'ceil', h: 360, on: 1.0, off: 0.85 }, b: { t: 'spike', side: 'floor', n: 3 }, f: 2.3 }, { t: 'run', n: 1 }] },
  ],
];