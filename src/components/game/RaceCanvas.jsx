import React, { useEffect, useRef, useState } from 'react';
import useRaceSession from '@/hooks/useRaceSession';
import useRaceControls from '@/hooks/useRaceControls';
import RaceHud from '@/components/game/RaceHud';
import RaceOverlays from '@/components/game/race/RaceOverlays';

export default function RaceCanvas(options) {
  const wrapRef = useRef(null), canvasRef = useRef(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const race = useRaceSession(options, wrapRef, canvasRef);
  const pointer = useRaceControls(race.engineRef, race.actionsRef, options.sound);
  useEffect(() => { if (!race.paused) setSettingsOpen(false); }, [race.paused]);
  return <div ref={wrapRef} className="race-shell fixed inset-0 touch-none select-none overflow-hidden bg-background text-foreground">
    <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full touch-none" onPointerDown={pointer} onContextMenu={(event) => event.preventDefault()} />
    <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 border-l border-border" />
    {race.ui.state !== 'ready' && race.ui.state !== 'raceover' ? <RaceHud ui={race.ui} series={race.series} isTouch={race.touch} totalGems={options.totalGems} sound={options.sound} onPause={() => race.actionsRef.current?.togglePause()} /> : null}
    <RaceOverlays race={race} options={options} settingsOpen={settingsOpen} setSettingsOpen={setSettingsOpen} />
  </div>;
}