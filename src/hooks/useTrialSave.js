import { useCallback, useEffect, useRef, useState } from 'react';

const initial = { pending: false, saved: false, newRecord: false, bestMs: null, error: '', ghostStored: false };
export default function useTrialSave(onSave) {
  const [status, setStatus] = useState(initial);
  const callback = useRef(onSave), active = useRef(true), receipt = useRef(null), busy = useRef(false);
  callback.current = onSave;
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const submit = useCallback(async (run = receipt.current) => {
    if (!run || busy.current) return;
    receipt.current = run; busy.current = true; setStatus({ ...initial, pending: true });
    try {
      const result = await callback.current(run);
      if (!active.current || receipt.current !== run) return;
      setStatus(result?.saved ? { ...initial, ...result } : { ...initial, error: 'This record could not be saved. Retry saving before leaving to keep this run.' });
    } catch {
      if (active.current && receipt.current === run) setStatus({ ...initial, error: 'This record could not be saved. Please try again.' });
    } finally { busy.current = false; }
  }, []);
  const clear = useCallback(() => { if (busy.current) return false; receipt.current = null; setStatus(initial); return true; }, []);
  return { status, submit, clear, retrySave: () => submit() };
}