import { PROGRESS_KEY, MIGRATION_KEY, checkSaveSize } from '@/game/platform/saveConstants';

function migrationFinished() {
  try { localStorage.setItem(MIGRATION_KEY, '1'); } catch { /* migration marker is not player data */ }
}
// Never merge guest/account saves or compare gem balances. An SDK save is authoritative.
export default function migrateLegacySave(data, decode) {
  const existing = data.getItem(PROGRESS_KEY);
  if (existing !== null) { migrationFinished(); return existing; }
  let legacy;
  try {
    if (localStorage.getItem(MIGRATION_KEY) === '1') return null;
    legacy = localStorage.getItem(PROGRESS_KEY);
  } catch { return null; }
  if (legacy === null) return null;
  const progress = decode(legacy); // Validate before writing anything; never copy malformed defaults.
  const migrated = JSON.stringify({ ...progress, crazyGamesMigration: 1 });
  try {
    checkSaveSize(migrated);
    data.setItem(PROGRESS_KEY, migrated);
  } catch (error) {
    // The key was absent: undo any rejected in-memory mutation, without touching other SDK data.
    try { data.removeItem(PROGRESS_KEY); } catch { /* preserve the original browser save */ }
    throw Object.assign(new Error('Legacy save migration could not persist'), { code: error?.code || 'other', legacySave: migrated });
  }
  migrationFinished(); // Only after the complete wallet + reward ledgers were accepted together.
  return migrated;
}