import { PLAYER_SIZE, CEIL_Y, FLOOR_Y, clamp } from '@/game/config';
import { platGeom, vanishGeom, rectHit } from '@/game/geom';

export function activateRaceRush(eng, p, gem) {
  const row = eng.gemGroups.get(gem.groupId);
  if (!row || row.length < 4) return;
  const dir = gem.rowDir || { x: 1, y: 0 };
  const length = Math.hypot(dir.x, dir.y) || 1;
  const nx = dir.x / length, ny = dir.y / length;
  const last = row[row.length - 1];
  const totalLen = (last.x - gem.x) * nx + (last.y - gem.y) * ny;
  if (totalLen <= 0) return;
  p.rush = { dir: { x: nx, y: ny }, startX: gem.x, startY: gem.y,
    s: Math.max(0, (p.px + PLAYER_SIZE / 2 - gem.x) * nx + (p.py + PLAYER_SIZE / 2 - gem.y) * ny), totalLen };
  p.grounded = false; p.groundPlat = null; p.vy = 0;
  p.sx = 0.8; p.sy = 1.2;
  eng.sound.sfx('rush'); eng.addShake(5, 0.2);
  eng.particles.ring(gem.x, gem.y, { r: 8, rv: 420, life: 0.4, color: eng.theme.accent, w: 4 });
}

export function stepRaceRush(eng, p, h) {
  const r = p.rush, size = PLAYER_SIZE;
  const speed = eng.level.speed * p.speedMult;
  r.s += Math.min(r.dir.x > 0.05 ? speed / r.dir.x : speed * 2, speed * 2.4) * h;
  p.px = r.startX + r.dir.x * r.s - size / 2;
  p.py = clamp(r.startY + r.dir.y * r.s - size / 2, CEIL_Y, FLOOR_Y - size);
  eng.checkTriggersPlayer(p);
  if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - h);
  if (p.invuln <= 0) eng.checkHazardsPlayer(p);
  if (!p.alive) return;
  const blocked = eng.solids.some((it) => {
    const g = it.type === 'vanish' ? vanishGeom(it, eng.t) : platGeom(it, eng.t);
    return g.solid && rectHit(p.px + 4, p.py + 4, size - 8, size - 8, g.x, g.y, g.w, g.h);
  });
  if (blocked || r.s >= r.totalLen) {
    p.rush = null; p.grounded = false; p.groundPlat = null;
  }
  if (p.px >= eng.level.length) eng.playerFinish(p);
}