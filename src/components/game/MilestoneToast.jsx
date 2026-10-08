import React, { useEffect, useState } from 'react';

const STYLES = {
  distance: { border: 'border-cyan-300/40', text: 'text-cyan-200', glow: 'shadow-[0_0_60px_-12px_rgba(56,232,255,0.7)]' },
  section: { border: 'border-fuchsia-300/40', text: 'text-fuchsia-200', glow: 'shadow-[0_0_60px_-12px_rgba(255,62,165,0.7)]' },
  best: { border: 'border-amber-300/50', text: 'text-amber-200', glow: 'shadow-[0_0_70px_-10px_rgba(252,211,77,0.8)]' },
};

export default function MilestoneToast({ event }) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (!event) return;
    setActive(event);
    const timer = setTimeout(() => setActive(null), 1600);
    return () => clearTimeout(timer);
  }, [event]);

  if (!active) return null;

  const s = STYLES[active.type] || STYLES.distance;

  return (
    <div className="pointer-events-none absolute inset-0 z-25 flex items-center justify-center">
      <div className={`gs-milestone-pop rounded-2xl border bg-black/50 px-8 py-4 backdrop-blur-md ${s.border} ${s.glow}`}>
        <div className={`font-heading text-2xl uppercase tracking-[0.2em] sm:text-4xl ${s.text}`}>
          {active.text}
        </div>
      </div>
    </div>
  );
}