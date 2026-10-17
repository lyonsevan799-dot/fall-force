import { Engine } from './engine';
import { emit } from './levels';
import { BASE_SPEED, CROSS_TIME, START_X, clamp } from './config';
import { ENDLESS_CHUNKS } from './endlessChunks';
import { gemClear, LANE, placeRow } from './gemPlace';
import { recordGemPickup } from '@/game/meta/events';

// Visual sections — theme and name are driven by difficulty so transitions
// happen smoothly as the player survives longer.
const SECTIONS = [
  { name: 'Training', theme: 'neon', diffMax: 0.15 },
  { name: 'Factory', theme: 'industrial', diffMax: 0.35 },
  { name: 'Neon', theme: 'cyber', diffMax: 0.55 },
  { name: 'Space', theme: 'space', diffMax: 0.75 },
  { name: 'Extreme', theme: 'energy', diffMax: 1.01 },
];

const DISTANCE_MILESTONES = [100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000];
const PX_PER_METER = 10;

export class EndlessEngine extends Engine {
  constructor({ sound, settings }) {
    super({ sound, settings });
    this.mode = 'endless';
    this.levelIndex = -1;
    this.score = 0;
    this.best = 0;
    this.gems = 0;
    this.streakTime = 0;
    this.streak = 1;
    this.maxStreak = 1;
    this._gen = null;
    this._level = null;
    this.milestonesHit = new Set();
    this.milestoneEvent = null;
    this.sectionIndex = -1;
    this.sectionName = '';
    this._newBestFired = false;
  }

  get level() { return this._level; }

  loadEndless(best = 0, skipIntro = false) {
    this.best = best || 0;
    this.score = 0;
    this.gems = 0;
    this.streakTime = 0;
    this.streak = 1;
    this.maxStreak = 1;
    this.milestonesHit = new Set();
    this.milestoneEvent = null;
    this.sectionIndex = -1;
    this.sectionName = '';
    this._newBestFired = false;
    this._lastCull = START_X;
    this._lastChunkName = null;

    const startSpeed = 0.62;
    const step = startSpeed * BASE_SPEED * CROSS_TIME;
    this._gen = {
      x: START_X + step * 3,
      speed: startSpeed,
      gap: 3.0,
      difficulty: 0,
      items: [],
      chunkCount: 0,
    };
    this._level = {
      index: -1,
      name: 'Endless',
      theme: SECTIONS[0].theme,
      speed: startSpeed * BASE_SPEED,
      step,
      items: this._gen.items,
      checkpoints: [],
      length: this._gen.x + step * 4,
      startX: START_X,
      noFinish: true,
      hints: 0,
      tip: null,
    };
    for (let i = 0; i < 5; i++) this._appendChunk();
    this.load(-1);
    if (skipIntro) {
      this.state = 'playing';
      this.introT = 1.5;
      this.timeScale = 1;
      this.attemptTime = 0;
    } else {
      this.state = 'intro';
      this.introT = 0;
      this.timeScale = 0.3;
    }
    this._updateSection();
  }

  _sectionForDifficulty(d) {
    for (let i = 0; i < SECTIONS.length; i++) {
      if (d < SECTIONS[i].diffMax) return i;
    }
    return SECTIONS.length - 1;
  }

  _appendChunk() {
    const g = this._gen;
    // Space future obstacles for their upcoming difficulty, without speeding
    // up the player merely because several chunks have been generated ahead.
    const difficulty = clamp((g.x - START_X) / 22000, 0, 1);
    const step = (0.62 + difficulty * 0.60) * BASE_SPEED * CROSS_TIME;
    const ctx = { step, gap: 3.0 - difficulty * 1.3 };

    const tier = difficulty < 0.25 ? 0 : difficulty < 0.55 ? 1 : difficulty < 0.85 ? 2 : 3;
    let pickTier = tier;
    const r = Math.random();
    if (r < 0.3 && tier > 0) pickTier = tier - 1;
    else if (r > 0.9 && tier < 3) pickTier = tier + 1;
    const pool = ENDLESS_CHUNKS[pickTier];
    let choice = Math.floor(Math.random() * pool.length);
    if (pool[choice].name === this._lastChunkName) choice = (choice + 1) % pool.length;
    const chunk = pool[choice];
    this._lastChunkName = chunk.name;

    let x = g.x;
    for (const d of chunk.sections) x = emit(d, x, g.items, ctx);
    this._scatterGems(g.x, x, g.items, step);
    g.x = x;
    g.chunkCount++;
    this._level.length = g.x + step * 4;
    this._rebuild();
  }

