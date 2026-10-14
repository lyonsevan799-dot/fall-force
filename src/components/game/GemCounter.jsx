import React, { useEffect, useRef, useState } from 'react';
import { Gem } from 'lucide-react';

// Displays the player's persistent total gem balance (gem icon + number).
// `count` (gems collected this level/run) is only used to trigger the +1 pop
// animation — it is not shown, since there is no per-level gem target.
export default function GemCounter({ count, total, size = 'sm' }) {
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
      <Gem size={iconSize} className="text-cyan-300 drop-shadow-[0_0_4px_rgba(56,232,255,0.5)]" />
      <span className={`font-mono ${textSize} text-white/80`}>{(total || 0).toLocaleString()}</span>
      {popKey > 0 && (
        <div key={popKey} className="gs-gem-pop pointer-events-none absolute -top-1 left-5 font-mono text-xs font-bold text-cyan-300">+1</div>
      )}
    </div>
  );
}