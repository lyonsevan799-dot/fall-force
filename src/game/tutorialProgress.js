import { safeInteger } from '@/game/saveData';

export const tutorialAccessibleCareer = (save) => save.tutorialCompleted === true || save.tutorialSkipped === true;

// Grandfather actual pre-tutorial progress without marking the tutorial complete.
export function tutorialSaveFields(source) {
  const legacy = source.tutorialCompleted == null && source.tutorialSkipped == null && (
    Number(source.unlocked) > 0 || Number(source.totalGems) > 0 || Number(source.endlessBest) > 0 || Number(source.raceWins) > 0 ||
    Object.values(source.levels || {}).some((r) => r?.completed || r?.stars > 0) ||
    Object.values(source.challenges || {}).some((r) => r === true || r?.completed)
  );
  return { tutorialCompleted: source.tutorialCompleted === true, tutorialSkipped: source.tutorialSkipped === true || legacy,
    tutorialGemsBanked: source.tutorialGemsBanked === true,
    tutorialGemsAwarded: source.tutorialGemsBanked === true ? source.tutorialGemsAwarded == null ? 9 : Math.min(9, safeInteger(source.tutorialGemsAwarded)) : 0,
    tutorialReplays: safeInteger(source.tutorialReplays) };
}

export function completeTutorial(save, gems) {
  const amount = save.tutorialGemsBanked ? 0 : Math.min(9, safeInteger(gems));
  return { ...save, tutorialCompleted: true, tutorialGemsBanked: true,
    tutorialGemsAwarded: save.tutorialGemsBanked ? save.tutorialGemsAwarded ?? 9 : amount,
    totalGems: safeInteger((save.totalGems || 0) + amount) };
}