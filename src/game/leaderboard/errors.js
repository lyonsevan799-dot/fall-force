export default function leaderboardError(error) {
  const code = error?.code || error?.type || '';
  const messages = {
    'no-active-season': 'No official leaderboard season is active right now.',
    'user-not-found': 'Your CrazyGames account cannot enter this leaderboard right now.',
    'privacy-disabled': 'Your CrazyGames privacy settings do not allow leaderboard participation.',
    validation: 'This run could not be sent because its score was not valid for the configured leaderboard.',
    'internal-server-error': 'CrazyGames is temporarily unavailable. Your run still finishes normally.',
  };
  if (error?.status === 429) return 'CrazyGames is limiting score submissions. No automatic retry will be made.';
  return messages[code] || 'Could not reach the official leaderboard. Your run and personal record are unaffected.';
}