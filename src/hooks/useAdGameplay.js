import { useEffect } from 'react';
import { registerAdGameplay } from '@/game/platform/ads/session';

export default function useAdGameplay(engineRef, setPaused) {
  useEffect(() => registerAdGameplay({ getEngine: () => engineRef.current, setPaused }), [engineRef, setPaused]);
}