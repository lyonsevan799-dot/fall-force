import { CEIL_Y, FLOOR_Y, PLAYER_SIZE } from '@/game/config';
import { platGeom, vanishGeom, rectHit } from '@/game/geom';

const geometry = (item, time) => item.type === 'vanish' ? vanishGeom(item, time) : platGeom(item, time);
const across = (x, g) => x + PLAYER_SIZE > g.x && x < g.x + g.w;
const release = (engine) => { engine.grounded = false; engine.groundPlat = null; engine.vy = 0; };
export function carryPlatform(engine, h, time = engine.t) {
  const item = engine.groundPlat;
  if (!engine.grounded || !item) return;
  const previous = geometry(item, time - h), current = geometry(item, time);
  if (!current.solid || !across(engine.px, previous)) { release(engine); return; }
  engine.px += current.x - previous.x;
  engine.py += current.y - previous.y;
}

// Sweep against both platform faces using relative motion, not gravity direction.
// A flip during ascent must not let the body pass through an underside.
export default function resolveSurfaceCollision(engine, prevY, prevX, world = engine, land = (item) => engine.land(item)) {
  const size = PLAYER_SIZE, epsilon = 0.01;
  let blocked = false;
  const verticalContact = (y, direction, item) => {
    engine.py = y; blocked = true;
    if (engine.dir === direction) land(item);
    else { engine.vy = 0; engine.grounded = false; engine.groundPlat = null; }
  };
  if (engine.py + size >= FLOOR_Y) {
    engine.py = FLOOR_Y - size;
    if (engine.dir === 1) land(null); else engine.vy = Math.min(0, engine.vy);
  } else if (engine.py <= CEIL_Y) {
    engine.py = CEIL_Y;
    if (engine.dir === -1) land(null); else engine.vy = Math.max(0, engine.vy);
  }
  for (const item of world.solids) {
    const g = geometry(item, world.t);
    if (!g.solid) continue;
    const old = geometry(item, world.t - (world.physicsStep || 0));
    const dy = engine.py - prevY - (g.y - old.y);
    if (across(engine.px, g)) {
      if (prevY + size <= old.y + epsilon && engine.py + size >= g.y && dy >= -epsilon) {
        verticalContact(g.y - size, 1, item); continue;
      }
      if (prevY >= old.y + old.h - epsilon && engine.py <= g.y + g.h && dy <= epsilon) {
        verticalContact(g.y + g.h, -1, item); continue;
      }
    }
    if (!rectHit(engine.px, engine.py, size, size, g.x, g.y, g.w, g.h)) continue;
    blocked = true;
    if (prevX + size <= old.x + epsilon) engine.px = g.x - size;
    else if (prevX >= old.x + old.w - epsilon) engine.px = g.x + g.w;
    else if (engine.py + size - g.y < g.y + g.h - engine.py) verticalContact(g.y - size, 1, item);
    else verticalContact(g.y + g.h, -1, item);
  }
  if (engine.groundPlat) {
    const support = geometry(engine.groundPlat, world.t);
    if (!support.solid || !across(engine.px, support)) release(engine);
  }
  return blocked;
}