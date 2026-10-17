import { switchSaveSession } from '@/game/platform/saveStore';
import { keepPendingAdReward } from '@/game/platform/ads/rewards';

let state = Object.freeze({ available: false, username: null, loading: false, error: '' });
let started = false, revision = 0;
const listeners = new Set();
export const getAccountState = () => state;
export const subscribeAccount = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
function publish(user, error = '') {
  // Presentation only. No user IDs, tokens, authentication, or account-keyed wallets.
  state = Object.freeze({ available: true, username: typeof user?.username === 'string' ? user.username.slice(0, 20) : null, loading: false, error });
  listeners.forEach((listener) => listener());
}
export function initializeAccounts(sdk) {
  if (started || sdk?.user?.isUserAccountAvailable !== true || typeof sdk.user.getUser !== 'function') return;
  started = true;
  state = Object.freeze({ ...state, available: true, loading: true });
  const changed = (user) => {
    revision++; keepPendingAdReward(null);
    // The SDK has selected its account data. Never merge it with the guest wallet.
    switchSaveSession(); publish(user);
  };
  const refresh = () => {
    const current = ++revision;
    let timer;
    Promise.race([Promise.resolve().then(() => sdk.user.getUser()), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Profile unavailable')), 5000);
    })]).then((user) => { if (current === revision) publish(user); })
      .catch(() => { if (current === revision) publish(null, 'CrazyGames profile unavailable. Playing does not require login.'); })
      .finally(() => clearTimeout(timer));
  };
  let attached = false;
  const attach = () => {
    if (attached || typeof sdk.user.addAuthListener !== 'function') return;
    try { sdk.user.addAuthListener(changed); attached = true; } catch { /* Account presentation is optional. */ }
  };
  attach(); refresh();
  window.addEventListener('pagehide', () => {
    if (!attached) return;
    try { sdk.user.removeAuthListener(changed); } catch { /* Page is leaving. */ }
    attached = false;
  });
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    switchSaveSession(); keepPendingAdReward(null); attach(); refresh();
  });
}