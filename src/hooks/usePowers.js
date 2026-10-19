import { useRef, useState } from 'react';
import { activateDoubleGems } from '@/game/powers/activation';
export default function usePowers(updateSave) {
  const [selected, setSelected] = useState(false), [active, setActive] = useState(null);
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  const busy = useRef(false);
  const begin = async (index, challenge, id) => {
    if (busy.current) return false;
    busy.current = true; setPending(true); setError('');
    try {
      if (selected) await updateSave((save) => activateDoubleGems(save, index, id, challenge));
      setActive(selected ? { id, levelIndex: index } : null); setSelected(false); return true;
    } catch (failure) { setError(failure.message); return false; }
    finally { busy.current = false; setPending(false); }
  };
  return { selected, setSelected, active, pending, error, begin, end: () => { setActive(null); setError(''); } };
}