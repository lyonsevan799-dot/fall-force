// Start at the player's actual position, then visit every remaining gem.
// No snap to a distant first uncollected gem, and no proximity-only omissions.
export function nextRushSegment(rush) {
  if (rush.target >= rush.points.length) return false;
  if (rush.target > 0) {
    const previous = rush.points[rush.target - 1];
    rush.startX = previous.x; rush.startY = previous.y;
  }
  const point = rush.points[rush.target++];
  const dx = point.x - rush.startX, dy = point.y - rush.startY;
  rush.totalLen = Math.max(0.0001, Math.hypot(dx, dy));
  rush.dir = { x: dx / rush.totalLen, y: dy / rush.totalLen }; rush.s = 0;
  return true;
}
export default function createRush(group, x, y) {
  if (!group || group.length < 4) return null;
  const direction = group[0].rowDir || { x: 1, y: 0 };
  const points = group.filter((gem) => !gem.collected).sort((a, b) =>
    (a.x - b.x) * direction.x + (a.y - b.y) * direction.y);
  if (!points.length) return null;
  const rush = { points, target: 0, startX: x, startY: y };
  nextRushSegment(rush);
  return rush;
}