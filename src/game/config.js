// Core tuning constants for Fall Force.
export const BASE_SPEED = 340;      // world units / second at speed multiplier 1
export const CROSS_TIME = 0.44;     // seconds to cross the corridor (used for fair spacing)
export const GRAVITY = 2500;
export const LAUNCH_V = 660;        // kick applied when gravity is switched
export const MAX_VY = 1600;
export const PLAYER_SIZE = 34;
export const CEIL_Y = 120;
export const FLOOR_Y = 640;
export const MID_Y = (CEIL_Y + FLOOR_Y) / 2;
export const WORLD_H = 780;
export const VIEW_W = 1040;
export const VIEW_H = 700;
export const START_X = 560;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);

export function starsFor(deaths) {
  if (deaths === 0) return 3;
  if (deaths <= 2) return 2;
  return 1;
}

export const THEMES = {
  neon: {
    bg: ['#060a1e', '#0d1740', '#04050f'],
    accent: '#3ae8ff', accent2: '#ff3ea5', hazard: '#ff2f6d',
    ground: '#0d1734', groundTop: '#16244c', edge: '#3ae8ff',
    grid: '#3ae8ff', star: '#a8f2ff', plat: '#1b2c58', player: '#7ff4ff',
  },
  industrial: {
    bg: ['#170c05', '#301b09', '#0b0603'],
    accent: '#ffab33', accent2: '#ff6b2e', hazard: '#ff4a2e',
    ground: '#2a180a', groundTop: '#3d2410', edge: '#ffab33',
    grid: '#ffab33', star: '#ffd79a', plat: '#42280f', player: '#ffc978',
  },
  space: {
    bg: ['#0a0718', '#1c1145', '#06040e'],
    accent: '#a77bff', accent2: '#5b8cff', hazard: '#ff59e6',
    ground: '#181040', groundTop: '#241a5c', edge: '#a77bff',
    grid: '#a77bff', star: '#d9c8ff', plat: '#2a1f60', player: '#cbb2ff',
  },
  cyber: {
    bg: ['#03130f', '#062c22', '#020a08'],
    accent: '#2bf5a0', accent2: '#38e8ff', hazard: '#ff2f6d',
    ground: '#06231c', groundTop: '#0a3529', edge: '#2bf5a0',
    grid: '#2bf5a0', star: '#a8ffdd', plat: '#0c3227', player: '#8dffd0',
  },
  energy: {
    bg: ['#180410', '#3a0a20', '#0b0208'],
    accent: '#ffd23f', accent2: '#ff7a3f', hazard: '#ff5470',
    ground: '#2c0817', groundTop: '#410c22', edge: '#ffd23f',
    grid: '#ffd23f', star: '#ffe9a8', plat: '#3a0f22', player: '#ffe08a',
  },
  void: {
    bg: ['#04040a', '#0e0b20', '#020206'],
    accent: '#e6ecff', accent2: '#ff6b9d', hazard: '#ff3b5c',
    ground: '#0b0a1a', groundTop: '#151230', edge: '#9aa6e0',
    grid: '#8f9bd8', star: '#ffffff', plat: '#161436', player: '#f2f5ff',
  },
};