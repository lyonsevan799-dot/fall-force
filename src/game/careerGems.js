import { gemClear, placeRow } from '@/game/gemPlace';

// Authored gems must be checked AFTER all section hazards have been emitted.
export default function validateCareerGems(items) {
  const authored = items.filter((item) => item.type === 'gem');
  if (!authored.length) return;
  const groups = new Map();
  for (let i = items.length - 1; i >= 0; i--) if (items[i].type === 'gem') items.splice(i, 1);
  for (const gem of authored) {
    if (gem.groupId == null) {
      if (gemClear(items, gem.x, gem.y, gem.r)) items.push(gem);
    } else {
      if (!groups.has(gem.groupId)) groups.set(gem.groupId, []);
      groups.get(gem.groupId).push(gem);
    }
  }
  for (const gems of groups.values()) {
    gems.sort((a, b) => a.x - b.x);
    const first = gems[0], last = gems[gems.length - 1];
    const dx = last.x - first.x, dy = last.y - first.y;
    placeRow(items, first.x, first.y, gems.length, dx, dy, Math.hypot(dx, dy) / (gems.length - 1));
  }
}