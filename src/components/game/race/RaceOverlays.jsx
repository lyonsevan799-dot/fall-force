import React from 'react';
import RaceIntro from '@/components/game/RaceIntro';
import RaceResult from '@/components/game/RaceResult';
import PauseMenu from '@/components/game/PauseMenu';
import SettingsPanel from '@/components/game/SettingsPanel';
import RotateOverlay from '@/components/game/RotateOverlay';

export default function RaceOverlays({ race, options, settingsOpen, setSettingsOpen }) {
  const actions = race.actionsRef.current, ui = race.ui;
  const rematch = () => { setSettingsOpen(false); actions?.rematch(); };
  const exit = () => actions?.exit();
  return <>
    {ui.state === 'ready' ? <RaceIntro sound={options.sound} onStart={() => actions?.start()} onExit={exit} isTouch={race.touch} series={race.series} onFormat={(value) => actions?.setFormat(value)} skinIds={options.skinIds} ownedSkins={options.ownedSkins} onEquipSkin={options.onEquipSkin} /> : null}
    {ui.state === 'countdown' ? <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"><div key={Math.ceil(ui.countdown)} className="gs-countdown font-heading text-8xl text-foreground">{Math.max(1, Math.ceil(ui.countdown))}</div></div> : null}
    {ui.state === 'racing' && ui.raceTime < 0.7 ? <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"><div className="gs-go font-heading text-7xl text-primary">GO!</div></div> : null}
    {ui.state === 'finished' ? <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center text-center"><div className={`gs-winner-banner font-heading text-4xl uppercase sm:text-5xl ${ui.winner === -1 ? 'text-foreground' : ui.winner === 0 ? 'text-race-one' : 'text-race-two'}`}>{ui.winner === -1 ? 'Draw!' : `Player ${ui.winner + 1} Wins!`}</div></div> : null}
    {ui.state === 'raceover' ? <RaceResult ui={ui} series={race.series} totalGems={options.totalGems} sound={options.sound} bank={race.bank} onSave={() => actions?.retrySave()} onRestart={rematch} onExit={exit} /> : null}
    {race.paused && !settingsOpen ? <PauseMenu title="Local Race" exitLabel="Main Menu" sound={options.sound} onResume={() => actions?.togglePause()} onRestart={rematch} onSettings={() => setSettingsOpen(true)} onExit={exit} /> : null}
    {race.paused && settingsOpen ? <SettingsPanel settings={options.displaySettings || options.settings} sound={options.sound} onChange={options.onUpdateSettings} onReset={options.onResetProgress} onClose={() => setSettingsOpen(false)} /> : null}
    {race.rotate ? <RotateOverlay onDismiss={() => { actions?.dismissRotate(); if (!import.meta.env.CRAZYGAMES) document.documentElement.requestFullscreen?.().catch(() => {}); }} /> : null}
  </>;
}