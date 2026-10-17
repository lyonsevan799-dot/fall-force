import { useEffect } from 'react';
import { getAdState, subscribeAds } from '@/game/platform/ads/session';

export default function useAdAudio(sound) {
  useEffect(() => {
    let mutedByAd = false, previous = false, wasRunning = false, wasMusicPlaying = false, requested = false;
    const sync = () => {
      const { busy, playing } = getAdState();
      if (busy && !requested) {
        requested = true; wasRunning = sound.ctx?.state === 'running'; wasMusicPlaying = sound.musicPlaying;
      }
      if (playing && !mutedByAd) {
        previous = sound.adMuted; mutedByAd = true; sound.setAdMuted(true);
      }
      if (!busy && requested) {
        requested = false;
        if (mutedByAd) { mutedByAd = false; sound.setAdMuted(previous); }
        if (wasRunning && !document.hidden) sound.resume();
        if (wasMusicPlaying && !document.hidden && sound.s.music !== false) sound.startMusic();
      }
    };
    sync(); const unsubscribe = subscribeAds(sync);
    return () => { unsubscribe(); if (mutedByAd) sound.setAdMuted(previous); };
  }, [sound]);
}