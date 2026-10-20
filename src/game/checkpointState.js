// Runtime snapshots only, never written to the player's saved progress.
export function captureCheckpoint(engine) {
  return { px: engine.px, py: engine.py, vy: engine.vy, dir: engine.dir,
    grounded: engine.grounded, groundPlat: engine.groundPlat, t: engine.t,
    speedMult: engine.speedMult, gateIndex: engine.gateIndex,
    portals: engine.portals.map((portal) => portal.used === true),
    hazards: engine.hazards.map((hazard) => ({ _triggered: hazard._triggered, _phase: hazard._phase, _triggerT: hazard._triggerT })) };
}
export function restoreCheckpoint(engine, checkpoint) {
  const snapshot = checkpoint?.snapshot;
  if (!snapshot) return;
  for (const key of ['px', 'py', 'vy', 'dir', 'grounded', 'groundPlat', 't', 'speedMult', 'gateIndex']) engine[key] = snapshot[key];
  engine.portals.forEach((portal, index) => { portal.used = snapshot.portals[index]; });
  engine.hazards.forEach((hazard, index) => Object.assign(hazard, snapshot.hazards[index]));
}