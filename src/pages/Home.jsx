import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sound } from '@/game/audio';
import { useGameAudio } from '@/hooks/useGameAudio';
import { LEVEL_COUNT } from '@/game/levels';
import { commitRaceResult } from '@/game/raceRewards';
import { recordMiddleFailure, middleChallengeEligible } from '@/game/middleProgress';
import { groupForLevel, groupCompleted, nextGroupAfter, groupIndex, isLevelPlayable } from '@/game/groups';
import { loadProgress, saveProgress, recordResult, clearProgress, commitLevelGems, commitEndlessGems, claimChallenge, FALLBACK } from '@/game/progress';
import { challengeGroupIndex, challengeUnlocked, isChallengeDone } from '@/game/challenges';
import MainMenu from '@/components/game/MainMenu';
import Challenges from '@/components/game/Challenges';
import CareerGroups from '@/components/game/CareerGroups';
import LevelSelect from '@/components/game/LevelSelect';
import RaceLevelSelect from '@/components/game/RaceLevelSelect';
import SettingsPanel from '@/components/game/SettingsPanel';
import GameCanvas from '@/components/game/GameCanvas';
import EndlessCanvas from '@/components/game/EndlessCanvas';
import RaceCanvas from '@/components/game/RaceCanvas';
import TutorialCanvas from '@/components/game/tutorial/TutorialCanvas';
import { tutorialAccessibleCareer, completeTutorial } from '@/game/tutorialProgress';

