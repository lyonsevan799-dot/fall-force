// Actual engine observations only; no network responses or saved highs mint events.
const runs = new WeakMap(), listeners = new Set();
const session = crypto.randomUUID();
let sequence = 0;
const dayOf = (at) => new Date(at).toISOString().slice(0, 10);
export function subscribeProgressEvents(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function publish(engine, data, at = Date.now()) {
  if (!['career', 'tutorial', 'endless'].includes(engine.mode)) return;
  const event = Object.freeze({ session, sequence: ++sequence, at, date: dayOf(at), mode: engine.mode, levelIndex: engine.levelIndex, ...data });
  listeners.forEach((listener) => listener(event));
}
export function flushProgressEvents(engine) {
  const run = runs.get(engine);
  if (!run) return;
  for (const bucket of run.pending.values()) publish(engine, { kind: 'pickups', gems: bucket.gems, runGems: bucket.runGems, rows: bucket.rows }, bucket.at);
  run.pending.clear();
}
export function startProgressRun(engine, full) {
  if (!full && runs.has(engine)) return;
  flushProgressEvents(engine);
  engine.runId = crypto.randomUUID();
  runs.set(engine, { pending: new Map(), dayGems: new Map(), rows: new Set(), finished: false, deaths: 0 });
}
export function recordGemPickup(engine, gem) {
  const run = runs.get(engine);
  if (!run || run.finished) return;
  const at = Date.now(), date = dayOf(at);
  const count = (run.dayGems.get(date) || 0) + 1;
  run.dayGems.set(date, count);
  const bucket = run.pending.get(date) || { gems: 0, runGems: 0, rows: 0, at };
  bucket.gems++; bucket.runGems = count; bucket.at = at;
  const group = gem.groupId == null ? null : engine.gemGroups[gem.groupId];
  if (group?.length >= 4 && !run.rows.has(gem.groupId) && group.every((item) => item.collected)) {
    run.rows.add(gem.groupId); bucket.rows++;
  }
  run.pending.set(date, bucket);
}
export function recordRunOutcome(engine, outcome) {
  const run = runs.get(engine);
  if (!run || run.finished || (outcome === 'death' && run.deaths === engine.deaths)) return;
  flushProgressEvents(engine);
  if (outcome === 'complete' || engine.mode === 'endless') run.finished = true;
  run.deaths = engine.deaths;
  publish(engine, { kind: outcome, deaths: engine.deaths, time: engine.attemptTime,
    score: typeof engine.score === 'number' && Number.isFinite(engine.score) ? Math.max(0, Math.floor(engine.score)) : 0 });
}