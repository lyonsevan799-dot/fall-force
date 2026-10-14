// Chunk definitions for Endless mode. Each chunk is an array of section
// descriptors using the same DSL as Career levels (see levels.js `emit`),
// so spacing and fairness are identical to the hand-authored levels.
// Tiers: 0 easy, 1 medium, 2 hard, 3 expert. Every chunk opens and closes
// with a safe runway so the player always has a readable reaction window.
// Gems (collectibles) are placed for risk/reward — often on the opposite
// side from a hazard, or in a gap the player must time.

export const ENDLESS_CHUNKS = [
  // ---- easy (tier 0) — Training ----
  [
    { name: 'flipflop', sections: [{ t: 'run', n: 1 }, { t: 'spike', side: 'floor', n: 2, f: 3.2 }, { t: 'run', n: 0.8 }, { t: 'spike', side: 'ceil', n: 2, f: 3.2 }, { t: 'run', n: 1 }] },
    { name: 'alt-easy', sections: [{ t: 'run', n: 1 }, { t: 'alt', n: 3, c: 2, f: 3.0 }, { t: 'run', n: 1 }] },
    { name: 'saw-easy', sections: [{ t: 'run', n: 1 }, { t: 'saw', at: 'floor', r: 24, f: 2.8 }, { t: 'run', n: 0.8 }, { t: 'saw', at: 'ceil', r: 24, f: 2.8 }, { t: 'run', n: 1 }] },
    { name: 'spikes3', sections: [{ t: 'run', n: 1 }, { t: 'spike', side: 'floor', n: 3, f: 3.0 }, { t: 'run', n: 0.8 }, { t: 'spike', side: 'ceil', n: 3, f: 3.0 }, { t: 'run', n: 1 }] },
    { name: 'gem-run', sections: [{ t: 'run', n: 1 }, { t: 'gem', y: 560, n: 4, spacing: 0.6 }, { t: 'run', n: 1 }] },
    { name: 'saw-gem', sections: [{ t: 'run', n: 1 }, { t: 'over', a: { t: 'saw', at: 'floor', r: 24 }, b: { t: 'gem', y: 200, n: 2, spacing: 0.7 }, f: 2.8 }, { t: 'run', n: 1 }] },
    { name: 'plat-gem', sections: [{ t: 'run', n: 1 }, { t: 'plat', y: 460, w: 150, f: 2.6 }, { t: 'gem', y: 430, n: 2, spacing: 0.4 }, { t: 'run', n: 1 }] },
    { name: 'alt-gem', sections: [{ t: 'run', n: 1 }, { t: 'alt', n: 3, c: 2, f: 3.0 }, { t: 'gem', y: 380, n: 3, spacing: 0.5 }, { t: 'run', n: 1 }] },
    { name: 'ceil-gem', sections: [{ t: 'run', n: 1 }, { t: 'spike', side: 'floor', n: 3, f: 3.0 }, { t: 'gem', y: 200, n: 3, spacing: 0.5 }, { t: 'run', n: 1 }] },
    { name: 'mspike-easy', sections: [{ t: 'run', n: 1 }, { t: 'mspike', side: 'floor', c: 2, period: 2.6, on: 0.5, f: 3.0 }, { t: 'run', n: 0.8 }, { t: 'mspike', side: 'ceil', c: 2, period: 2.6, on: 0.5, phase: 1.3, f: 3.0 }, { t: 'run', n: 1 }] },
    { name: 'bounce-easy', sections: [{ t: 'run', n: 1 }, { t: 'bounce', r: 22, y0: 200, y1: 560, period: 2.8, f: 3.0 }, { t: 'run', n: 1 }] },
  ],

  // ---- medium (tier 1) — Factory ----
  [
    { name: 'saw-pair', sections: [{ t: 'run', n: 1 }, { t: 'saw', at: 'floor', r: 26, n: 2, f: 2.6 }, { t: 'run', n: 0.8 }, { t: 'alt', n: 3, c: 2, f: 2.5 }, { t: 'run', n: 1 }] },
    { name: 'crusher-blade', sections: [{ t: 'run', n: 1 }, { t: 'crusher', period: 2.8, f: 3.0 }, { t: 'run', n: 0.8 }, { t: 'blade', arm: 110, spin: 0.8, f: 2.5 }, { t: 'run', n: 1 }] },
    { name: 'laser-spike', sections: [{ t: 'run', n: 1 }, { t: 'laser', host: 'floor', h: 320, on: 1.4, off: 1.2, f: 2.6 }, { t: 'run', n: 0.8 }, { t: 'spike', side: 'ceil', n: 3, f: 2.4 }, { t: 'run', n: 1 }] },
    { name: 'plat-alt', sections: [{ t: 'run', n: 1 }, { t: 'plat', y: 360, amp: 90, period: 3.2, w: 150, f: 2.6 }, { t: 'run', n: 0.8 }, { t: 'alt', n: 4, c: 2, f: 2.4 }, { t: 'run', n: 1 }] },
    { name: 'vsaw', sections: [{ t: 'run', n: 1 }, { t: 'saw', move: 'v', r: 26, period: 3.0, f: 3.0 }, { t: 'run', n: 0.8 }, { t: 'spike', side: 'floor', n: 3, f: 2.4 }, { t: 'run', n: 1 }] },
    { name: 'gem-weave', sections: [{ t: 'run', n: 1 }, { t: 'saw', at: 'floor', r: 24, f: 2.6 }, { t: 'gem', y: 200, n: 2, spacing: 0.5 }, { t: 'saw', at: 'ceil', r: 24, f: 2.6 }, { t: 'gem', y: 560, n: 2, spacing: 0.5 }, { t: 'run', n: 1 }] },
    { name: 'laser-gem', sections: [{ t: 'run', n: 1 }, { t: 'over', a: { t: 'laser', host: 'floor', h: 320, on: 1.4, off: 1.2 }, b: { t: 'gem', y: 200, n: 2, spacing: 0.6 }, f: 2.6 }, { t: 'run', n: 1 }] },
    { name: 'crusher-gem', sections: [{ t: 'run', n: 1 }, { t: 'over', a: { t: 'crusher', period: 2.8 }, b: { t: 'gem', y: 560, n: 2, spacing: 0.5 }, f: 3.0 }, { t: 'run', n: 1 }] },
    { name: 'narrow-passage', sections: [{ t: 'run', n: 1 }, { t: 'plat', y: 300, w: 120, f: 2.6 }, { t: 'run', n: 0.6 }, { t: 'plat', y: 460, w: 120, f: 2.6 }, { t: 'run', n: 1 }] },
    { name: 'drop-run', sections: [{ t: 'run', n: 1 }, { t: 'drop', w: 60, h: 44, f: 3.0 }, { t: 'run', n: 0.8 }, { t: 'alt', n: 3, c: 2, f: 2.5 }, { t: 'run', n: 1 }] },
    { name: 'wall-gap', sections: [{ t: 'run', n: 1 }, { t: 'wall', gap: 160, period: 3.0, f: 2.8 }, { t: 'run', n: 0.8 }, { t: 'spike', side: 'floor', n: 2, f: 2.5 }, { t: 'run', n: 1 }] },
    { name: 'trap-floor', sections: [{ t: 'run', n: 1 }, { t: 'trap', side: 'floor', w: 40, f: 2.8 }, { t: 'run', n: 0.8 }, { t: 'spike', side: 'ceil', n: 2, f: 2.5 }, { t: 'run', n: 1 }] },
    { name: 'bounce-gem', sections: [{ t: 'run', n: 1 }, { t: 'bounce', r: 22, y0: 200, y1: 560, period: 2.6, f: 2.8 }, { t: 'gem', y: 380, n: 2, spacing: 0.5 }, { t: 'run', n: 1 }] },
  ],

  // ---- hard (tier 2) — Neon / Space ----
  [
    { name: 'over-saw', sections: [{ t: 'run', n: 1 }, { t: 'over', a: { t: 'spike', side: 'floor', n: 3 }, b: { t: 'saw', at: 'ceil', r: 28 }, f: 2.6 }, { t: 'run', n: 0.8 }, { t: 'blade', arm: 120, spin: 1.0, f: 2.2 }, { t: 'run', n: 1 }] },
    { name: 'dual-laser', sections: [{ t: 'run', n: 1 }, { t: 'laser', host: 'floor', h: 340, on: 1.2, off: 1.0, f: 2.4 }, { t: 'run', n: 0.7 }, { t: 'laser', host: 'ceil', h: 340, on: 1.2, off: 1.0, f: 2.4 }, { t: 'run', n: 1 }] },
    { name: 'vanish-alt', sections: [{ t: 'run', n: 1 }, { t: 'vanish', y: 360, w: 150, on: 1.7, off: 1.2, f: 2.4 }, { t: 'run', n: 0.7 }, { t: 'alt', n: 4, c: 2, f: 2.1 }, { t: 'run', n: 1 }] },
    { name: 'crush-vsaw', sections: [{ t: 'run', n: 1 }, { t: 'crusher', period: 2.6, f: 2.9 }, { t: 'run', n: 0.7 }, { t: 'saw', move: 'v', r: 28, period: 2.8, f: 2.9 }, { t: 'run', n: 0.7 }, { t: 'spike', side: 'ceil', n: 3, f: 2.1 }, { t: 'run', n: 1 }] },
    { name: 'zone-alt', sections: [{ t: 'run', n: 1 }, { t: 'zone', dir: -1, len: 1.8 }, { t: 'run', n: 0.8 }, { t: 'alt', n: 4, c: 2, f: 2.0 }, { t: 'run', n: 1 }] },
    { name: 'gem-maze', sections: [{ t: 'run', n: 1 }, { t: 'plat', y: 280, w: 100, f: 2.4 }, { t: 'gem', y: 380, n: 3, spacing: 0.4 }, { t: 'plat', y: 480, w: 100, f: 2.4 }, { t: 'run', n: 1 }] },
    { name: 'blade-gem', sections: [{ t: 'run', n: 1 }, { t: 'over', a: { t: 'blade', arm: 120, spin: 1.0 }, b: { t: 'gem', y: 560, n: 2, spacing: 0.6 }, f: 2.3 }, { t: 'run', n: 1 }] },
    { name: 'dual-laser-gem', sections: [{ t: 'run', n: 1 }, { t: 'laser', host: 'floor', h: 340, on: 1.2, off: 1.0, f: 2.4 }, { t: 'gem', y: 200, n: 2, spacing: 0.5 }, { t: 'laser', host: 'ceil', h: 340, on: 1.2, off: 1.0, f: 2.4 }, { t: 'run', n: 1 }] },
    { name: 'vanish-gem', sections: [{ t: 'run', n: 1 }, { t: 'vanish', y: 360, w: 140, on: 1.6, off: 1.1, f: 2.3 }, { t: 'gem', y: 330, n: 2, spacing: 0.4 }, { t: 'alt', n: 3, c: 2, f: 2.1 }, { t: 'run', n: 1 }] },
    { name: 'drop-wall', sections: [{ t: 'run', n: 1 }, { t: 'drop', w: 64, h: 46, f: 2.8 }, { t: 'run', n: 0.7 }, { t: 'wall', gap: 140, period: 2.8, f: 2.6 }, { t: 'run', n: 1 }] },
    { name: 'mspike-bounce', sections: [{ t: 'run', n: 1 }, { t: 'mspike', side: 'floor', c: 3, period: 2.0, on: 0.5, f: 2.4 }, { t: 'run', n: 0.7 }, { t: 'bounce', r: 24, y0: 170, y1: 590, period: 2.4, f: 2.6 }, { t: 'run', n: 1 }] },
    { name: 'trap-wall', sections: [{ t: 'run', n: 1 }, { t: 'trap', side: 'floor', w: 44, f: 2.5 }, { t: 'run', n: 0.6 }, { t: 'wall', gap: 140, period: 2.6, f: 2.6 }, { t: 'run', n: 1 }] },
    { name: 'hplat-gem', sections: [{ t: 'run', n: 1 }, { t: 'plat', y: 380, amp: 120, axis: 'x', period: 3.0, w: 140, f: 2.6 }, { t: 'gem', y: 350, n: 2, spacing: 0.4 }, { t: 'alt', n: 3, c: 2, f: 2.1 }, { t: 'run', n: 1 }] },
  ],

  // ---- expert (tier 3) — Extreme ----
  [
    { name: 'over-crush', sections: [{ t: 'run', n: 1 }, { t: 'over', a: { t: 'crusher', period: 2.5 }, b: { t: 'spike', side: 'floor', n: 3 }, f: 2.9 }, { t: 'run', n: 0.7 }, { t: 'blade', arm: 130, spin: 1.15, f: 2.0 }, { t: 'run', n: 1 }] },
    { name: 'laser-saw', sections: [{ t: 'run', n: 1 }, { t: 'over', a: { t: 'laser', host: 'floor', h: 360, on: 1.0, off: 0.9 }, b: { t: 'saw', at: 'ceil', r: 28 }, f: 2.4 }, { t: 'run', n: 0.7 }, { t: 'alt', n: 5, c: 2, f: 1.85 }, { t: 'run', n: 1 }] },
    { name: 'portal-run', sections: [{ t: 'run', n: 1 }, { t: 'portal', dir: 1, boost: 0.1, y: 380, f: 2.6 }, { t: 'run', n: 0.8 }, { t: 'saw', move: 'v', r: 28, period: 2.6, f: 2.8 }, { t: 'run', n: 0.7 }, { t: 'spike', side: 'ceil', n: 4, f: 1.9 }, { t: 'run', n: 1 }] },
    { name: 'blade-vanish', sections: [{ t: 'run', n: 1 }, { t: 'over', a: { t: 'blade', arm: 130, spin: 1.2 }, b: { t: 'vanish', y: 380, w: 140, on: 1.6, off: 1.0 }, f: 2.3 }, { t: 'run', n: 0.7 }, { t: 'crusher', period: 2.4, f: 2.8 }, { t: 'run', n: 1 }] },
    { name: 'zone-laser', sections: [{ t: 'run', n: 1 }, { t: 'zone', dir: -1, len: 1.6 }, { t: 'run', n: 0.7 }, { t: 'over', a: { t: 'laser', host: 'ceil', h: 360, on: 1.0, off: 0.85 }, b: { t: 'spike', side: 'floor', n: 3 }, f: 2.3 }, { t: 'run', n: 1 }] },
    { name: 'gem-gauntlet', sections: [{ t: 'run', n: 1 }, { t: 'over', a: { t: 'crusher', period: 2.5 }, b: { t: 'gem', y: 560, n: 3, spacing: 0.5 }, f: 2.9 }, { t: 'run', n: 0.7 }, { t: 'over', a: { t: 'blade', arm: 125, spin: 1.1 }, b: { t: 'gem', y: 200, n: 2, spacing: 0.6 }, f: 2.2 }, { t: 'run', n: 1 }] },
    { name: 'triple-threat', sections: [{ t: 'run', n: 1 }, { t: 'crusher', period: 2.5, f: 2.9 }, { t: 'run', n: 0.6 }, { t: 'blade', arm: 125, spin: 1.1, f: 2.1 }, { t: 'run', n: 0.6 }, { t: 'saw', move: 'v', r: 28, period: 2.6, f: 2.8 }, { t: 'run', n: 1 }] },
    { name: 'portal-blade', sections: [{ t: 'run', n: 1 }, { t: 'portal', dir: -1, boost: 0.08, y: 380, f: 2.6 }, { t: 'run', n: 0.7 }, { t: 'blade', arm: 130, spin: 1.15, f: 2.0 }, { t: 'run', n: 0.6 }, { t: 'spike', side: 'floor', n: 4, f: 1.85 }, { t: 'run', n: 1 }] },
    { name: 'laser-vanish-gem', sections: [{ t: 'run', n: 1 }, { t: 'over', a: { t: 'laser', host: 'floor', h: 360, on: 1.0, off: 0.85 }, b: { t: 'vanish', y: 380, w: 140, on: 1.5, off: 1.0 }, f: 2.4 }, { t: 'gem', y: 200, n: 2, spacing: 0.5 }, { t: 'alt', n: 4, c: 2, f: 1.85 }, { t: 'run', n: 1 }] },
    { name: 'drop-trap-wall', sections: [{ t: 'run', n: 1 }, { t: 'drop', w: 66, h: 46, f: 2.8 }, { t: 'run', n: 0.6 }, { t: 'trap', side: 'ceil', w: 44, f: 2.3 }, { t: 'run', n: 0.6 }, { t: 'wall', gap: 130, period: 2.4, f: 2.6 }, { t: 'run', n: 1 }] },
    { name: 'bounce-mspike', sections: [{ t: 'run', n: 1 }, { t: 'bounce', r: 24, y0: 150, y1: 610, period: 2.0, f: 2.4 }, { t: 'run', n: 0.6 }, { t: 'mspike', side: 'floor', c: 3, period: 1.8, on: 0.55, f: 2.2 }, { t: 'alt', n: 4, c: 2, f: 1.9 }, { t: 'run', n: 1 }] },
    { name: 'wall-drop-gem', sections: [{ t: 'run', n: 1 }, { t: 'over', a: { t: 'wall', gap: 130, period: 2.4 }, b: { t: 'gem', y: 380, n: 2, spacing: 0.5 }, f: 2.6 }, { t: 'run', n: 0.6 }, { t: 'drop', w: 66, h: 46, side: 'floor', f: 2.8 }, { t: 'run', n: 1 }] },
  ],
];