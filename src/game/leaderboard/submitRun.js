import { getCrazyGames } from '@/game/platform/crazyGames';
import { ENDLESS_LEADERBOARD as config } from '@/game/leaderboard/config';
import { isCompletedEndlessRun } from '@/game/leaderboard/completedRuns';
import { checkLeaderboardAccess, leaderboardDeadline } from '@/game/leaderboard/access';
import encryptScore from '@/game/leaderboard/encryptScore';
import leaderboardError from '@/game/leaderboard/errors';
import { getSaveSession } from '@/game/platform/saveStore';

const attempted = new WeakSet();
let lastAttempt = -Infinity;
export default async function submitCompletedRun(receipt) {
  if (!isCompletedEndlessRun(receipt)) return { state: 'error', message: 'Only a completed live Endless run can enter the leaderboard.' };
  if (attempted.has(receipt)) return { state: 'skipped', message: 'This run has already been handled. It will not be submitted again.' };
  attempted.add(receipt); // Before the first await, including failures: never retry a game-over event.
  const session = getSaveSession();
  if (!receipt.valid || typeof receipt.score !== 'number' || !Number.isFinite(receipt.score)
    || !Number.isSafeInteger(receipt.score) || receipt.score < config.minValue || receipt.score > config.maxValue) {
    return { state: 'error', message: 'This run is outside the configured leaderboard score limits. Your personal record is unaffected.' };
  }
  try {
    const access = await checkLeaderboardAccess();
    if (access.state !== 'ready') return access;
    const encryptedScore = await leaderboardDeadline(encryptScore(receipt.score, config.encryptionKey));
    const now = performance.now();
    if (now - lastAttempt < config.cooldownSeconds * 1000) return {
      state: 'skipped', message: 'This run ended inside the leaderboard submission cooldown. Your personal record is unaffected.' };
    lastAttempt = now;
    // Exact documented SDK payload. No secret API endpoint, user ID, or invented receipt.
    await leaderboardDeadline(Promise.resolve().then(() => {
      if (session !== getSaveSession()) throw new Error('The CrazyGames account changed before score submission.');
      return getCrazyGames().user.submitScore({ encryptedScore, score: receipt.score });
    }));
    // The SDK intentionally hides backend validation. Its response is NOT proof of acceptance.
    return { state: 'sent', message: 'Run sent to CrazyGames for validation. Leaderboard placement is not confirmed.' };
  } catch (error) { return { state: 'error', message: leaderboardError(error) }; }
}