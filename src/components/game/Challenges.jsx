import React from 'react';
import { Gem, Check, Lock, ChevronLeft, ChevronRight, Target, MoveVertical, Crosshair, Orbit } from 'lucide-react';
import { GameButton } from './ui';
import { CHALLENGES, challengeGroup, challengeUnlocked, isChallengeDone } from '@/game/challenges';

const ACCENT = {
  cyan: {
    ring: 'border-cyan-300/40',
    glow: 'hover:shadow-[0_0_50px_-15px_rgba(56,232,255,0.55)]',
    chip: 'border-cyan-300/40 bg-cyan-400/10 text-cyan-100',
    text: 'text-cyan-200',
    dot: 'bg-cyan-300',
    reward: 'text-cyan-200',
  },
  amber: {
    ring: 'border-amber-300/40',
    glow: 'hover:shadow-[0_0_50px_-15px_rgba(252,211,77,0.55)]',
    chip: 'border-amber-300/40 bg-amber-400/10 text-amber-100',
    text: 'text-amber-200',
    dot: 'bg-amber-300',
    reward: 'text-amber-200',
  },
  pink: {
    ring: 'border-pink-300/40',
    glow: 'hover:shadow-[0_0_50px_-15px_rgba(255,62,165,0.55)]',
    chip: 'border-pink-300/40 bg-pink-400/10 text-pink-100',
    text: 'text-pink-200',
    dot: 'bg-pink-300',
    reward: 'text-pink-200',
  },
};

function DifficultyDots({ level, accent }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < level ? accent.dot : 'bg-white/15'}`} />
      ))}
    </div>
  );
}

export default function Challenges({ save, sound, onStart, onBack }) {
  const completedCount = CHALLENGES.filter((c) => isChallengeDone(save, c.id)).length;

  return (
    <div className="relative z-10 mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 px-5 py-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => { sound.sfx('click'); onBack(); }}
          className="flex items-center gap-2 font-heading text-[10px] uppercase tracking-[0.28em] text-white/50 transition-colors hover:text-white"
        >
          <ChevronLeft size={14} /> Menu
        </button>
        <div className="text-center">
          <div className="font-heading text-xs uppercase tracking-[0.4em] text-white/80">Challenges</div>
          <div className="font-heading text-[9px] uppercase tracking-[0.24em] text-white/40">{completedCount} / {CHALLENGES.length} completed</div>
        </div>
        <div className="w-16" />
      </div>

      <div className="flex flex-col gap-4">
        {CHALLENGES.map((ch, ci) => {
          const middle = ch.type === 'middle';
          const ChallengeIcon = middle ? ({ easy: MoveVertical, medium: Crosshair, hard: Orbit }[ch.groupId]) : Target;
          const group = challengeGroup(ch);
          const unlocked = challengeUnlocked(save, ch);
          const done = isChallengeDone(save, ch.id);
          const a = ACCENT[group.accent];
          const failed = middle && save.challenges?.[ch.id]?.failedAttempt;
          return (
            <div
              key={ch.id}
              className={`relative overflow-hidden rounded-3xl border ${unlocked ? `${a.ring} bg-white/[0.04] ${a.glow}` : 'border-white/10 bg-white/[0.02]'} p-5 transition-all duration-200 sm:p-6`}
            >
              {middle && ci === 3 ? <h2 className="mb-4 font-heading text-sm uppercase tracking-widest text-white/80">Stay in the Middle</h2> : null}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className={`font-heading text-xl uppercase tracking-[0.16em] sm:text-2xl ${unlocked ? 'text-white' : 'text-white/40'}`}>
                      {ch.name}
                    </h2>
                    <span className={`rounded-full border px-2.5 py-0.5 font-heading text-[9px] uppercase tracking-[0.22em] ${unlocked ? a.chip : 'border-white/15 bg-white/5 text-white/40'}`}>
                      {group.name}
                    </span>
                    <DifficultyDots level={['easy', 'medium', 'hard'].indexOf(ch.groupId) + 1} accent={a} />
                    {done ? (
                      <span className={`flex items-center gap-1 font-heading text-[9px] uppercase tracking-[0.2em] ${a.text}`}>
                        <Check size={12} /> Completed
                      </span>
                    ) : (
                      <span className="font-heading text-[9px] uppercase tracking-[0.2em] text-white/40">{!unlocked ? 'Locked' : failed ? 'Failed Attempt' : 'Available'}</span>
                    )}
                  </div>

                  <div className="mt-3 flex items-start gap-2">
                    <ChallengeIcon size={14} className={`mt-0.5 shrink-0 ${unlocked ? 'text-white/55' : 'text-white/30'}`} />
                    <p className={`text-[12px] leading-relaxed ${unlocked ? 'text-white/55' : 'text-white/35'}`}>
                      {ch.objective} in a single run.
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Gem size={16} className={a.reward} />
                    <span className={`font-heading text-lg font-bold tracking-[0.04em] ${a.reward}`}>
                      +{ch.reward.toLocaleString()}
                    </span>
                    <span className="font-heading text-[10px] uppercase tracking-[0.2em] text-white/40">gems</span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  {unlocked ? (
                    <GameButton
                      variant={done ? 'ghost' : 'primary'}
                      className="sm:w-44"
                      sound={sound}
                      onClick={() => onStart(ch)}
                    >
                      {done ? 'Replay' : 'Start Challenge'} <ChevronRight size={14} className="ml-1" />
                    </GameButton>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3 sm:w-64">
                      <Lock size={14} className="shrink-0 text-white/40" />
                      <span className="font-heading text-[10px] uppercase leading-tight tracking-[0.16em] text-white/45">
                        {group.lockHint}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-white/30">
        No-Death: finish without dying. Stay in the Middle: avoid both boundaries for the entire level; deaths and restarts fail the attempt. Start a fresh attempt from the level picker. Each challenge pays once.
      </p>
    </div>
  );
}