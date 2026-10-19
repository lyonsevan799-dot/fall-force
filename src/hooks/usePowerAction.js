import { useRef, useState } from 'react';
export default function usePowerAction(updateSave) {
  const busy = useRef(false);
  const [pending, setPending] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const perform = async (updater, success) => {
    if (busy.current) return null;
    busy.current = true; setPending(true); setError(''); setMessage('');
    try {
      const next = await updateSave(updater);
      setMessage(success); return next;
    } catch (failure) { setError(failure.message || 'Could not save. No gems were spent.'); return null; }
    finally { busy.current = false; setPending(false); }
  };
  return { pending, error, message, perform };
}