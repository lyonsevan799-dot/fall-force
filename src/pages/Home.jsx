import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sound } from '@/game/audio';
import { LEVEL_COUNT } from '@/game/levels';
import { loadProgress, saveProgress, recordResult, clearProgress, FALLBACK } from '@/game/progress';
import MainMenu from '@/components/game/MainMenu';
import LevelSelect from '@/components/game/LevelSelect';
import SettingsPanel from '@/components/game/SettingsPanel';
import GameCanvas from '@/components/game/GameCanvas';

export default function Home() {
  const initial = useMemo(() => loadProgress(), []);
  const soundRef = useRef(null);
  if (!soundRef.current) soundRef.current = new Sound(initial.settings);
  const sound = soundRef.current;

  // Stable object handed to the engine so setting changes apply live.
  const settingsRef = useRef({ ...initial.settings });

  const [save, setSave] = useState(initial);
  const [screen, setScreen] = useState('menu');
  const [levelIndex, setLevelIndex] = useState(Math.min(initial.unlocked || 0, LEVEL_COUNT - 1));

  useEffect(() => {
    settingsRef.current = save.settings;
    sound.s = save.settings;
    saveProgress(save);
    if (save.settings.music) {
      sound.init();
      sound.resume();
      sound.startMusic();
    } else {
      sound.stopMusic();
    }
  }, [save, sound]);

  useEffect(() => {
    sound.setIntensity(screen === 'game' ? 1 + Math.floor(levelIndex / 5) * 0.6 : 1);
  }, [screen, levelIndex, sound]);

  useEffect(() => {
    const unlock = () => {
      sound.init();
      sound.resume();
      if (save.settings.music) sound.startMusic();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [sound, save.settings.music]);

  const startLevel = (i) => {
    sound.init();
    sound.resume();
    setLevelIndex(i);
    setScreen('game');
  };

  const handleComplete = (i, result) => {
    setSave((p) => recordResult(p, i, { stars: result.stars, time: result.time }, LEVEL_COUNT));
  };

  const handleUpdateSettings = (patch) => {
    setSave((p) => ({ ...p, settings: { ...p.settings, ...patch } }));
  };

  const handleReset = () => {
    clearProgress();
    setSave((p) => ({ ...FALLBACK, settings: p.settings }));
    setLevelIndex(0);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04050c] text-white">
      <div className="pointer-events-none absolute inset-0 gs-bg" />
      <div className="pointer-events-none absolute inset-0 gs-grid opacity-[0.35]" />
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-[120px]" />

      {screen === 'game' ? (
        <GameCanvas
          key={levelIndex}
          levelIndex={levelIndex}
          totalLevels={LEVEL_COUNT}
          settings={settingsRef.current}
          displaySettings={save.settings}
          sound={sound}
          onExit={() => setScreen('levels')}
          onComplete={handleComplete}
          onNext={() => setLevelIndex((i) => Math.min(LEVEL_COUNT - 1, i + 1))}
          onUpdateSettings={handleUpdateSettings}
          onResetProgress={handleReset}
        />
      ) : (
        <div className="relative z-10 min-h-screen">
          {screen === 'menu' ? (
            <div className="flex min-h-screen flex-col justify-center">
              <MainMenu
                save={save}
                sound={sound}
                onPlay={startLevel}
                onLevels={() => setScreen('levels')}
                onSettings={() => setScreen('settings')}
              />
            </div>
          ) : null}
          {screen === 'levels' ? (
            <LevelSelect save={save} sound={sound} onSelect={startLevel} onBack={() => setScreen('menu')} />
          ) : null}
          {screen === 'settings' ? (
            <SettingsPanel
              settings={save.settings}
              sound={sound}
              onChange={handleUpdateSettings}
              onReset={handleReset}
              onClose={() => setScreen('menu')}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}