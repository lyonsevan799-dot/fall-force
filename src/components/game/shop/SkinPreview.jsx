import React, { useEffect, useRef } from 'react';
import drawSkin from '@/game/skins/drawSkin';

export default function SkinPreview({ skinId, large = false, rotation = 0, reduced = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d');
    let frame, last = -Infinity;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const staticPreview = reduced || media.matches;
    const draw = (now) => {
      if (now - last > 32) {
        last = now; ctx.clearRect(0, 0, 280, 200); ctx.save(); ctx.translate(140, 100);
        ctx.rotate(rotation * Math.PI / 180); ctx.scale(large ? 3.1 : 2.4, large ? 3.1 : 2.4);
        drawSkin(ctx, skinId, { time: now / 1000, reduced: staticPreview }); ctx.restore();
      }
      if (!staticPreview) frame = requestAnimationFrame(draw);
    };
    draw(performance.now());
    return () => cancelAnimationFrame(frame);
  }, [skinId, large, rotation, reduced]);
  return <canvas ref={ref} width={280} height={200} role="img" aria-label={`${skinId} skin preview, identical to gameplay`} className={large ? 'mx-auto h-44 w-full max-w-sm object-contain sm:h-52' : 'h-32 w-full object-contain'} />;
}