import { PROGRESS_KEY, checkSaveSize, saveMessage } from '@/game/platform/saveConstants';
import migrateLegacySave from '@/game/platform/saveMigration';

let backend = null, mode = 'memory', cached = null, volatile = false, blocked = false, validate;
let notice = '';
const listeners = new Set();
export const getSaveNotice = () => notice;
export const usesBrowserSaves = () => mode === 'browser' && !blocked;
export function subscribeSaveNotice(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function notify(error) {
  notice = error ? saveMessage(error) : '';
  listeners.forEach((listener) => listener());
}
export function initializeSaveStore(sdk, decode) {
  validate = decode;
  try {
    if (sdk) {
      mode = 'crazygames'; backend = sdk.data;
      cached = migrateLegacySave(backend, decode);
    } else {
      mode = 'browser'; backend = window.localStorage;
      cached = backend.getItem(PROGRESS_KEY);
    }
    if (cached !== null) decode(cached);
  } catch (error) {
    // A failed SDK read must not fall through to an unrelated browser/account wallet.
    blocked = true;
    if (error?.code === 'corruptSave' && mode === 'browser' && cached) {
      try {
        const key = `${PROGRESS_KEY}-corrupt-backup`;
        if (!backend.getItem(key)) backend.setItem(key, cached);
      } catch { /* original remains untouched even if backup storage is full */ }
    }
    // Only a validated migration candidate may be kept in memory after a rejected import.
    // Never load a local wallet after an SDK read error (account data may be unknown).
    if (error?.legacySave) cached = error.legacySave;
    notify(error);
  }
}
export function readSaveRaw() {
  if (volatile || blocked) return cached;
  try {
    const candidate = backend?.getItem(PROGRESS_KEY) ?? null;
    if (candidate !== null) validate(candidate);
    cached = candidate;
  } catch (error) { blocked = true; notify(error); }
  return cached;
}
export function writeSaveRaw(raw) {
  checkSaveSize(raw);
  if (blocked || !backend) throw Object.assign(new Error(notice || 'Saving unavailable'), { code: 'storeBlocked' });
  const previous = cached;
  try {
    backend.setItem(PROGRESS_KEY, raw);
    cached = raw; volatile = false; notify(null);
  } catch (error) {
    // SDK implementations may update their in-memory value before throwing a size error.
    // Restore only our record, never clear the player's entire Data Module.
    if (mode === 'crazygames') {
      try {
        if (previous === null) backend.removeItem(PROGRESS_KEY);
        else backend.setItem(PROGRESS_KEY, previous);
      } catch { blocked = true; }
    }
    cached = previous; volatile = true;
    notify(error); throw error;
  }
}
// Gameplay continues after write failure without re-running an award. Purchases stay atomic.
export function keepSessionSave(raw, error) { cached = raw; volatile = true; if (error?.code !== 'storeBlocked') notify(error); }
export function removeSave() {
  if (blocked || !backend) throw new Error(notice || 'Saving unavailable');
  backend.removeItem(PROGRESS_KEY); cached = null; volatile = false;
  // Do not data.clear(): it would also erase migration metadata or future SDK records.
}