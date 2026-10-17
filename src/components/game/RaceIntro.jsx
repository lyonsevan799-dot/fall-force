import React, { useState } from 'react';
import { GameButton, Panel } from '@/components/game/ui';
import { RACE_WIN_REWARD } from '@/game/raceRewards';
import RaceControlGuide from '@/components/game/race/RaceControlGuide';
import RaceSetup from '@/components/game/race/RaceSetup';

export default function RaceIntro({ sound, onStart, onExit, isTouch, series, onFormat, skinIds, ownedSkins, onEquipSkin }) {
  const [busy, setBusy] = useState(false);
  return <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
    <Panel className="my-auto w-full max-w-lg shrink-0 text-center">
      <div className="font-heading text-xs uppercase tracking-widest text-primary">Local multiplayer · One device</div>
      <h2 className="mt-2 font-heading text-2xl uppercase">Race Mode</h2>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Identical independent courses, equal camera views. Players cannot collide or trigger each other’s hazards. First to cross the finish ends the round; simultaneous finishes draw.</p>
      <RaceControlGuide touch={isTouch} />
      <RaceSetup series={series} onFormat={onFormat} skinIds={skinIds} ownedSkins={ownedSkins} onEquipSkin={onEquipSkin} onBusy={setBusy} />
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Death: automatic respawn after 0.55s, a 600-unit setback and 1.2s of protection. Both players follow the same rule. Wait for 3, 2, 1, GO.</p>
      <p className="mt-2 text-xs text-muted-foreground">{RACE_WIN_REWARD} gems per round win, once to the shared wallet. Draws earn 0. No pickups or Gem Rush.</p>
      {!isTouch ? <p className="mt-2 text-xs text-muted-foreground">P / Esc: pause · R: restart current round</p> : null}
      <div className="mt-5 flex flex-col gap-2"><GameButton size="lg" sound={sound} onClick={onStart} disabled={busy}>Start Race</GameButton><GameButton variant="ghost" sound={sound} onClick={onExit}>Main Menu</GameButton></div>
    </Panel>
  </div>;
}