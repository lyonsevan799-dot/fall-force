import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function RaceCelebration({ winner }) {
  useEffect(() => {
    if (winner !== 0 && winner !== 1) return;
    const colors = winner === 0 ? ['#7ff4ff', '#3ae8ff', '#ffffff'] : ['#ff9ec4', '#ff3ea5', '#ffffff'];
    const end = performance.now() + 2500;
    let raf;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors, scalar: 0.8, disableForReducedMotion: true });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors, scalar: 0.8, disableForReducedMotion: true });
      if (performance.now() < end) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, [winner]);
  return null;
}