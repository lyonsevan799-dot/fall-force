// Retire complete rows together; never leave ordinary tail gems with no trigger.
export function cullRunWorld(engine) {
  if (engine.px - engine._lastCull < 400) return;
  engine._lastCull = engine.px;
  const cut = engine.px - 900, items = engine._level.items;
  const groups = new Set(items.filter((item) => item.groupId != null && item.x >= cut).map((item) => item.groupId));
  if (engine.rush) for (const point of engine.rush.points) groups.add(point.groupId);
  engine._level.items = engine._gen.items = items.filter((item) =>
    item.x + (item.w || item.arm || item.r || 0) >= cut || groups.has(item.groupId));
  engine._rebuild();
}

// Keep render/collision coordinates small without resetting score, distance,
// timers, difficulty, collected flags, or the active row's shared gem objects.
export function rebaseRunWorld(engine) {
  if (engine.px < 1000000) return;
  const shift = Math.floor(engine.px / 500000) * 500000;
  engine.px -= shift; engine._gen.x -= shift; engine._level.length -= shift;
  engine._lastCull -= shift;
  for (const item of engine._level.items) {
    item.x -= shift;
    if (Number.isFinite(item.x0)) item.x0 -= shift;
    if (Number.isFinite(item.x1)) item.x1 -= shift;
  }
  if (engine.rush) engine.rush.startX -= shift;
  for (const point of engine.trail) point.x -= shift;
  for (const particle of engine.particles.pool) if (particle.alive) particle.x -= shift;
}