import { BASE_SPEED, CEIL_Y, FLOOR_Y, PLAYER_SIZE } from '@/game/config';
import { emit } from '@/game/levels';
import { placeRow, gemClear, LANE } from '@/game/gemPlace';

export const difficultyAt = (distance) => 1 - Math.exp(-Math.max(0, distance) / 18000);
export const speedAt = (difficulty) => BASE_SPEED * (0.62 + 0.60 * difficulty);
const TYPES = ['spike', 'saw', 'mspike', 'laser', 'blade', 'bounce'];
function descriptor(type, side, difficulty) {
  const atTop = side === 'ceil';
  const common = { t: type, side, at: side, host: side };
  if (type === 'spike') return { ...common, n: 2 + Math.floor(difficulty * 2) };
  if (type === 'saw') return { ...common, r: 24 + difficulty * 6 };
  if (type === 'mspike') return { ...common, c: 3, period: 3 - difficulty, on: 0.55, phase: Math.random() * 2 };
  if (type === 'laser') return { ...common, h: 210 + difficulty * 70, on: 1.4, off: 1.5 - difficulty * 0.4 };
  if (type === 'blade') return { ...common, at: atTop ? 'high' : 'low', arm: 100, spin: 0.6 + difficulty * 0.3 };
  return { ...common, r: 22, y0: atTop ? CEIL_Y + 36 : FLOOR_Y - 140,
    y1: atTop ? CEIL_Y + 140 : FLOOR_Y - 36, period: 2.8 - difficulty * 0.5 };
}

// Constructive route guarantee: an encounter occupies ONE wall's half only.
// Its opposite wall is safe at EVERY timer phase; full-height gaps connect it
// to the previous encounter's safe wall, even at the maximum future speed.
export default function buildRunSection(start, difficulty, mode, ordinal) {
  const items = [], speed = speedAt(difficulty), step = speed * 0.44;
  const clearance = speed * (1.5 - difficulty * 0.45) + PLAYER_SIZE * 2;
  const ctx = { step, gap: 3 };
  let x = start + clearance;
  const count = (mode === 'survival' ? 4 : 3) + Math.floor(difficulty * 4);
  let side = ordinal % 2 ? 'ceil' : 'floor';
  for (let i = 0; i < count; i++) {
    const available = Math.min(TYPES.length, 2 + Math.floor(difficulty * 5));
    const type = TYPES[Math.floor(Math.random() * available)];
    const before = items.length;
    emit(descriptor(type, side, difficulty), x, items, ctx);
    // Same-wall combinations never close the guaranteed opposite route.
    if (difficulty > 0.2 && Math.random() < difficulty * 0.65) {
      emit(descriptor(type === 'spike' ? 'saw' : 'spike', side, difficulty), x + 155, items, ctx);
    }
    const end = Math.max(...items.slice(before).map((item) => item.x + (item.w || item.r || 60)));
    const lane = side === 'floor' ? LANE.ceil : LANE.floor;
    for (let n = 0; n < 1 + (i % 3); n++) {
      const gx = x + n * 60;
      if (gemClear(items, gx, lane)) items.push({ type: 'gem', x: gx, y: lane, r: 13 });
    }
    x = end + clearance;
    side = side === 'floor' ? 'ceil' : 'floor';
  }
  // Reserve entry AND recovery room; a future chunk cannot invade this row.
  const lane = ordinal % 2 ? LANE.ceil : LANE.floor;
  const rowCount = 4 + ordinal % 3, spacing = Math.max(60, step * 0.5);
  const rowStart = x + clearance;
  placeRow(items, rowStart, lane, rowCount, 1, 0, spacing);
  x = rowStart + (rowCount - 1) * spacing + Math.max(clearance, spacing * 3 + PLAYER_SIZE);
  return { items, end: x, name: `${mode === 'survival' ? 'Wave' : 'Section'} ${ordinal + 1}` };
}

export function validRunSection(section, start) {
  return Number.isFinite(section.end) && section.end > start + 500 && section.items.length < 100
    && section.items.every((item) => Number.isFinite(item.x) && item.x >= start && item.x < section.end
      && Object.values(item).every((value) => typeof value !== 'number' || Number.isFinite(value)));
}