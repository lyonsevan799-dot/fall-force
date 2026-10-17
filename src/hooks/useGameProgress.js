import { useCallback, useEffect, useRef, useState } from 'react';
import { loadProgress, PROGRESS_KEY } from '@/game/progress';
import progressTransaction from '@/game/progressTransaction';

export default function useGameProgress(initial) {
  const [save, setSave] = useState(initial), saveRef = useRef(initial);
  const [saveError, setSaveError] = useState('');
  const accept = useCallback((next) => { saveRef.current = next; setSave(next); }, []);
  useEffect(() => {
    const sync = (event) => { if (event.key === PROGRESS_KEY || event.key == null) accept(loadProgress()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [accept]);
  const updateSave = useCallback(async (updater) => {
    try {
      const next = await progressTransaction(updater);
      accept(next); setSaveError(''); return next;
    } catch (error) {
      const message = error?.message?.includes('gems') || error?.message?.includes('skin') || error?.message?.includes('Another tab')
        ? error.message : 'Could not save. Check browser storage permissions or space and try again; no purchase was charged.';
      setSaveError(message); throw new Error(message);
    }
  }, [accept]);
  // Gameplay events do not leak rejected promises into the canvas loop.
  const commitGame = useCallback((updater) => updateSave(updater).catch(() => null), [updateSave]);
  return { save, saveRef, updateSave, commitGame, saveError };
}