  _scatterGems(x0, x1, items, step) {
    // Dense, varied gem scatter: a frequent alternating stream across
    // floor/ceiling/mid lanes plus occasional 3-gem clusters. Uses the shared
    // bounding-box clearance check so gems never land inside hazards, and
    // every lane is reachable by the player's normal movement.
    const spacing = step * 1.5;
    const lanes = [LANE.floor, LANE.ceil, LANE.mid, LANE.midLow, LANE.midHigh];
    let i = 0;
    for (let cx = x0 + step; cx < x1 - step; cx += spacing, i++) {
      const y = lanes[i % lanes.length];
      if (gemClear(items, cx, y)) items.push({ type: 'gem', x: cx, y, r: 13 });
    }
    // Occasional cluster — a short line of 3 gems in a safe lane.
    for (let cx = x0 + step * 3; cx < x1 - step; cx += step * 6) {
      if (Math.random() > 0.5) continue;
      const ly = lanes[Math.floor(Math.random() * 3)];
      if (!gemClear(items, cx, ly)) continue;
      for (let k = -1; k <= 1; k++) {
        const gx = cx + k * step * 0.34;
        if (gemClear(items, gx, ly)) items.push({ type: 'gem', x: gx, y: ly, r: 13 });
      }
    }
    // Large gem rows (4-6) — straight lines that enable Gem Rush. Alternates
    // horizontal floor/ceiling and diagonal floor-to-mid / ceiling-to-mid
    // paths, each checked against hazards so it never crosses an obstacle.
    for (let cx = x0 + step * 5; cx < x1 - step * 3; cx += step * 6) {
      if (Math.random() > 0.3) continue;
      const count = 4 + Math.floor(Math.random() * 3);
      const spacing = step * 0.5;
      const m = Math.floor(cx / step) % 4;
      if (m === 0) placeRow(items, cx, LANE.floor, count, 1, 0, spacing);
      else if (m === 1) placeRow(items, cx, LANE.ceil, count, 1, 0, spacing);
      else if (m === 2) placeRow(items, cx, LANE.floor, count, 1, -1, spacing);
      else placeRow(items, cx, LANE.ceil, count, 1, 1, spacing);
    }
  }

  _rebuild() {
    const L = this._level;
    this.hazards = L.items.filter((i) => i.type === 'spike' || i.type === 'saw' || i.type === 'blade' || i.type === 'crusher' || i.type === 'laser' || i.type === 'mspike' || i.type === 'drop' || i.type === 'wall' || i.type === 'bounce' || i.type === 'trap');
    this.solids = L.items.filter((i) => i.type === 'plat' || i.type === 'vanish');
    this.zones = L.items.filter((i) => i.type === 'zone');
    this.portals = L.items.filter((i) => i.type === 'portal');
    this.gates = L.items.filter((i) => i.type === 'speed');
    this.collectibles = L.items.filter((i) => i.type === 'gem');
    this.buildGemGroups();
  }

  _cull() {
    if (this.px - this._lastCull < 400) return;
    this._lastCull = this.px;
    const items = this._gen.items;
    if (items.length < 160) return;
    const cutX = this.px - 900;
    let changed = false;
    for (let i = 0; i < items.length; i++) {
      if ((items[i].x || 0) < cutX && items[i].type !== 'speed') { changed = true; break; }
    }
    if (!changed) return;
    this._gen.items = items.filter((i) => (i.x || 0) >= cutX || i.type === 'speed');
    this._level.items = this._gen.items;
    this._rebuild();
  }

