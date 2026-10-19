import { GROUPS } from '@/game/groups';

const hard = GROUPS.find((group) => group.id === 'hard');
export const ACHIEVEMENTS = [
  { id: 'first_flight', name: 'First Flight', description: 'Complete the tutorial. Skipping does not count.', target: 1, reward: 50 },
  { id: 'survivor', name: 'Survivor', description: 'Finish 10 Career runs without dying. Successful replays count.', target: 10, reward: 150 },
  { id: 'gem_collector', name: 'Gem Collector', description: 'Collect 1,000 lifetime gems from actual pickups, not bonus rewards.', target: 1000, reward: 200 },
  { id: 'endless_runner', name: 'Endless Runner', description: 'Finish an Endless run with at least 5,000 points.', target: 5000, reward: 250 },
  { id: 'gravity_master', name: 'Gravity Master', description: 'Complete every Hard-ranked Career level.', target: hard.end - hard.start + 1, reward: 1000 },
];
export function achievementProgress(save, id) {
  if (id === 'first_flight') return save.tutorialCompleted === true ? 1 : 0;
  if (id === 'survivor') return save.metaProgress?.deathlessCompletions || 0;
  if (id === 'gem_collector') return save.lifetimeGemsCollected || 0;
  if (id === 'endless_runner') return save.endlessBest || 0;
  if (id === 'gravity_master') {
    let count = 0;
    for (let index = hard.start; index <= hard.end; index++) if (save.levels?.[index]?.completed && !save.levels[index].skipped) count++;
    return count;
  }
  return 0;
}
export function reconcileAchievements(save, at = Date.now()) {
  const achievements = { ...save.achievements };
  let changed = false;
  for (const definition of ACHIEVEMENTS) {
    const previous = achievements[definition.id] || {};
    const progress = Math.max(previous.progress || 0, Math.min(definition.target, achievementProgress(save, definition.id)));
    const unlockedAt = previous.unlockedAt || (progress >= definition.target ? at : null);
    if (progress !== previous.progress || unlockedAt !== previous.unlockedAt) {
      achievements[definition.id] = { ...previous, progress, unlockedAt }; changed = true;
    }
  }
  return changed ? { ...save, achievements } : save;
}