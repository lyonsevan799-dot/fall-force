import { CEIL_Y, FLOOR_Y } from '@/game/config';
import { SPIKE_W, rectHit } from '@/game/geom';

// Exact intersection with the same triangular teeth drawn on screen.
// The existing player inset remains forgiving; no rectangular invisible corners.
export default function hitSpikeTeeth(item, height, x, y, w, h, floor = item.side === 'floor') {
  const base = floor ? FLOOR_Y : CEIL_Y;
  if (!(height > 0) || !rectHit(x, y, w, h, item.x, floor ? base - height : base, item.w, height)) return false;
  const teeth = Math.max(1, Math.round(item.w / SPIKE_W)), width = item.w / teeth;
  const nearestBase = floor ? Math.min(base, y + h) : Math.max(base, y);
  const halfWidth = width * 0.5 * Math.max(0, 1 - Math.abs(base - nearestBase) / height);
  const first = Math.max(0, Math.floor((x - item.x) / width));
  const last = Math.min(teeth - 1, Math.floor((x + w - item.x) / width));
  for (let i = first; i <= last; i++) {
    const center = item.x + (i + 0.5) * width;
    if (x <= center + halfWidth && x + w >= center - halfWidth) return true;
  }
  return false;
}