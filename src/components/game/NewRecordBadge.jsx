import React from 'react';
import { Trophy } from 'lucide-react';

export default function NewRecordBadge() {
  return <span role="status" className="gs-record inline-flex items-center gap-2 rounded-full border border-skin-legendary/50 bg-skin-legendary/10 px-4 py-2 font-heading text-xs text-skin-legendary"><Trophy size={16} />New personal best</span>;
}