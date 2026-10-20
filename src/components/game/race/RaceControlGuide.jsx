import React from 'react';

export default function RaceControlGuide({ touch }) {
  return <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
    <div className="rounded-xl border border-race-one/40 p-3 text-race-one"><strong className="font-heading">Player 1 · Left</strong><p className="mt-2">W / Z or Space</p>{touch ? <p className="mt-1">Tap left half</p> : null}</div>
    <div className="rounded-xl border border-race-two/40 p-3 text-race-two"><strong className="font-heading">Player 2 · Right</strong><p className="mt-2">↑ or Enter</p>{touch ? <p className="mt-1">Tap right half</p> : null}</div>
  </div>;
}