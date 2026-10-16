// Failure history survives restarts, fresh attempts, refresh, and completion.
export function recordMiddleFailure(progress, id, reason) {
  const previous = progress.challenges?.[id] || {};
  if (previous.completed) return progress;
  return { ...progress, challenges: { ...progress.challenges, [id]: {
    ...previous, failedAttempt: true, failedAttempts: (previous.failedAttempts || 0) + 1,
    lastFailure: { reason, at: Date.now() },
  } } };
}

export function middleChallengeEligible(challenge, result) {
  return challenge.type !== 'middle' ? result.deaths === 0 : result.middleSuccess === true;
}