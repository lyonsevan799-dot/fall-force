import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sound } from '@/game/audio';
import { useGameAudio } from '@/hooks/useGameAudio';
import { LEVEL_COUNT } from '@/game/levels';
import { commitRaceResult } from '@/game/raceRewards';
import { recordMiddleFailure, middleChallengeEligible } from '@/game/middleProgress';
import { groupForLevel, groupCompleted, nextGroupAfter, groupIndex, groupUnlocked, isLevelPlayable } from '@/game/groups';
import { loadProgress, recordResult, commitLevelGems, commitEndlessGems, claimChallenge, completedCount, FALLBACK } from '@/game/progress';
import { stopLoading, reportCompletion } from '@/game/platform/gameEvents';
import useGameProgress from '@/hooks/useGameProgress';
import useMetaProgress from '@/hooks/useMetaProgress';
import DailyChallengesScreen from '@/components/game/meta/DailyChallengesScreen';
import AchievementsScreen from '@/components/game/meta/AchievementsScreen';
import AchievementUnlocks from '@/components/game/meta/AchievementUnlocks';
import TimeTrialLevels from '@/components/game/timeTrial/TimeTrialLevels';
import TimeTrialCanvas from '@/components/game/timeTrial/TimeTrialCanvas';
import commitTrialRecord from '@/game/timeTrial/records';
import { trialRecord } from '@/game/timeTrial/courses';
import SkinShop from '@/components/game/shop/SkinShop';
import { skinForTarget, equipSkin } from '@/game/skins/inventory';
import { challengeGroupIndex, challengeUnlocked, isChallengeDone } from '@/game/challenges';
import MainMenu from '@/components/game/MainMenu';
import GlobalLeaderboard from '@/components/game/leaderboard/GlobalLeaderboard';
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
import SurvivalCanvas from '@/components/game/survival/SurvivalCanvas';
import AdOverlay from '@/components/game/ads/AdOverlay';
import AdContent from '@/components/game/ads/AdContent';
import commitSurvivalResult from '@/game/survivalRecords';

