import React from 'react';

export default function RaceSeriesSummary({ series }) {
  if (!series?.bestOfThree) return null;
  const time = (finished, value) => finished ? `${value.toFixed(3)}s` : 'DNF';
  return <section className="mt-4 rounded-xl border border-border p-3 text-xs" aria-label="Series results">
    <h3 className="font-heading">{series.complete ? `Player ${series.winner + 1} wins the series` : 'Best of three · First to 2 wins'}</h3>
    <p className="mt-2 font-mono text-lg"><span className="text-race-one">P1 {series.wins[0]}</span> : <span className="text-race-two">{series.wins[1]} P2</span></p>
    <ol className="mt-2 max-h-28 space-y-2 overflow-y-auto text-left text-muted-foreground">{series.rounds.map((round, index) => <li key={round.runId}>Race {index + 1}: {round.winner === -1 ? 'Draw · replayed' : `P${round.winner + 1} wins`}<br />P1 {time(round.p1Finished, round.p1Time)} · P2 {time(round.p2Finished, round.p2Time)}</li>)}</ol>
    {!series.complete ? <p className="mt-2 text-muted-foreground">Draws do not award a win; replay the tied round.</p> : null}
  </section>;
}