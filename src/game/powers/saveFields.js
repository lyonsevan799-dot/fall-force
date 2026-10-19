import { safeInteger } from '@/game/saveData';
const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
export default function powerSaveFields(source) {
  return { powerInventory: { doubleGems: safeInteger(object(source.powerInventory).doubleGems) },
    powerPurchases: object(source.powerPurchases), powerActivations: object(source.powerActivations),
    levelStruggles: object(source.levelStruggles) };
}