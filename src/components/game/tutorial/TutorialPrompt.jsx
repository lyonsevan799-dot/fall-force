import React from 'react';
import { ArrowUp, ArrowDown, ArrowRight, Gem, MousePointer2, Keyboard } from 'lucide-react';
import { LESSONS } from '@/game/tutorialLessons';

export default function TutorialPrompt({ phase, onContinue, onFlip }) {
  const lesson = LESSONS[phase];
  const Icon = { up: ArrowUp, down: ArrowDown, right: ArrowRight, gem: Gem }[lesson.icon];
  return (
    <section aria-live="polite" className="absolute right-3 top-1/2 z-20 w-[46%] max-w-sm -translate-y-1/2 rounded-2xl border border-primary/40 bg-card/95 p-3 shadow-lg sm:p-5">
      <div className="mb-2 flex items-center gap-2 text-primary"><Icon size={24} /><span className="font-heading text-[10px] uppercase tracking-wider">Lesson {lesson.step} / 6</span></div>
      <h2 className="font-heading text-sm sm:text-lg">{lesson.title}</h2>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{lesson.text}</p>
      {lesson.flip && <button type="button" onClick={onFlip} className="mt-3 flex min-h-11 w-full flex-wrap items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary/15 p-3 text-xs font-bold text-primary"><MousePointer2 size={16} />Tap / Click <span>or</span><Keyboard size={16} /><kbd className="rounded border border-primary/50 px-2 py-1 font-mono">Space</kbd> {lesson.icon === 'up' ? '↑' : '↓'}</button>}
      {lesson.action && <button type="button" onClick={onContinue} className="mt-3 min-h-11 w-full rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">{lesson.action} →</button>}
      {!lesson.flip && !lesson.action && <p className="mt-2 text-[10px] text-primary">Guided practice · follow the arrows</p>}
    </section>
  );
}