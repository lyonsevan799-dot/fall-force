import React, { useSyncExternalStore } from 'react';
import Home from '@/pages/Home';
import { getSaveSession, subscribeSaveSession } from '@/game/platform/saveStore';

// A platform account transition retires every old run and its callbacks together.
export default function GameRoot() {
  const session = useSyncExternalStore(subscribeSaveSession, getSaveSession);
  return <Home key={session} />;
}