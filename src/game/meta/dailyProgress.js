import { createDailyTasks, dailyGoal, utcDate } from '@/game/meta/dailyCatalog';

export function ensureDaily(save, date = utcDate(), at = Date.now()) {
  if (save.dailyChallenges?.days?.[date]) return save;
  return { ...save, dailyChallenges: { ...save.dailyChallenges, days: { ...save.dailyChallenges?.days,
    [date]: { date, createdAt: at, tasks: createDailyTasks(save, date) } } } };
}
function eligible(task, event) {
  if (task.mode !== 'any' && task.mode !== event.mode) return false;
  if (task.kind === 'gems' && task.mode === 'any' && !['career', 'endless'].includes(event.mode)) return false;
  return task.levelIndex == null || task.levelIndex === event.levelIndex;
}
export function advanceDaily(save, event) {
  const prepared = ensureDaily(save, event.date, event.at);
  const day = prepared.dailyChallenges.days[event.date];
  const tasks = day.tasks.map((task) => {
    if (task.completedAt || !eligible(task, event)) return task;
    let progress = task.progress || 0, failed = false;
    if (event.kind === 'pickups') {
      if (task.kind === 'gems') progress = Math.max(progress, event.runGems || 0);
      if (task.kind === 'rush') progress += event.rows || 0;
    }
    if (event.kind === 'complete') {
      if (task.kind === 'tutorial' && event.mode === 'tutorial') progress = 1;
      if (task.kind === 'clean' && event.mode === 'career' && event.deaths === 0) progress = 1;
      if (task.kind === 'speed') {
        if (event.mode === 'career' && event.deaths === 0 && Number.isFinite(event.time) && event.time <= task.target) progress = 1;
        else failed = true;
      }
    }
    if (event.kind === 'death' && event.mode === 'endless' && task.kind === 'endless') progress = Math.max(progress, event.score);
    if (event.kind === 'death' && ['clean', 'speed', 'tutorial'].includes(task.kind)) failed = true;
    const goal = dailyGoal(task);
    return { ...task, progress: Math.min(goal, progress), completedAt: progress >= goal ? event.at : null,
      ...(failed ? { lastFailureAt: event.at } : {}) };
  });
  return { ...prepared, dailyChallenges: { ...prepared.dailyChallenges,
    days: { ...prepared.dailyChallenges.days, [event.date]: { ...day, tasks } } } };
}