// Levels 36–55: authored section orders, never random placement or recycled
// generated templates. Keep top speed stable; challenge comes from route changes.
const spike = (side, n = 3) => ({ t: 'spike', side, n, f: 2.2 });
const pulse = (side, phase = 0) => ({ t: 'mspike', side, c: 3, period: 2.6, phase, f: 2.15 });
const blade = (at = 'mid', arm = 120) => ({ t: 'blade', at, arm, spin: 0.85, f: 2.1 });
const laser = (host, phase = 0) => ({ t: 'laser', host, h: 300, on: 1.2, off: 1.3, phase, f: 2.3 });
const drop = (side = 'ceil') => ({ t: 'drop', side, w: 60, h: 44, shake: 0.65, trigger: 400, f: 2.8 });
const lift = (y, axis = 'y') => ({ t: 'plat', y, axis, w: 180, amp: axis === 'x' ? 55 : 85, period: 3.6, f: 2.8 });
const fade = (y) => ({ t: 'vanish', y, w: 180, on: 2.2, off: 1.2, f: 2.8 });
const bounce = (phase = 0) => ({ t: 'bounce', r: 22, y0: 180, y1: 580, period: 2.8, phase, f: 2.8 });
const walls = (phase = 0) => ({ t: 'wall', w: 46, gap: 260, period: 3.6, phase, f: 3.2 });
const crusher = (side = 'ceil') => ({ t: 'crusher', side, period: 3.2, w: 48, f: 3.2 });
const zone = (dir) => ({ t: 'zone', dir, len: 2.4 });
const cross = (n = 4, side = 'floor') => ({ t: 'alt', n, c: 2, side, f: 1.75 });
const mix = (a, b, f = 2.35) => ({ t: 'over', a, b, f });
const rest = { t: 'run', n: 1.1 };
const checkpoint = { t: 'checkpoint', n: 3 };
// Authored optional Rush rooms include a full empty crossing at the exit.
const reward = (y) => [checkpoint, { t: 'run', n: 1 }, { t: 'gem', y, n: 5, spacing: 0.5 }, { t: 'run', n: 2 }];
const specs = [
  {
    name: 'Afterburn', theme: 'neon', tip: 'Familiar hazards now share the same crossing. Gems remain optional.',
    sections: [mix(pulse('floor'), blade()), laser('ceil'), cross(5), mix(drop(), laser('floor'), 3.0), spike('ceil'),
      ...reward(601), mix(spike('floor'), blade('high')), mix(bounce(), spike('floor'), 3.0), laser('floor', 0.6), cross(5, 'ceil'),
      checkpoint, lift(400), mix(pulse('ceil', 1), blade('low')), mix(crusher(), spike('floor'), 3.2), spike('ceil'), cross(6), rest],
  },
  {
    name: 'Counterweight', theme: 'industrial', tip: 'Horizontal platforms carry you too. Flip away before the next hazard.',
    sections: [lift(430, 'x'), spike('floor'), mix(blade('high'), spike('ceil')), cross(5), laser('floor'),
      checkpoint, drop('floor'), lift(330), pulse('floor'), laser('ceil', 0.8), cross(6),
      ...reward(143), lift(410, 'x'), mix(blade(), pulse('ceil')), spike('floor'), bounce(0.8), cross(5), rest],
  },
  {
    name: 'Warning Signs', theme: 'industrial', tip: 'Shaking blocks are about to fall. Use the clear opposite route.',
    sections: [drop(), spike('floor'), laser('ceil'), drop('floor'), cross(5),
      ...reward(601), mix(drop(), blade('low'), 3.2), pulse('ceil'), laser('floor', 0.5), cross(5, 'ceil'),
      checkpoint, drop('floor'), fade(350), spike('ceil'), crusher('floor'), cross(6), bounce(), rest],
  },
  {
    name: 'Fade Relay', theme: 'space', tip: 'The red bar and countdown show exactly when a solid platform disappears.',
    sections: [fade(420), spike('floor'), fade(320), laser('ceil'), cross(5),
      checkpoint, mix(fade(400), spike('floor')), blade('high'), pulse('ceil'), bounce(1), cross(5),
      ...reward(143), fade(350), drop(), laser('floor', 0.8), fade(440), spike('ceil'), cross(6), rest],
  },
  {
    name: 'Blade Weave', theme: 'space', tip: 'Take the boundary route around each central blade, then reverse for the next cluster.',
    sections: [mix(blade(), spike('floor')), spike('ceil'), blade('low', 140), cross(5), laser('ceil'),
      ...reward(601), mix(blade('high'), pulse('ceil')), bounce(0.5), laser('floor'), cross(6),
      checkpoint, blade('low'), lift(340), spike('ceil'), blade('high'), pulse('floor'), cross(7), rest],
  },
  {
    name: 'Light Lattice', theme: 'cyber', tip: 'Inactive lasers show a dashed warning before becoming dangerous.',
    sections: [laser('floor'), spike('ceil'), laser('ceil', 0.6), pulse('floor'), cross(6),
      checkpoint, mix(laser('floor', 0.3), blade('high')), spike('ceil'), bounce(0.7), laser('ceil', 1.1), cross(5),
      ...reward(601), laser('floor', 0.9), drop('floor'), fade(380), blade(), laser('ceil'), cross(7), rest],
  },
  {
    name: 'Open Circuit', theme: 'cyber', tip: 'Crushing walls leave a generous middle gap. Cross during their open phase or through the center.',
    sections: [walls(), cross(5), blade('high'), laser('floor'), pulse('ceil'),
      ...reward(143), walls(1.2), bounce(), spike('floor'), lift(400), cross(6),
      checkpoint, walls(2.2), laser('ceil'), spike('floor'), crusher(), blade('low'), cross(7), rest],
  },
  {
    name: 'Elastic Orbit', theme: 'space', tip: 'Bouncing orbs follow a fixed rhythm. Read their full vertical track.',
    sections: [bounce(), spike('floor'), blade('high'), bounce(1.3), cross(6),
      checkpoint, laser('floor'), bounce(0.5), spike('ceil'), lift(400), pulse('floor'), cross(5),
      ...reward(601), bounce(1), blade('low'), laser('ceil', 0.7), drop(), cross(7), walls(1.5), rest],
  },
  {
    name: 'Current Exchange', theme: 'neon', tip: 'Tunnel arrows set gravity while inside. Prepare your next manual flip after the field ends.',
    sections: [zone(-1), spike('floor'), blade('low'), cross(5, 'ceil'), laser('ceil'),
      ...reward(143), zone(1), spike('ceil'), bounce(0.6), laser('floor'), cross(6),
      checkpoint, zone(-1), pulse('floor'), blade('low'), rest, zone(1), pulse('ceil'), cross(7), rest],
  },
  {
    name: 'Factory Shift', theme: 'industrial', tip: 'Combine the platform ride, falling-block warning, and opposite-wall escape.',
    sections: [lift(400, 'x'), spike('floor'), drop(), blade('high'), laser('floor'), cross(6),
      checkpoint, fade(350), pulse('ceil'), crusher('floor'), laser('ceil'), cross(6),
      ...reward(601), mix(lift(400), spike('floor')), bounce(), drop('floor'), pulse('ceil'), blade('low'), cross(7), rest],
  },
  {
    name: 'Crossed Signals', theme: 'cyber', tip: 'The laser and cluster share a column; the middle passage is the alternate route.',
    sections: [mix(laser('floor'), spike('ceil'), 3.2), blade('low'), cross(6), bounce(1), drop(),
      ...reward(143), mix(laser('ceil'), spike('floor'), 3.2), lift(380), pulse('ceil'), cross(6),
      checkpoint, walls(1.3), laser('floor', 0.8), blade('high'), drop('floor'), spike('ceil'), cross(8), rest],
  },
  {
    name: 'Suspended Sentence', theme: 'space', tip: 'Use solid platform faces as safe surfaces; disappearing ones are only temporary.',
    sections: [lift(430), spike('floor'), fade(330), pulse('ceil'), cross(6), laser('floor'),
      checkpoint, lift(350, 'x'), drop(), fade(440), spike('ceil'), blade('low'), cross(6),
      ...reward(601), mix(lift(400), spike('floor')), laser('ceil'), bounce(1.1), fade(330), pulse('floor'), cross(8), rest],
  },
  {
    name: 'Twin Press', theme: 'energy', tip: 'Read each press separately. Their warning phases are deliberately staggered.',
    sections: [crusher(), spike('floor'), walls(1), cross(6), laser('ceil'), bounce(),
      ...reward(143), crusher('floor'), spike('ceil'), blade('low'), walls(2.2), cross(7),
      checkpoint, drop(), laser('floor'), crusher(), pulse('ceil'), blade('high'), cross(8), rest],
  },
  {
    name: 'Skyline Sprint', theme: 'neon', tip: 'Long alternating sequences reward a steady rhythm rather than faster movement.',
    sections: [cross(8), mix(pulse('floor'), blade()), laser('ceil'), drop('floor'),
      checkpoint, cross(7, 'ceil'), bounce(0.8), lift(380), laser('floor', 1), pulse('ceil'),
      ...reward(601), cross(8), blade('high'), walls(2), spike('floor'), laser('ceil'), cross(6, 'ceil'), rest],
  },
  {
    name: 'Redline Relay', theme: 'energy', tip: 'Three different rhythms meet: fading pads, moving spikes, and lasers.',
    sections: [mix(fade(400), spike('floor')), pulse('ceil'), laser('floor'), cross(7), blade('high'),
      ...reward(143), lift(350, 'x'), laser('ceil', 0.6), pulse('floor', 0.7), bounce(), cross(7),
      checkpoint, fade(440), drop(), spike('ceil'), laser('floor', 1.1), blade('low'), cross(8), walls(), rest],
  },
  {
    name: 'Vector Divide', theme: 'cyber', tip: 'Ride each gravity field before choosing the next clear lane.',
    sections: [zone(-1), spike('floor'), laser('floor'), cross(7, 'ceil'), blade('low'),
      checkpoint, zone(1), spike('ceil'), laser('ceil'), cross(7), bounce(0.6), walls(1.2),
      ...reward(601), zone(-1), blade('low'), pulse('floor'), rest, zone(1), laser('ceil'), cross(8), rest],
  },
  {
    name: 'Dark Matter', theme: 'void', tip: 'Mixes change the safe lane, but every encounter retains a readable escape.',
    sections: [mix(blade(), pulse('floor')), laser('ceil'), bounce(1), cross(7), drop(), walls(0.7),
      ...reward(143), mix(fade(400), spike('floor')), crusher('floor'), laser('ceil'), cross(7), blade('low'),
      checkpoint, mix(laser('floor'), spike('ceil'), 3.2), drop('floor'), lift(350), pulse('floor'), bounce(), cross(8), rest],
  },
  {
    name: 'Event Horizon', theme: 'void', tip: 'Choose your optional gem detour in the recovery room, not inside a moving hazard.',
    sections: [walls(1.2), blade('high'), mix(laser('floor'), spike('ceil'), 3.2), cross(8), bounce(),
      checkpoint, lift(400, 'x'), drop(), pulse('ceil'), laser('floor'), cross(7), crusher('floor'),
      ...reward(601), fade(350), blade('low'), zone(-1), spike('floor'), laser('ceil'), cross(8), walls(2.3), rest],
  },
  {
    name: 'Terminal Velocity', theme: 'energy', tip: 'No speed reset or surprise acceleration: sustained combinations are the challenge.',
    sections: [cross(8), mix(blade('high'), pulse('ceil')), laser('floor'), drop(), bounce(0.5),
      ...reward(143), walls(1), lift(420), spike('floor'), laser('ceil'), crusher(), cross(8, 'ceil'),
      checkpoint, zone(1), spike('ceil'), blade('low'), pulse('floor'), fade(350), laser('ceil', 0.8), cross(9), rest],
  },
  {
    name: 'Beyond Gravity', theme: 'void', tip: 'The final relay combines known mechanics. Checkpoints remain gem-free and optional rows stay safe.',
    sections: [mix(pulse('floor'), blade()), laser('ceil'), drop('floor'), cross(8), walls(1.1), bounce(0.6),
      checkpoint, lift(400, 'x'), spike('floor'), fade(330), laser('ceil'), crusher('floor'), cross(8),
      ...reward(601), zone(-1), pulse('floor'), blade('low'), rest, zone(1), spike('ceil'), laser('ceil'),
      checkpoint, mix(laser('floor'), spike('ceil'), 3.2), drop(), blade('high'), bounce(1), walls(2), cross(10), rest],
  },
];
export default specs.map((spec) => ({ speed: 1.56, gap: 2.2, fScale: 0.64, startRun: 4, ...spec }));