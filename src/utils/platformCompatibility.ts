export type ClientPlatform = 'ios' | 'android' | 'desktop';
export type AppViewMode = 'landing' | 'app';

export const ANDROID_APK_DOWNLOAD_URL =
  'https://github.com/sidihost/GambleAware-BetBlock/releases/latest/download/GambleAware-Nigeria.apk';

export function detectClientPlatform(
  userAgent: string,
  maxTouchPoints = 0,
): ClientPlatform {
  const ua = (userAgent || '').toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios';
  }
  // iPadOS Safari reports Macintosh in UA with multi-touch points
  if (ua.includes('macintosh') && maxTouchPoints > 1) {
    return 'ios';
  }
  if (ua.includes('android')) {
    return 'android';
  }
  return 'desktop';
}

export function resolveInitialViewMode(params: {
  isStandalone: boolean;
  search: string;
  hash: string;
}): AppViewMode {
  if (params.isStandalone) return 'app';
  const normalizedHash = (params.hash || '').trim().toLowerCase();
  if (normalizedHash === '#app' || normalizedHash === '#shield') return 'app';
  const searchParams = new URLSearchParams(params.search || '');
  const appParam = searchParams.get('app') ?? searchParams.get('mode');
  if (appParam === '1' || appParam === 'true' || appParam === 'app') {
    return 'app';
  }
  return 'landing';
}

export function shouldPromoteWebApp(
  platform: ClientPlatform,
  isStandalone: boolean,
): boolean {
  return platform === 'ios' || isStandalone;
}

export function getDefaultInstallGuideTarget(platform: ClientPlatform): 'android' | 'ios' {
  return platform === 'ios' ? 'ios' : 'android';
}

export function getOrderedPlatformCards(
  platform: ClientPlatform,
): readonly ['android' | 'ios', 'android' | 'ios'] {
  return platform === 'ios' ? ['ios', 'android'] : ['android', 'ios'];
}

export const TOP_BETTING_DOMAINS_FOR_IOS: readonly string[] = [
  'sportybet.com',
  'sportybet.ng',
  'bet9ja.com',
  'betking.com',
  '1xbet.com',
  '1xbet.ng',
  'msport.com',
  'bangbet.com',
  'betpawa.com',
  '22bet.com',
  'melbet.com',
  'paripesa.com',
  'nairabet.com',
  'merrybet.com',
  'bet365.com',
  'betway.com',
  'stake.com',
  'draftkings.com',
  'fanduel.com',
  'pokerstars.com',
  'roobet.com',
  'rollbit.com',
];

export function formatIosBlocklistText(
  domains: readonly string[] = TOP_BETTING_DOMAINS_FOR_IOS,
): string {
  return domains.join('\n');
}
