import { skipPrice, canSkip } from '@/game/skipLevel/catalog';
import { LEVEL_COUNT } from '@/game/levels';
export function skipLevel(save, index, id) {
  const price = skipPrice(index);
  if (typeof id !== 'string' || !id) throw new Error('Invalid purchase. No gems were spent.');
  const previous = save.skipPurchases?.[id];
  if (previous) {
    if (previous.levelIndex !== index) throw new Error('Invalid level receipt. No gems were spent.');
    return save;
  }
  // Re-check inside the serialized save transaction, not just in the interface.
  if (!canSkip(save, index)) throw new Error('This level is locked or already completed. No gems were spent.');
  if (!Number.isSafeInteger(save.totalGems) || save.totalGems < 0) throw new Error('Invalid gems balance. Nothing was spent.');
  if (save.totalGems < price) throw new Error(`You need ${(price - save.totalGems).toLocaleString()} more gems.`);
  return { ...save, totalGems: save.totalGems - price,
    levels: { ...save.levels, [index]: { completed: true, skipped: true, skippedAt: Date.now(), stars: 0, time: null } },
    unlocked: Math.max(save.unlocked || 0, Math.min(index + 1, LEVEL_COUNT - 1)),
    skipPurchases: { ...save.skipPurchases, [id]: { kind: 'skip', levelIndex: index, price, at: Date.now() } } };
}