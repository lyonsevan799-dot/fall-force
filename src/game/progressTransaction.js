import { loadProgress, PROGRESS_KEY } from '@/game/progress';
import { writeSaveRaw, keepSessionSave, usesBrowserSaves } from '@/game/platform/saveStore';
import { reconcileMetaSave } from '@/game/meta/progression';

let queue = Promise.resolve();
const LOCK = `${PROGRESS_KEY}-write`;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Web Locks serialize all tabs. The lease is for older browsers without Web Locks.
async function withLease(task) {
  const key = `${LOCK}-lease`, owner = crypto.randomUUID();
  for (let attempt = 0; attempt < 35; attempt++) {
    const raw = localStorage.getItem(key);
    let lease;
    try { lease = raw ? JSON.parse(raw) : null; } catch { lease = null; }
    if (!lease || lease.expires < Date.now()) {
      localStorage.setItem(key, JSON.stringify({ owner, expires: Date.now() + 4000 }));
      await delay(45);
      if (JSON.parse(localStorage.getItem(key) || 'null')?.owner === owner) {
        try { return task(); }
        finally { if (JSON.parse(localStorage.getItem(key) || 'null')?.owner === owner) localStorage.removeItem(key); }
      }
    }
    await delay(70);
  }
  throw new Error('Another tab is saving. Please wait a moment and try again.');
}
export default function progressTransaction(update, { allowVolatile = false } = {}) {
  const run = async () => {
    const commit = () => {
      const current = loadProgress();
      const proposed = update(current);
      if (!proposed || proposed === current) return current;
      if (!Number.isSafeInteger(proposed.totalGems) || proposed.totalGems < 0) throw new Error('Invalid gem balance. Nothing was spent.');
      const next = { ...reconcileMetaSave(proposed), saveRevision: (Number(current.saveRevision) || 0) + 1 };
      // One SDK/browser record atomically contains wallet, ownership, and claim ledgers.
      const raw = JSON.stringify(next);
      try { writeSaveRaw(raw); }
      catch (error) {
        if (!allowVolatile) throw error;
        keepSessionSave(raw, error);
      }
      return next;
    };
    if (!usesBrowserSaves()) return commit(); // SDK owns guest/account storage and its debounce.
    try { return await (navigator.locks?.request ? navigator.locks.request(LOCK, commit) : withLease(commit)); }
    catch (error) {
      if (['SecurityError', 'QuotaExceededError'].includes(error?.name)) return commit();
      throw error;
    }
  };
  const result = queue.then(run);
  queue = result.catch(() => {});
  return result;
}