import React from 'react';
import { ExternalLink, Loader2, LockKeyhole, RefreshCw } from 'lucide-react';

export default function LeaderboardAccessState({ access, onRefresh }) {
  const loading = access.state === 'loading';
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 font-heading text-[11px] uppercase tracking-widest text-primary">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <LockKeyhole size={16} />}
        {loading ? 'Checking access' : access.state === 'ready' ? 'Account connected' : access.state === 'error' ? 'Access error' : 'Not available yet'}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground" role={access.state === 'error' ? 'alert' : 'status'} aria-live="polite">{access.message}</p>
      {access.state === 'ready' ? <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Open the official CrazyGames game page and use its Leaderboard drawer to view rankings.</p> : null}
      <div className="mt-5 flex flex-wrap gap-3">
        {access.state === 'ready' && access.page ? <a href={access.page} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground"><ExternalLink size={15} />View on CrazyGames</a> :
          <button type="button" disabled className="min-h-11 rounded-xl border border-border px-4 text-xs text-muted-foreground opacity-60">Official leaderboard unavailable</button>}
        <button type="button" disabled={loading} onClick={onRefresh} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 text-xs text-foreground transition-colors hover:bg-primary/10 disabled:opacity-50"><RefreshCw size={14} />{access.state === 'error' ? 'Try again' : 'Check again'}</button>
      </div>
      {access.state === 'ready' && !access.page ? <p className="mt-3 text-xs text-muted-foreground">The approved CrazyGames game-page link has not been configured.</p> : null}
    </section>
  );
}