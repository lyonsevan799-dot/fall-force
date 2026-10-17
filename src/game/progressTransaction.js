import { loadProgress, PROGRESS_KEY } from '@/game/progress';

let queue = Promise.resolve();
const LOCK = `${PROGRESS_KEY}-write`;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Web Locks serialize all tabs. The lease is for older browsers without Web Locks.
async function withLease(task) {
  const key = `${LOCK}-lease`, owner = crypto.randomUUID();
  for (let attempt = 0; attempt < 35; attempt++) {
    const raw = localStorage.getItem(key);
    const lease = raw ? JSON.parse(raw) : null;
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
export default function progressTransaction(update) {
  const run = async () => {
    const commit = () => {
      // Do not turn an unreadable existing save into a charge against a fallback.
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) JSON.parse(raw);
      const current = loadProgress();
      const proposed = update(current);
      if (!proposed || proposed === current) return current;
      if (!Number.isSafeInteger(proposed.totalGems) || proposed.totalGems < 0) throw new Error('Invalid gem balance. Nothing was spent.');
      const next = { ...proposed, saveRevision: (Number(current.saveRevision) || 0) + 1 };
      // One synchronous write atomically commits gems AND ownership/equipment.
      // setItem throws before changing storage if persistence is blocked or full.
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      return next;
    };
    return navigator.locks?.request ? navigator.locks.request(LOCK, commit) : withLease(commit);
  };
  const result = queue.then(run);
  queue = result.catch(() => {});
  return result;
}