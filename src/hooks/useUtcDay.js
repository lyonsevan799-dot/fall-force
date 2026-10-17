import { useEffect, useState } from 'react';
import { utcDate } from '@/game/meta/dailyCatalog';

export default function useUtcDay() {
  const [day, setDay] = useState(() => utcDate());
  useEffect(() => {
    let timer;
    const update = () => {
      clearTimeout(timer);
      const now = Date.now();
      setDay(utcDate(now));
      timer = setTimeout(update, 86400000 - now % 86400000 + 25);
    };
    update();
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => { clearTimeout(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update); };
  }, []);
  return day;
}