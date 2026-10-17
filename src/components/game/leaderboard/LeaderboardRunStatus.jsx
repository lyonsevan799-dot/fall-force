import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LeaderboardRunStatus({ status }) {
  if (!status || status.state === 'idle') return null;
  return (
    <div className="leaderboard-shell mt-4 rounded-xl border border-border bg-card p-3 text-left text-xs leading-relaxed text-muted-foreground"
      role={status.state === 'error' ? 'alert' : 'status'} aria-live="polite">
      <div className="mb-1 flex items-center gap-2 font-heading text-[9px] uppercase tracking-widest text-primary">
        {status.state === 'loading' ? <Loader2 size={12} className="animate-spin" /> : null}Global Leaderboard
      </div>
      {status.message}
    </div>
  );
}