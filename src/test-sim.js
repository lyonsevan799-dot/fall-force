import { EndlessEngine } from './game/endlessEngine';

const mockSound = { sfx: () => {}, init: () => {}, resume: () => {}, startMusic: () => {}, stopMusic: () => {}, setIntensity: () => {} };
const settings = { music: false, sfx: false, shake: true, reduced: false };

export async function run() {
  const out = {};
  try {
    const eng = new EndlessEngine({ sound: mockSound, settings });
    eng.loadEndless(5000, true); // skip intro for testing

    out.initial = {
      state: eng.state,
      score: eng.score,
      gems: eng.gems,
      streak: eng.streak,
      sectionName: eng.sectionName,
      sectionIndex: eng.sectionIndex,
      difficulty: eng._gen.difficulty,
      speed: +eng._gen.speed.toFixed(3),
      levelTheme: eng._level.theme,
      itemCount: eng._gen.items.length,
      hasGems: eng.collectibles.length > 0,
    };

    // Simulate ~30 seconds of gameplay
    const dt = 1 / 60;
    let milestones = [];
    let sections = [];
    let newBest = false;
    for (let i = 0; i < 30 * 60; i++) {
      eng.update(dt);
      if (eng.milestoneEvent) {
        milestones.push(eng.milestoneEvent.text);
        if (eng.milestoneEvent.type === 'best') newBest = true;
        eng.milestoneEvent = null;
      }
      if (sections.length === 0 || sections[sections.length - 1] !== eng.sectionName) {
        sections.push(eng.sectionName);
      }
      // Auto-switch gravity to dodge (simple AI: switch when near a hazard)
      // Just switch every ~0.5s to simulate play
      if (i % 30 === 0 && eng.state === 'playing') eng.switchGravity();
      if (eng.state === 'dead') break;
    }

    out.after30s = {
      state: eng.state,
      score: Math.floor(eng.score),
      distance: Math.floor(eng.px),
      gems: eng.gems,
      streak: +eng.streak.toFixed(2),
      maxStreak: +eng.maxStreak.toFixed(2),
      sectionName: eng.sectionName,
      difficulty: +eng._gen.difficulty.toFixed(3),
      speed: +eng._gen.speed.toFixed(3),
      levelTheme: eng._level.theme,
      itemsGenerated: eng._gen.items.length,
      milestones: milestones,
      sections: sections,
      newBestFired: newBest,
    };

    // Test gem collection
    let gemCount = 0;
    for (const it of eng._gen.items) {
      if (it.type === 'gem' && it.collected) gemCount++;
    }
    out.collectedGems = gemCount;
    out.totalGems = eng._gen.items.filter(i => i.type === 'gem').length;

    // Test fast retry
    eng.loadEndless(5000, true);
    out.retry = {
      state: eng.state,
      score: eng.score,
      streak: eng.streak,
      sectionName: eng.sectionName,
      hasGems: eng.collectibles.length > 0,
    };

    // Test that new best fires
    eng.loadEndless(100, true);
    eng.score = 200; // exceed best of 100
    eng._checkMilestones();
    out.newBestCheck = {
      newBestFired: eng._newBestFired,
      milestoneEvent: eng.milestoneEvent ? eng.milestoneEvent.text : null,
    };

  } catch (e) {
    out.err = e.message;
    out.stack = e.stack;
  }
  return out;
}