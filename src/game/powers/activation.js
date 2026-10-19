import { LEVELS } from '@/game/levels';
import { tutorialAccessibleCareer } from '@/game/tutorialProgress';
import { isLevelPlayable, groupForLevel, groupIndex, groupUnlocked } from '@/game/groups';
import { ownedDoubleGems } from '@/game/powers/catalog';
import { commitLevelGems } from '@/game/progress';
export function activateDoubleGems(save, index, id, challenge = null) {
  if (!Number.isInteger(index) || typeof id !== 'string' || !id) throw new Error('Invalid power selection. No gems were spent.');
  if (!tutorialAccessibleCareer(save)) throw new Error('Complete or skip the tutorial first. No gems were spent.');
  const existing = save.powerActivations?.[id];
  if (existing) {
    if (existing.levelIndex !== index || existing.completedRunId) throw new Error('This power use has ended. No gems were spent.');
    return save;
  }
  const middleAllowed = challenge?.type === 'middle' && groupForLevel(index).id === challenge.groupId && groupUnlocked(save, groupIndex(groupForLevel(index)));
  if (!LEVELS[index] || (!isLevelPlayable(save, index) && !middleAllowed)) throw new Error('This level is locked. No gems were spent.');
  const owned = ownedDoubleGems(save);
  if (owned < 1) throw new Error('No Double Gems uses remain. Buy one for 100 gems.');
  return { ...save, powerInventory: { ...save.powerInventory, doubleGems: owned - 1 },
    powerActivations: { ...save.powerActivations, [id]: { levelIndex: index, consumedAt: Date.now() } } };
}
export function creditPoweredLevel(save, index, gems, runId, activationId) {
  if (save.gemCredits?.[runId]) return save;
  const activation = save.powerActivations?.[activationId];
  const boosted = activation?.levelIndex === index && !activation.completedRunId;
  const next = commitLevelGems(save, index, gems * (boosted ? 2 : 1), runId);
  if (next === save) return save;
  return { ...next,
    // Actual pickups, not power bonuses, remain the legacy lifetime estimate.
    levelGems: { ...next.levelGems, [index]: Math.max(save.levelGems?.[index] || 0, gems) },
    powerActivations: boosted ? { ...next.powerActivations, [activationId]: { ...activation, completedRunId: runId } } : next.powerActivations };
}