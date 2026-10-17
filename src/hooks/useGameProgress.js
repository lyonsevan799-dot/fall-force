import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usesBrowserSaves, getSaveNotice, subscribeSaveNotice } from '@/game/platform/saveStore';
import { loadProgress, PROGRESS_KEY } from '@/game/progress';
import progressTransaction from '@/game/progressTransaction';

export default function useGameProgress(initial) {
  const [save, setSave] = useState(initial), saveRef = useRef(initial);
  const [saveError, setSaveError] = useState('');
  const storageNotice = useSyncExternalStore(subscribeSaveNotice, getSaveNotice);
  const accept = useCallback((next) => { saveRef.current = next; setSave(next); }, []);
  useEffect(() => {
    const sync = (event) => { if (usesBrowserSaves() && (event.key === PROGRESS_KEY || event.key == null)) accept(loadProgress()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [accept]);
  const updateSave = useCallback(async (updater) => {
    try {
      const next = await progressTransaction(updater);
      accept(next); setSaveError(''); return next;
    } catch (error) {
      const message = error?.message?.includes('gems') || error?.message?.includes('skin') || error?.message?.includes('Another tab')
        ? error.message : 'Could not save this purchase. No gems were spent; try again when saving is available.';
      setSaveError(message); throw new Error(message);
    }
  }, [accept]);
  // Gameplay events do not leak rejected promises into the canvas loop.
  const commitGame = useCallback(async (updater, options = {}) => {
    try {
      const next = await progressTransaction(updater, { allowVolatile: options.allowVolatile !== false });
      accept(next); setSaveError(''); return next;
    } catch { return null; }
  }, [accept]);
  return { save, saveRef, updateSave, commitGame, saveError: storageNotice || saveError };
}