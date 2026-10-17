import { Engine } from '@/game/engine';
import { START_X, BASE_SPEED } from '@/game/config';
import buildRunSection, { difficultyAt, speedAt, validRunSection } from '@/game/procedural/runPatterns';
import hitRunHazard from '@/game/procedural/runCollision';
import { cullRunWorld, rebaseRunWorld } from '@/game/procedural/runWorld';
import { retireProgressRows } from '@/game/meta/events';

const SECTIONS = [
  { name: 'Training', theme: 'neon' }, { name: 'Factory', theme: 'industrial' },
  { name: 'Neon', theme: 'cyber' }, { name: 'Space', theme: 'space' }, { name: 'Extreme', theme: 'energy' },
];

// A rolling world, not a finite Career course. Score is NEVER a termination condition.
export class EndlessEngine extends Engine {
  constructor({ sound, settings, mode = 'endless' }) {
    super({ sound, settings });
    this.mode = mode;
    this._level = null;
    this._gen = null;
    this.lookAhead = 4000;
  }
  get level() { return this._level; }

  loadEndless(best = 0, skipIntro = false) {
    this.best = Number.isFinite(best) ? best : 0;
    this.score = 0; this.distanceTravelled = 0;
    this.streakTime = 0; this.streak = 1; this.maxStreak = 1;
    this.sectionIndex = -1; this.sectionName = 'Training'; this.milestoneEvent = null;
    this._newBestFired = false; this._nextDistanceMilestone = 100;
    this._lastCull = START_X; this.paused = false; this.px = START_X;
    const speed = speedAt(0);
    this._gen = { x: START_X + speed * 1.5, items: [], chunkCount: 0, difficulty: 0, speed: speed / BASE_SPEED };
    this._level = { index: -1, name: this.mode === 'survival' ? 'Survival' : 'Endless',
      theme: 'neon', speed, step: speed * 0.44, items: this._gen.items,
      checkpoints: [], length: this._gen.x + 4000, startX: START_X, noFinish: true, hints: 0, tip: null };
    this.load(-1);
    this.maybeGenerate();
    this.state = skipIntro ? 'playing' : 'intro';
    this.introT = skipIntro ? 1.5 : 0; this.timeScale = skipIntro ? 1 : 0.3;
    this.syncUi();
  }

