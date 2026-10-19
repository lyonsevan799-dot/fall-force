import React from 'react';
import { X } from 'lucide-react';
export default function PowerFeedback({ message, onDismiss }) {
  return <div role="status" className="shop-shell gs-pop relative z-30 mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-xl border border-primary/40 bg-card px-4 py-2 text-sm text-primary">
    <span>{message}</span><button type="button" aria-label="Dismiss purchase confirmation" onClick={onDismiss} className="flex min-h-11 min-w-11 items-center justify-center"><X size={18} /></button>
  </div>;
}