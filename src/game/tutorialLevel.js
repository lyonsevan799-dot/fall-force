import { FLOOR_Y, PLAYER_SIZE } from '@/game/config';

// Independent geometry: no career indices, groups, challenges or level specs change.
export default function tutorialLevel() {
  const y = FLOOR_Y - PLAYER_SIZE / 2;
  return { name: 'Level 0: Tutorial', theme: 'neon', speed: 200, step: 88,
    startX: 560, length: 6500, checkpoints: [], hints: 1,
    items: [
      { type: 'spike', x: 2800, w: 96, h: 34, side: 'floor', hint: true },
      ...[4100, 4250, 4400].map((x) => ({ type: 'gem', x, y, r: 13 })),
      ...Array.from({ length: 6 }, (_, i) => ({ type: 'gem', x: 5000 + i * 68, y,
        r: i === 0 ? 25 : 13, trigger: i === 0, groupId: 'tutorial-rush', rowDir: { x: 1, y: 0 } })),
    ],
  };
}