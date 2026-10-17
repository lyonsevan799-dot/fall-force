import { getCrazyGames } from '@/game/platform/crazyGames';
import { ENDLESS_LEADERBOARD as config, officialLeaderboardPage } from '@/game/leaderboard/config';
import { decodeEncryptionKey } from '@/game/leaderboard/encryptScore';
import leaderboardError from '@/game/leaderboard/errors';

const unavailable = (message) => ({ state: 'unavailable', message });
export function leaderboardGate() {
  if (!config.approved) return unavailable('Awaiting CrazyGames invitation, approval, and developer configuration. Global rankings are not live.');
  if (!config.encryptionKey) return unavailable('The approved leaderboard client encryption key has not been configured.');
  try { decodeEncryptionKey(config.encryptionKey); }
  catch { return unavailable('The leaderboard client encryption key is not a valid 32-byte base64 key.'); }
  if (config.scoreLabel !== 'POINTS' || config.scoreSorting !== 'DESC' || config.isIncremental !== false
    || config.minValue !== 0 || !Number.isSafeInteger(config.maxValue) || config.maxValue < 0
    || !Number.isSafeInteger(config.cooldownSeconds) || config.cooldownSeconds < 0 || config.guide.length > 50) {
    return unavailable('The Endless leaderboard settings must match the approved POINTS, DESC, nonincremental configuration.');
  }
  const sdk = getCrazyGames();
  if (!sdk) return unavailable('Official leaderboard access requires a supported CrazyGames session or Developer Portal preview.');
  if (!window.crypto?.subtle) return unavailable('Secure browser encryption is unavailable. Open the game using HTTPS.');
  if (sdk.user.isUserAccountAvailable !== true || typeof sdk.user.submitScore !== 'function'
    || typeof sdk.user.getUser !== 'function') return unavailable('CrazyGames account or leaderboard access is unavailable for this player.');
  return null;
}
export function leaderboardDeadline(promise) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Leaderboard request timed out')), 8000);
  })]).finally(() => clearTimeout(timer));
}
export async function checkLeaderboardAccess() {
  try {
    const blocked = leaderboardGate();
    if (blocked) return blocked;
    const user = await leaderboardDeadline(getCrazyGames().user.getUser());
    if (!user) return unavailable('Sign in on CrazyGames to enter future Endless runs. Guest personal records remain available.');
    return { state: 'ready', page: officialLeaderboardPage(),
      message: 'Your CrazyGames account is connected. CrazyGames controls leaderboard eligibility and validates rankings.' };
  } catch (error) { return { state: 'error', message: leaderboardError(error) }; }
}