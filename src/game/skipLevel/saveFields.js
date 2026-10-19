const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
export default function skipSaveFields(source) {
  // Retire the old inventory and activations without changing the wallet or other progress.
  const { powerInventory: retiredInventory, powerActivations: retiredActivations, powerPurchases: legacyReceipts, ...current } = source;
  const previousSkips = Object.fromEntries(Object.entries(object(legacyReceipts)).filter(([, receipt]) => receipt?.kind === 'skip'));
  return { ...current, skipPurchases: { ...previousSkips, ...object(current.skipPurchases) }, levelStruggles: object(current.levelStruggles) };
}