import { officialRaceResult } from '@/game/raceOutcome';

export const RACE_WIN_REWARD = 100;

export function raceReward(result) {
  return officialRaceResult(result) && (result.winner === 0 || result.winner === 1) ? RACE_WIN_REWARD : 0;
}

// Local P1 and P2 use one saved wallet. Attribute one credit to the actual
// winner and persist its race ID so replayed completion events cannot repay it.
export function commitRaceResult(progress, result) {
  const amount = raceReward(result);
  if (!amount || progress.raceRewards?.[result.runId]) return progress;
  return {
    ...progress,
    raceWins: (progress.raceWins || 0) + 1,
    totalGems: (progress.totalGems || 0) + amount,
    raceRewards: { ...progress.raceRewards, [result.runId]: { winner: result.winner, amount } },
  };
}