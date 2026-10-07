// Pooled, allocation-free particle system (mobile friendly).
function makeParticle() {
  return {
    alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1,
    size: 3, color: '#fff', shape: 'dot', rot: 0, vr: 0,
    grav: 0, drag: 0, add: true, r: 0, rv: 0, w: 2, alpha: 1, ease: 1,
  };
}

export class Particles {
  constructor(max = 720) {
    this.max = max;
    this.pool = new Array(max);
    for (let i = 0; i < max; i++) this.pool[i] = makeParticle();
    this.cursor = 0;
  }

  clear() {
    for (let i = 0; i < this.max; i++) this.pool[i].alive = false;
    this.cursor = 0;
  }

  spawn(o) {
    const p = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % this.max;
    p.alive = true;
    p.x = o.x; p.y = o.y;
    p.vx = o.vx || 0; p.vy = o.vy || 0;
    p.max = p.life = o.life || 0.5;
    p.size = o.size || 3;
    p.color = o.color || '#fff';
    p.shape = o.shape || 'dot';
    p.rot = o.rot || 0;
    p.vr = o.vr || 0;
    p.grav = o.grav || 0;
    p.drag = o.drag || 0;
    p.add = o.add !== false;
    p.r = o.r || 0;
    p.rv = o.rv || 0;
    p.w = o.w || 2;
    p.alpha = o.alpha == null ? 1 : o.alpha;
    p.ease = o.ease == null ? 1 : o.ease;
    return p;
  }

  burst(x, y, n, o = {}) {
    const spread = o.spread == null ? Math.PI * 2 : o.spread;
    const base = o.angle == null ? 0 : o.angle;
    for (let i = 0; i < n; i++) {
      const a = base + (spread === Math.PI * 2 ? Math.random() * Math.PI * 2 : (Math.random() - 0.5) * spread);
      const sp = (o.speed || 120) * (0.45 + Math.random() * 0.85);
      this.spawn({
        x: x + (Math.random() - 0.5) * (o.jitterX || 6),
        y: y + (Math.random() - 0.5) * (o.jitterY || 6),
        vx: Math.cos(a) * sp + (o.vx || 0),
        vy: Math.sin(a) * sp + (o.vy || 0),
        life: (o.life || 0.45) * (0.7 + Math.random() * 0.6),
        size: (o.size || 4) * (0.6 + Math.random() * 0.8),
        color: Array.isArray(o.color) ? o.color[(Math.random() * o.color.length) | 0] : o.color,
        shape: o.shape || 'dot',
        grav: o.grav || 0, drag: o.drag == null ? 1.6 : o.drag,
        add: o.add, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 10,
        alpha: o.alpha,
      });
    }
  }

  ring(x, y, o = {}) {
    this.spawn({
      x, y, shape: 'ring', r: o.r || 8, rv: o.rv || 320,
      life: o.life || 0.35, w: o.w || 4, color: o.color || '#fff',
      add: o.add !== false, alpha: o.alpha == null ? 0.9 : o.alpha,
    });
  }

  update(dt) {
    const pool = this.pool;
    for (let i = 0; i < this.max; i++) {
      const p = pool[i];
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) { p.alive = false; continue; }
      if (p.shape === 'ring') { p.r += p.rv * dt; continue; }
      p.vy += p.grav * dt;
      if (p.drag) {
        const d = Math.max(0, 1 - p.drag * dt);
        p.vx *= d; p.vy *= d;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
  }

  get count() {
    let n = 0;
    for (let i = 0; i < this.max; i++) if (this.pool[i].alive) n++;
    return n;
  }
}