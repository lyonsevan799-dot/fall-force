import { CEIL_Y, FLOOR_Y, PLAYER_SIZE } from '@/game/config';
import { crusherGeom, dropGeom, wallGeom, trapGeom, rectHit } from '@/game/geom';
import hitRunHazard from '@/game/procedural/runCollision';

export default function hitRaceHazard(item, time, player) {
  const x = player.px + 5, y = player.py + 5, size = PLAYER_SIZE - 10;
  switch (item.type) {
    case 'crusher': { const g = crusherGeom(item, time); return rectHit(x, y, size, size, g.x - g.w / 2 + 4, g.y + 4, g.w - 8, g.h - 8); }
    case 'drop': { const g = dropGeom(item, time, player.px); return g.active && rectHit(x, y, size, size, g.x + 3, g.y + 3, g.w - 6, g.h - 6); }
    case 'trap': { const g = trapGeom(item, time, player.px); return g.active && rectHit(x, y, size, size, g.x, g.y, g.w, g.h); }
    case 'wall': { const g = wallGeom(item, time); return (g.topH > 4 && rectHit(x, y, size, size, g.x, CEIL_Y, g.w, g.topH)) || (g.botH > 4 && rectHit(x, y, size, size, g.x, FLOOR_Y - g.botH, g.w, g.botH)); }
    default: return hitRunHazard(item, time, player.px, player.py);
  }
}