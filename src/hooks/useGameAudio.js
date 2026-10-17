import { useEffect } from 'react';
import { subscribePlatformSettings } from '@/game/platform/crazyGames';

export function useGameAudio(sound, settingsRef) {
  useEffect(() => {
    const unsubscribe = subscribePlatformSettings((settings) => sound.setPlatformMuted(settings.muteAudio));
    const unlock = () => {
      if (document.hidden) return;
      sound.init(); sound.resume();
      if (settingsRef.current.music) sound.startMusic();
    };
    const visibility = () => {
      if (!document.hidden) return;
      sound.stopMusic();
      if (sound.ctx?.state === 'running') sound.ctx.suspend().catch(() => {});
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchend', unlock);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      unsubscribe();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchend', unlock);
      document.removeEventListener('visibilitychange', visibility);
      sound.dispose();
    };
  }, [sound, settingsRef]);
}