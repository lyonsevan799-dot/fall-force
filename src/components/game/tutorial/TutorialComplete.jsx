import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import CareerSaveStatus from '@/components/game/CareerSaveStatus';

export default function TutorialComplete({ totalGems, onPlay, onReplay, onExit, completion = { saved: true } }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
      <section className="gs-pop my-auto w-full max-w-md shrink-0 rounded-3xl border border-primary/40 bg-card p-5 text-center sm:p-7">
        <CheckCircle2 className="mx-auto text-primary" size={44} />
        <h1 className="mt-3 font-heading text-xl sm:text-2xl">Tutorial Complete!</h1>
        <p className="mt-2 text-sm text-primary">{completion.saved ? 'Level 1 is unlocked.' : 'Finish saving to continue to Level 1.'}</p>
        <CareerSaveStatus completion={completion} />
        <ul className="my-4 space-y-2 text-left text-xs leading-relaxed text-muted-foreground">
          <li>→ Run right automatically. No movement keys needed.</li>
          <li>↕ Tap, click or press Space to flip gravity.</li>
          <li>◇ Touch gems to collect; glowing trigger gems start Gem Rush automatically. No holding.</li>
          <li>⚑ Avoid spikes and touch the finish line to complete a level.</li>
        </ul>
        <p className="mb-4 text-xs text-muted-foreground">Saved gem balance: {totalGems.toLocaleString()}. Tutorial gems are banked once; replays are practice.</p>
        <button type="button" onClick={onPlay} disabled={!completion.saved} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary p-3 text-sm font-bold text-primary-foreground disabled:opacity-50">Play Level 1 <ArrowRight size={16} /></button>
        <div className="mt-3 flex justify-center gap-6 text-xs text-primary"><button type="button" onClick={onReplay} disabled={completion.pending} className="min-h-11 disabled:opacity-50">Replay Tutorial</button><button type="button" onClick={onExit} className="min-h-11">Main Menu</button></div>
      </section>
    </div>
  );
}