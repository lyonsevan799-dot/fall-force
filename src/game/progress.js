const KEY = 'gravity-switch-save-v1';

export const FALLBACK = {
  levels: {},          // { [index]: { stars, time, completed } }
  unlocked: 0,         // highest playable level index (0-based)
  endlessBest: 0,      // highest endless score
  settings: { music: true, sfx: true, shake: true, reduced: false },
};

const clone = (o) => JSON.parse(JSON.stringify(o));

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return clone(FALLBACK);
    const p = JSON.parse(raw);
    return {
      levels: p.levels && typeof p.levels === 'object' ? p.levels : {},
      unlocked: typeof p.unlocked === 'number' ? p.unlocked : 1,
      endlessBest: typeof p.endlessBest === 'number' ? p.endlessBest : 0,
      settings: { ...FALLBACK.settings, ...(p.settings || {}) },
    };
  } catch (e) {
    return clone(FALLBACK);
  }
}

export function saveProgress(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* storage unavailable */ }
}

export function clearProgress() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
}

export function recordResult(progress, levelIndex, { stars, time }, totalLevels) {
  const next = clone(progress);
  const prev = next.levels[levelIndex] || { stars: 0, time: null, completed: false };
  next.levels[levelIndex] = {
    stars: Math.max(prev.stars || 0, stars),
    time: prev.time == null ? time : Math.min(prev.time, time),
    completed: true,
  };
  next.unlocked = Math.min(totalLevels - 1, Math.max(next.unlocked, levelIndex + 1));
  return next;
}

export function totalStars(progress) {
  return Object.values(progress.levels || {}).reduce((a, l) => a + (l.stars || 0), 0);
}

export function completedCount(progress) {
  return Object.values(progress.levels || {}).filter((l) => l.completed).length;
}