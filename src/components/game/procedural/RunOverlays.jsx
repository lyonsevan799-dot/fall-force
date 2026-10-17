import React from 'react';
import EndlessGameOver from '@/components/game/EndlessGameOver';
import SurvivalGameOver from '@/components/game/survival/SurvivalGameOver';
import SurvivalReady from '@/components/game/survival/SurvivalReady';
import PauseMenu from '@/components/game/PauseMenu';
import SettingsPanel from '@/components/game/SettingsPanel';
import RotateOverlay from '@/components/game/RotateOverlay';
import MilestoneToast from '@/components/game/MilestoneToast';

export default function RunOverlays({ run, options, orientation, settingsOpen, setSettingsOpen }) {
  const actions = run.actionsRef.current, ui = run.ui, survival = options.mode === 'survival';
  const retry = () => { setSettingsOpen(false); actions?.restart(); };
  const exit = () => actions?.exit();
  const save = () => actions?.retrySave();
  return <>
    {!survival && ui.state === 'playing' ? <MilestoneToast event={ui.milestoneEvent} /> : null}
    {ui.rushAvailable && !ui.rush && ui.state === 'playing' ? <div className="meta-shell pointer-events-none absolute inset-x-0 bottom-5 text-center text-xs text-primary">Grab the glowing gem to rush</div> : null}
    {run.ready ? <SurvivalReady records={options.records} sound={options.sound} onStart={() => actions?.start()} onExit={exit} /> : null}
    {!run.ready && ui.state === 'intro' ? <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"><div className="meta-shell text-center"><h2 className="font-heading text-3xl uppercase">{survival ? 'Survival' : 'Endless'}</h2><p className="mt-2 text-sm text-muted-foreground">Flip · dodge · survive</p></div></div> : null}
    {ui.rush && ui.state === 'playing' ? <div className="meta-shell pointer-events-none absolute inset-x-0 bottom-5 text-center font-heading text-sm text-primary">Gem Rush · automatic</div> : null}
    {ui.state === 'dead' ? survival
      ? <SurvivalGameOver ui={ui} records={options.records} sound={options.sound} bank={run.bank} onSave={save} onRetry={retry} onExit={exit} />
      : <EndlessGameOver score={ui.score} best={Math.max(options.best || 0, ui.score || 0)} distance={ui.distance} gems={ui.gems} maxStreak={ui.maxStreak} isNewBest={ui.isNewBest} leaderboardStatus={options.leaderboard?.status} sound={options.sound} saveStatus={run.bank} onRetrySave={save} onRestart={retry} onExit={exit} /> : null}
    {run.paused && !run.ready && !settingsOpen ? <PauseMenu title={survival ? 'Survival' : 'Endless'} exitLabel="End run & return to menu" sound={options.sound} onResume={() => actions?.togglePause()} onRestart={retry} onSettings={() => setSettingsOpen(true)} onExit={exit} /> : null}
    {run.paused && settingsOpen ? <SettingsPanel settings={options.displaySettings || options.settings} sound={options.sound} onChange={options.onUpdateSettings} onReset={options.onResetProgress} onClose={() => setSettingsOpen(false)} /> : null}
    {orientation.needsRotate ? <RotateOverlay onDismiss={() => { orientation.dismiss(); if (!import.meta.env.CRAZYGAMES) document.documentElement.requestFullscreen?.().catch(() => {}); }} /> : null}
  </>;
}