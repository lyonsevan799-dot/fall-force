const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
export const safeInteger = (value) => Number.isFinite(Number(value)) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(Number(value)))) : 0;
const volume = (value, fallback) => typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;

// Repair individual fields, retaining unknown fields for forward compatibility.
export function normalizeProgress(value, defaults, levelCount) {
  const source = object(value);
  const levels = {};
  let unlocked = Math.min(levelCount - 1, safeInteger(source.unlocked));
  for (const [key, value] of Object.entries(object(source.levels))) {
    if (!/^\d+$/.test(key) || Number(key) >= levelCount) continue;
    const record = object(value);
    levels[key] = { ...record, completed: record.completed === true, stars: Math.min(3, safeInteger(record.stars)), time: typeof record.time === 'number' && Number.isFinite(record.time) && record.time >= 0 ? record.time : null };
    if (levels[key].completed) unlocked = Math.max(unlocked, Math.min(levelCount - 1, Number(key) + 1));
  }
  const settings = { ...defaults.settings, ...object(source.settings) };
  for (const key of ['music', 'sfx', 'shake', 'reduced']) {
    if (typeof settings[key] !== 'boolean') settings[key] = defaults.settings[key];
  }
  settings.musicVolume = volume(settings.musicVolume, defaults.settings.musicVolume);
  settings.sfxVolume = volume(settings.sfxVolume, defaults.settings.sfxVolume);
  const challenges = {};
  for (const [key, value] of Object.entries(object(source.challenges))) {
    const record = object(value);
    challenges[key] = { ...record, completed: value === true || record.completed === true };
  }
  const levelGems = Object.fromEntries(Object.entries(object(source.levelGems)).map(([key, gems]) => [key, safeInteger(gems)]));
  return { ...defaults, ...source, levels, unlocked, settings, challenges, levelGems,
    totalGems: safeInteger(source.totalGems), endlessBest: safeInteger(source.endlessBest), raceWins: safeInteger(source.raceWins), raceRewards: object(source.raceRewards) };
}