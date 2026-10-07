import React, { useState } from 'react';
import { GameButton, Panel, ToggleRow } from './ui';

export default function SettingsPanel({ settings, onChange, onReset, onClose, sound }) {
  const [confirming, setConfirming] = useState(false);
  const set = (patch) => onChange(patch);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Panel className="gs-pop w-full max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <div className="font-heading text-sm uppercase tracking-[0.3em] text-white">Settings</div>
          <button
            type="button"
            onClick={() => { if (sound) sound.sfx('click'); onClose(); }}
            className="font-heading text-[10px] uppercase tracking-[0.24em] text-white/50 transition-colors hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <ToggleRow label="Music" hint="Background soundtrack" value={settings.music} onChange={(v) => set({ music: v })} sound={sound} />
          <ToggleRow label="Sound Effects" hint="Switch, landing, impacts" value={settings.sfx} onChange={(v) => set({ sfx: v })} sound={sound} />
          <ToggleRow label="Screen Shake" hint="Camera kick on impacts" value={settings.shake} onChange={(v) => set({ shake: v })} sound={sound} />
          <ToggleRow label="Reduced Effects" hint="Lighter particles for low-end devices" value={settings.reduced} onChange={(v) => set({ reduced: v })} sound={sound} />
        </div>

        <div className="mt-5 border-t border-white/8 pt-5">
          {confirming ? (
            <div className="flex flex-col gap-3">
              <p className="text-center text-xs text-white/60">Erase all progress, stars and unlocks?</p>
              <div className="flex justify-center gap-3">
                <GameButton variant="danger" size="sm" sound={sound} onClick={() => { setConfirming(false); onReset(); }}>Erase</GameButton>
                <GameButton variant="ghost" size="sm" sound={sound} onClick={() => setConfirming(false)}>Cancel</GameButton>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { if (sound) sound.sfx('click'); setConfirming(true); }}
              className="w-full rounded-2xl border border-rose-400/25 bg-rose-500/5 px-5 py-3 font-heading text-[10px] uppercase tracking-[0.24em] text-rose-200/80 transition-colors hover:bg-rose-500/15"
            >
              Reset Progress
            </button>
          )}
        </div>
      </Panel>
    </div>
  );
}