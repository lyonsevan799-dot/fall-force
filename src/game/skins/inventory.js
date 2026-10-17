import { SKINS } from '@/game/skins/catalog';

const valid = (id) => SKINS.some((skin) => skin.id === id);
export function skinSaveFields(source) {
  const ownedSkins = [...new Set((Array.isArray(source.ownedSkins) ? source.ownedSkins : []).filter(valid))];
  const equipped = source.equippedSkins || {};
  const available = (id) => id === 'classic' || ownedSkins.includes(id);
  const solo = available(equipped.solo) ? equipped.solo : 'classic';
  return { ownedSkins, equippedSkins: { solo,
    p1: equipped.p1 == null ? null : available(equipped.p1) ? equipped.p1 : null,
    p2: available(equipped.p2) ? equipped.p2 : 'classic' },
    skinPurchases: source.skinPurchases && typeof source.skinPurchases === 'object' && !Array.isArray(source.skinPurchases) ? source.skinPurchases : {} };
}
export const skinForTarget = (save, target = 'solo') => save.equippedSkins?.[target] || save.equippedSkins?.solo || 'classic';

// Called only inside the shared save transaction, using its latest balance.
export function purchaseSkin(save, id) {
  const skin = SKINS.find((s) => s.id === id);
  if (!skin) throw new Error('This skin is not available.');
  if (save.ownedSkins.includes(id)) return save;
  if (save.totalGems < skin.price) throw new Error(`You need ${(skin.price - save.totalGems).toLocaleString()} more gems.`);
  return { ...save, totalGems: save.totalGems - skin.price, ownedSkins: [...save.ownedSkins, id],
    skinPurchases: { ...save.skinPurchases, [id]: { price: skin.price, purchasedAt: Date.now() } } };
}
export function equipSkin(save, id, target) {
  if (!['solo', 'p1', 'p2'].includes(target)) throw new Error('Choose a valid player.');
  if (id !== 'classic' && !save.ownedSkins.includes(id)) throw new Error('Purchase this skin before equipping it.');
  if (!valid(id)) throw new Error('This skin is not available.');
  return { ...save, equippedSkins: { ...save.equippedSkins, [target]: id } };
}