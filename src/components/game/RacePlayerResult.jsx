import React from 'react';

export default function RacePlayerResult({ number, finished, time, progress, winner, reward }) {
  const won = winner === number - 1;
  const tie = winner === -1;
  return (
    <div className="rounded-xl border border-border/30 bg-muted/30 p-3 text-left text-foreground">
      <div className="font-heading text-xs uppercase tracking-widest">Player {number} · {tie ? 'Tie' : won ? 'Winner' : 'Loser'}</div>
      <p className="mt-2 text-xs">{tie ? 'Race Tied! +0 Gems' : won ? `Race Won! +${reward} Gems!` : 'Race Lost! Better luck next time!'}</p>
      <p className="mt-1 font-mono text-xs">{finished ? `Finished in ${time.toFixed(2)}s` : `Did not finish · ${Math.round((progress || 0) * 100)}%`}</p>
      {!won && !tie ? <p className="mt-1 text-xs">0 gems earned</p> : null}
    </div>
  );
}