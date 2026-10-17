import { EndlessEngine } from '@/game/endlessEngine';

// Live engine receipts only. Saved personal bests and SDK responses cannot mint a run.
// These checks prevent integration mistakes, NOT hostile browser modification.
const runs = new WeakMap();
const receipts = new WeakSet();
export function beginEndlessRun(engine) {
  if (!(engine instanceof EndlessEngine) || !['intro', 'playing'].includes(engine.state) || engine.score !== 0) return;
  runs.set(engine, { started: performance.now(), ended: false });
}
export function completeEndlessRun(engine) {
  const run = runs.get(engine);
  if (!run || run.ended || !(engine instanceof EndlessEngine) || engine.mode !== 'endless' || engine.state !== 'dead') return null;
  run.ended = true;
  const rawScore = engine.score;
  const receipt = Object.freeze({
    score: typeof rawScore === 'number' && Number.isFinite(rawScore) ? Math.floor(rawScore) : NaN,
    valid: typeof rawScore === 'number' && Number.isFinite(rawScore) && rawScore >= 0
      && Number.isFinite(engine.attemptTime) && engine.attemptTime >= 0 && performance.now() >= run.started,
  });
  receipts.add(receipt);
  return receipt;
}
export const isCompletedEndlessRun = (receipt) => receipts.has(receipt);