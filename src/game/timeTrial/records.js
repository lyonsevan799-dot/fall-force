import { COURSE_SIGNATURES, trialRecord } from '@/game/timeTrial/courses';
import { checkSaveSize } from '@/game/platform/saveConstants';

export default function commitTrialRecord(save, run) {
  if (!run || run.completed !== true || run.deaths !== 0 || !Number.isInteger(run.levelIndex)
    || typeof COURSE_SIGNATURES[run.levelIndex] !== 'string' || run.signature !== COURSE_SIGNATURES[run.levelIndex] || !Number.isSafeInteger(run.timeMs) || run.timeMs <= 0) {
    throw new Error('Only completed, death-free Time Trial runs can set a personal record.');
  }
  const previous = trialRecord(save.timeTrialRecords, run.levelIndex);
  if (previous && previous.timeMs <= run.timeMs) return { save, improved: false };
  const record = { timeMs: run.timeMs, signature: run.signature, recordedAt: Date.now(),
    runId: run.runId, splits: run.splits, ghost: run.ghost, ghostNote: run.ghost ? '' : 'No recording is available for this run.' };
  const next = { ...save, timeTrialRecords: { ...save.timeTrialRecords, [run.levelIndex]: record } };
  try { checkSaveSize(JSON.stringify(next)); }
  catch (error) {
    if (error?.code !== 'dataLimitExcedeed') throw error;
    // Never discard Career/inventory data or attach an older path to a new best.
    record.ghost = null; record.ghostNote = 'Save space is full; the exact personal-best time and splits were retained without a ghost.';
    checkSaveSize(JSON.stringify(next));
  }
  return { save: next, improved: true };
}