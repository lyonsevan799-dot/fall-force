// Career-mode difficulty groups. All 35 existing levels are distributed across
// three groups (Easy / Medium / Hard) by their index in the LEVELS array. The
// split follows the existing continuous difficulty curve (speed + fScale), so
// the transition between groups stays fair and Hard holds the most demanding
// levels. No level layouts are changed — this only governs grouping, unlocking
// and progression display.

export const GROUPS = [
  {
    id: 'easy',
    name: 'Easy',
    start: 0,
    end: 11,
    accent: 'cyan',
    tagline: 'Learn the flip',
    desc: 'Gravity switching, basic spikes and simple gaps. Your introduction to Fall Force.',
    lockHint: '',
  },
  {
    id: 'medium',
    name: 'Medium',
    start: 12,
    end: 22,
    accent: 'amber',
    tagline: 'Sharpen the timing',
    desc: 'Moving spikes, falling blocks, rotating blades, laser gates and vanishing platforms.',
    lockHint: 'Complete every Easy level to unlock.',
  },
  {
    id: 'hard',
    name: 'Hard',
    start: 23,
    end: 34,
    accent: 'pink',
    tagline: 'Master the chaos',
    desc: 'Every obstacle at once. Precise timing, quick reactions and rapid switches.',
    lockHint: 'Complete every Easy and Medium level to unlock.',
  },
];

export function groupForLevel(index) {
  for (const g of GROUPS) {
    if (index >= g.start && index <= g.end) return g;
  }
  return GROUPS[GROUPS.length - 1];
}

export function groupIndex(group) {
  return GROUPS.findIndex((g) => g === group || g.id === (group && group.id));
}

// A group is complete when every level in its range has a completed record.
export function groupCompleted(save, group) {
  for (let i = group.start; i <= group.end; i++) {
    const rec = save && save.levels && save.levels[i];
    if (!rec || !rec.completed) return false;
  }
  return true;
}

// Easy (group 0) is always unlocked. Each later group unlocks only when the
// previous group is fully completed.
export function groupUnlocked(save, groupIndexArg) {
  if (!Number.isInteger(groupIndexArg) || groupIndexArg < 0 || groupIndexArg >= GROUPS.length) return false;
  return GROUPS.slice(0, groupIndexArg).every((group) => groupCompleted(save, group));
}

export function groupProgress(save, group) {
  let done = 0;
  let stars = 0;
  for (let i = group.start; i <= group.end; i++) {
    const rec = save && save.levels && save.levels[i];
    if (rec && rec.completed) done++;
    if (rec) stars += rec.stars || 0;
  }
  return { done, total: group.end - group.start + 1, stars, starTotal: (group.end - group.start + 1) * 3 };
}

// A level is playable when its group is unlocked AND the existing sequential
// progression (save.unlocked) has reached it. This preserves the old per-level
// unlock behaviour inside an unlocked group.
export function isLevelPlayable(save, index) {
  if (!Number.isInteger(index) || index < 0 || index > GROUPS[GROUPS.length - 1].end) return false;
  const gi = groupIndex(groupForLevel(index));
  if (gi < 0) return false;
  if (!groupUnlocked(save, gi)) return false;
  return index <= (save.unlocked || 0);
}

export function nextGroupAfter(group) {
  const gi = groupIndex(group);
  if (gi < 0 || gi >= GROUPS.length - 1) return null;
  return GROUPS[gi + 1];
}