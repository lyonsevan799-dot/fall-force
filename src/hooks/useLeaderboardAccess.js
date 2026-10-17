import { useCallback, useEffect, useRef, useState } from 'react';
import { checkLeaderboardAccess } from '@/game/leaderboard/access';
import { subscribeAccount } from '@/game/platform/accounts';

export default function useLeaderboardAccess() {
  const [access, setAccess] = useState({ state: 'loading', message: 'Checking CrazyGames leaderboard access…' });
  const request = useRef(0);
  const refresh = useCallback(() => {
    const current = ++request.current;
    setAccess({ state: 'loading', message: 'Checking CrazyGames leaderboard access…' });
    void checkLeaderboardAccess().then((next) => { if (current === request.current) setAccess(next); });
  }, []);
  useEffect(() => { refresh(); const unsubscribe = subscribeAccount(refresh); return () => { request.current++; unsubscribe(); }; }, [refresh]);
  return { access, refresh };
}