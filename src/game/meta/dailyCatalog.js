import { LEVELS } from '@/game/levels';
import { isLevelPlayable } from '@/game/groups';
import { tutorialAccessibleCareer } from '@/game/tutorialProgress';

export const utcDate = (at = Date.now()) => new Date(at).toISOString().slice(0, 10);
export const dailyGoal = (task) => task.kind === 'speed' ? 1 : task.target;
export function createDailyTasks(save, date) {
  const seed = Number(date.replaceAll('-', ''));
  const playable = tutorialAccessibleCareer(save) ? LEVELS.slice(0, 3).filter((level) => isLevelPlayable(save, level.index)) : [];
  const level = playable[seed % Math.max(1, playable.length)];
  const speedTarget = level ? Math.ceil((level.length - level.startX) / level.speed * 1.4 + 5) : 5;
  return [
    level ? { id: 'clean', kind: 'clean', mode: 'career', target: 1, reward: 25 }
      : { id: 'clean', kind: 'tutorial', mode: 'tutorial', target: 1, reward: 25 },
    { id: 'gems', kind: 'gems', mode: 'any', target: 20, reward: 35 },
    level ? { id: 'speed', kind: 'speed', mode: 'career', levelIndex: level.index, target: speedTarget, reward: 30 }
      : { id: 'speed', kind: 'gems', mode: 'tutorial', target: 5, reward: 30 },
    { id: 'rush', kind: 'rush', mode: 'any', target: 1, reward: 40 },
    { id: 'endless', kind: 'endless', mode: 'endless', target: (save.endlessBest >= 5000 ? 1500 : 500) + seed % 3 * 250, reward: 50 },
  ].map((task) => ({ ...task, progress: 0, completedAt: null, claimedAt: null }));
}
export function dailyDescription(task) {
  if (task.kind === 'tutorial') return 'Complete the tutorial. Skipping does not count.';
  if (task.kind === 'clean') return 'Finish any unlocked Career level without dying.';
  if (task.kind === 'speed') return `Finish ${LEVELS[task.levelIndex]?.name || 'the selected level'} without dying in ${task.target} seconds or less.`;
  if (task.kind === 'gems') return `Collect ${task.target} gems in one ${task.mode === 'tutorial' ? 'Tutorial' : 'Career or Endless'} run today.`;
  if (task.kind === 'rush') return 'Collect every gem in a full Gem Rush row in Career, Tutorial, or Endless.';
  return `Finish an Endless run with at least ${task.target.toLocaleString()} points.`;
}
export const DAILY_NAMES = { tutorial: 'First Steps', clean: 'Clean Flight', speed: 'Beat the Clock', gems: 'Gem Run', rush: 'Rush Collector', endless: 'Endless Ascent' };