import { safeInteger } from '@/game/saveData';

const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
export function metaSaveFields(source) {
  const meta = object(source.metaProgress);
  return { lifetimeGemsCollected: safeInteger(source.lifetimeGemsCollected),
    metaProgress: { ...meta, version: safeInteger(meta.version), deathlessCompletions: safeInteger(meta.deathlessCompletions), sessions: object(meta.sessions) },
    achievements: object(source.achievements),
    dailyChallenges: { ...object(source.dailyChallenges), days: object(source.dailyChallenges?.days) } };
}
export function initializeMetaProgress(save) {
  if (save.metaProgress?.version === 1) return save;
  // Legacy wallets include bonus rewards and omit spent gems: never call them lifetime pickups.
  const knownPickups = Object.values(save.levelGems || {}).reduce((total, amount) => total + safeInteger(amount), 0)
    + (save.tutorialGemsBanked ? 9 : 0);
  const knownClean = Object.values(save.levels || {}).filter((record) => record.completed && record.stars === 3).length;
  return { ...save,
    lifetimeGemsCollected: Math.max(safeInteger(save.lifetimeGemsCollected), safeInteger(knownPickups)),
    metaProgress: { ...save.metaProgress, version: 1, sessions: save.metaProgress?.sessions || {},
      deathlessCompletions: Math.max(save.metaProgress?.deathlessCompletions || 0, knownClean),
      legacyLifetimeEstimate: knownPickups > 0 || knownClean > 0 } };
}