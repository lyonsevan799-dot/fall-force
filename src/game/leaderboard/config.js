// Match the approved CrazyGames Leaderboard tab before enabling this integration.
// Client encryption key ONLY: never put the secret server API key in this file.
export const ENDLESS_LEADERBOARD = Object.freeze({
  approved: false,
  encryptionKey: '', // Portal-generated 32-byte base64 CLIENT encryption key.
  officialGameUrl: '', // Actual approved https://www.crazygames.com/game/... page; no guessed URL.
  guide: 'Endless Mode - Survive as long as possible',
  scoreLabel: 'POINTS',
  scoreSorting: 'DESC',
  isIncremental: false,
  minValue: 0,
  maxValue: 500000,
  cooldownSeconds: 10,
});
export function officialLeaderboardPage() {
  if (!ENDLESS_LEADERBOARD.approved || !ENDLESS_LEADERBOARD.officialGameUrl) return null;
  try {
    const url = new URL(ENDLESS_LEADERBOARD.officialGameUrl);
    return url.protocol === 'https:' && ['crazygames.com', 'www.crazygames.com'].includes(url.hostname)
      && !url.username && !url.password && !url.port && /^\/game\/[^/]+/.test(url.pathname) ? url.href : null;
  } catch { return null; }
}