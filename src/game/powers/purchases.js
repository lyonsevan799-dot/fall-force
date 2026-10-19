import { DOUBLE_GEMS_PRICE, skipPrice, canSkip, ownedDoubleGems } from '@/game/powers/catalog';
import { LEVEL_COUNT } from '@/game/levels';
function charge(save, price) {
  if (!Number.isSafeInteger(save.totalGems) || save.totalGems < 0) throw new Error('Invalid gems balance. Nothing was spent.');
  if (save.totalGems < price) throw new Error(`You need ${(price - save.totalGems).toLocaleString()} more gems.`);
  return save.totalGems - price;
}
function receipt(save, id, kind) {
  if (typeof id !== 'string' || !id) throw new Error('Invalid purchase. No gems were spent.');
  const previous = save.powerPurchases?.[id];
  if (previous && previous.kind !== kind) throw new Error('Invalid purchase receipt. No gems were spent.');
  return previous;
}
export function buyDoubleGems(save, id) {
  if (receipt(save, id, 'doubleGems')) return save;
  const owned = ownedDoubleGems(save);
  if (!Number.isSafeInteger(owned) || owned >= Number.MAX_SAFE_INTEGER) throw new Error('Inventory is full. No gems were spent.');
  return { ...save, totalGems: charge(save, DOUBLE_GEMS_PRICE), powerInventory: { ...save.powerInventory, doubleGems: owned + 1 },
    powerPurchases: { ...save.powerPurchases, [id]: { kind: 'doubleGems', price: DOUBLE_GEMS_PRICE, at: Date.now() } } };
}
export function skipLevel(save, index, id) {
  const price = skipPrice(index), previous = receipt(save, id, 'skip');
  if (previous) {
    if (previous.levelIndex !== index) throw new Error('Invalid level receipt. No gems were spent.');
    return save;
  }
  if (!canSkip(save, index)) throw new Error('This level is locked or already completed. No gems were spent.');
  return { ...save, totalGems: charge(save, price),
    levels: { ...save.levels, [index]: { completed: true, skipped: true, skippedAt: Date.now(), stars: 0, time: null } },
    unlocked: Math.max(save.unlocked || 0, Math.min(index + 1, LEVEL_COUNT - 1)),
    powerPurchases: { ...save.powerPurchases, [id]: { kind: 'skip', levelIndex: index, price, at: Date.now() } } };
}