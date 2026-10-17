export const VIDEO_ERRORS = {
  adsDisabledBasicLaunch: 'Advertising is unavailable during CrazyGames Basic Launch.',
  unfilled: 'No advertisement is available right now. Please try later.',
  adblock: 'An ad blocker prevents this optional offer. All game modes remain available.',
  adCooldown: 'Advertisements are cooling down. Please try later.',
  other: 'The advertisement could not be shown. You can keep playing normally.',
};
export const BANNER_ERRORS = new Set(['bannersDisabledBasicLaunch', 'unfilled', 'missingId', 'notVisible', 'noAvailableSizes', 'notCreated', 'videoAdPlaying', 'invalidSize', 'bannerCooldown', 'maxRefreshReached', 'bannersDisabledMobileApp', 'other']);
export function videoError(error) {
  const code = typeof error === 'string' ? error : error?.code;
  return { status: 'error', code: VIDEO_ERRORS[code] ? code : 'other', message: VIDEO_ERRORS[code] || VIDEO_ERRORS.other };
}