import React from 'react';
import { Pause } from 'lucide-react';
import { IconButton } from '@/components/game/ui';
import GemCounter from '@/components/game/GemCounter';

export default function RaceHud({ ui, series, isTouch, totalGems, onPause, sound }) {
  return <div className="pointer-events-none absolute inset-0 z-20">
    <div className="grid grid-cols-2">{[0, 1].map((index) => {
      const progress = (index === 0 ? ui.p1 : ui.p2) || 0;
      const alive = index === 0 ? ui.p1Alive : ui.p2Alive;
      const finished = index === 0 ? ui.p1Finished : ui.p2Finished;
      const color = index === 0 ? 'text-race-one' : 'text-race-two';
      return <div key={index} className={`bg-background/80 p-3 ${index === 0 ? 'pr-8' : 'pl-8'}`}>
        <div className="flex items-center justify-between gap-2"><span className={`font-heading text-xs ${color}`}>P{index + 1} · {index === 0 ? 'Left' : 'Right'}</span><span className="font-mono text-sm">{(ui.raceTime || 0).toFixed(2)}s</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full ${index === 0 ? 'bg-race-one' : 'bg-race-two'}`} style={{ width: `${progress * 100}%` }} /></div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>{finished ? 'Finished' : !alive ? 'Respawning…' : `${Math.floor(progress * 100)}%`}</span><span>{index === 0 ? ui.p1Deaths : ui.p2Deaths} deaths</span></div>
      </div>;
    })}</div>
    <div className="absolute left-1/2 top-3 -translate-x-1/2"><IconButton label="Pause local race" sound={sound} onClick={onPause}><Pause size={16} /></IconButton></div>
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-xl bg-background/80 p-2 text-center">
      {series.bestOfThree ? <p className="mb-1 text-[10px] text-muted-foreground">Race {series.rounds.length + 1} · P1 {series.wins[0]} : {series.wins[1]} P2 · First to 2</p> : null}<GemCounter total={totalGems} size="sm" />
    </div>
    <div className="absolute inset-x-0 bottom-4 grid grid-cols-2 text-center text-[10px]"><span className="text-race-one">{isTouch ? 'P1 · Tap left half' : 'P1 · W / Space'}</span><span className="text-race-two">{isTouch ? 'P2 · Tap right half' : 'P2 · ↑ / Enter'}</span></div>
  </div>;
}