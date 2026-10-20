import { PLAYER_SIZE } from '@/game/config';
import hitSpikeTeeth from '@/game/spikeCollision';
import { sawGeom, bladeGeom, laserGeom, mspikeGeom, bounceGeom, circleHit, segmentHit, rectHit } from '@/game/geom';

// Share exact tooth geometry across Career, Endless, Survival and Race.
export default function hitRunHazard(item, time, px, py) {
  const x = px + 5, y = py + 5, size = PLAYER_SIZE - 10;
  switch (item.type) {
    case 'spike': return hitSpikeTeeth(item, item.h || 30, x, y, size, size);
    case 'mspike': return hitSpikeTeeth(item, mspikeGeom(item, time).drawH, x, y, size, size);
    case 'saw': { const g = sawGeom(item, time); return circleHit(g.x, g.y, g.r - 3, x, y, size, size); }
    case 'blade': { const g = bladeGeom(item, time); return segmentHit(g.x1, g.y1, g.x2, g.y2, x, y, size, size, 7); }
    case 'laser': { const g = laserGeom(item, time); return g.active && rectHit(x, y, size, size, g.x + 3, g.y, g.w - 6, g.h); }
    case 'bounce': { const g = bounceGeom(item, time); return circleHit(g.x, g.y, g.r - 3, x, y, size, size); }
    default: return false;
  }
}