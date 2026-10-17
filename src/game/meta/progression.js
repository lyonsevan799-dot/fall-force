import { safeInteger } from '@/game/saveData';
import { initializeMetaProgress } from '@/game/meta/saveFields';
import { reconcileAchievements } from '@/game/meta/achievements';
import { advanceDaily, ensureDaily } from '@/game/meta/dailyProgress';
import { utcDate } from '@/game/meta/dailyCatalog';

export const reconcileMetaSave = (save, at = Date.now()) => reconcileAchievements(initializeMetaProgress(save), at);
export const prepareMetaProgress = (save, at = Date.now()) => reconcileMetaSave(ensureDaily(initializeMetaProgress(save), utcDate(at), at), at);
export function applyProgressEvent(save, event) {
  const initialized = initializeMetaProgress(save);
  if (!Number.isSafeInteger(event.sequence) || event.sequence <= (initialized.metaProgress.sessions[event.session] || 0)) return initialized;
  const meta = initialized.metaProgress;
  const next = { ...initialized,
    lifetimeGemsCollected: safeInteger(initialized.lifetimeGemsCollected + (event.kind === 'pickups' ? safeInteger(event.gems) : 0)),
    metaProgress: { ...meta, sessions: { ...meta.sessions, [event.session]: event.sequence },
      deathlessCompletions: meta.deathlessCompletions + (event.kind === 'complete' && event.mode === 'career' && event.deaths === 0 ? 1 : 0) } };
  return reconcileMetaSave(advanceDaily(next, event), event.at);
}
export function acknowledgeAchievement(save, id) {
  const record = save.achievements?.[id];
  if (!record?.unlockedAt || record.notifiedAt) return save;
  return { ...save, achievements: { ...save.achievements, [id]: { ...record, notifiedAt: Date.now() } } };
}