import { initializeCrazyGames } from '@/game/platform/crazyGames';
import { startLoading } from '@/game/platform/gameEvents';
import { initializeSaveStore } from '@/game/platform/saveStore';
import { decodeProgress } from '@/game/progress';
import { initializeAccounts } from '@/game/platform/accounts';

let boot;
export default function bootstrapGame() {
  if (!boot) boot = (async () => {
    const sdk = await initializeCrazyGames();
    startLoading();
    initializeSaveStore(sdk, decodeProgress);
    initializeAccounts(sdk);
    // Home and every engine mount only after SDK preload, migration, and save validation.
  })();
  return boot;
}