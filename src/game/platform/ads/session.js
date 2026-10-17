import { setAdGameplayBlocked } from '@/game/platform/gameEvents';

let state = Object.freeze({ busy: false, playing: false });
const listeners = new Set(), participants = new Set();
const snapshots = new Map();
export const getAdState = () => state;
export const isAdBusy = () => state.busy;
export const subscribeAds = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
function freeze(participant) {
  const engine = participant.getEngine();
  if (!engine || snapshots.has(participant)) return;
  snapshots.set(participant, { engine, paused: engine.paused, runId: engine.runId });
  engine.paused = true; participant.setPaused(true);
}
export function registerAdGameplay(participant) {
  participants.add(participant);
  if (state.busy) freeze(participant);
  return () => { participants.delete(participant); snapshots.delete(participant); };
}
export function updateAdState(busy, playing = false) {
  if (busy && !state.busy) {
    setAdGameplayBlocked(true);
    participants.forEach(freeze);
  }
  state = Object.freeze({ busy, playing });
  listeners.forEach((listener) => listener());
  if (!busy) {
    for (const [participant, snapshot] of snapshots) {
      if (participant.getEngine() !== snapshot.engine || snapshot.engine.runId !== snapshot.runId) continue;
      snapshot.engine.paused = snapshot.paused || document.hidden;
      participant.setPaused(snapshot.engine.paused);
    }
    snapshots.clear(); setAdGameplayBlocked(false);
  }
}