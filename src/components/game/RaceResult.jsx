import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Gem } from 'lucide-react';
import { GameButton, Panel } from './ui';

export default function RaceResult({ ui, sound, onRestart, onExit }) {
  const winnerNum = ui.winner === 0 ? 1 : 2;
  const loserNum = ui.winner === 0 ? 2 : 1;
  const isP1 = ui.winner === 0;
  const winnerText = isP1 ? 'text-cyan-200' : 'text-pink-200';
  const winnerGlow = isP1 ? '0 0 40px rgba(56,232,255,0.6)' : '0 0 40px rgba(255,62,165,0.6)';
  const loserFinished = isP1 ? ui.p2Finished : ui.p1Finished;
  const loserTime = isP1 ? ui.p2Time : ui.p1Time;
  const loserFinalProgress = isP1 ? (ui.p2Final || ui.p2) : (ui.p1Final || ui.p1);

  useEffect(() => {
    const colors = isP1 ? ['#7ff4ff', '#3ae8ff', '#ffffff'] : ['#ff9ec4', '#ff3ea5', '#ffffff'];
    const end = Date.now() + 2500;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors, scalar: 0.8, disableForReducedMotion: true });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors, scalar: 0.8, disableForReducedMotion: true });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [ui.winner]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <Panel className="gs-pop w-full max-w-md text-center">
        <div className="font-heading text-[10px] uppercase tracking-[0.5em] text-white/40">Winner</div>
        <h2 className={`mt-2 font-heading text-4xl uppercase tracking-[0.18em] sm:text-5xl ${winnerText}`}
            style={{ textShadow: winnerGlow }}>
          Player {winnerNum}
        </h2>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-6 py-3">
          <div className="font-heading text-[9px] uppercase tracking-[0.3em] text-white/40">Race Time</div>
          <div className="mt-1 font-mono text-3xl text-white">{(ui.raceTime || 0).toFixed(2)}<span className="ml-1 text-base text-white/40">s</span></div>
        </div>

        <div className="mt-3 text-sm text-white/50">
          {loserFinished
            ? <>Player {loserNum} finished in <span className="font-mono text-white/70">{(loserTime || 0).toFixed(2)}s</span></>
            : <>Player {loserNum} reached <span className="font-mono text-white/70">{Math.round(loserFinalProgress * 100)}%</span> of the course</>}
        </div>

        <div className="mt-3 flex items-center justify-center gap-5 text-xs">
          <span className="flex items-center gap-1.5 text-cyan-200"><Gem size={13} className="text-cyan-300" />P1 {ui.p1Gems || 0}</span>
          <span className="flex items-center gap-1.5 text-pink-200"><Gem size={13} className="text-pink-300" />P2 {ui.p2Gems || 0}</span>
        </div>

        <div className="mt-6 space-y-3">
          <GameButton variant="primary" size="lg" sound={sound} onClick={onRestart} className="w-full">
            <RotateCcw size={18} /> Rematch
          </GameButton>
          <GameButton variant="ghost" sound={sound} onClick={onExit} className="w-full">
            <Home size={16} /> Main Menu
          </GameButton>
        </div>

        <div className="mt-4 text-[10px] text-white/30">Press R to rematch · Esc for menu</div>
      </Panel>
    </div>
  );
}