  maybeGenerate() {
    while (this._gen.x - this.px < 2200) this._appendChunk();
    this._cull();
  }

  step(h) {
    const prevPx = this.px;
    super.step(h);
    this.maybeGenerate();
    if (this.state === 'playing') {
      const distDelta = this.px - prevPx;
      if (distDelta > 0) {
        const diffBonus = 1 + (this._gen ? this._gen.difficulty : 0) * 1.5;
        this.score += distDelta * diffBonus * this.streak * 0.15;
      }
      this.streakTime += h;
      this.streak = 1 + Math.min(this.streakTime / 15, 3);
      this.maxStreak = Math.max(this.maxStreak, this.streak);
    }
    this._checkMilestones();
  }

  reachFinish() {}

  _updateSection() {
    const diff = clamp((this.px - START_X) / 22000, 0, 1);
    this._gen.difficulty = diff;
    this._gen.speed = 0.62 + diff * 0.60;
    this._level.speed = this._gen.speed * BASE_SPEED;
    this._level.step = this._level.speed * CROSS_TIME;
    const idx = this._sectionForDifficulty(diff);
    if (this.sectionIndex !== idx) {
      this.sectionIndex = idx;
      this.sectionName = SECTIONS[idx].name;
      this._level.theme = SECTIONS[idx].theme;
      if (idx > 0) this._fireMilestone(SECTIONS[idx].name.toUpperCase(), 'section');
    }
  }

  _checkMilestones() {
    const distM = Math.floor(this.px / PX_PER_METER);
    for (const m of DISTANCE_MILESTONES) {
      if (!this.milestonesHit.has(m) && distM >= m) {
        this.milestonesHit.add(m);
        this._fireMilestone(m.toLocaleString() + ' M', 'distance');
      }
    }
    this._updateSection();
    if (!this._newBestFired && this.best > 0 && this.score > this.best) {
      this._newBestFired = true;
      this._fireMilestone('NEW BEST!', 'best');
      this.sound.sfx('unlock');
    }
  }

  _fireMilestone(text, type) {
    this.milestoneEvent = { text, type, id: Date.now() + Math.random() };
  }

  collectGem(gem) {
    if (gem.collected || (this.state !== 'playing' && this.state !== 'intro')) return;
    gem.collected = true;
    this.gems++;
    recordGemPickup(this, gem);
    const value = 100 * (1 + (this._gen ? this._gen.difficulty : 0));
    this.score += value;
    this.sound.sfx('gem');
    const theme = this.theme;
    this.particles.burst(gem.x, gem.y, 12, {
      color: [theme.accent, '#ffffff', theme.accent2],
      speed: 200, size: 3.5, life: 0.5, drag: 2.5, shape: 'spark',
    });
    this.particles.ring(gem.x, gem.y, { r: 5, rv: 300, life: 0.35, color: theme.accent, w: 3 });
    this.flash = Math.min(1, this.flash + 0.12);
    // Special trigger gem: auto-engage Gem Rush along its row (no hold).
    if (gem.trigger && gem.groupId != null && !this.rush && this.state === 'playing') {
      this.activateRush(gem.groupId);
    }
  }

  syncUi() {
    super.syncUi();
    this.ui.score = Math.floor(this.score);
    this.ui.distance = Math.floor(this.px / PX_PER_METER);
    this.ui.best = this.best;
    this.ui.gems = this.gems;
    this.ui.streak = this.streak;
    this.ui.maxStreak = this.maxStreak;
    this.ui.sectionName = this.sectionName;
    this.ui.difficulty = this._gen ? this._gen.difficulty : 0;
    this.ui.speed = this._gen ? this._gen.speed : 0.62;
    this.ui.progress = this._gen ? this._gen.difficulty : 0;
  }
}