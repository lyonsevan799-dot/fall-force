import { Engine } from './engine';
import { emit } from './levels';
import { BASE_SPEED, CROSS_TIME, START_X, clamp } from './config';
import { ENDLESS_CHUNKS } from './endlessChunks';

const THEMES_ORDER = ['neon', 'industrial', 'space', 'cyber', 'energy', 'void'];

// EndlessEngine reuses the entire Career physics/collision/render pipeline by
// subclassing Engine and overriding only the level source + finish behaviour.
// The generated level object has the exact same shape as a Career level, so
// render() and all hazard/solid/zone logic work unchanged.
export class EndlessEngine extends Engine {
  constructor({ sound, settings }) {
    super({ sound, settings });
    this.mode = 'endless';
    this.levelIndex = -1;
    this.score = 0;
    this.best = 0;
    this._gen = null;
    this._level = null;
  }

  get level() { return this._level; }

  loadEndless(best = 0) {
    this.best = best || 0;
    const startSpeed = 0.62;
    const step = startSpeed * BASE_SPEED * CROSS_TIME;
    const startTheme = THEMES_ORDER[Math.floor(Math.random() * THEMES_ORDER.length)];
    this._gen = {
      x: START_X + step * 3,
      speed: startSpeed,
      gap: 3.0,
      difficulty: 0,
      items: [],
      chunkCount: 0,
      themeIndex: THEMES_ORDER.indexOf(startTheme),
    };
    this._level = {
      index: -1,
      name: 'Endless',
      theme: startTheme,
      speed: startSpeed * BASE_SPEED,
      step,
      items: this._gen.items,
      checkpoints: [],
      length: this._gen.x + step * 4,
      startX: START_X,
      noFinish: true,
    };
    for (let i = 0; i < 5; i++) this._appendChunk();
    // Reuse the parent load() to build the filtered hazard/solid/zone arrays.
    this.load(-1);
    this.state = 'intro';
    this.introT = 0;
    this.timeScale = 0.3;
  }

  _appendChunk() {
    const g = this._gen;
    // Difficulty ramps with distance travelled, then caps at max.
    g.difficulty = clamp((g.x - START_X) / 22000, 0, 1);
    g.speed = 0.62 + g.difficulty * 0.60;
    g.gap = 3.0 - g.difficulty * 1.3;
    // Cycle the visual theme every 7 chunks for variety.
    if (g.chunkCount > 0 && g.chunkCount % 7 === 0) {
      g.themeIndex = (g.themeIndex + 1) % THEMES_ORDER.length;
    }
    this._level.theme = THEMES_ORDER[g.themeIndex];
    this._level.speed = g.speed * BASE_SPEED;
    const step = g.speed * BASE_SPEED * CROSS_TIME;
    this._level.step = step;
    const ctx = { step, gap: g.gap };

    const tier = g.difficulty < 0.25 ? 0 : g.difficulty < 0.55 ? 1 : g.difficulty < 0.85 ? 2 : 3;
    let pickTier = tier;
    const r = Math.random();
    if (r < 0.3 && tier > 0) pickTier = tier - 1;
    else if (r > 0.9 && tier < 3) pickTier = tier + 1;
    const pool = ENDLESS_CHUNKS[pickTier];
    const chunk = pool[Math.floor(Math.random() * pool.length)];

    let x = g.x;
    for (const d of chunk.sections) x = emit(d, x, g.items, ctx);
    g.x = x;
    g.chunkCount++;
    this._level.length = g.x + step * 4;
  }

  _rebuild() {
    const L = this._level;
    this.hazards = L.items.filter((i) => i.type === 'spike' || i.type === 'saw' || i.type === 'blade' || i.type === 'crusher' || i.type === 'laser');
    this.solids = L.items.filter((i) => i.type === 'plat' || i.type === 'vanish');
    this.zones = L.items.filter((i) => i.type === 'zone');
    this.portals = L.items.filter((i) => i.type === 'portal');
    this.gates = L.items.filter((i) => i.type === 'speed');
  }

  _cull() {
    const items = this._gen.items;
    if (items.length < 240) return;
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
    const L = this._level;
    if (L.length - this.px < 1600) this._appendChunk();
    this._cull();
  }

  step(h) {
    super.step(h);
    this.maybeGenerate();
  }

  // Endless never finishes — the run ends only on death.
  reachFinish() {}

  syncUi() {
    this.score = Math.floor(this.px / 10);
    super.syncUi();
    this.ui.score = this.score;
    this.ui.distance = Math.floor(this.px);
    this.ui.best = this.best;
    this.ui.progress = this._gen ? this._gen.difficulty : 0;
  }
}