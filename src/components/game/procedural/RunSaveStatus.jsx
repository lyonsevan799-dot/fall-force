import React from 'react';

export default function RunSaveStatus({ state, onRetry }) {
  return <div className="meta-shell mt-3 text-center text-xs text-muted-foreground" role="status">
    {state === 'saving' ? 'Saving gems and personal records…' : state === 'saved' ? 'Gems and records saved.' : null}
    {state === 'error' ? <><p>Gems and records could not be saved.</p><button type="button" className="mt-2 underline text-primary" onClick={onRetry}>Try saving again</button></> : null}
  </div>;
}