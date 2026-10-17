import React from 'react';
import useTutorialGame from '@/hooks/useTutorialGame';
import TutorialPrompt from '@/components/game/tutorial/TutorialPrompt';
import TutorialHud from '@/components/game/tutorial/TutorialHud';
import TutorialComplete from '@/components/game/tutorial/TutorialComplete';

export default function TutorialCanvas({ sound, settings, skinId, totalGems, banked, canSkip, onComplete, onReplay, onPlay, onExit, onSkip }) {
  const game = useTutorialGame({ sound, settings, skinId, onComplete });
  const complete = game.ui.state === 'complete';
  return (
    <div ref={game.wrapRef} className="tutorial-shell fixed inset-0 overflow-hidden bg-background text-foreground">
      <canvas ref={game.canvasRef} aria-label="Tutorial playfield: tap or click to flip gravity when prompted" className="absolute inset-0 block h-full w-full touch-none"
        onPointerDown={(event) => { if (event.pointerType === 'mouse' && event.button !== 0) return; event.preventDefault(); game.flip(); }} onContextMenu={(event) => event.preventDefault()} />
      {!complete && <>
        <TutorialHud ui={game.ui} totalGems={totalGems} banked={banked} canSkip={canSkip} onPause={game.pause} onRestart={game.restart} onExit={onExit} onSkip={onSkip} />
        {!game.ui.paused && game.ui.state === 'playing' && <TutorialPrompt phase={game.ui.phase} onContinue={game.proceed} onFlip={game.flip} />}
        <div className="pointer-events-none absolute bottom-2 left-3 text-[10px] text-primary">Tap / Click / Space = flip · P = pause · R = restart</div>
      </>}
      {complete && <TutorialComplete totalGems={totalGems} onPlay={onPlay} onReplay={() => { onReplay?.(); game.restart(); }} onExit={onExit} />}
    </div>
  );
}