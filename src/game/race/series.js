import { officialRaceResult } from '@/game/raceOutcome';

export const createRaceSeries = (bestOfThree = false) => ({ bestOfThree, rounds: [], wins: [0, 0], complete: false, winner: null });

// Draws are recorded but replayed; best of three means first to two wins.
export function recordRaceRound(series, result) {
  if (series.complete || !officialRaceResult(result) || series.rounds.some((round) => round.runId === result.runId)) return series;
  const wins = [...series.wins];
  if (result.winner !== -1) wins[result.winner]++;
  const complete = !series.bestOfThree || Math.max(...wins) >= 2;
  return { ...series, wins, rounds: [...series.rounds, result], complete,
    winner: complete ? result.winner : null };
}