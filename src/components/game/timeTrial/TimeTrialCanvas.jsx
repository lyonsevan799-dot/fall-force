import React, { useCallback } from 'react';
import { LEVELS } from '@/game/levels';
import useTimeTrial from '@/hooks/useTimeTrial';
import useTrialSave from '@/hooks/useTrialSave';
import useTrialControls from '@/hooks/useTrialControls';
import useTrialOrientation from '@/hooks/useTrialOrientation';
import TimeTrialHud from '@/components/game/timeTrial/TimeTrialHud';
import TimeTrialOverlays from '@/components/game/timeTrial/TimeTrialOverlays';
import TimeTrialResults from '@/components/game/timeTrial/TimeTrialResults';

export default function TimeTrialCanvas({ levelIndex, records, settings, skinId, sound, ghostEnabled, onToggleGhost, onSave, onBack, onMenu }) {
  const saving = useTrialSave(onSave);
  const session = useTimeTrial({ levelIndex, records, settings, skinId, sound, ghostEnabled, onFinish: saving.submit });
  const retry = useCallback(() => { if (saving.clear()) session.retry(); }, [saving.clear, session.retry]);
  const control = useTrialControls({ engineRef: session.engineRef, sound, setPaused: session.setPaused, retry, pending: saving.status.pending });
  const orientation = useTrialOrientation(session.engineRef, session.setPaused);
  const ended = ['complete', 'dead', 'dying'].includes(session.ui.state);
  return <section className="meta-shell fixed inset-0 flex select-none flex-col overflow-hidden bg-background text-foreground">
    <TimeTrialHud ui={session.ui} paused={session.paused} ghostEnabled={ghostEnabled} onGhost={() => onToggleGhost(!ghostEnabled)} onPause={control.pause} onRetry={retry} onBack={onBack} pending={saving.status.pending} />
    <div ref={session.wrapRef} className="relative min-h-0 flex-1 overflow-hidden">
      <canvas ref={session.canvasRef} aria-label="Time Trial playfield. Tap to start or flip gravity." className="absolute inset-0 block h-full w-full touch-none" {...control.pointer} onContextMenu={(event) => event.preventDefault()} />
      <p className="pointer-events-none absolute inset-x-2 bottom-1 text-center text-[8px] text-muted-foreground">{session.ui.ghostHint}{!ghostEnabled ? ' · Ghost hidden' : ''}</p>
      <TimeTrialOverlays state={session.ui.state} paused={session.paused} needsRotate={orientation.needsRotate} onRotateDismiss={orientation.dismiss} onStart={control.primary} onResume={control.pause} onRetry={retry} onMenu={onMenu} name={LEVELS[levelIndex].name} />
      {ended ? <TimeTrialResults ui={session.ui} status={saving.status} reduced={settings.reduced} onRetry={retry} onMenu={onMenu} onSaveAgain={saving.retrySave} /> : null}
    </div>
  </section>;
}