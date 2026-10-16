export const RACE_FINISH_BONUS = 50;

// Both local racers contribute to the same saved gem wallet.
export function raceReward(result) {
  return (result.p1Gems || 0) + (result.p2Gems || 0) + RACE_FINISH_BONUS;
}

export function commitRaceResult(progress, result) {
  return { ...progress, raceWins: (progress.raceWins || 0) + 1,
    totalGems: (progress.totalGems || 0) + raceReward(result) };
}