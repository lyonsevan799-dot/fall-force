import { safeInteger } from '@/game/saveData';
export function struggleStats(save, index) {
  const raw = save?.levelStruggles?.[index] || {};
  return { deaths: safeInteger(raw.deaths), failedAttempts: safeInteger(raw.failedAttempts), seconds: safeInteger(raw.seconds),
    lowProgressRestarts: safeInteger(raw.lowProgressRestarts), bestProgress: Math.min(1, Math.max(0, Number(raw.bestProgress) || 0)),
    nextReminderAt: safeInteger(raw.nextReminderAt), nextReminderAttempt: safeInteger(raw.nextReminderAttempt), lastEvent: raw.lastEvent || '' };
}
export function shouldRecommend(save, index, at = Date.now()) {
  const stats = struggleStats(save, index);
  return !save?.levels?.[index]?.completed && at >= stats.nextReminderAt && stats.failedAttempts >= stats.nextReminderAttempt &&
    (stats.deaths >= 5 || (stats.failedAttempts >= 3 && stats.seconds >= 120) || stats.lowProgressRestarts >= 3);
}
export function recordStruggle(save, index, event) {
  if (save.levels?.[index]?.completed) return save;
  const previous = struggleStats(save, index);
  if (previous.lastEvent === event.id) return save;
  const progress = Math.min(1, Math.max(0, Number(event.progress) || 0));
  const next = event.kind === 'dismiss' ? { ...previous, nextReminderAt: Date.now() + 5 * 60 * 1000, nextReminderAttempt: previous.failedAttempts + 3 } : {
    ...previous, deaths: previous.deaths + (event.kind === 'death' ? 1 : 0), failedAttempts: previous.failedAttempts + 1,
    seconds: previous.seconds + safeInteger(event.seconds), bestProgress: Math.max(previous.bestProgress, progress),
    lowProgressRestarts: progress > previous.bestProgress + 0.03 ? 0 : previous.lowProgressRestarts + (event.kind === 'restart' ? 1 : 0) };
  return { ...save, levelStruggles: { ...save.levelStruggles, [index]: { ...next, lastEvent: event.id } } };
}