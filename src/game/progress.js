import { normalizeProgress, safeInteger } from '@/game/saveData';
import { LEVEL_COUNT } from '@/game/levels';
import { challengeById } from '@/game/challenges';
import { tutorialSaveFields } from '@/game/tutorialProgress';
import { skinSaveFields } from '@/game/skins/inventory';

export const PROGRESS_KEY = 'gravity-switch-save-v1';
const KEY = PROGRESS_KEY;

export const FALLBACK = {
  tutorialCompleted: false,
  tutorialSkipped: false,
  tutorialGemsBanked: false,
  ownedSkins: [],
  equippedSkins: { solo: 'classic', p1: null, p2: 'classic' },
  skinPurchases: {},
  levels: {},          // { [index]: { stars, time, completed } }
  unlocked: 0,         // highest playable level index (0-based)
  endlessBest: 0,      // highest endless score
  raceWins: 0,         // total race victories
  raceRewards: {},     // credited race IDs, actual winner, and one shared-wallet reward
  totalGems: 0,        // persistent gems across all modes
  levelGems: {},       // { [levelIndex]: bestGemsCollected }
  challenges: {},      // { [challengeId]: { completed, awardedAt } }
  settings: { music: true, sfx: true, shake: true, reduced: false, musicVolume: 0.5, sfxVolume: 0.7 },
};

const clone = (o) => JSON.parse(JSON.stringify(o));

export function loadProgress() {
  let raw;
  try {
    raw = localStorage.getItem(KEY);
    if (!raw) return clone(FALLBACK);
    const source = JSON.parse(raw);
    const normalized = normalizeProgress(source, FALLBACK, LEVEL_COUNT);
    const fields = source && typeof source === 'object' ? source : {};
    return { ...normalized, ...tutorialSaveFields(fields), ...skinSaveFields(fields) };
  } catch (e) {
    // Keep an unreadable save recoverable instead of silently destroying it.
    if (raw) {
      try { if (!localStorage.getItem(`${KEY}-corrupt-backup`)) localStorage.setItem(`${KEY}-corrupt-backup`, raw); } catch (_) { /* storage unavailable */ }
    }
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

export function commitLevelGems(progress, levelIndex, gems) {
  const next = clone(progress);
  next.totalGems = safeInteger(next.totalGems + safeInteger(gems));
  next.levelGems[levelIndex] = Math.max(next.levelGems[levelIndex] || 0, safeInteger(gems));
  return next;
}

export function commitEndlessGems(progress, gems) {
  const next = clone(progress);
  next.totalGems = safeInteger(next.totalGems + safeInteger(gems));
  return next;
}

export function totalStars(progress) {
  return Object.values(progress.levels || {}).reduce((a, l) => a + (l.stars || 0), 0);
}

export function completedCount(progress) {
  return Object.values(progress.levels || {}).filter((l) => l.completed).length;
}

// Award a one-time challenge gem reward. Has a built-in guard so a challenge
// can never be paid out twice, even if the completion event fires repeatedly.
export function claimChallenge(progress, challengeId) {
  const challenge = challengeById(challengeId);
  if (!challenge) return progress;
  const next = clone(progress);
  next.challenges = { ...(next.challenges || {}) };
  if (next.challenges[challengeId] && next.challenges[challengeId].completed) return next;
  next.challenges[challengeId] = { ...next.challenges[challengeId], completed: true, awardedAt: Date.now() };
  next.totalGems = safeInteger((next.totalGems || 0) + challenge.reward);
  return next;
}