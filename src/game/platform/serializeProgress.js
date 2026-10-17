import { checkSaveSize } from '@/game/platform/saveConstants';

// Optional recordings must not stop wallet, ownership, claims, or best-time saves.
// Never prune claim ledgers: that could allow an old receipt to pay again.
export default function serializeProgress(save) {
  const original = JSON.stringify(save);
  try { checkSaveSize(original); return { save, raw: original }; }
  catch (error) { if (error?.code !== 'dataLimitExcedeed') throw error; }
  const records = { ...save.timeTrialRecords };
  const candidates = Object.entries(records).filter(([, record]) => record?.ghost)
    .sort(([, a], [, b]) => (Number(a.recordedAt) || 0) - (Number(b.recordedAt) || 0));
  for (const [key, record] of candidates) {
    records[key] = { ...record, ghost: null, ghostNote: 'Recording removed to preserve save space. Personal-best time and splits are retained.' };
    const compacted = { ...save, timeTrialRecords: records }, raw = JSON.stringify(compacted);
    try { checkSaveSize(raw); return { save: compacted, raw }; }
    catch (error) { if (error?.code !== 'dataLimitExcedeed') throw error; }
  }
  // If essential progress alone is too large, preserve the durable original and
  // let the existing transaction show its save warning and retain session data.
  return { save, raw: original };
}