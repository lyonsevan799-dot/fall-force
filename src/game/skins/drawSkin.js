import { getSkin } from '@/game/skins/catalog';
import { paintPattern } from '@/game/skins/patterns';

function box(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
// The exact same 34-unit cosmetic is used by previews and every game renderer.
// This function only draws: it never modifies a player or any collision geometry.
export default function drawSkin(ctx, id, { time = 0, reduced = false } = {}) {
  const skin = getSkin(id), t = reduced ? 0 : time, edge = skin.edge || skin.colors[1];
  ctx.save();
  ctx.shadowColor = edge; ctx.shadowBlur = reduced ? 0 : skin.rarity === 'Legendary' ? 13 : skin.rarity === 'Epic' ? 9 : 5;
  ctx.fillStyle = `${edge}33`; box(ctx, -22, -22, 44, 44, 12); ctx.fill();
  ctx.shadowBlur = 0;
  if (skin.id === 'fireball') {
    for (let i = 0; i < 3; i++) {
      const x = -12 + i * 12, tip = -25 - Math.sin(t * 5 + i) * 3;
      ctx.fillStyle = i === 1 ? '#ffe57a' : '#ff7434'; ctx.beginPath(); ctx.moveTo(x - 6, -11);
      ctx.quadraticCurveTo(x - 8, -22, x + 2, tip); ctx.quadraticCurveTo(x - 1, -17, x + 7, -11); ctx.fill();
    }
  }
  const gradient = ctx.createLinearGradient(0, -17, 0, 17);
  skin.colors.forEach((color, i) => gradient.addColorStop(i / 2, color));
  ctx.fillStyle = gradient; box(ctx, -17, -17, 34, 34, 9); ctx.fill();
  ctx.save(); box(ctx, -17, -17, 34, 34, 9); ctx.clip(); paintPattern(ctx, skin.id, t); ctx.restore();
  ctx.strokeStyle = skin.edge || skin.colors[0]; ctx.lineWidth = skin.rarity === 'Legendary' ? 1.5 : 0.8;
  box(ctx, -17, -17, 34, 34, 9); ctx.stroke();
  ctx.fillStyle = '#040510bb'; box(ctx, -6, -2, 12, 8, 4); ctx.fill();
  if (skin.id === 'shadow') { ctx.fillStyle = '#d5b6ff'; ctx.fillRect(-4, 0, 8, 2); }
  ctx.save(); ctx.globalAlpha *= 0.85; ctx.fillStyle = '#ffffff'; box(ctx, -12, -13, 24, 3, 2); ctx.fill(); ctx.restore();
  if (skin.rarity === 'Legendary') for (let i = 0; i < 3; i++) {
    const a = t * 0.7 + i * Math.PI * 2 / 3, x = Math.cos(a) * 24, y = Math.sin(a) * 24;
    ctx.strokeStyle = skin.id === 'fireball' ? '#ffd46e' : skin.colors[0]; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + 2, y); ctx.moveTo(x, y - 2); ctx.lineTo(x, y + 2); ctx.stroke();
  }
  ctx.restore();
}