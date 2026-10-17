import { CEIL_Y, FLOOR_Y, PLAYER_SIZE } from '@/game/config';
import { sawGeom, bladeGeom, laserGeom, mspikeGeom, bounceGeom, circleHit, segmentHit, rectHit } from '@/game/geom';

// Triangle/rectangle SAT uses the SAME individual teeth as the renderer.
// The five-unit player inset is forgiving, never an expanded invisible hazard.
function triangleHit(vertices, x, y, w, h) {
  const axes = [[1, 0], [0, 1]];
  for (let i = 0; i < 3; i++) {
    const a = vertices[i], b = vertices[(i + 1) % 3];
    axes.push([a[1] - b[1], b[0] - a[0]]);
  }
  for (const [ax, ay] of axes) {
    const projections = vertices.map(([vx, vy]) => vx * ax + vy * ay);
    const center = (x + w / 2) * ax + (y + h / 2) * ay;
    const radius = Math.abs(ax) * w / 2 + Math.abs(ay) * h / 2;
    if (Math.max(...projections) < center - radius || Math.min(...projections) > center + radius) return false;
  }
  return true;
}
function teethHit(item, height, x, y, w, h) {
  const floor = item.side === 'floor', base = floor ? FLOOR_Y : CEIL_Y;
  const top = floor ? base - height : base;
  if (!(height > 0) || !rectHit(x, y, w, h, item.x, top, item.w, height)) return false;
  const n = Math.max(1, Math.round(item.w / 34)), width = item.w / n;
  for (let i = 0; i < n; i++) {
    const left = item.x + i * width;
    if (triangleHit([[left, base], [left + width / 2, base + (floor ? -height : height)], [left + width, base]], x, y, w, h)) return true;
  }
  return false;
}
export default function hitRunHazard(item, time, px, py) {
  const x = px + 5, y = py + 5, size = PLAYER_SIZE - 10;
  switch (item.type) {
    case 'spike': return teethHit(item, item.h || 30, x, y, size, size);
    case 'mspike': return teethHit(item, mspikeGeom(item, time).drawH, x, y, size, size);
    case 'saw': { const g = sawGeom(item, time); return circleHit(g.x, g.y, g.r - 3, x, y, size, size); }
    case 'blade': { const g = bladeGeom(item, time); return segmentHit(g.x1, g.y1, g.x2, g.y2, x, y, size, size, 7); }
    case 'laser': { const g = laserGeom(item, time); return g.active && rectHit(x, y, size, size, g.x + 3, g.y, g.w - 6, g.h); }
    case 'bounce': { const g = bounceGeom(item, time); return circleHit(g.x, g.y, g.r - 3, x, y, size, size); }
    default: return false;
  }
}