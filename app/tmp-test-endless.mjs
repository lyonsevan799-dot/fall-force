import { EndlessEngine } from '/app/src/game/endlessEngine.js';
import { LANE } from '/app/src/game/gemPlace.js';
console.log('LANE:', JSON.stringify(LANE));
const sound = { init(){}, resume(){}, sfx(){}, setMusicVolume(){}, setSfxVolume(){}, startMusic(){}, stopMusic(){} };
const settings = { musicVolume: 0.5, sfxVolume: 0.5, shake: true, reducedEffects: false };
let found = 0;
let dumped = false;
for (let run = 0; run < 40; run++) {
  if (dumped) break;
  const eng = new EndlessEngine({ sound, settings });
  eng.loadEndless(0, true);
  for (let i = 0; i < 60; i++) eng._appendChunk();
  const items = eng.level.items;
  const gems = items.filter(it => it.type === 'gem');
  const groups = {};
  for (const g of gems) { if (g.groupId != null) (groups[g.groupId] ||= []).push(g); }
  for (const [k, gs] of Object.entries(groups)) {
    if (gs.length >= 4 && !gs.find(g => g.trigger)) {
      found++;
      if (found <= 2) {
        console.log('ALL gems with groupId==' + k + ':');
        gems.filter(g => g.groupId != null && String(g.groupId) === String(k)).forEach(g => console.log('   G x=' + g.x.toFixed(0) + ' y=' + g.y.toFixed(0) + ' r=' + g.r + ' trig=' + (!!g.trigger)));
        console.log('run ' + run + ': NO-TRIGGER group ' + k + ' size ' + gs.length + ':');
        gs.forEach(g => console.log('  x=' + g.x.toFixed(0) + ' y=' + g.y.toFixed(0) + ' r=' + g.r + ' trig=' + (!!g.trigger) + ' rowLen=' + g.rowLen + ' dir=' + JSON.stringify(g.rowDir)));
        const xs = gs.map(g=>g.x);
        const lo = Math.min(...xs) - 120, hi = Math.max(...xs) + 120;
        const region = gems.filter(g => g.x >= lo && g.x <= hi);
        console.log('  ALL gems in x[' + lo.toFixed(0) + ',' + hi.toFixed(0) + ']:');
        region.forEach(g => console.log('    x=' + g.x.toFixed(0) + ' y=' + g.y.toFixed(0) + ' r=' + g.r + ' grp=' + g.groupId + ' trig=' + (!!g.trigger) + ' rowLen=' + g.rowLen));
        dumped = true;
      }
    }
  }
}
console.log('total no-trigger rows across 40 runs: ' + found);
// deep diagnostic for run 0
console.error('=== DIAGNOSTIC RUN START ===');
{
  const eng = new EndlessEngine({ sound, settings });
  eng.loadEndless(0, true);
  for (let i = 0; i < 65; i++) eng._appendChunk();
  const all = eng.level.items.filter(it => it.type === 'gem');
  const noTrig = all.filter(g => g.groupId != null && g.rowLen >= 4 && !all.find(o => o.groupId === g.groupId && o.trigger));
  console.log('DIAG no-trigger-row groups: ' + new Set(noTrig.map(g=>g.groupId)).size);
  noTrig.slice(0,4).forEach(g => console.log('DIAG nogroup gid=' + g.groupId + ' x=' + g.x.toFixed(0) + ' y=' + g.y.toFixed(0) + ' rowLen=' + g.rowLen + ' dir=' + JSON.stringify(g.rowDir)));
}
console.error('=== DIAGNOSTIC RUN END ===');
}