// Official v3 SDK only. No feature access until init resolves in a supported environment.
let initialization;
let sdk = null;
let settings = { muteAudio: false, disableChat: false };
const listeners = new Set();
const unavailableMethods = new Set();
export const getCrazyGames = () => sdk;
export const getPlatformSettings = () => settings;
export function subscribePlatformSettings(listener) {
  listeners.add(listener); listener(settings);
  return () => listeners.delete(listener);
}
function updateSettings(value) {
  settings = { muteAudio: value?.muteAudio === true, disableChat: value?.disableChat === true };
  listeners.forEach((listener) => listener(settings));
}
function withDeadline(promise, milliseconds) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('CrazyGames initialization timed out')), milliseconds);
  })]).finally(() => clearTimeout(timer));
}
function waitForScript() {
  if (window.CrazyGames?.SDK) return Promise.resolve(window.CrazyGames.SDK);
  const script = document.getElementById('crazygames-sdk');
  if (!script) return Promise.resolve(null);
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      script.removeEventListener('load', finish); script.removeEventListener('error', finish);
      resolve(window.CrazyGames?.SDK || null);
    };
    const timer = setTimeout(finish, 5000);
    script.addEventListener('load', finish); script.addEventListener('error', finish);
  });
}
export function initializeCrazyGames() {
  if (!initialization) initialization = (async () => {
    try {
      const candidate = await waitForScript();
      if (!candidate) return null;
      await withDeadline(candidate.init(), 15000);
      if (!['local', 'crazygames'].includes(candidate.environment)) return null;
      sdk = candidate;
      try {
        updateSettings(sdk.game.settings);
        sdk.game.addSettingsChangeListener(updateSettings);
        window.addEventListener('pagehide', () => {
          try { sdk.game.removeSettingsChangeListener(updateSettings); } catch { /* page is leaving */ }
        });
        window.addEventListener('pageshow', (event) => {
          if (!event.persisted) return;
          try {
            updateSettings(sdk.game.settings);
            sdk.game.addSettingsChangeListener(updateSettings);
          } catch (error) { console.warn('CrazyGames settings unavailable', error); }
        });
      } catch (error) { console.warn('CrazyGames settings unavailable', error); }
      return sdk;
    } catch (error) {
      console.warn('CrazyGames unavailable; using browser saves', error);
      return null;
    }
  })();
  return initialization;
}
export function callGame(method, ...args) {
  if (!sdk || unavailableMethods.has(method)) return false;
  try {
    const result = sdk.game[method](...args);
    if (result?.catch) result.catch((error) => {
      unavailableMethods.add(method); console.warn(`CrazyGames ${method} unavailable`, error);
    });
    return true;
  } catch (error) {
    unavailableMethods.add(method); console.warn(`CrazyGames ${method} unavailable`, error); return false;
  }
}