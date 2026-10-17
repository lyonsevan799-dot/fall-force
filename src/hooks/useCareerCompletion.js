import { useCallback, useEffect, useRef, useState } from 'react';

const initial = { pending: false, saved: false, error: '' };
export default function useCareerCompletion(onComplete, levelIndex) {
  const [status, setStatus] = useState(initial);
  const callback = useRef(onComplete), receipt = useRef(null), busy = useRef(false), active = useRef(true);
  callback.current = onComplete;
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const submit = useCallback(async (result = receipt.current) => {
    if (!result || busy.current) return;
    receipt.current = result; busy.current = true; setStatus({ ...initial, pending: true });
    try {
      const saved = await callback.current(levelIndex, result);
      if (active.current) setStatus(saved ? { ...initial, saved: true } : { ...initial, error: 'Completion could not be saved. Retry saving before continuing.' });
    } catch {
      if (active.current) setStatus({ ...initial, error: 'Completion could not be saved. Retry saving before continuing.' });
    } finally { busy.current = false; }
  }, [levelIndex]);
  const clear = useCallback(() => {
    if (busy.current) return false;
    receipt.current = null; setStatus(initial); return true;
  }, []);
  return { ...status, submit, clear, retry: () => submit() };
}