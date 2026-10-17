import { getCrazyGames } from '@/game/platform/crazyGames';
import { AD_CONFIG } from '@/game/platform/ads/config';
import { isAdBusy } from '@/game/platform/ads/session';
import { BANNER_ERRORS } from '@/game/platform/ads/errors';

let lastRequest = -Infinity, requests = 0, disabled = false;
export function bannersEnabled() {
  const sdk = getCrazyGames();
  return AD_CONFIG.approved && AD_CONFIG.banners && !disabled && sdk?.environment === 'crazygames'
    && typeof sdk.banner?.requestBanner === 'function' && typeof sdk.banner?.clearBanner === 'function';
}
export function clearBanner(id) {
  const sdk = getCrazyGames();
  try { const result = sdk?.banner?.clearBanner(id); result?.catch?.(() => {}); } catch { /* Removal must not block play. */ }
}
export async function requestMenuBanner(element) {
  if (!bannersEnabled() || isAdBusy() || document.hidden || requests >= AD_CONFIG.bannerSessionLimit || Date.now() - lastRequest < AD_CONFIG.bannerIntervalMs) return false;
  const bounds = element.getBoundingClientRect();
  if (!element.isConnected || bounds.width < 320 || bounds.height < 50 || bounds.top < 0 || bounds.left < 0 || bounds.bottom > window.innerHeight || bounds.right > window.innerWidth) return false;
  lastRequest = Date.now(); requests++;
  try {
    await getCrazyGames().banner.requestBanner({ id: element.id, width: 320, height: 50 });
    const visible = element.getBoundingClientRect();
    if (!element.isConnected || isAdBusy() || document.hidden || visible.top < 0 || visible.left < 0 || visible.bottom > window.innerHeight || visible.right > window.innerWidth) { clearBanner(element.id); return false; }
    return true;
  } catch (error) {
    const code = BANNER_ERRORS.has(error?.code) ? error.code : 'other';
    if (['bannersDisabledBasicLaunch', 'bannersDisabledMobileApp', 'maxRefreshReached'].includes(code)) disabled = true;
    clearBanner(element.id); return false;
  }
}