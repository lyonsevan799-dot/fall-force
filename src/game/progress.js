import { normalizeProgress, safeInteger } from '@/game/saveData';
import { LEVEL_COUNT } from '@/game/levels';
import { challengeById } from '@/game/challenges';
import { tutorialSaveFields } from '@/game/tutorialProgress';
import { skinSaveFields } from '@/game/skins/inventory';
import { metaSaveFields } from '@/game/meta/saveFields';
import creditRunGems from '@/game/gemCredits';
import powerSaveFields from '@/game/powers/saveFields';

import { PROGRESS_KEY } from '@/game/platform/saveConstants';
import { readSaveRaw, writeSaveRaw, removeSave } from '@/game/platform/saveStore';
export { PROGRESS_KEY };

export const FALLBACK = {
  tutorialCompleted: false,
  tutorialSkipped: false,
  tutorialGemsBanked: false,
  tutorialGemsAwarded: 0,
  tutorialReplays: 0,
  achievements: {},
  dailyChallenges: {},
  lifetimeGemsCollected: 0,
  metaProgress: { version: 0, deathlessCompletions: 0, sessions: {} },
  timeTrialRecords: {},
  timeTrialGhostEnabled: true,
  endlessRecords: {},
  survivalRecords: { bestScore: 0, bestTime: 0, bestDistance: 0, runs: 0 },
  ownedSkins: ['classic'],
  equippedSkins: { solo: 'classic', p1: 'classic', p2: 'classic' },
  skinPurchases: {},
  powerInventory: { doubleGems: 0 },
  powerPurchases: {},
  powerActivations: {},
  levelStruggles: {},
  levels: {},          // { [index]: { stars, time, completed } }
  unlocked: 0,         // highest playable level index (0-based)
  endlessBest: 0,      // highest endless score
  raceWins: 0,         // total race victories
  raceRewards: {},     // credited race IDs, actual winner, and one shared-wallet reward
  gemCredits: {},      // durable per-run receipts, saved atomically with the wallet
  adRewards: {},       // successfully completed rewarded advertisements only
  totalGems: 0,        // persistent gems across all modes
  levelGems: {},       // { [levelIndex]: bestGemsCollected }
  challenges: {},      // { [challengeId]: { completed, awardedAt } }
  settings: { music: true, sfx: true, shake: true, reduced: false, musicVolume: 0.5, sfxVolume: 0.7 },
};

const clone = (o) => JSON.parse(JSON.stringify(o));

export function decodeProgress(raw) {
  if (raw === null) return clone(FALLBACK);
  try {
    if (typeof raw !== 'string' || raw.length > 4194304) throw new Error('Invalid save size');
    const source = JSON.parse(raw);
    if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('Invalid save record');
    return { ...normalizeProgress(source, FALLBACK, LEVEL_COUNT),
      ...tutorialSaveFields(source), ...skinSaveFields(source), ...metaSaveFields(source), ...powerSaveFields(source) };
  } catch (cause) {
    throw Object.assign(new Error('Saved progress could not be read', { cause }), { code: 'corruptSave' });
  }
}

export function loadProgress() {
  try { return decodeProgress(readSaveRaw()); }
  catch { return clone(FALLBACK); } // Store protects the unreadable original from writes.
}
export function saveProgress(progress) { writeSaveRaw(JSON.stringify(progress)); }
export function clearProgress() { removeSave(); }

export function recordResult(progress, levelIndex, { stars, time }, totalLevels) {
  const next = clone(progress);
  const prev = next.levels[levelIndex] || { stars: 0, time: null, completed: false };
  next.levels[levelIndex] = {
    ...prev, skipped: false,
    stars: Math.max(prev.stars || 0, stars),
    time: prev.time == null ? time : Math.min(prev.time, time),
    completed: true,
  };
  next.unlocked = Math.min(totalLevels - 1, Math.max(next.unlocked, levelIndex + 1));
  return next;
}

export function commitLevelGems(progress, levelIndex, gems, runId) {
  const next = creditRunGems(progress, runId, 'career', gems, levelIndex);
  if (next === progress) return progress;
  return { ...next, levelGems: { ...next.levelGems,
    [levelIndex]: Math.max(next.levelGems[levelIndex] || 0, safeInteger(gems)) } };
}

export function commitEndlessGems(progress, gems, runId) {
  return creditRunGems(progress, runId, 'endless', gems);
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