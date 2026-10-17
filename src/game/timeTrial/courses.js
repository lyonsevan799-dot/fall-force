import { LEVELS } from '@/game/levels';
import { GRAVITY, LAUNCH_V, MAX_VY, PLAYER_SIZE, CEIL_Y, FLOOR_Y } from '@/game/config';

export const SPLIT_DISTANCE = 512;
const clean = (key, value) => key.startsWith('_') || ['collected', 'done', 'used', 'groupId'].includes(key) ? undefined : value;
const hash = (text) => {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  return (value >>> 0).toString(16);
};
// Ignore mutable gameplay flags and generated row IDs, never collision geometry.
export const COURSE_SIGNATURES = LEVELS.map((level) => hash(JSON.stringify({ version: 'trial-fixed120-v2-surfaces-rush',
  physics: [GRAVITY, LAUNCH_V, MAX_VY, PLAYER_SIZE, CEIL_Y, FLOOR_Y],
  length: level.length, speed: level.speed, startX: level.startX, items: level.items }, clean)));
export function cloneTrialCourse(index) {
  if (!Number.isInteger(index) || !LEVELS[index]) throw new Error('This Time Trial course is unavailable.');
  // Keep group membership for Rush, but isolate every mutable object from Career.
  return JSON.parse(JSON.stringify(LEVELS[index], (key, value) => key.startsWith('_') || ['collected', 'done', 'used'].includes(key) ? undefined : value));
}
export function trialRecord(records, index) {
  const record = records?.[index];
  return typeof COURSE_SIGNATURES[index] === 'string' && record && record.signature === COURSE_SIGNATURES[index] && Number.isSafeInteger(record.timeMs) && record.timeMs > 0 ? record : null;
}
export function trialSplits(record, level) {
  const values = record?.splits;
  const expected = Math.floor((level.length - level.startX) / SPLIT_DISTANCE);
  return Array.isArray(values) && values.length === expected && values.every((value, index) => Number.isSafeInteger(value) && value > (values[index - 1] || 0) && value <= record.timeMs) ? values : null;
}
export const formatTrialTime = (ms) => Number.isFinite(ms) && ms >= 0 ? `${(ms / 1000).toFixed(3)}s` : '—';
export const formatTrialDelta = (ms) => `${ms < 0 ? '−' : ms > 0 ? '+' : '±'}${(Math.abs(ms) / 1000).toFixed(3)}s`;