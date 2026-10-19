import { useRef, useState } from 'react';
export default function useSkipPurchase(updateSave) {
  const busy = useRef(false);
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  const perform = async (updater) => {
    if (busy.current) return null;
    busy.current = true; setPending(true); setError('');
    try { return await updateSave(updater); }
    catch (failure) { setError(failure.message || 'Could not save. No gems were spent.'); return null; }
    finally { busy.current = false; setPending(false); }
  };
  return { pending, error, perform };
}