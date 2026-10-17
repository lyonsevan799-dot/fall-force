import React from 'react';
import { ArrowLeft, Globe2, Trophy } from 'lucide-react';
import useLeaderboardAccess from '@/hooks/useLeaderboardAccess';
import LeaderboardAccessState from '@/components/game/leaderboard/LeaderboardAccessState';

export default function GlobalLeaderboard({ best, hasRecord, sound, onBack, onPlay }) {
  const { access, refresh } = useLeaderboardAccess();
  return (
    <main className="leaderboard-shell mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-5 py-8 text-foreground sm:px-8">
      <button type="button" onClick={() => { sound.sfx('click'); onBack(); }} className="flex min-h-11 w-fit items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-primary"><ArrowLeft size={16} />Main Menu</button>
      <header>
        <div className="mb-3 flex items-center gap-2 font-heading text-[10px] uppercase tracking-[0.3em] text-primary"><Globe2 size={16} />Endless Mode</div>
        <h1 className="font-heading text-2xl uppercase tracking-[0.1em] sm:text-3xl">Global Leaderboard</h1>
        <p className="mt-3 text-sm text-muted-foreground">Endless Mode - Survive as long as possible</p>
      </header>
      <section className="flex flex-wrap items-center justify-between gap-5 rounded-3xl border border-primary/30 bg-card p-6">
        <div><div className="flex items-center gap-2 font-heading text-[10px] uppercase tracking-widest text-primary"><Trophy size={16} />Your personal best · All time</div><div className="mt-3 font-mono text-4xl text-foreground">{best.toLocaleString()}<span className="ml-2 text-sm text-muted-foreground">points</span></div></div>
        <button type="button" onClick={() => { sound.sfx('click'); onPlay(); }} className="min-h-11 rounded-xl bg-primary px-5 font-heading text-xs uppercase tracking-widest text-primary-foreground">Play Endless</button>
        {!hasRecord ? <p className="w-full text-xs text-muted-foreground" role="status">No completed Endless run recorded yet. Finish a run to set your personal best.</p> : null}
      </section>
      <LeaderboardAccessState access={access} onRefresh={refresh} />
      <footer className="space-y-2 text-xs leading-relaxed text-muted-foreground"><p>One official leaderboard. Highest run score wins; scores are not added together. Official seasons reset weekly.</p><p>Global standings and ranks are displayed only by CrazyGames, never invented here. Client-side checks cannot make a browser game cheat-proof.</p></footer>
    </main>
  );
}