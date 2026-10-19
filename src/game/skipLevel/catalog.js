import { LEVELS } from '@/game/levels';
import { tutorialAccessibleCareer } from '@/game/tutorialProgress';
import { groupForLevel, isLevelPlayable } from '@/game/groups';
const prices = { easy: 500, medium: 1500, hard: 3000 };
export function skipPrice(index) {
  if (!Number.isInteger(index) || !LEVELS[index]) throw new Error('Choose a valid level. No gems were spent.');
  return prices[groupForLevel(index).id];
}
export const canSkip = (save, index) => !!save && tutorialAccessibleCareer(save) && isLevelPlayable(save, index) && !save.levels?.[index]?.completed;