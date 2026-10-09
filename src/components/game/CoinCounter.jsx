import React, { useEffect, useRef, useState } from 'react';
import { Coins } from 'lucide-react';

export default function CoinCounter({ count, total, size = 'sm' }) {
  const prevCountRef = useRef(count || 0);
  const [popKey, setPopKey] = useState(0);

  useEffect(() => {
    if ((count || 0) > prevCountRef.current) setPopKey((k) => k + 1);
    prevCountRef.current = count || 0;
  }, [count]);

  const iconSize = size === 'lg' ? 16 : size === 'md' ? 13 : 11;
  const textSize = size === 'lg' ? 'text-sm' : size === 'md' ? 'text-xs' : 'text-[11px]';

  return (
    <div className="relative flex items-center gap-1.5">
      <Coins size={iconSize} className="text-amber-300 drop-shadow-[0_0_4px_rgba(252,211,77,0.5)]" />
      <span className={`font-mono ${textSize} text-white/80`}>{count || 0}</span>
      {total != null && (
        <span className={`font-mono ${size === 'sm' ? 'text-[10px]' : 'text-xs'} text-amber-200/50`}>/ {total.toLocaleString()}</span>
      )}
      {popKey > 0 && (
        <div key={popKey} className="gs-coin-pop pointer-events-none absolute -top-1 left-5 font-mono text-xs font-bold text-amber-300">+1</div>
      )}
    </div>
  );
}