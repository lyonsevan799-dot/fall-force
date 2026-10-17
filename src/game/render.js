import { CEIL_Y, FLOOR_Y, MID_Y, WORLD_H, VIEW_W, VIEW_H, PLAYER_SIZE, clamp } from './config';
import {
  spikeGeom, sawGeom, bladeGeom, crusherGeom, laserGeom, platGeom, vanishGeom,
  mspikeGeom, dropGeom, wallGeom, bounceGeom, trapGeom,
  SPIKE_W, SPIKE_H, LASER_W, PLAT_H,
} from './geom';

import drawSkin from '@/game/skins/drawSkin';
import { getSkin } from '@/game/skins/catalog';

// ---------- helpers ----------
function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function mulberry32(a) {
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const bgCache = {};
function getBg(index, length, seed) {
  if (bgCache[index]) return bgCache[index];
  const rng = mulberry32(1000 + index * 977);
  const range = index < 0 ? 100000 : length + 900;
  const stars = [];
  for (let i = 0; i < 90; i++) {
    stars.push({
      x: -200 + rng() * range,
      y: rng() * WORLD_H,
      r: 0.8 + rng() * 2.1,
      p: rng() * 6.28,
      sp: 0.6 + rng() * 1.6,
    });
  }
  const shapes = [];
  for (let i = 0; i < 16; i++) {
    shapes.push({
      x: -200 + rng() * range,
      y: 60 + rng() * (WORLD_H - 120),
      s: 40 + rng() * 120,
      rot: rng() * 6.28,
      sp: (rng() - 0.5) * 0.18,
      sides: rng() > 0.5 ? 3 : 4,
    });
  }
  bgCache[index] = { stars, shapes };
  return bgCache[index];
}

// ---------- background ----------
function drawParallax(ctx, eng, s, tx, ty, w, h, camLeft, camTop, viewW) {
  const theme = eng.theme;
  const bg = getBg(eng.levelIndex, eng.level.length);
  const t = eng.t;

  // grid (slow layer)
  const gp = 0.72;
  const spacing = 160;
  const left = camLeft * gp;
  const top = camTop * gp;
  ctx.lineWidth = 1;
  ctx.strokeStyle = hexA(theme.grid, 0.07);
  ctx.beginPath();
  const gx0 = Math.floor(left / spacing) * spacing;
  for (let gx = gx0; gx < left + viewW + spacing; gx += spacing) {
    const sx = (gx - left) * s;
    ctx.moveTo(sx, 0); ctx.lineTo(sx, h);
  }
  const gy0 = Math.floor(top / spacing) * spacing;
  for (let gy = gy0; gy < top + h / s + spacing; gy += spacing) {
    const sy = (gy - top) * s;
    ctx.moveTo(0, sy); ctx.lineTo(w, sy);
  }
  ctx.stroke();

  // floating shapes
  ctx.lineWidth = 1.5;
  for (let i = 0; i < bg.shapes.length; i++) {
    const sh = bg.shapes[i];
    const sx = (sh.x - camLeft * 0.42) * s;
    if (sx < -220 || sx > w + 220) continue;
    const sy = (sh.y - camTop * 0.42) * s;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(sh.rot + t * sh.sp);
    ctx.strokeStyle = hexA(theme.accent, 0.09);
    const r = sh.s * s;
    ctx.beginPath();
    for (let k = 0; k <= sh.sides; k++) {
      const a = (k / sh.sides) * Math.PI * 2;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  // stars
  for (let i = 0; i < bg.stars.length; i++) {
    const st = bg.stars[i];
    const sx = (st.x - camLeft * 0.3) * s;
    if (sx < -40 || sx > w + 40) continue;
    const sy = (st.y - camTop * 0.3) * s;
    const a = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * st.sp + st.p));
    ctx.fillStyle = hexA(theme.star, a);
    const r = st.r * s;
    ctx.fillRect(sx, sy, r, r);
  }
}

// ---------- world ----------
function drawTerrain(ctx, eng, camLeft, viewW) {
  const theme = eng.theme;
  const x0 = camLeft - 120;
  const x1 = camLeft + viewW + 120;
  const W = x1 - x0;

  const cg = ctx.createLinearGradient(0, CEIL_Y - 300, 0, CEIL_Y + 10);
  cg.addColorStop(0, theme.bg[0]);
  cg.addColorStop(1, theme.ground);
  ctx.fillStyle = cg;
  ctx.fillRect(x0, CEIL_Y - 320, W, 320);

  const fg = ctx.createLinearGradient(0, FLOOR_Y - 10, 0, FLOOR_Y + 260);
  fg.addColorStop(0, theme.ground);
  fg.addColorStop(1, theme.bg[2]);
  ctx.fillStyle = fg;
  ctx.fillRect(x0, FLOOR_Y, W, 320);

  // surface ticks for speed perception
  ctx.fillStyle = hexA(theme.grid, 0.18);
  const spacing = 120;
  const startX = Math.floor(x0 / spacing) * spacing;
  for (let x = startX; x < x1; x += spacing) {
    ctx.fillRect(x + 2, CEIL_Y, 34, 4);
    ctx.fillRect(x + 2, FLOOR_Y - 4, 34, 4);
  }

  // glowing edges
  ctx.fillStyle = hexA(theme.edge, 0.22);
  ctx.fillRect(x0, CEIL_Y - 7, W, 7);
  ctx.fillRect(x0, FLOOR_Y, W, 7);
  ctx.fillStyle = theme.edge;
  ctx.fillRect(x0, CEIL_Y, W, 3);
  ctx.fillRect(x0, FLOOR_Y - 3, W, 3);
}

function spikePath(ctx, x, baseY, w, h, up) {
  ctx.beginPath();
  const n = Math.max(1, Math.round(w / SPIKE_W));
  const sw = w / n;
  for (let i = 0; i < n; i++) {
    const sx = x + i * sw;
    if (up) {
      ctx.moveTo(sx, baseY);
      ctx.lineTo(sx + sw / 2, baseY - h);
      ctx.lineTo(sx + sw, baseY);
    } else {
      ctx.moveTo(sx, baseY);
      ctx.lineTo(sx + sw / 2, baseY + h);
      ctx.lineTo(sx + sw, baseY);
    }
  }
  ctx.closePath();
}

function drawHazards(ctx, eng) {
  const theme = eng.theme;
  const t = eng.t;
  const items = eng.level.items;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    switch (it.type) {
      case 'spike': {
        const up = it.side === 'floor';
        const baseY = up ? FLOOR_Y : CEIL_Y;
        const sh = it.h || SPIKE_H;
        const grad = ctx.createLinearGradient(0, up ? baseY : baseY + sh, 0, up ? baseY - sh : baseY);
        grad.addColorStop(0, theme.hazard);
        grad.addColorStop(1, hexA(theme.hazard, 0.45));
        ctx.fillStyle = grad;
        spikePath(ctx, it.x, baseY, it.w, sh, up);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.55;
        spikePath(ctx, it.x + 2, baseY, it.w - 4, sh - 4, up);
        ctx.globalAlpha = 0.14;
        ctx.fill();
        ctx.globalAlpha = 1;
        // Beginner hint: a soft pulsing chevron on the safe side, shown only
        // on the first few obstacles of tutorial levels. Fades out as the
        // player closes in so it never clutters the moment of action.
        if (it.hint) {
          const dist = (it.x + it.w / 2) - eng.px;
          if (dist > 20 && dist < 1200) {
            const closeFade = clamp((dist - eng.level.step * 0.6) / (eng.level.step * 0.9), 0, 1);
            const pulse = 0.5 + 0.5 * Math.sin(eng.t * 4 + it.x * 0.02);
            const alpha = closeFade * (0.22 + 0.28 * pulse);
            if (alpha > 0.01) {
              const ax = it.x + it.w / 2;
              const ay = up ? FLOOR_Y - 92 : CEIL_Y + 92;
              ctx.save();
              ctx.translate(ax, ay);
              if (!up) ctx.scale(1, -1);
              ctx.strokeStyle = hexA(theme.accent, alpha);
              ctx.lineWidth = 3;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              const s = 13 + 3 * pulse;
              ctx.beginPath();
              ctx.moveTo(-s, s * 0.5); ctx.lineTo(0, -s * 0.6); ctx.lineTo(s, s * 0.5);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(-s, s * 1.4); ctx.lineTo(0, s * 0.3); ctx.lineTo(s, s * 1.4);
              ctx.stroke();
              ctx.restore();
            }
          }
        }
        break;
      }
      case 'saw': {
        const g = sawGeom(it, t);
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(t * it.spin);
        ctx.fillStyle = hexA(theme.hazard, 0.18);
        for (let k = 0; k < 8; k++) {
          ctx.save();
          ctx.rotate((k / 8) * Math.PI * 2);
          ctx.beginPath();
          ctx.moveTo(-g.r * 0.34, -g.r * 0.72);
          ctx.lineTo(g.r * 0.34, -g.r * 0.72);
          ctx.lineTo(0, -g.r * 1.14);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = theme.ground;
        ctx.beginPath(); ctx.arc(0, 0, g.r * 0.78, 0, 6.2832); ctx.fill();
        ctx.fillStyle = theme.hazard;
        ctx.beginPath(); ctx.arc(0, 0, g.r * 0.42, 0, 6.2832); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.arc(0, 0, g.r * 0.16, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
        ctx.strokeStyle = hexA(theme.hazard, 0.5);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(g.x, g.y, g.r + 2, 0, 6.2832); ctx.stroke();
        break;
      }
      case 'blade': {
        const g = bladeGeom(it, t);
        ctx.save();
        ctx.translate(it.x, it.y);
        ctx.rotate(g.a);
        ctx.fillStyle = hexA(theme.hazard, 0.9);
        rr(ctx, -g.L / 2, -8, g.L, 16, 8);
        ctx.fill();
        ctx.fillStyle = hexA(theme.hazard, 0.25);
        rr(ctx, -g.L / 2, -14, g.L, 28, 12);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.75;
        rr(ctx, -g.L / 2 + 6, -3, g.L - 12, 6, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
        ctx.fillStyle = theme.bg[0];
        ctx.beginPath(); ctx.arc(it.x, it.y, 13, 0, 6.2832); ctx.fill();
        ctx.fillStyle = hexA(theme.accent, 0.9);
        ctx.beginPath(); ctx.arc(it.x, it.y, 7, 0, 6.2832); ctx.fill();
        break;
      }
      case 'crusher': {
        const g = crusherGeom(it, t);
        const down = it.side === 'floor';
        const glow = g.phase === 'warn' ? g.warn : g.phase === 'slam' || g.phase === 'hold' ? 1 : 0.3;
        // housing
        ctx.fillStyle = hexA(theme.edge, 0.28);
        ctx.fillRect(g.x - g.w / 2 - 6, down ? FLOOR_Y - 26 : CEIL_Y, g.w + 12, 26);
        // block
        ctx.save();
        if (g.phase === 'warn') ctx.translate(Math.sin(t * 60) * 1.6, 0);
        const bx = g.x - g.w / 2;
        ctx.fillStyle = theme.ground;
        rr(ctx, bx, g.y, g.w, g.h, 6);
        ctx.fill();
        ctx.fillStyle = hexA(theme.hazard, 0.35 + glow * 0.5);
        rr(ctx, bx + 4, g.y + 4, g.w - 8, g.h - 8, 4);
        ctx.fill();
        ctx.fillStyle = hexA('#ffffff', 0.25 + glow * 0.5);
        ctx.fillRect(bx + 6, g.y + 6, g.w - 12, 5);
        ctx.restore();
        if (g.phase === 'warn') {
          ctx.strokeStyle = hexA(theme.hazard, 0.25 + glow * 0.5);
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 10]);
          ctx.beginPath();
          ctx.moveTo(g.x, down ? FLOOR_Y : CEIL_Y);
          ctx.lineTo(g.x, down ? CEIL_Y : FLOOR_Y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        break;
      }
      case 'laser': {
        const g = laserGeom(it, t);
        const host = it.host || 'floor';
        const padY = host === 'floor' ? FLOOR_Y - 10 : CEIL_Y;
        ctx.fillStyle = hexA(theme.accent, 0.35);
        rr(ctx, it.x - 16, host === 'floor' ? FLOOR_Y - 12 : CEIL_Y, 32, 12, 3);
        ctx.fill();
        if (g.active) {
          const grad = ctx.createLinearGradient(g.x, 0, g.x + LASER_W, 0);
          grad.addColorStop(0, hexA(theme.accent, 0.15));
          grad.addColorStop(0.5, hexA(theme.accent, 0.95));
          grad.addColorStop(1, hexA(theme.accent, 0.15));
          ctx.fillStyle = grad;
          ctx.fillRect(g.x, g.y, g.w, g.h);
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.85;
          ctx.fillRect(g.x + g.w / 2 - 2, g.y, 4, g.h);
          ctx.globalAlpha = 1;
          ctx.fillStyle = hexA(theme.accent, 0.9);
          ctx.beginPath(); ctx.arc(it.x, padY, 8, 0, 6.2832); ctx.fill();
        } else if (g.warn) {
          ctx.strokeStyle = hexA('#ffffff', 0.2 + 0.6 * g.warnK);
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 8]);
          ctx.beginPath();
          ctx.moveTo(it.x, host === 'floor' ? FLOOR_Y - 12 : CEIL_Y);
          ctx.lineTo(it.x, host === 'floor' ? CEIL_Y : FLOOR_Y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.strokeStyle = hexA(theme.accent, 0.4);
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(it.x, padY, 12, 0, 6.2832); ctx.stroke();
        break;
      }
      case 'mspike': {
        const g = mspikeGeom(it, t);
        const up = g.floor;
        const baseY = up ? FLOOR_Y : CEIL_Y;
        ctx.fillStyle = hexA(theme.ground, 0.7);
        ctx.fillRect(it.x - 2, up ? FLOOR_Y - 6 : CEIL_Y, it.w + 4, 6);
        if (g.ext > 0.02) {
          const sh = g.drawH;
          const grad = ctx.createLinearGradient(0, up ? baseY : baseY + sh, 0, up ? baseY - sh : baseY);
          grad.addColorStop(0, theme.hazard);
          grad.addColorStop(1, hexA(theme.hazard, 0.45));
          ctx.fillStyle = grad;
          spikePath(ctx, it.x, baseY, it.w, sh, up);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.55;
          spikePath(ctx, it.x + 2, baseY, it.w - 4, Math.max(2, sh - 4), up);
          ctx.globalAlpha = 0.14;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        break;
      }
      case 'drop': {
        const g = dropGeom(it, t, eng.px);
        if (g.phase === 'idle') break;
        if (g.phase === 'shake' || g.phase === 'fall') {
          const landY = g.fromCeil ? FLOOR_Y : CEIL_Y;
          ctx.fillStyle = hexA(theme.hazard, 0.15);
          rr(ctx, it.x, g.fromCeil ? landY - 4 : landY, it.w, 4, 2);
          ctx.fill();
        }
        ctx.fillStyle = theme.ground;
        rr(ctx, g.x, g.y, g.w, g.h, 5);
        ctx.fill();
        const glow = g.phase === 'shake' ? 0.4 + 0.3 * Math.sin(t * 30) : g.phase === 'landed' ? 0.7 : 0.25;
        ctx.fillStyle = hexA(theme.hazard, glow);
        rr(ctx, g.x + 3, g.y + 3, g.w - 6, g.h - 6, 3);
        ctx.fill();
        ctx.fillStyle = hexA('#ffffff', 0.2 + glow * 0.3);
        ctx.fillRect(g.x + 5, g.y + 5, g.w - 10, 4);
        break;
      }
      case 'wall': {
        const g = wallGeom(it, t);
        if (g.phase === 'warn') {
          ctx.strokeStyle = hexA(theme.hazard, 0.3 + 0.5 * g.warn);
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.moveTo(g.x, CEIL_Y); ctx.lineTo(g.x, FLOOR_Y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (g.topH > 1) {
          ctx.fillStyle = theme.ground;
          rr(ctx, g.x, CEIL_Y, g.w, g.topH, 4); ctx.fill();
          ctx.fillStyle = hexA(theme.hazard, 0.4);
          rr(ctx, g.x + 3, CEIL_Y + 3, g.w - 6, Math.max(0, g.topH - 6), 3); ctx.fill();
          ctx.fillStyle = hexA('#ffffff', 0.2);
          ctx.fillRect(g.x + 5, CEIL_Y + 5, g.w - 10, 4);
        }
        if (g.botH > 1) {
          const by = FLOOR_Y - g.botH;
          ctx.fillStyle = theme.ground;
          rr(ctx, g.x, by, g.w, g.botH, 4); ctx.fill();
          ctx.fillStyle = hexA(theme.hazard, 0.4);
          rr(ctx, g.x + 3, by + 3, g.w - 6, Math.max(0, g.botH - 6), 3); ctx.fill();
          ctx.fillStyle = hexA('#ffffff', 0.2);
          ctx.fillRect(g.x + 5, by + 5, g.w - 10, 4);
        }
        break;
      }
      case 'bounce': {
        const g = bounceGeom(it, t);
        const pulse = 1 + 0.12 * Math.sin(t * 8 + it.x * 0.02);
        const r = g.r * pulse;
        const y0c = it.y0 != null ? it.y0 : CEIL_Y + 50;
        const y1c = it.y1 != null ? it.y1 : FLOOR_Y - 50;
        ctx.strokeStyle = hexA(theme.hazard, 0.12);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(it.x, y0c); ctx.lineTo(it.x, y1c);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.save();
        ctx.translate(g.x, g.y);
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2);
        glow.addColorStop(0, hexA(theme.hazard, 0.4));
        glow.addColorStop(1, hexA(theme.hazard, 0));
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(0, 0, r * 2, 0, 6.2832); ctx.fill();
        ctx.fillStyle = theme.hazard;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill();
        ctx.fillStyle = hexA('#ffffff', 0.7);
        ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.25, r * 0.4, 0, 6.2832); ctx.fill();
        ctx.restore();
        break;
      }
      case 'trap': {
        const g = trapGeom(it, t, eng.px);
        const up = g.floor;
        const baseY = up ? FLOOR_Y : CEIL_Y;
        ctx.fillStyle = hexA(theme.hazard, 0.15);
        ctx.fillRect(it.x, up ? FLOOR_Y - 3 : CEIL_Y, it.w, 3);
        if (g.phase === 'warn') {
          const flash = 0.3 + 0.5 * Math.abs(Math.sin(t * 20));
          ctx.strokeStyle = hexA(theme.hazard, flash);
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(it.x, up ? FLOOR_Y : CEIL_Y);
          ctx.lineTo(it.x + it.w, up ? FLOOR_Y : CEIL_Y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (g.ext > 0.02) {
          const sh = g.drawH;
          const grad = ctx.createLinearGradient(0, up ? baseY : baseY + sh, 0, up ? baseY - sh : baseY);
          grad.addColorStop(0, theme.hazard);
          grad.addColorStop(1, hexA(theme.hazard, 0.45));
          ctx.fillStyle = grad;
          spikePath(ctx, it.x, baseY, it.w, sh, up);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 0.55;
          spikePath(ctx, it.x + 2, baseY, it.w - 4, Math.max(2, sh - 4), up);
          ctx.globalAlpha = 0.14;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        break;
      }
      case 'zone': {
        const g = ctx.createLinearGradient(0, CEIL_Y, 0, FLOOR_Y);
        g.addColorStop(0, hexA(theme.accent2, 0.16));
        g.addColorStop(1, hexA(theme.accent, 0.05));
        ctx.fillStyle = g;
        ctx.fillRect(it.x, CEIL_Y, it.w, FLOOR_Y - CEIL_Y);
        ctx.strokeStyle = hexA(theme.accent, 0.35);
        ctx.lineWidth = 2;
        ctx.strokeRect(it.x + 1, CEIL_Y + 1, it.w - 2, FLOOR_Y - CEIL_Y - 2);
        const dir = it.dir || -1;
        ctx.fillStyle = hexA(theme.accent, 0.35);
        for (let x = it.x + 26; x < it.x + it.w - 10; x += 44) {
          const y = (CEIL_Y + FLOOR_Y) / 2 + ((x * 0.05 + t * 90) % 220) - 110;
          ctx.save();
          ctx.translate(x, y);
          ctx.beginPath();
          ctx.moveTo(-9, dir * 8);
          ctx.lineTo(0, dir * -6);
          ctx.lineTo(9, dir * 8);
          ctx.lineTo(0, dir * 1);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        break;
      }
      case 'portal': {
        const pulse = 1 + 0.08 * Math.sin(t * 6);
        ctx.save();
        ctx.translate(it.x, it.y);
        ctx.strokeStyle = hexA(theme.accent, it.used ? 0.2 : 0.9);
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(0, 0, 16 * pulse, 54 * pulse, 0, 0, 6.2832); ctx.stroke();
        ctx.strokeStyle = hexA(theme.accent2, it.used ? 0.15 : 0.7);
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(0, 0, 10 * pulse, 38 * pulse, t * 2, 0, 6.2832); ctx.stroke();
        ctx.fillStyle = hexA(theme.accent, it.used ? 0.08 : 0.22);
        ctx.beginPath(); ctx.ellipse(0, 0, 16, 54, 0, 0, 6.2832); ctx.fill();
        ctx.restore();
        break;
      }
      case 'checkpoint': {
        const cp = eng.level.checkpoints[it.index];
        const on = cp && cp.done;
        const col = on ? theme.accent : hexA('#ffffff', 0.22);
        const up = true;
        ctx.fillStyle = col;
        ctx.globalAlpha = on ? 1 : 0.5;
        ctx.fillRect(it.x - 2, FLOOR_Y - 88, 4, 88);
        ctx.beginPath();
        ctx.moveTo(it.x + 2, FLOOR_Y - 88);
        ctx.lineTo(it.x + 44, FLOOR_Y - 72);
        ctx.lineTo(it.x + 2, FLOOR_Y - 56);
        ctx.closePath();
        ctx.fill();
        if (on) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = hexA('#ffffff', 0.5 + 0.5 * Math.sin(eng.t * 4));
          ctx.fillRect(it.x - 4, FLOOR_Y - 92, 8, 6);
        }
        ctx.globalAlpha = 1;
        break;
      }
      case 'plat':
      case 'vanish': {
        const g = it.type === 'vanish' ? vanishGeom(it, eng.t) : platGeom(it, eng.t);
        if (!g.solid) {
          if (g.warning) {
            ctx.strokeStyle = hexA(theme.hazard, 0.25 + 0.6 * g.warnK);
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 8]);
            rr(ctx, g.x, g.y, g.w, g.h, 6);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          break;
        }
        ctx.fillStyle = hexA(theme.edge, 0.16);
        rr(ctx, g.x - 3, g.y - 3, g.w + 6, g.h + 6, 8);
        ctx.fill();
        ctx.fillStyle = theme.plat;
        rr(ctx, g.x, g.y, g.w, g.h, 6);
        ctx.fill();
        ctx.fillStyle = theme.accent;
        ctx.globalAlpha = 0.9;
        rr(ctx, g.x + 3, g.y + 3, g.w - 6, 4, 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      }
      case 'speed': {
        ctx.fillStyle = hexA(theme.accent, 0.35);
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(it.x + k * 10, (CEIL_Y + FLOOR_Y) / 2 - 34);
          ctx.lineTo(it.x + 12 + k * 10, (CEIL_Y + FLOOR_Y) / 2);
          ctx.lineTo(it.x + k * 10, (CEIL_Y + FLOOR_Y) / 2 + 34);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'gem': {
        if (it.collected) break;
        const isTrigger = !!it.trigger;
        const pulse = 1 + (isTrigger ? 0.22 : 0.15) * Math.sin(t * (isTrigger ? 5 : 4) + it.x * 0.01);
        const r = (it.r || 13) * pulse;
        ctx.save();
        ctx.translate(it.x, it.y);
        const glowR = r * (isTrigger ? 3.4 : 2.5);
        const glowColor = isTrigger ? theme.accent2 : theme.accent;
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
        glow.addColorStop(0, hexA(glowColor, isTrigger ? 0.6 : 0.35));
        glow.addColorStop(1, hexA(glowColor, 0));
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(0, 0, glowR, 0, 6.2832); ctx.fill();
        if (isTrigger) {
          // pulsing halo ring + dashed directional trail toward the row
          ctx.strokeStyle = hexA(theme.accent2, 0.55 + 0.3 * Math.sin(t * 5));
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(0, 0, r * 1.55, 0, 6.2832); ctx.stroke();
          const dir = it.rowDir || { x: 1, y: 0 };
          ctx.strokeStyle = hexA(theme.accent, 0.35);
          ctx.lineWidth = 4;
          ctx.setLineDash([7, 9]);
          ctx.beginPath();
          ctx.moveTo(dir.x * r * 1.3, dir.y * r * 1.3);
          ctx.lineTo(dir.x * r * 3.4, dir.y * r * 3.4);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.rotate(t * 1.5);
        ctx.fillStyle = isTrigger ? theme.accent2 : theme.accent;
        ctx.beginPath();
        ctx.moveTo(0, -r); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.7, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.78;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.5); ctx.lineTo(r * 0.35, 0); ctx.lineTo(0, r * 0.2); ctx.lineTo(-r * 0.35, 0);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
        break;
      }
      default: break;
    }
  }
}

function drawFinish(ctx, eng) {
  const theme = eng.theme;
  const x = eng.level.length;
  const g = ctx.createLinearGradient(x, CEIL_Y, x, FLOOR_Y);
  g.addColorStop(0, hexA(theme.accent, 0.75));
  g.addColorStop(1, hexA(theme.accent2, 0.55));
  ctx.fillStyle = hexA('#ffffff', 0.14);
  ctx.fillRect(x - 6, CEIL_Y, 92, FLOOR_Y - CEIL_Y);
  ctx.fillStyle = g;
  ctx.fillRect(x - 3, CEIL_Y, 6, FLOOR_Y - CEIL_Y);
  for (let i = 0; i < 8; i++) {
    const y = CEIL_Y + 24 + i * 64;
    ctx.fillStyle = hexA(theme.accent, i % 2 ? 0.25 : 0.6);
    ctx.fillRect(x + 12, y, 56, 26);
  }
}

function drawGemRows(ctx, eng) {
  const theme = eng.theme;
  const t = eng.t;
  const items = eng.level.items;
  const groups = {};
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.type !== 'gem' || it.groupId == null || it.collected) continue;
    if (!groups[it.groupId]) groups[it.groupId] = [];
    groups[it.groupId].push(it);
  }
  for (const id in groups) {
    const gs = groups[id];
    if (gs.length < 4) continue;
    gs.sort((a, b) => a.x - b.x);
    const pulse = 0.5 + 0.3 * Math.sin(t * 3 + gs[0].x * 0.01);
    ctx.strokeStyle = hexA(theme.accent, 0.1 * pulse);
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(gs[0].x, gs[0].y);
    for (let i = 1; i < gs.length; i++) ctx.lineTo(gs[i].x, gs[i].y);
    ctx.stroke();
    ctx.strokeStyle = hexA(theme.accent, 0.22 * pulse);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(gs[0].x, gs[0].y);
    for (let i = 1; i < gs.length; i++) ctx.lineTo(gs[i].x, gs[i].y);
    ctx.stroke();
  }
}

function drawRushGuide(ctx, eng) {
  if (!eng.rush) return;
  const r = eng.rush;
  const theme = eng.theme;
  const size = PLAYER_SIZE;
  const cx = eng.px + size / 2, cy = eng.py + size / 2;
  const ex = r.startX + r.dir.x * r.totalLen;
  const ey = r.startY + r.dir.y * r.totalLen;
  ctx.strokeStyle = hexA(theme.accent2, 0.22);
  ctx.lineWidth = 12;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.strokeStyle = hexA(theme.accent, 0.6);
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 9]);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.setLineDash([]);
}

function drawParticles(ctx, eng) {
  const pool = eng.particles.pool;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    if (!p.alive || !p.add) continue;
    const k = p.life / p.max;
    if (p.shape === 'ring') {
      ctx.strokeStyle = hexA(p.color, clamp(k * p.alpha, 0, 1));
      ctx.lineWidth = Math.max(0.6, p.w * k);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.stroke();
    } else if (p.shape === 'spark') {
      ctx.fillStyle = hexA(p.color, clamp(k * p.alpha, 0, 1));
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.7);
    } else {
      ctx.fillStyle = hexA(p.color, clamp(k * p.alpha * 0.9, 0, 1));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + k * 0.6), 0, 6.2832); ctx.fill();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    if (!p.alive || p.add) continue;
    const k = p.life / p.max;
    if (p.shape === 'frag') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = hexA(p.color, clamp(k, 0, 1));
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.8);
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawTrail(ctx, eng) {
  const theme = eng.theme;
  const boost = eng.rush ? 2.4 : 1;
  for (let i = 0; i < eng.trail.length; i++) {
    const tr = eng.trail[i];
    const k = tr.life / tr.max;
    ctx.fillStyle = hexA(eng.rush ? theme.accent : getSkin(eng.skinId).colors[1], 0.13 * k * boost);
    rr(ctx, tr.x + 4, tr.y + 4, PLAYER_SIZE - 8, PLAYER_SIZE - 8, 6);
    ctx.fill();
  }
}

function drawPlayer(ctx, eng) {
  const theme = eng.theme;
  const size = PLAYER_SIZE;
  const cx = eng.px + size / 2;
  const cy = eng.py + size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(eng.rot);
  let spawnK = 1;
  let spawnAlpha = 1;
  if (eng.spawnT > 0) {
    const p = 1 - eng.spawnT / 0.42;
    spawnK = 0.25 + 0.75 * (p * p * (3 - 2 * p));
    spawnAlpha = 0.3 + 0.7 * p;
  }
  ctx.scale(eng.sx * spawnK, eng.sy * spawnK);
  ctx.globalAlpha = spawnAlpha;
  drawSkin(ctx, eng.skinId, { time: eng.t, reduced: eng.settings.reduced });
  ctx.restore();
}

let vignette = null;
let vignetteKey = '';
function drawScreenFx(ctx, eng, w, h, dpr) {
  const key = `${w}x${h}x${dpr}`;
  if (vignetteKey !== key) {
    vignetteKey = key;
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.55)');
    vignette = g;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  if (eng.flash > 0.001) {
    ctx.fillStyle = `rgba(255,255,255,${clamp(eng.flash * 0.5, 0, 0.7)})`;
    ctx.fillRect(0, 0, w, h);
  }
}

export function render(ctx, eng, w, h, dpr = 1, drawWorldOverlay = null) {
  const theme = eng.theme;
  const fit = Math.min(w / VIEW_W, h / VIEW_H);
  const s = fit * eng.zoom;
  const anchorX = w * 0.34;
  let tx = anchorX - (eng.px + PLAYER_SIZE / 2) * s + eng.shakeX;
  const ty = h * 0.5 - MID_Y * s + eng.shakeY;

  const leftWorld = -tx / s;
  if (leftWorld < -70) tx = 70 * s;
  const rightWorld = (w - tx) / s;
  const maxRight = eng.level.length + 460;
  if (rightWorld > maxRight) tx = w - maxRight * s;

  const camLeft = -tx / s;
  const camTop = -ty / s;
  const viewW = w / s;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, theme.bg[0]);
  grad.addColorStop(0.55, theme.bg[1]);
  grad.addColorStop(1, theme.bg[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  drawParallax(ctx, eng, s, tx, ty, w, h, camLeft, camTop, viewW);

  ctx.save();
  ctx.setTransform(s * dpr, 0, 0, s * dpr, tx * dpr, ty * dpr);
  drawTerrain(ctx, eng, camLeft, viewW);
  drawGemRows(ctx, eng);
  if (!eng.level.noFinish) drawFinish(ctx, eng);
  if (drawWorldOverlay) drawWorldOverlay(ctx, eng);
  drawHazards(ctx, eng);
  drawParticles(ctx, eng);
  if (eng.state !== 'dying' && eng.state !== 'dead') {
    drawRushGuide(ctx, eng);
    drawTrail(ctx, eng);
    drawPlayer(ctx, eng);
  }
  ctx.restore();

  drawScreenFx(ctx, eng, w, h, dpr);
}

// ---- race mode (two players, shared world) ----
const RACE_P1 = '#7ff4ff', RACE_P1_ACCENT = '#3ae8ff';
const RACE_P2 = '#ff9ec4', RACE_P2_ACCENT = '#ff3ea5';

function drawRaceTrail(ctx, p, color) {
  for (let i = 0; i < p.trail.length; i++) {
    const tr = p.trail[i];
    const k = tr.life / tr.max;
    ctx.fillStyle = hexA(color, 0.13 * k);
    rr(ctx, tr.x + 4, tr.y + 4, PLAYER_SIZE - 8, PLAYER_SIZE - 8, 6);
    ctx.fill();
  }
}

function drawRacePlayer(ctx, p, color, accent, label, skinId, time, reduced) {
  const size = PLAYER_SIZE;
  const cx = p.px + size / 2, cy = p.py + size / 2;
  const blink = p.invuln > 0 ? (0.4 + 0.6 * Math.abs(Math.sin(p.invuln * 24))) : 1;
  ctx.save();
  ctx.globalAlpha = blink;
  ctx.translate(cx, cy);
  ctx.rotate(p.rot);
  ctx.scale(p.sx, p.sy);
  drawSkin(ctx, skinId, { time, reduced });
  ctx.restore();
  ctx.save();
  ctx.translate(cx, cy - size / 2 - 14);
  ctx.fillStyle = accent;
  ctx.beginPath(); ctx.arc(0, 0, 9, 0, 6.2832); ctx.fill();
  ctx.fillStyle = '#04050c';
  ctx.font = 'bold 11px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 1);
  ctx.restore();
}

export function renderRace(ctx, eng, w, h, dpr = 1) {
  const theme = eng.theme;
  const p1 = eng.players[0], p2 = eng.players[1];
  const cx1 = p1.px + PLAYER_SIZE / 2, cx2 = p2.px + PLAYER_SIZE / 2;
  const midX = (cx1 + cx2) / 2;
  const span = Math.abs(cx1 - cx2);
  const targetW = Math.max(VIEW_W, span + 560);
  const baseFit = Math.min(w / VIEW_W, h / VIEW_H);
  let s = Math.min(w / targetW, h / VIEW_H) * eng.zoom;
  s = Math.min(s, baseFit);
  s = Math.max(s, 0.0001);
  const tx = w * 0.5 - midX * s + eng.shakeX;
  const ty = h * 0.5 - MID_Y * s + eng.shakeY;
  const camLeft = -tx / s;
  const camTop = -ty / s;
  const viewW = w / s;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, theme.bg[0]);
  grad.addColorStop(0.55, theme.bg[1]);
  grad.addColorStop(1, theme.bg[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  drawParallax(ctx, eng, s, tx, ty, w, h, camLeft, camTop, viewW);

  ctx.save();
  ctx.setTransform(s * dpr, 0, 0, s * dpr, tx * dpr, ty * dpr);
  drawTerrain(ctx, eng, camLeft, viewW);
  if (!eng.level.noFinish) drawFinish(ctx, eng);
  drawHazards(ctx, eng);
  drawParticles(ctx, eng);
  const skins = eng.skinIds || ['classic', 'classic'];
  drawRaceTrail(ctx, p1, getSkin(skins[0]).colors[1]);
  drawRaceTrail(ctx, p2, getSkin(skins[1]).colors[1]);
  if (p1.alive) drawRacePlayer(ctx, p1, RACE_P1, RACE_P1_ACCENT, '1', skins[0], eng.t, eng.settings.reduced);
  if (p2.alive) drawRacePlayer(ctx, p2, RACE_P2, RACE_P2_ACCENT, '2', skins[1], eng.t, eng.settings.reduced);
  ctx.restore();

  drawScreenFx(ctx, eng, w, h, dpr);
}