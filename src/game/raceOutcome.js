const SAME_FINISH = 1e-7;
const finishValid = (finished, time) => typeof finished === 'boolean' &&
  (finished ? Number.isFinite(time) && time >= 0 : time === null);

// Compare crossing times, not player update order or rounded display times.
export function raceWinner({ p1Finished, p2Finished, p1Time, p2Time }) {
  if (p1Finished && p2Finished) {
    if (Math.abs(p1Time - p2Time) <= SAME_FINISH) return -1;
    return p1Time < p2Time ? 0 : 1;
  }
  return p1Finished ? 0 : p2Finished ? 1 : -1;
}

export function officialRaceResult(result) {
  return !!result && result.status === 'raceover' &&
    typeof result.runId === 'string' && result.runId.length > 0 &&
    finishValid(result.p1Finished, result.p1Time) &&
    finishValid(result.p2Finished, result.p2Time) &&
    (result.p1Finished || result.p2Finished) &&
    result.winner === raceWinner(result);
}