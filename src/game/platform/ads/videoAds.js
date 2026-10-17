import { getCrazyGames } from '@/game/platform/crazyGames';
import { AD_CONFIG } from '@/game/platform/ads/config';
import { isAdBusy, updateAdState } from '@/game/platform/ads/session';
import { videoError } from '@/game/platform/ads/errors';

let disabled = false, adblockDetected = false, lastVideo = Date.now();
const breaks = new Set();
export function videoAvailability(type) {
  const sdk = getCrazyGames();
  if (!AD_CONFIG.approved || !AD_CONFIG[type] || disabled || sdk?.environment !== 'crazygames' || typeof sdk.ad?.requestAd !== 'function')
    return { available: false, message: 'Optional ads are not enabled for this version. Earn gems by playing normally.' };
  if (adblockDetected) return { available: false, message: 'An ad blocker prevents this optional offer. All game modes remain available.' };
  if (isAdBusy()) return { available: false, message: 'An advertisement request is already in progress.' };
  if (Date.now() - lastVideo < AD_CONFIG.videoIntervalMs)
    return { available: false, message: 'Optional advertisements are cooling down. Please try later.' };
  return { available: true, message: '' };
}
async function detectBlocker(sdk) {
  let timer;
  try {
    return await Promise.race([sdk.ad.hasAdblock(), new Promise((_, reject) => {
      timer = setTimeout(() => reject({ code: 'other' }), 5000);
    })]);
  } finally { clearTimeout(timer); }
}
export function requestVideoAd(type, { breakId } = {}) {
  if (!['rewarded', 'midgame'].includes(type)) return Promise.resolve(videoError('other'));
  const access = videoAvailability(type);
  if (!access.available) return Promise.resolve({ status: 'unavailable', message: access.message });
  if (type === 'midgame' && (!breakId || breaks.has(breakId))) return Promise.resolve({ status: 'skipped' });
  if (type === 'midgame') breaks.add(breakId);
  const sdk = getCrazyGames(), id = crypto.randomUUID();
  updateAdState(true);
  return new Promise((resolve) => {
    let terminal = false;
    const finish = (result) => {
      if (terminal) return;
      terminal = true;
      if (result.code === 'adsDisabledBasicLaunch') disabled = true;
      if (result.code === 'adblock') adblockDetected = true;
      if (result.status === 'error') lastVideo = Date.now();
      updateAdState(false); resolve({ ...result, id });
    };
    const callbacks = {
      adStarted: () => { if (!terminal) updateAdState(true, true); },
      adFinished: () => finish({ status: 'finished', type }),
      adError: (error, errorData) => finish(videoError(errorData || error)),
    };
    detectBlocker(sdk).then((blocked) => {
      if (terminal) return;
      if (blocked) { finish(videoError('adblock')); return; }
      lastVideo = Date.now();
      try {
        // Only this documented callback can authorize a reward. Promise resolution is NOT completion.
        const request = sdk.ad.requestAd(type, callbacks);
        request?.catch?.((error) => finish(videoError(error)));
      } catch (error) { finish(videoError(error)); }
    }).catch((error) => finish(videoError(error)));
  });
}