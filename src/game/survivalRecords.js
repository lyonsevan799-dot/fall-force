import creditRunGems from '@/game/gemCredits';
import { safeInteger } from '@/game/saveData';

export default function commitSurvivalResult(save, run) {
  if (!run.runId || save.gemCredits?.[run.runId]) return save;
  const credited = creditRunGems(save, run.runId, 'survival', run.gems);
  const old = save.survivalRecords || {};
  return { ...credited, survivalRecords: {
    bestScore: Math.max(safeInteger(old.bestScore), safeInteger(run.score)),
    bestTime: Math.max(Number(old.bestTime) || 0, Number.isFinite(run.time) ? run.time : 0),
    bestDistance: Math.max(safeInteger(old.bestDistance), safeInteger(run.distance)),
    runs: safeInteger(old.runs) + 1,
  } };
}
export function formatSurvivalTime(value = 0) {
  const tenths = Math.max(0, Math.floor(value * 10));
  return `${String(Math.floor(tenths / 600)).padStart(2, '0')}:${String(Math.floor(tenths / 10) % 60).padStart(2, '0')}.${tenths % 10}`;
}