import { useCallback, useEffect, useRef, useState } from 'react';
import { beginEndlessRun, completeEndlessRun } from '@/game/leaderboard/completedRuns';
import submitCompletedRun from '@/game/leaderboard/submitRun';

export default function useEndlessLeaderboard() {
  const [status, setStatus] = useState({ state: 'idle' });
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  const begin = useCallback((engine) => {
    generation.current++;
    beginEndlessRun(engine);
    setStatus({ state: 'idle' });
  }, []);
  const finish = useCallback((engine) => {
    const receipt = completeEndlessRun(engine);
    if (!receipt) return;
    const current = generation.current;
    setStatus({ state: 'loading', message: 'Checking leaderboard access and sending this completed run…' });
    // Detached from gameplay completion and gem banking; a failure never blocks Retry/Exit.
    void submitCompletedRun(receipt).then((result) => {
      if (current === generation.current) setStatus(result);
    });
  }, []);
  return { status, begin, finish };
}