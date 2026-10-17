// Exactly one animation frame chain per canvas, invalidated on every restart.
export default function createRunLoop({ engine, draw, publish, onEnd }) {
  let frame = 0, generation = 0, last = 0, sync = 0, state = '', disposed = false;
  const stop = () => { generation++; cancelAnimationFrame(frame); frame = 0; };
  const start = () => {
    stop();
    const epoch = generation;
    last = performance.now(); sync = 0; state = '';
    const tick = (now) => {
      if (disposed || epoch !== generation) return;
      frame = 0;
      engine.update(Math.max(0, now - last) / 1000); last = now;
      draw();
      if (engine.state !== state || now - sync >= 80) {
        state = engine.state; sync = now; publish();
      }
      if (engine.state === 'dead') { onEnd(); return; }
      if (!disposed && epoch === generation) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  };
  return { start, stop, dispose: () => { disposed = true; stop(); } };
}