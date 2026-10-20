import React from 'react';
import { Play, ChevronRight } from 'lucide-react';
import { LEVELS } from '@/game/levels';
import { isLevelPlayable } from '@/game/groups';
import { tutorialAccessibleCareer } from '@/game/tutorialProgress';

export default function MainMenuPlay({ save, sound, onTutorial, onQuickPlay }) {
  const trained = tutorialAccessibleCareer(save);
  const next = LEVELS.findIndex((_, index) => isLevelPlayable(save, index) && !save.levels?.[index]?.completed);
  const label = !trained ? 'Play Fall Force' : next < 0 ? 'Replay Career' : `Continue · Level ${next + 1}`;
  return <div className="w-full max-w-3xl text-center">
    <button type="button" onClick={() => { sound.init(); sound.resume(); sound.sfx('click'); if (trained) onQuickPlay(Math.max(0, next)); else onTutorial(); }} className="flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border border-primary bg-primary px-5 py-4 font-heading text-sm uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.98]">
      <Play size={22} fill="currentColor" /><span>{label}</span><ChevronRight size={20} />
    </button>
    <p className="mt-3 text-sm text-muted-foreground">Run automatically. Flip gravity, dodge hazards, reach the finish.</p>
    <p className="mt-1 text-xs text-muted-foreground">Tap / Click / Space to flip · P to pause · R to restart</p>
  </div>;
}