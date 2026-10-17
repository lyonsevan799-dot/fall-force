import { safeInteger } from '@/game/saveData';

// One whole-save transaction persists the wallet and this receipt together.
// Replayable levels may earn again only after a genuinely new full run.
export default function creditRunGems(progress, runId, mode, gems, levelIndex = null) {
  if (typeof runId !== 'string' || !runId || !['career', 'endless', 'survival'].includes(mode)) return progress;
  if (progress.gemCredits?.[runId]) return progress;
  const amount = safeInteger(gems);
  return { ...progress, totalGems: safeInteger(progress.totalGems + amount),
    gemCredits: { ...progress.gemCredits, [runId]: { mode, amount, levelIndex, creditedAt: Date.now() } } };
}