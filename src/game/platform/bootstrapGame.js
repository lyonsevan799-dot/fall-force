import { initializeCrazyGames } from '@/game/platform/crazyGames';
import { startLoading } from '@/game/platform/gameEvents';
import { initializeSaveStore } from '@/game/platform/saveStore';
import { decodeProgress } from '@/game/progress';

let boot;
export default function bootstrapGame() {
  if (!boot) boot = (async () => {
    const sdk = await initializeCrazyGames();
    startLoading();
    initializeSaveStore(sdk, decodeProgress);
    // Home and every engine mount only after SDK preload, migration, and save validation.
  })();
  return boot;
}