export default function Home() {
  const initial = useMemo(() => loadProgress(), []);
  const soundRef = useRef(null);
  if (!soundRef.current) soundRef.current = new Sound(initial.settings);
  const sound = soundRef.current;

  const settingsRef = useRef({ ...initial.settings });

  const [save, setSave] = useState(initial);
  const saveRef = useRef(initial);
  saveRef.current = save;
  const [screen, setScreen] = useState('menu');
  const [levelIndex, setLevelIndex] = useState(Math.min(initial.unlocked || 0, LEVEL_COUNT - 1));
  const [raceIndex, setRaceIndex] = useState(0);
  const [careerGroup, setCareerGroup] = useState(0);
  const [completedInfo, setCompletedInfo] = useState({ groupJustCompleted: false, nextGroupName: null, isFinalGroup: false });
  const [challenge, setChallenge] = useState(null);
  const [challengeReward, setChallengeReward] = useState(null);

  useEffect(() => {
    settingsRef.current = save.settings;
    sound.s = save.settings;
    sound.applySettings?.();
    saveProgress(save);
    if (save.settings.music && !document.hidden) { sound.startMusic(); } else { sound.stopMusic(); }
  }, [save, sound]);

  useEffect(() => {
    sound.setIntensity(screen === 'game' ? 1 + Math.floor(levelIndex / 5) * 0.6 : screen === 'endless' ? 2 : 1);
  }, [screen, levelIndex, sound]);

  useGameAudio(sound, settingsRef);

  const startTutorial = () => { sound.init(); sound.resume(); setChallenge(null); setChallengeReward(null); setScreen('tutorial'); };
  const handleTutorialComplete = (gems) => {
    const nextSave = completeTutorial(saveRef.current, gems);
    saveRef.current = nextSave;
    saveProgress(nextSave);
    setSave(nextSave);
  };
  const startLevel = (i) => { if (!tutorialAccessibleCareer(saveRef.current)) { startTutorial(); return; } sound.init(); sound.resume(); setChallenge(null); setChallengeReward(null); setLevelIndex(i); setScreen('game'); };
  const startRace = (i) => { sound.init(); sound.resume(); setRaceIndex(i); setScreen('race'); };

  const enterGroup = (gi) => { sound.sfx('click'); setCareerGroup(gi); setScreen('levels'); };

  const handleMiddleFailure = (id, reason) => {
    const nextSave = recordMiddleFailure(saveRef.current, id, reason);
    saveRef.current = nextSave;
    saveProgress(nextSave);
    setSave(nextSave);
  };

  const handleComplete = (i, result) => {
    const currentSave = saveRef.current;
    const group = groupForLevel(i);
    const before = groupCompleted(currentSave, group);
    const withResult = recordResult(currentSave, i, { stars: result.stars, time: result.time }, LEVEL_COUNT);
    const after = groupCompleted(withResult, group);
    const nextGrp = nextGroupAfter(group);
    setCompletedInfo({
      groupJustCompleted: !before && after,
      nextGroupName: nextGrp ? nextGrp.name : null,
      isFinalGroup: !nextGrp,
    });
    let nextSave = commitLevelGems(withResult, i, result.gems || 0);
    let reward = null;
    if (challenge && challengeUnlocked(currentSave, challenge) && middleChallengeEligible(challenge, result) && group.id === challenge.groupId && !isChallengeDone(currentSave, challenge.id)) {
      nextSave = claimChallenge(nextSave, challenge.id, challenge.reward);
      reward = { amount: challenge.reward, name: challenge.name };
    }
    setChallengeReward(reward);
    saveRef.current = nextSave;
    saveProgress(nextSave);
    setSave(nextSave);
  };

  const handleEnterNextGroup = () => {
    const group = groupForLevel(levelIndex);
    const nextGrp = nextGroupAfter(group);
    if (nextGrp) {
      setCareerGroup(groupIndex(nextGrp));
      setScreen('levels');
    } else {
      setScreen('career');
    }
  };

  const handleEndlessResult = (score, gems) => {
    setSave((p) => {
      const withBest = { ...p, endlessBest: Math.max(p.endlessBest || 0, score) };
      return commitEndlessGems(withBest, gems || 0);
    });
  };

  const handleRaceWin = (result) => {
    const nextSave = commitRaceResult(saveRef.current, result);
    if (nextSave === saveRef.current) return;
    saveRef.current = nextSave;
    saveProgress(nextSave);
    setSave(nextSave);
  };

  const handleUpdateSettings = (patch) => {
    setSave((p) => ({ ...p, settings: { ...p.settings, ...patch } }));
  };

  const handleReset = () => {
    clearProgress();
    setSave((p) => ({ ...FALLBACK, settings: p.settings }));
    setLevelIndex(0);
    setChallenge(null);
    setChallengeReward(null);
  };

  const startChallenge = (ch) => {
    if (!tutorialAccessibleCareer(saveRef.current)) { startTutorial(); return; }
    sound.sfx('click');
    setChallenge(ch);
    setChallengeReward(null);
    setCareerGroup(challengeGroupIndex(ch));
    setScreen('challenge-levels');
  };

  const startChallengeLevel = (i) => {
    sound.init(); sound.resume();
    setLevelIndex(i);
    setChallengeReward(null);
    setScreen('game');
  };

  const exitChallenge = () => {
    setChallenge(null);
    setChallengeReward(null);
    setScreen('challenges');
  };

  const inGame = screen === 'tutorial' || screen === 'game' || screen === 'endless' || screen === 'race';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04050c] text-white">
      <div className="pointer-events-none absolute inset-0 gs-bg" />
      <div className="pointer-events-none absolute inset-0 gs-grid opacity-[0.35]" />
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-[120px]" />

      {screen === 'tutorial' ? (
        <TutorialCanvas sound={sound} settings={save.settings} totalGems={save.totalGems || 0}
          banked={save.tutorialGemsBanked} canSkip={tutorialAccessibleCareer(save)}
          onComplete={handleTutorialComplete} onPlay={() => startLevel(0)} onExit={() => setScreen('menu')}
          onSkip={() => { if (tutorialAccessibleCareer(saveRef.current)) setScreen('career'); }} />
      ) : null}

      {screen === 'game' ? (
        <GameCanvas
          key={levelIndex}
          levelIndex={levelIndex}
          totalLevels={LEVEL_COUNT}
          settings={settingsRef.current}
          displaySettings={save.settings}
          sound={sound}
          totalGems={save.totalGems || 0}
          groupJustCompleted={completedInfo.groupJustCompleted}
          nextGroupName={completedInfo.nextGroupName}
          isFinalGroup={completedInfo.isFinalGroup}
          challenge={challenge}
          challengeReward={challengeReward}
          onClearReward={() => setChallengeReward(null)}
          onChallengeFailure={handleMiddleFailure}
          onNewChallengeAttempt={() => { setChallengeReward(null); setScreen('challenge-levels'); }}
          onExit={() => (challenge ? exitChallenge() : setScreen('levels'))}
          onComplete={handleComplete}
          onNext={() => {
            const next = Math.min(LEVEL_COUNT - 1, levelIndex + 1);
            if (isLevelPlayable(saveRef.current, next)) setLevelIndex(next);
            else { setCareerGroup(groupIndex(groupForLevel(levelIndex))); setScreen('levels'); }
          }}
          onEnterNextGroup={handleEnterNextGroup}
          onUpdateSettings={handleUpdateSettings}
          onResetProgress={handleReset}
        />
      ) : null}

      {screen === 'endless' ? (
        <EndlessCanvas
          settings={settingsRef.current}
          displaySettings={save.settings}
          sound={sound}
          best={save.endlessBest || 0}
          totalGems={save.totalGems || 0}
          onResult={handleEndlessResult}
          onExit={() => setScreen('menu')}
          onUpdateSettings={handleUpdateSettings}
          onResetProgress={handleReset}
        />
      ) : null}

      {screen === 'race' ? (
        <RaceCanvas
          key={raceIndex}
          levelIndex={raceIndex}
          settings={settingsRef.current}
          displaySettings={save.settings}
          sound={sound}
          totalGems={save.totalGems || 0}
          onRaceWin={handleRaceWin}
          onExit={() => setScreen('race-levels')}
          onUpdateSettings={handleUpdateSettings}
          onResetProgress={handleReset}
        />
      ) : null}

      {!inGame ? (
        <div key={screen} className="gs-screen-in relative z-10 min-h-screen">
          {screen === 'menu' ? (
            <div className="flex min-h-screen flex-col justify-center">
              <MainMenu
                save={save}
                sound={sound}
                onCareer={() => tutorialAccessibleCareer(saveRef.current) ? setScreen('career') : startTutorial()}
                onTutorial={startTutorial}
                onEndless={() => setScreen('endless')}
                onRace={() => setScreen('race-levels')}
                onChallenges={() => setScreen('challenges')}
                onSettings={() => setScreen('settings')}
              />
            </div>
          ) : null}

          {screen === 'career' ? (
            <CareerGroups save={save} sound={sound} onEnter={enterGroup} onBack={() => setScreen('menu')} />
          ) : null}

          {screen === 'levels' ? (
            <LevelSelect save={save} groupIndex={careerGroup} sound={sound} onSelect={startLevel} onBack={() => setScreen('career')} />
          ) : null}

          {screen === 'challenges' ? (
            <Challenges save={save} sound={sound} onStart={startChallenge} onBack={() => setScreen('menu')} />
          ) : null}

          {screen === 'challenge-levels' ? (
            <LevelSelect
              save={save}
              groupIndex={careerGroup}
              sound={sound}
              onSelect={startChallengeLevel}
              onBack={() => setScreen('challenges')}
              backLabel="Challenges"
              banner={challenge ? { name: challenge.name, reward: challenge.reward, type: challenge.type } : null}
            />
          ) : null}

          {screen === 'race-levels' ? (
            <RaceLevelSelect sound={sound} onSelect={startRace} onBack={() => setScreen('menu')} />
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
      ) : null}
    </div>
  );
}