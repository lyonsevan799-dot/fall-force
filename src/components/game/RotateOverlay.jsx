import React from 'react';
import { RotateCcw } from 'lucide-react';
import { GameButton } from './ui';

export default function RotateOverlay({ onDismiss }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-[#04050c]/95 p-8 text-center">
      <RotateCcw size={44} className="gs-float text-cyan-200" />
      <div className="font-heading text-sm uppercase tracking-[0.3em] text-white">Rotate your device</div>
      <p className="max-w-xs text-xs leading-relaxed text-white/50">
        Fall Force plays best in landscape. Turn your phone sideways for the full view.
      </p>
      <GameButton variant="ghost" size="sm" onClick={onDismiss}>Play anyway</GameButton>
    </div>
  );
}