import React, { useSyncExternalStore } from 'react';
import { getAccountState, subscribeAccount } from '@/game/platform/accounts';

export default function CrazyGamesProfile() {
  const account = useSyncExternalStore(subscribeAccount, getAccountState);
  if (!account.available) return null;
  return <p role="status" className="max-w-sm text-center text-xs text-race-one/70">
    {account.loading ? 'Connecting CrazyGames profile…' : account.error || (account.username ? `Playing as ${account.username}` : 'CrazyGames guest · no login required')}
  </p>;
}