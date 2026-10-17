import { AD_CONFIG } from '@/game/platform/ads/config';
import { safeInteger } from '@/game/saveData';

// Keep an unsaved, SDK-confirmed completion across menu navigation; saving retries never request another ad.
let pendingCompletion = null;
export const getPendingAdReward = () => pendingCompletion;
export const keepPendingAdReward = (completion) => { pendingCompletion = completion; };
export const clearPendingAdReward = (id) => { if (pendingCompletion?.id === id) pendingCompletion = null; };

// A completion receipt and its wallet credit are persisted in one transaction.
export default function creditAdReward(save, completion) {
  if (completion?.status !== 'finished' || completion.type !== 'rewarded' || typeof completion.id !== 'string') return save;
  if (save.adRewards?.[completion.id]) return save;
  return { ...save, totalGems: safeInteger(safeInteger(save.totalGems) + AD_CONFIG.rewardGems),
    adRewards: { ...save.adRewards, [completion.id]: { amount: AD_CONFIG.rewardGems, creditedAt: Date.now() } } };
}