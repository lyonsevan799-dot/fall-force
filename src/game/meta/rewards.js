import { ACHIEVEMENTS } from '@/game/meta/achievements';
import { dailyGoal } from '@/game/meta/dailyCatalog';
import { safeInteger } from '@/game/saveData';

export default function claimMetaReward(save, type, date, id) {
  if (type === 'achievement') {
    const definition = ACHIEVEMENTS.find((entry) => entry.id === id);
    const record = save.achievements?.[id];
    if (!definition || !record?.unlockedAt || record.claimedAt || record.rewardClaimed) return save;
    return { ...save, totalGems: safeInteger(save.totalGems + definition.reward), achievements: { ...save.achievements,
      [id]: { ...record, claimedAt: Date.now(), rewardClaimed: true } } };
  }
  if (type !== 'daily') return save;
  const day = save.dailyChallenges?.days?.[date];
  const task = day?.tasks.find((entry) => entry.id === id);
  if (!task?.completedAt || task.progress < dailyGoal(task) || task.claimedAt) return save;
  return { ...save, totalGems: safeInteger(save.totalGems + task.reward), dailyChallenges: { ...save.dailyChallenges,
    days: { ...save.dailyChallenges.days, [date]: { ...day,
      tasks: day.tasks.map((entry) => entry.id === id ? { ...entry, claimedAt: Date.now() } : entry) } } } };
}