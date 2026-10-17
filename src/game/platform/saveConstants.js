export const PROGRESS_KEY = 'gravity-switch-save-v1';
export const MIGRATION_KEY = `${PROGRESS_KEY}-crazygames-migrated-v1`;
// Leave room for SDK metadata, escaped JSON, and the SDK's other keys under 1 MiB.
export const SAVE_BUDGET = 900000;
export function checkSaveSize(raw) {
  if (new TextEncoder().encode(JSON.stringify({ [PROGRESS_KEY]: raw })).length > SAVE_BUDGET) {
    throw Object.assign(new Error('Save data is too large. The previous save was kept.'), { code: 'dataLimitExcedeed' });
  }
}
export function saveMessage(error) {
  if (error?.code === 'dataLimitExcedeed') return 'Save data is too large. Previous saved progress is untouched; new progress stays in this session.';
  if (error?.code === 'dataModuleDisabled') return 'CrazyGames saving is disabled. Progress stays in this session; enable the Data Module in the CrazyGames submission settings.';
  if (error?.code === 'corruptSave') return 'Saved data could not be read. The original is untouched; new progress stays in this session.';
  return 'Saving is unavailable. New progress stays in this session; reload to retry. No cloud backup is confirmed.';
}