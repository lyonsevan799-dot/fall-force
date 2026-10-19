import MiddleAttempt from '@/game/middleAttempt';
export default function restartChallengeAttempt(engine, challenge, onFailure) {
  engine.middleAttempt?.fail('Restarted the level');
  engine.middleAttempt = null;
  engine.restart(true);
  if (challenge?.type === 'middle') {
    engine.middleAttempt = new MiddleAttempt(onFailure);
    engine.middleAttempt.position(engine);
    engine.middleAttempt.start(engine);
  }
}