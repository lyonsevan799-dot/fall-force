import React from 'react';

export default function CareerSaveStatus({ completion }) {
  if (completion?.pending) return <p role="status" className="mt-3 text-xs text-cyan-200">Saving completion…</p>;
  if (!completion?.error) return null;
  return <div role="alert" className="mt-3 text-xs text-pink-200">
    <p>{completion.error}</p>
    <button type="button" onClick={completion.retry} className="mt-1 min-h-11 underline">Retry saving completion</button>
  </div>;
}