import { useRef } from 'react';
import { requestVideoAd } from '@/game/platform/ads/videoAds';

export default function useAdBreak(engineRef) {
  const busy = useRef(false);
  return async (continueGame) => {
    const engine = engineRef.current;
    if (busy.current || engine?.state !== 'complete') return;
    busy.current = true;
    const runId = engine.runId;
    try {
      if (!engine.rush) await requestVideoAd('midgame', { breakId: runId });
      if (!document.hidden && engineRef.current === engine && engine.runId === runId && engine.state === 'complete') continueGame();
    } finally { busy.current = false; }
  };
}