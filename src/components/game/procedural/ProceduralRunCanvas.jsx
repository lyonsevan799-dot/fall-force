import React, { useEffect, useRef, useState } from 'react';
import useProceduralRun from '@/hooks/useProceduralRun';
import useProceduralControls from '@/hooks/useProceduralControls';
import useTrialOrientation from '@/hooks/useTrialOrientation';
import EndlessHud from '@/components/game/EndlessHud';
import SurvivalHud from '@/components/game/survival/SurvivalHud';
import RunOverlays from '@/components/game/procedural/RunOverlays';

export default function ProceduralRunCanvas(options) {
  const wrapRef = useRef(null), canvasRef = useRef(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const run = useProceduralRun(options, options.mode, wrapRef, canvasRef, options.leaderboard);
  const pointer = useProceduralControls(run.engineRef, run.actionsRef, options.sound);
  const orientation = useTrialOrientation(run.engineRef, run.setPaused);
  useEffect(() => { if (!run.paused) setSettingsOpen(false); }, [run.paused]);
  const pause = () => run.actionsRef.current?.togglePause();
  return <div ref={wrapRef} className="meta-shell fixed inset-0 touch-none select-none overflow-hidden bg-background text-foreground">
    <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full touch-none" onPointerDown={pointer} onContextMenu={(event) => event.preventDefault()} />
    {options.mode === 'survival'
      ? <SurvivalHud ui={run.ui} records={options.records} totalGems={options.totalGems} sound={options.sound} onPause={pause} />
      : <EndlessHud ui={run.ui} best={Math.max(options.best || 0, run.ui.score || 0)} totalGems={options.totalGems} sound={options.sound} onPause={pause} />}
    <RunOverlays run={run} options={options} orientation={orientation} settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} />
  </div>;
}