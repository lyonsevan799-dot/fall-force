import { CEIL_Y, FLOOR_Y, PLAYER_SIZE } from '@/game/config';

export const GHOST_STEP_MS = 100;
export const MAX_GHOST_POINTS = 6001;
export function encodeGhost(points, skinId) {
  if (!points || points.length < 2 || points.length > MAX_GHOST_POINTS) return null;
  const bytes = new Uint8Array(points.length * 8), view = new DataView(bytes.buffer);
  for (let i = 0; i < points.length; i++) {
    const [x, y, rotation] = points[i];
    if (![x, y, rotation].every(Number.isFinite) || x < 0 || x * 4 > 4294967295) return null;
    view.setUint32(i * 8, Math.round(x * 4), true);
    view.setUint16(i * 8 + 4, Math.round(y * 4), true);
    view.setInt16(i * 8 + 6, Math.max(-32768, Math.min(32767, Math.round(rotation * 1000))), true);
  }
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return { version: 1, stepMs: GHOST_STEP_MS, count: points.length, skinId, data: btoa(binary) };
}
export function decodeGhost(record, level) {
  const ghost = record?.ghost;
  if (!ghost || ghost.version !== 1 || ghost.stepMs !== GHOST_STEP_MS || !Number.isInteger(ghost.count)
    || ghost.count < 2 || ghost.count > MAX_GHOST_POINTS || typeof ghost.data !== 'string'
    || ghost.data.length !== Math.ceil(ghost.count * 8 / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(ghost.data)
    || !(record.timeMs > (ghost.count - 2) * GHOST_STEP_MS && record.timeMs <= (ghost.count - 1) * GHOST_STEP_MS + 1)) return null;
  // A corrupt/missing recording is optional input, never a level-loading failure.
  try {
    const binary = atob(ghost.data);
    if (binary.length !== ghost.count * 8) return null;
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const view = new DataView(bytes.buffer), points = [];
    for (let i = 0; i < ghost.count; i++) {
      const x = view.getUint32(i * 8, true) / 4, y = view.getUint16(i * 8 + 4, true) / 4;
      if (x < level.startX - 1 || x > level.length + 1 || y < CEIL_Y - 1 || y > FLOOR_Y - PLAYER_SIZE + 1) return null;
      points.push([x, y, view.getInt16(i * 8 + 6, true) / 1000]);
    }
    if (Math.abs(points[0][0] - level.startX) > 1 || Math.abs(points.at(-1)[0] - level.length) > 1) return null;
    return { points, stepMs: GHOST_STEP_MS, timeMs: record.timeMs, skinId: typeof ghost.skinId === 'string' ? ghost.skinId : 'classic' };
  } catch { return null; }
}