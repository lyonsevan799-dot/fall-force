// Gem membership is built once per course/chunk, not sorted every render.
export default function drawGemRows(ctx, engine, left, viewWidth) {
  const groups = engine.gemGroups || {};
  ctx.save();
  ctx.strokeStyle = engine.theme.accent;
  for (const id in groups) {
    const gems = groups[id];
    let count = 0, first = null, last = null;
    for (const gem of gems) {
      if (gem.collected) continue;
      count++; if (!first) first = gem; last = gem;
    }
    if (count < 4 || last.x < left - 100 || first.x > left + viewWidth + 100) continue;
    const pulse = engine.settings.reduced ? 0.6 : 0.5 + 0.3 * Math.sin(engine.t * 3 + first.x * 0.01);
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (const gem of gems) if (!gem.collected && gem !== first) ctx.lineTo(gem.x, gem.y);
    ctx.globalAlpha = 0.1 * pulse; ctx.lineWidth = 9; ctx.stroke();
    ctx.globalAlpha = 0.22 * pulse; ctx.lineWidth = 2.5; ctx.stroke();
  }
  ctx.restore();
}