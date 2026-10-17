import { callGame } from '@/game/platform/crazyGames';
let loading = false, playing = false, context = null, percentage = null;
let desiredPlaying = false, adBlocked = false;
export function setAdGameplayBlocked(blocked) { adBlocked = blocked; setGameplay(desiredPlaying); }
export function startLoading() { if (!loading && callGame('loadingStart')) loading = true; }
export function stopLoading() { if (loading && callGame('loadingStop')) loading = false; }
export function setGameplay(active) {
  desiredPlaying = active;
  active = active && !adBlocked;
  if (playing === active) return;
  if (callGame(active ? 'gameplayStart' : 'gameplayStop')) playing = active;
}
export function setLevelContext(level) {
  if (level === context) return;
  if (level === null ? callGame('clearGameContext') : callGame('setGameContext', { level })) context = level;
}
export function reportCompletion(value) {
  const next = Math.min(100, Math.max(0, Math.floor(value)));
  if (next !== percentage && callGame('reportGameCompletedPercentage', next)) percentage = next;
}