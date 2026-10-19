import { useEffect, useRef, useState } from 'react';
import { recordStruggle, shouldRecommend, struggleStats } from '@/game/skipLevel/struggle';
import { canSkip } from '@/game/skipLevel/catalog';
export default function useLevelStruggle(index, save, commitGame) {
  const [local, setLocal] = useState(() => ({ levelStruggles: { [index]: struggleStats(save, index) } }));
  const current = useRef(local), meter = useRef({ seconds: 0, progress: 0, deaths: 0 });
  const commit = useRef(commitGame); commit.current = commitGame;
  const latest = useRef(save); latest.current = save;
  useEffect(() => {
    const saved = struggleStats(save, index), optimistic = struggleStats(current.current, index);
    if (saved.failedAttempts > optimistic.failedAttempts || (saved.failedAttempts === optimistic.failedAttempts && saved.nextReminderAt >= optimistic.nextReminderAt && saved.nextReminderAttempt >= optimistic.nextReminderAttempt)) {
      const next = { levelStruggles: { [index]: struggleStats(save, index) } };
      current.current = next; setLocal(next);
    }
  }, [save, index]);
  const record = (kind) => {
    if (!canSkip(latest.current, index)) return false;
    const event = { id: crypto.randomUUID(), kind, seconds: meter.current.seconds, progress: meter.current.progress };
    const next = recordStruggle(current.current, index, event);
    current.current = next; setLocal(next);
    if (kind !== 'dismiss') { meter.current.seconds = 0; meter.current.progress = 0; }
    void commit.current?.((latest) => recordStruggle(latest, index, event));
    return shouldRecommend(next, index);
  };
  const sample = (engine, dt) => {
    if (!engine.paused && engine.state === 'playing') meter.current.seconds += Math.max(0, Math.min(dt, 0.05));
    if (engine.state === 'playing' || engine.deaths > meter.current.deaths) meter.current.progress = Math.max(meter.current.progress, engine.ui.progress || 0);
    if (engine.deaths > meter.current.deaths) record('death');
    meter.current.deaths = engine.deaths;
    return canSkip(latest.current, index) && shouldRecommend(current.current, index);
  };
  return { sample, restart: () => record('restart'), failure: () => record('failure'), dismiss: () => record('dismiss'),
    eligible: !save?.levels?.[index]?.completed && shouldRecommend(local, index) };
}