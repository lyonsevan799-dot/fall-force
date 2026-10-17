import { useCallback, useEffect } from 'react';
import useUtcDay from '@/hooks/useUtcDay';
import { subscribeProgressEvents } from '@/game/meta/events';
import { applyProgressEvent, prepareMetaProgress, acknowledgeAchievement } from '@/game/meta/progression';
import claimMetaReward from '@/game/meta/rewards';

export default function useMetaProgress(commitGame) {
  const day = useUtcDay();
  const prepare = useCallback(() => commitGame((save) => prepareMetaProgress(save)), [commitGame]);
  useEffect(() => subscribeProgressEvents((event) => { void commitGame((save) => applyProgressEvent(save, event)); }), [commitGame]);
  useEffect(() => { void prepare(); }, [day, prepare]);
  const claim = useCallback((type, date, id) => commitGame((save) => claimMetaReward(save, type, date, id), { allowVolatile: false }), [commitGame]);
  const notify = useCallback((id) => commitGame((save) => acknowledgeAchievement(save, id)), [commitGame]);
  return { day, prepare, claim, notify };
}