import React from 'react';

export default function MetaProgressBar({ value, target, label }) {
  const progress = Math.max(0, Math.min(target, value || 0));
  return <div className="mt-4"><div className="mb-2 flex justify-between gap-3 text-xs text-muted-foreground"><span>{label}</span><span className="font-mono">{progress.toLocaleString()} / {target.toLocaleString()}</span></div><div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={target} aria-valuenow={progress} className="h-2 overflow-hidden rounded-full bg-primary/10"><div className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: `${target ? progress / target * 100 : 0}%` }} /></div></div>;
}