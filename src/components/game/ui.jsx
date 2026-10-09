import React from 'react';
import { Star } from 'lucide-react';

export function GameButton({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, sound }) {
  const base = 'relative select-none font-heading uppercase tracking-[0.14em] rounded-xl border transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none inline-flex items-center justify-center gap-2';
  const sizes = {
    sm: 'px-4 py-2 text-[11px]',
    md: 'px-6 py-3 text-xs',
    lg: 'px-8 py-4 text-sm',
  };
  const variants = {
    primary: 'bg-white text-[#05070f] border-white hover:scale-[1.03] shadow-[0_0_34px_-8px_rgba(255,255,255,0.6)]',
    accent: 'bg-cyan-400/12 text-cyan-100 border-cyan-300/40 hover:bg-cyan-400/22 hover:scale-[1.03]',
    ghost: 'bg-white/5 text-white/75 border-white/12 hover:bg-white/10 hover:text-white hover:scale-[1.02]',
    danger: 'bg-rose-500/12 text-rose-200 border-rose-400/40 hover:bg-rose-500/22',
  };
  const handle = (e) => {
    if (sound) sound.sfx('click');
    if (onClick) onClick(e);
  };
  return (
    <button type="button" className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} onClick={handle} disabled={disabled}>
      {children}
    </button>
  );
}

export function IconButton({ children, onClick, className = '', label, sound }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => { if (sound) sound.sfx('click'); if (onClick) onClick(e); }}
      className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-white/80 backdrop-blur transition-all duration-150 hover:bg-white/10 hover:text-white active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

export function Stars({ value = 0, size = 18, className = '' }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.7}
          fill={i < value ? 'currentColor' : 'none'}
          className={i < value ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.6)]' : 'text-white/20'}
        />
      ))}
    </div>
  );
}

export function Panel({ children, className = '' }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-[#070912]/85 p-6 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

export function ToggleRow({ label, hint, value, onChange, sound }) {
  return (
    <button
      type="button"
      onClick={() => { if (sound) sound.sfx('click'); onChange(!value); }}
      className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 text-left transition-colors duration-150 hover:bg-white/[0.07]"
    >
      <span>
        <span className="block font-heading text-xs uppercase tracking-[0.18em] text-white/90">{label}</span>
        {hint ? <span className="mt-1 block text-[11px] text-white/40">{hint}</span> : null}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-200 ${value ? 'border-cyan-300/60 bg-cyan-400/30' : 'border-white/15 bg-white/5'}`}>
        <span className={`absolute top-[3px] h-5 w-5 rounded-full transition-all duration-200 ${value ? 'left-[25px] bg-cyan-200' : 'left-[3px] bg-white/50'}`} />
      </span>
    </button>
  );
}

export function SliderRow({ label, value, onChange, sound }) {
  return (
    <div className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4">
      <span className="font-heading text-xs uppercase tracking-[0.18em] text-white/90">{label}</span>
      <div className="flex items-center gap-3">
        <span className="w-9 text-right font-mono text-xs text-white/50">{Math.round(value * 100)}%</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (sound) sound.sfx('click');
            onChange(v);
          }}
          className="gs-slider h-1.5 w-24 cursor-pointer rounded-full sm:w-32"
        />
      </div>
    </div>
  );
}