  _appendChunk() {
    const g = this._gen;
    const difficulty = difficultyAt(this.distanceTravelled + Math.max(0, g.x - this.px));
    let section = buildRunSection(g.x, difficulty, this.mode, g.chunkCount);
    // Reject non-advancing/invalid output before it enters render or collision lists.
    // This fallback is a real, escapable spike encounter, not a reset or empty level.
    if (!validRunSection(section, g.x)) section = {
      items: [{ type: 'spike', side: 'floor', x: g.x + 700, w: 68 }], end: g.x + 2000,
    };
    g.items.push(...section.items);
    g.x = section.end; g.chunkCount++;
    this._level.length = g.x + 1000;
    this._rebuild();
  }
  _rebuild() {
    const items = this._level.items;
    this.hazards = items.filter((item) => ['spike', 'saw', 'mspike', 'laser', 'blade', 'bounce'].includes(item.type));
    this.solids = []; this.zones = []; this.portals = []; this.gates = [];
    this.collectibles = items.filter((item) => item.type === 'gem');
    this.buildGemGroups();
    retireProgressRows(this, new Set(Object.keys(this.gemGroups)));
  }
  maybeGenerate() {
    // Bounded work per physics call, with generation BEFORE movement.
    for (let budget = 0; this._gen.x - this.px < this.lookAhead && budget < 8; budget++) this._appendChunk();
    cullRunWorld(this);
  }
  _updateSection() {
    const difficulty = difficultyAt(this.distanceTravelled);
    this._gen.difficulty = difficulty;
    this._level.speed = speedAt(difficulty);
    this._level.step = this._level.speed * 0.44;
    this._gen.speed = this._level.speed / BASE_SPEED;
    const index = Math.min(SECTIONS.length - 1, Math.floor(difficulty * SECTIONS.length));
    if (this.sectionIndex !== index) {
      this.sectionIndex = index; this.sectionName = SECTIONS[index].name;
      this._level.theme = SECTIONS[index].theme;
      if (index > 0) this.milestoneEvent = { text: this.sectionName.toUpperCase(), type: 'section', id: this.runId + index };
    }
  }
  step(h) {
    if (!['playing', 'intro'].includes(this.state)) return;
    this.maybeGenerate();
    this.speedMult = 1; // No infinitely accumulating portal boosts in a rolling course.
    const endTime = this.t;
    const pieces = Math.max(1, Math.ceil(h / Math.min(1 / 240, 5 / (this.level.speed * 2.4))));
    const dt = h / pieces;
    for (let i = 0; i < pieces; i++) {
      this.t = endTime - h + (i + 1) * dt;
      const before = this.px, wasPlaying = this.state === 'playing';
      super.step(dt);
      const distance = Math.max(0, this.px - before);
      this.distanceTravelled += distance;
      if (wasPlaying) {
        this.streakTime += dt;
        if (this.mode === 'survival') this.score = Math.floor(this.attemptTime * 100);
        else this.score += distance * (1 + this._gen.difficulty * 1.5) * this.streak * 0.15;
        this.streak = 1 + Math.min(this.streakTime / 15, 3);
        this.maxStreak = Math.max(this.maxStreak, this.streak);
      }
      if (!['playing', 'intro'].includes(this.state)) break;
    }
    this._updateSection();
    const meters = Math.floor(this.distanceTravelled / 10);
    if (meters >= this._nextDistanceMilestone) {
      this.milestoneEvent = { text: `${meters.toLocaleString()} M`, type: 'distance', id: this.runId + meters };
      this._nextDistanceMilestone = (Math.floor(meters / 500) + 1) * 500;
    }
    if (this.mode === 'endless' && !this._newBestFired && this.best > 0 && this.score > this.best) {
      this._newBestFired = true;
      this.milestoneEvent = { text: 'NEW BEST!', type: 'best', id: this.runId + 'best' };
      this.sound.sfx('unlock');
    }
    rebaseRunWorld(this);
  }
  checkHazards() {
    for (const item of this.hazards) {
      if (item.x < this.px - 250 || item.x > this.px + 250) continue;
      if (hitRunHazard(item, this.t, this.px, this.py)) { this.die(); return; }
    }
  }
  reachFinish() {} // A rolling world has no finish line.
  collectGem(gem) {
    if (gem.collected || !['playing', 'intro'].includes(this.state)) return;
    if (this.mode === 'endless') this.score += 100 * (1 + this._gen.difficulty);
    super.collectGem(gem);
  }
  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0 || this.state === 'dead' || this.paused) return;
    // Catch up ordinary slow frames using bounded fixed-step batches, never
    // one huge movement that could skip a spike or an unbounded catch-up loop.
    let remaining = Math.min(0.25, dt);
    while (remaining > 0.000001 && this.state !== 'dead') {
      const slice = Math.min(0.05, remaining);
      super.update(slice); remaining -= slice;
    }
  }
  syncUi() {
    super.syncUi();
    this.ui.score = Math.floor(this.score || 0);
    this.ui.distance = Math.floor((this.distanceTravelled || 0) / 10);
    this.ui.best = this.best || 0; this.ui.streak = this.streak || 1;
    this.ui.maxStreak = this.maxStreak || 1; this.ui.sectionName = this.sectionName;
    this.ui.speed = this._gen?.speed || 0.62;
    this.ui.progress = this._gen?.difficulty || 0;
    this.ui.wave = (this._gen?.chunkCount || 1);
    this.ui.milestoneEvent = this.milestoneEvent;
  }
}