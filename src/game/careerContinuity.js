// The old second campaign reset encounter variety to one-obstacle lessons at
// level 16. A spacing multiplier alone cannot preserve mechanical difficulty.
// Retain section order/checkpoint structure and restore familiar mixed routes.
export default function continueCareer(spec, index) {
  if (index < 15 || index > 34) return spec;
  let encounter = 0;
  return { ...spec, sections: spec.sections.map((section) => {
    if (!['mspike', 'spike', 'blade', 'laser', 'drop', 'plat', 'vanish'].includes(section.t)) return section;
    if (section.t !== 'spike' && section.n > 1) return section;
    const slot = encounter++;
    if (slot % 3 !== 0) return section;
    let partner;
    if (section.t === 'mspike' || section.t === 'spike') {
      // Central blade leaves the opposite boundary completely open.
      partner = { t: 'blade', at: 'mid', arm: 100, spin: 0.8 };
    } else if (section.t === 'blade') {
      partner = { t: 'spike', side: slot % 2 ? 'ceil' : 'floor', n: 2 };
    } else if (section.t === 'laser') {
      // Opposite-wall spikes leave a broad middle passage or the inactive beam.
      partner = { t: 'spike', side: section.host === 'ceil' ? 'floor' : 'ceil', n: 2 };
    } else if (section.t === 'drop') {
      // Previously introduced laser + falling block; both leave a middle route.
      partner = { t: 'laser', host: section.side === 'floor' ? 'ceil' : 'floor', h: 280, on: 1.1, off: 1.4 };
    } else {
      // A platform is a useful alternate route, not an isolated free obstacle.
      partner = { t: 'spike', side: 'floor', n: 2 };
    }
    return { t: 'over', a: section, b: partner, f: section.f ?? spec.gap };
  }) };
}