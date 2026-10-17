import React, { useSyncExternalStore } from 'react';
import { getAdState, subscribeAds } from '@/game/platform/ads/session';

export default function AdContent({ children }) {
  const { busy } = useSyncExternalStore(subscribeAds, getAdState);
  return <div inert={busy ? '' : undefined}>{children}</div>;
}