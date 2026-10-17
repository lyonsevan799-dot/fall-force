const line = (ctx, points, color, width = 1) => {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
};
const facet = (ctx, points, color) => {
  ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
};
export function paintPattern(ctx, id, t) {
  ctx.save();
  if (id === 'crimson') for (let i = -2; i < 3; i++) line(ctx, [[i * 11 - 15, 17], [i * 11 + 15, -17]], '#ffdfcf88', 3);
  if (id === 'ocean') for (let j = -1; j <= 1; j++) {
    ctx.strokeStyle = '#dcffff99'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-20, j * 9);
    ctx.bezierCurveTo(-7, j * 9 - 9, 7, j * 9 + 9, 20, j * 9); ctx.stroke();
  }
  if (id === 'toxic') {
    ctx.strokeStyle = '#e4ff9d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#e6ffbcbb'; ctx.beginPath(); ctx.arc(-10 + i * 10, 8 * Math.sin(t * 1.4 + i * 2), 2.3, 0, 7); ctx.fill(); }
  }
  if (id === 'neon') {
    for (let i = -1; i <= 1; i++) line(ctx, [[-15, i * 11 - 6], [0, i * 11 + 3], [15, i * 11 - 6]], '#f7d1ffbb', 1.5);
    line(ctx, [[-11, -17], [-11, 17]], '#42f5ff88'); line(ctx, [[11, -17], [11, 17]], '#42f5ff88');
  }
  if (id === 'golden') {
    line(ctx, [[-12, -12], [-12, 12], [12, 12], [12, -12], [-12, -12]], '#fff5baaa', 1.5);
    const x = Math.sin(t * 0.8) * 28; facet(ctx, [[x - 11, -17], [x - 3, -17], [x + 11, 17], [x + 3, 17]], '#ffffff66');
  }
  if (id === 'shadow') {
    ctx.strokeStyle = '#bd91ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(4, -2, 11, 1.1, 5.2); ctx.stroke();
    line(ctx, [[-15, 15], [-2, 5], [14, -15]], '#79529e88', 3);
  }
  if (id === 'ice' || id === 'diamond') {
    facet(ctx, [[-17, -17], [0, -9], [-9, 9]], '#ffffffaa');
    facet(ctx, [[17, -17], [0, -9], [9, 9]], '#3c9ad577');
    facet(ctx, [[-17, 17], [-9, 9], [0, -9], [17, 17]], '#dfffff99');
    line(ctx, [[-17, -17], [0, -9], [17, -17]], '#ffffff');
    if (id === 'diamond') {
      facet(ctx, [[0, -14], [13, -3], [0, 15], [-13, -3]], '#ecffff99');
      line(ctx, [[0, -14], [0, 15], [-13, -3], [13, -3], [0, 15]], '#258cbd', 0.7);
    } else for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); line(ctx, [[0, -13], [0, 13]], '#ffffffcc'); ctx.restore(); }
  }
  if (id === 'fireball') {
    const g = ctx.createRadialGradient(0, 5, 0, 0, 5, 23); g.addColorStop(0, '#ffffc8'); g.addColorStop(0.5, '#ffac31'); g.addColorStop(1, '#ec2946');
    ctx.fillStyle = g; ctx.fillRect(-17, -17, 34, 34);
    for (let i = 0; i < 3; i++) line(ctx, [[-13 + i * 12, 17], [-9 + i * 12, 1], [-15 + i * 12, -14]], '#fff4a8aa', 2);
  }
  if (id === 'galaxy') {
    ctx.strokeStyle = '#e5a8ff88'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 0, 21, 8, -0.7, 0, 7); ctx.stroke();
    for (let i = 0; i < 11; i++) {
      const x = ((i * 13) % 31) - 15, y = ((i * 19) % 29) - 14;
      ctx.fillStyle = `rgba(255,255,255,${0.55 + Math.sin(t + i) * 0.3})`; ctx.fillRect(x, y, i % 3 ? 1 : 2, i % 3 ? 1 : 2);
    }
  }
  if (id === 'rainbow') {
    const g = ctx.createLinearGradient(-17, -17, 17, 17);
    ['#ff467b', '#ffab38', '#f8f15a', '#68f2ad', '#48d8ff', '#925bff', '#ff83e8'].forEach((c, i) => g.addColorStop(i / 6, c));
    ctx.fillStyle = g; ctx.fillRect(-17, -17, 34, 34);
    const x = Math.sin(t) * 25; facet(ctx, [[x - 8, -17], [x - 3, -17], [x + 8, 17], [x + 3, 17]], '#ffffff88');
  }
  ctx.restore();
}