export default function Home() {
  const initial = useMemo(() => loadProgress(), []);
  const soundRef = useRef(null);
  if (!soundRef.current) soundRef.current = new Sound(initial.settings);
  const sound = soundRef.current;

  const settingsRef = useRef({ ...initial.settings });

  const { save, saveRef, updateSave, commitGame, saveError } = useGameProgress(initial);
  const meta = useMetaProgress(commitGame);
  useEffect(() => {
    stopLoading();
    reportCompletion(completedCount(save) * 100 / LEVEL_COUNT);
  }, [save]);
  const soloSkin = skinForTarget(save);
  const raceSkins = [skinForTarget(save, 'p1'), skinForTarget(save, 'p2')];
  const [screen, setScreen] = useState('menu');
  const [levelIndex, setLevelIndex] = useState(Math.min(initial.unlocked || 0, LEVEL_COUNT - 1));
  const [raceIndex, setRaceIndex] = useState(0);
  const [trialIndex, setTrialIndex] = useState(0);
  const [careerGroup, setCareerGroup] = useState(0);
  const [completedInfo, setCompletedInfo] = useState({ groupJustCompleted: false, nextGroupName: null, isFinalGroup: false });
  const [challenge, setChallenge] = useState(null);
  const [challengeReward, setChallengeReward] = useState(null);

  useEffect(() => {
    settingsRef.current = save.settings;
    sound.s = save.settings;
    sound.applySettings?.();
    if (save.settings.music && !document.hidden) { sound.startMusic(); } else { sound.stopMusic(); }
  }, [save, sound]);

  useEffect(() => {
    sound.setIntensity(screen === 'game' ? 1 + Math.floor(levelIndex / 5) * 0.6 : screen === 'endless' ? 2 : 1);
  }, [screen, levelIndex, sound]);

  useGameAudio(sound, settingsRef);

  const recordTutorialReplay = () => commitGame((latest) => ({ ...latest, tutorialReplays: (latest.tutorialReplays || 0) + 1 }));
  const startTutorial = () => {
    sound.init(); sound.resume();
    if (tutorialAccessibleCareer(saveRef.current)) recordTutorialReplay();
    setChallenge(null); setChallengeReward(null); setScreen('tutorial');
  };
  const handleTutorialComplete = (gems) => commitGame((latest) => completeTutorial(latest, gems));
  const startLevel = (i) => { if (!tutorialAccessibleCareer(saveRef.current)) { startTutorial(); return; } if (!isLevelPlayable(saveRef.current, i)) return; sound.init(); sound.resume(); setChallenge(null); setChallengeReward(null); setLevelIndex(i); setScreen('game'); };
  const startRace = (i) => { sound.init(); sound.resume(); setRaceIndex(i); setScreen('race'); };

  const enterGroup = (gi) => { if (!groupUnlocked(saveRef.current, gi)) return; sound.sfx('click'); setCareerGroup(gi); setScreen('levels'); };

  const handleMiddleFailure = (id, reason) => commitGame((latest) => recordMiddleFailure(latest, id, reason));

  const handleComplete = (i, result) => {
    let completion;
    return commitGame((currentSave) => {
    const group = groupForLevel(i);
    const before = groupCompleted(currentSave, group);
    const withResult = recordResult(currentSave, i, { stars: result.stars, time: result.time }, LEVEL_COUNT);
    const after = groupCompleted(withResult, group);
    const nextGrp = nextGroupAfter(group);
    const info = {
      groupJustCompleted: !before && after,
      nextGroupName: nextGrp ? nextGrp.name : null,
      isFinalGroup: !nextGrp,
    };
    let nextSave = commitLevelGems(withResult, i, result.gems || 0, result.runId);
    let reward = null;
    if (challenge && challengeUnlocked(currentSave, challenge) && middleChallengeEligible(challenge, result) && group.id === challenge.groupId && !isChallengeDone(currentSave, challenge.id)) {
      nextSave = claimChallenge(nextSave, challenge.id, challenge.reward);
      reward = { amount: challenge.reward, name: challenge.name };
    }
    completion = { info, reward };
    return nextSave;
    }).then((saved) => {
      if (saved) { setCompletedInfo(completion.info); setChallengeReward(completion.reward); }
    });
  };

  const handleEnterNextGroup = () => {
    const group = groupForLevel(levelIndex);
    const nextGrp = nextGroupAfter(group);
    if (nextGrp && groupUnlocked(saveRef.current, groupIndex(nextGrp))) {
      setCareerGroup(groupIndex(nextGrp));
      setScreen('levels');
    } else {
      setScreen('career');
    }
  };

  const handleEndlessResult = (score, gems, records) => commitGame((p) => {
    const withBest = { ...p, endlessBest: Math.max(p.endlessBest || 0, score), endlessRecords: {
      ...p.endlessRecords,
      distance: Math.max(p.endlessRecords?.distance || 0, records.distance),
      maxStreak: Math.max(p.endlessRecords?.maxStreak || 0, records.maxStreak),
    } };
    return commitEndlessGems(withBest, gems || 0, records.runId);
  });

  const handleRaceWin = (result) => commitGame((latest) => commitRaceResult(latest, result));
  const handleSurvivalResult = (score, gems, records) => commitGame((latest) =>
    commitSurvivalResult(latest, { ...records, score, gems }));

  const startTrial = (index) => {
    if (!isLevelPlayable(saveRef.current, index)) return;
    sound.init(); sound.resume(); setTrialIndex(index); setScreen('time-trial');
  };
  const handleTrialRecord = async (run) => {
    let outcome;
    const saved = await commitGame((latest) => {
      outcome = commitTrialRecord(latest, run);
      return outcome.save;
    }, { allowVolatile: false });
    const best = saved ? trialRecord(saved.timeTrialRecords, run.levelIndex) : null;
    return { saved: !!saved, newRecord: !!saved && outcome.improved,
      bestMs: best?.timeMs ?? null, ghostStored: !!best?.ghost };
  };

  const handleUpdateSettings = (patch) => commitGame((p) => ({ ...p, settings: { ...p.settings, ...patch } }));

  const handleReset = () => {
    commitGame((p) => ({ ...JSON.parse(JSON.stringify(FALLBACK)), settings: p.settings }));
    setLevelIndex(0);
    setChallenge(null);
    setChallengeReward(null);
  };

  const startChallenge = (ch) => {
    if (!tutorialAccessibleCareer(saveRef.current)) { startTutorial(); return; }
    if (!challengeUnlocked(saveRef.current, ch)) return;
    sound.sfx('click');
    setChallenge(ch);
    setChallengeReward(null);
    setCareerGroup(challengeGroupIndex(ch));
    setScreen('challenge-levels');
  };

  const startChallengeLevel = (i) => {
    if (!challenge || !challengeUnlocked(saveRef.current, challenge) || groupForLevel(i).id !== challenge.groupId) return;
    if (challenge.type !== 'middle' && !isLevelPlayable(saveRef.current, i)) return;
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

  const inGame = screen === 'tutorial' || screen === 'game' || screen === 'endless' || screen === 'survival' || screen === 'race' || screen === 'time-trial';

  return (
    <div data-reduced={save.settings.reduced ? 'true' : undefined} className="relative min-h-screen overflow-hidden bg-[#04050c] text-white">
      <AdOverlay />
      <AdContent>
      {saveError && screen !== 'shop' ? <div role="alert" className="fixed inset-x-4 bottom-4 z-50 rounded-xl border border-amber-300/50 bg-black/90 p-3 text-center text-xs text-amber-100">{saveError}</div> : null}
      <AchievementUnlocks achievements={save.achievements} onNotified={meta.notify} reduced={save.settings.reduced} />
      <div className="pointer-events-none absolute inset-0 gs-bg" />
      <div className="pointer-events-none absolute inset-0 gs-grid opacity-[0.35]" />
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-[120px]" />

      {screen === 'tutorial' ? (
        <TutorialCanvas sound={sound} settings={save.settings} skinId={soloSkin} totalGems={save.totalGems || 0}
          banked={save.tutorialGemsBanked} canSkip
          onComplete={handleTutorialComplete} onReplay={recordTutorialReplay} onPlay={() => startLevel(0)} onExit={() => setScreen('menu')}
          onSkip={async () => {
            const saved = await commitGame((latest) => ({ ...latest, tutorialSkipped: true }));
            if (saved) setScreen('career');
          }} />
      ) : null}

      {screen === 'game' ? (
        <GameCanvas
          key={levelIndex}
          skinId={soloSkin}
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
          skinId={soloSkin}
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

      {screen === 'survival' ? <SurvivalCanvas skinId={soloSkin} settings={settingsRef.current}
        displaySettings={save.settings} sound={sound} records={save.survivalRecords}
        totalGems={save.totalGems || 0} onResult={handleSurvivalResult} onExit={() => setScreen('menu')}
        onUpdateSettings={handleUpdateSettings} onResetProgress={handleReset} /> : null}

      {screen === 'time-trial' ? <TimeTrialCanvas key={trialIndex} levelIndex={trialIndex}
        records={save.timeTrialRecords} settings={save.settings} skinId={soloSkin} sound={sound}
        ghostEnabled={save.timeTrialGhostEnabled !== false}
        onToggleGhost={(enabled) => commitGame((latest) => ({ ...latest, timeTrialGhostEnabled: enabled }))}
        onSave={handleTrialRecord} onBack={() => setScreen('time-trial-levels')} onMenu={() => setScreen('menu')} /> : null}

      {screen === 'race' ? (
        <RaceCanvas
          key={raceIndex}
          skinIds={raceSkins}
          ownedSkins={save.ownedSkins}
          onEquipSkin={(target, id) => commitGame((latest) => equipSkin(latest, id, target), { allowVolatile: false })}
          levelIndex={raceIndex}
          settings={settingsRef.current}
          displaySettings={save.settings}
          sound={sound}
          totalGems={save.totalGems || 0}
          onRaceWin={handleRaceWin}
          onExit={() => setScreen('menu')}
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
                onShop={() => setScreen('shop')}
                onLeaderboard={() => setScreen('leaderboard')}
                onDaily={() => { void meta.prepare(); setScreen('daily'); }}
                onAchievements={() => setScreen('achievements')}
                onTimeTrial={() => setScreen('time-trial-levels')}
                onEndless={() => setScreen('endless')}
                onSurvival={() => setScreen('survival')}
                onRace={() => setScreen('race-levels')}
                onChallenges={() => setScreen('challenges')}
                onSettings={() => setScreen('settings')}
              />
            </div>
          ) : null}

          {screen === 'daily' ? <DailyChallengesScreen save={save} day={meta.day} sound={sound}
            onBack={() => setScreen('menu')} onPrepare={meta.prepare}
            onClaim={(date, id) => meta.claim('daily', date, id)} onPlay={(task) => {
              if (task.mode === 'tutorial' || task.kind === 'rush') startTutorial();
              else if (task.mode === 'career') startLevel(task.levelIndex ?? 0);
              else setScreen('endless');
            }} /> : null}
          {screen === 'achievements' ? <AchievementsScreen save={save} sound={sound}
            onBack={() => setScreen('menu')} onClaim={(id) => meta.claim('achievement', null, id)} /> : null}

          {screen === 'leaderboard' ? <GlobalLeaderboard best={save.endlessBest || 0}
            hasRecord={save.endlessBest > 0 || save.endlessRecords?.maxStreak > 0}
            sound={sound} onBack={() => setScreen('menu')} onPlay={() => setScreen('endless')} /> : null}

          {screen === 'shop' ? <SkinShop save={save} updateSave={updateSave} sound={sound} onBack={() => setScreen('menu')} /> : null}

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

          {screen === 'time-trial-levels' ? <TimeTrialLevels save={save} sound={sound}
            onSelect={startTrial} onBack={() => setScreen('menu')} /> : null}

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
      </AdContent>
    </div>
  );
}