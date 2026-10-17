import drawSkin from '@/game/skins/drawSkin';
import { PLAYER_SIZE } from '@/game/config';

export function ghostPosition(ghost, ms) {
  if (!ghost || ms < 0 || ms > ghost.timeMs) return null;
  const last = ghost.points.length - 1;
  const index = Math.min(last - 1, Math.floor(ms / ghost.stepMs));
  const fromTime = index * ghost.stepMs, toTime = index + 1 === last ? ghost.timeMs : (index + 1) * ghost.stepMs;
  const alpha = Math.max(0, Math.min(1, (ms - fromTime) / Math.max(1, toTime - fromTime)));
  return ghost.points[index].map((value, axis) => value + (ghost.points[index + 1][axis] - value) * alpha);
}
// Rendering only: no physics body, input replay, pickups, triggers, or engine writes.
export default function drawTrialGhost(ctx, engine, ghost) {
  if (engine.state !== 'playing') return;
  const position = ghostPosition(ghost, engine.attemptTime * 1000);
  if (!position) return;
  ctx.save(); ctx.translate(position[0] + PLAYER_SIZE / 2, position[1] + PLAYER_SIZE / 2); ctx.rotate(position[2]);
  ctx.globalAlpha = 0.25; drawSkin(ctx, ghost.skinId, { time: engine.attemptTime, reduced: true });
  ctx.globalAlpha = 0.8; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
  ctx.strokeRect(-PLAYER_SIZE / 2 - 2, -PLAYER_SIZE / 2 - 2, PLAYER_SIZE + 4, PLAYER_SIZE + 4); ctx.restore();
}