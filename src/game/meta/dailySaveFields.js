import { createDailyTasks, dailyGoal } from '@/game/meta/dailyCatalog';
import { safeInteger } from '@/game/saveData';
import { LEVEL_COUNT } from '@/game/levels';

const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const kinds = { clean: ['clean', 'tutorial'], speed: ['speed', 'gems'], gems: ['gems'], rush: ['rush'], endless: ['endless'] };
const stamp = (value) => value ? safeInteger(value) || 1 : null;
export default function dailySaveFields(source) {
  const daily = object(source.dailyChallenges), days = {};
  for (const [date, value] of Object.entries(object(daily.days))) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const day = object(value), raw = Array.isArray(day.tasks) ? day.tasks : Object.values(object(day.tasks));
    const tasks = createDailyTasks(source, date).map((fallback) => {
      const previous = object(raw.find((task) => task?.id === fallback.id && task.claimedAt) || raw.find((task) => task?.id === fallback.id));
      const kind = kinds[fallback.id].includes(previous.kind) ? previous.kind : fallback.kind;
      const mode = kind === 'tutorial' || fallback.id === 'speed' && kind === 'gems' ? 'tutorial'
        : ['clean', 'speed'].includes(kind) ? 'career' : fallback.mode;
      const target = typeof previous.target === 'number' && Number.isFinite(previous.target) && previous.target > 0
        ? Math.min(kind === 'speed' ? 3600 : 100000, previous.target) : fallback.target;
      const task = { ...previous, id: fallback.id, kind, mode, target, reward: fallback.reward };
      if (kind === 'speed') task.levelIndex = Number.isInteger(previous.levelIndex) && previous.levelIndex >= 0 && previous.levelIndex < LEVEL_COUNT ? previous.levelIndex : fallback.levelIndex ?? 0;
      const progress = Math.min(dailyGoal(task), safeInteger(previous.progress));
      return { ...task, progress, completedAt: progress >= dailyGoal(task) ? stamp(previous.completedAt) : null,
        // Never reopen a previously claimed reward, even if its timestamp is malformed.
        claimedAt: stamp(previous.claimedAt) };
    });
    days[date] = { ...day, date, tasks };
  }
  return { ...daily, days };
}