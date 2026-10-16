// No-death survival challenges. Each challenge asks the player to finish a
// level from a specific difficulty group without dying, in exchange for a
// one-time gem reward. Challenge progress is persisted in save.challenges and
// each reward can only be claimed once per player.

import { GROUPS, groupUnlocked, groupIndex } from './groups';

export const CHALLENGES = [
  {
    id: 'easy_survivor',
    name: 'Easy Survivor',
    groupId: 'easy',
    reward: 100,
    objective: 'Complete any Easy level without dying',
  },
  {
    id: 'medium_survivor',
    name: 'Medium Survivor',
    groupId: 'medium',
    reward: 350,
    objective: 'Complete any Medium level without dying',
  },
  {
    id: 'hard_survivor',
    name: 'Hard Survivor',
    groupId: 'hard',
    reward: 1000,
    objective: 'Complete any Hard level without dying',
  },
];

export function challengeById(id) {
  return CHALLENGES.find((c) => c.id === id) || null;
}

export function challengeGroup(challenge) {
  return GROUPS.find((g) => g.id === challenge.groupId) || GROUPS[0];
}

export function challengeGroupIndex(challenge) {
  return groupIndex(challengeGroup(challenge));
}

export function challengeUnlocked(save, challenge) {
  return groupUnlocked(save, challengeGroupIndex(challenge));
}

export function isChallengeDone(save, id) {
  return !!(save && save.challenges && save.challenges[id] && save.challenges[id].completed);
}