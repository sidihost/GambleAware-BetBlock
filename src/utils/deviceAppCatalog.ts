import { GamblingRegistry } from '../blocker/gamblingRegistry';
import { InstalledAppInfo } from '../data/types';

export type DeviceAppCategory =
  | 'Betting & Trading Apps'
  | 'Banking & Wallets'
  | 'Browsers'
  | 'Social & In-App Links';

export interface CategorizedDeviceApp extends InstalledAppInfo {
  category: DeviceAppCategory;
  riskNote: string;
}

export interface BankFreezeGuide {
  id: string;
  bankName: string;
  region: 'Nigeria' | 'Global / UK / US';
  featureName: string;
  summary: string;
  steps: string;
}

export const BANK_FREEZE_GUIDES: BankFreezeGuide[] = [
  {
    id: 'opay',
    bankName: 'OPay',
    region: 'Nigeria',
    featureName: 'SafeBox Vault & Transfer Cap',
    summary: 'Lock surplus funds out of instant betting transfers and lower daily spend limit.',
    steps: 'Finance → SafeBox (Lock) · Settings → Transfer Limits',
  },
  {
    id: 'kuda',
    bankName: 'Kuda Bank',
    region: 'Nigeria',
    featureName: 'Fixed Savings & Card Controls',
    summary: 'Disable web/card gambling payments and move cash into Fixed Savings.',
    steps: 'Cards → Manage Channels · Save → Fixed Savings',
  },
  {
    id: 'palmpay',
    bankName: 'PalmPay',
    region: 'Nigeria',
    featureName: 'CashBox Lock & Betting Cap',
    summary: 'Restrict instant wallet top-ups to betting merchants during high-risk hours.',
    steps: 'Wealth → CashBox Lock · Security → Payment Limits',
  },
  {
    id: 'moniepoint',
    bankName: 'Moniepoint',
    region: 'Nigeria',
    featureName: 'Merchant Channel Freeze',
    summary: 'Set strict daily transfer thresholds and disable online card betting checkout.',
    steps: 'Cards → Channel Controls · Settings → Transfer Limit',
  },
  {
    id: 'gtworld',
    bankName: 'GTWorld (GTBank)',
    region: 'Nigeria',
    featureName: 'GTCard Web Lock',
    summary: 'Turn off online/international card payments to stop instant sportsbook funding.',
    steps: 'Cards → Card Controls → Disable Web Payments',
  },
  {
    id: 'accessmore',
    bankName: 'AccessMore',
    region: 'Nigeria',
    featureName: 'Daily Limit & Card Switch',
    summary: 'Lower daily transfer cap and freeze virtual cards used for sportsbook deposits.',
    steps: 'Manage Cards → Channel Switch · Limits → Reduce Daily Cap',
  },
  {
    id: 'zenith',
    bankName: 'Zenith Bank Mobile',
    region: 'Nigeria',
    featureName: 'Card Freeze & Transfer PIN Cap',
    summary: 'Temporarily freeze Naira debit card online usage before matchdays.',
    steps: 'Cards → Freeze Web Transactions · Settings → Daily Limit',
  },
  {
    id: 'monzo',
    bankName: 'Monzo',
    region: 'Global / UK / US',
    featureName: 'Gambling Block (MCC 7995)',
    summary: 'Enforces a 48-hour cooling-off lock on all gambling merchant transactions.',
    steps: 'Manage → Gambling Block → Turn On (48h cooldown)',
  },
  {
    id: 'revolut',
    bankName: 'Revolut',
    region: 'Global / UK / US',
    featureName: 'Gambling Block + Pocket Vault',
    summary: 'Blocks betting cards & merchant transfers with mandatory 48-hour unlock delay.',
    steps: 'Profile → Security → Gambling Block → Enable',
  },
  {
    id: 'starling',
    bankName: 'Starling Bank',
    region: 'Global / UK / US',
    featureName: 'Card Gambling Lock',
    summary: 'Instant card-level block across online and retail bookmakers.',
    steps: 'Card → Card Controls → Gambling Block',
  },
  {
    id: 'chase',
    bankName: 'Chase',
    region: 'Global / UK / US',
    featureName: 'Gambling Merchant Block',
    summary: 'Prevents debit card funding to sportsbooks and casino wallets.',
    steps: 'Manage Card → Spending Controls → Gambling Block',
  },
];

export const DEVICE_APP_CATALOG: CategorizedDeviceApp[] = [
  // Betting & Trading Apps
  {
    packageName: 'com.sportybet.android',
    label: 'SportyBet',
    category: 'Betting & Trading Apps',
    riskNote: 'Sportsbook & instant virtuals',
  },
  {
    packageName: 'com.bet9ja.android',
    label: 'Bet9ja',
    category: 'Betting & Trading Apps',
    riskNote: 'Sportsbook & virtual leagues',
  },
  {
    packageName: 'ng.bet9ja.app',
    label: 'Bet9ja Mobile',
    category: 'Betting & Trading Apps',
    riskNote: 'Mobile sportsbook client',
  },
  {
    packageName: 'com.betking.android',
    label: 'BetKing',
    category: 'Betting & Trading Apps',
    riskNote: 'Sportsbook & virtual betting',
  },
  {
    packageName: 'org.xbet.client',
    label: '1xBet',
    category: 'Betting & Trading Apps',
    riskNote: 'Live odds & online casino',
  },
  {
    packageName: 'com.msport.android',
    label: 'MSport',
    category: 'Betting & Trading Apps',
    riskNote: 'Sportsbook & Super6',
  },
  {
    packageName: 'com.betway.android',
    label: 'Betway',
    category: 'Betting & Trading Apps',
    riskNote: 'Sportsbook & casino games',
  },
  {
    packageName: 'com.betpawa.android',
    label: 'betPawa',
    category: 'Betting & Trading Apps',
    riskNote: 'Mobile accumulator sportsbook',
  },
  {
    packageName: 'com.bangbet.android',
    label: 'BangBet',
    category: 'Betting & Trading Apps',
    riskNote: 'Sportsbook & crash games',
  },
  {
    packageName: 'com.paripesa.android',
    label: 'Paripesa',
    category: 'Betting & Trading Apps',
    riskNote: 'Sportsbook & slots',
  },
  {
    packageName: 'com.twentytwobet.android',
    label: '22Bet',
    category: 'Betting & Trading Apps',
    riskNote: 'Global sportsbook & casino',
  },
  {
    packageName: 'com.stake.android',
    label: 'Stake',
    category: 'Betting & Trading Apps',
    riskNote: 'Crypto casino & sportsbook',
  },
  {
    packageName: 'com.bet365.sport',
    label: 'bet365',
    category: 'Betting & Trading Apps',
    riskNote: 'Sportsbook & live in-play',
  },
  {
    packageName: 'com.draftkings.sportsbook',
    label: 'DraftKings',
    category: 'Betting & Trading Apps',
    riskNote: 'Sportsbook & daily fantasy',
  },
  {
    packageName: 'com.fanduel.sportsbook',
    label: 'FanDuel',
    category: 'Betting & Trading Apps',
    riskNote: 'Sportsbook & casino',
  },

  // Banking & Wallet Apps (Deposit & Spend Guard Tracking)
  {
    packageName: 'team.opay.pay',
    label: 'OPay',
    category: 'Banking & Wallets',
    riskNote: 'Deposit guard & SafeBox vault alert',
  },
  {
    packageName: 'com.transsnet.palmpay',
    label: 'PalmPay',
    category: 'Banking & Wallets',
    riskNote: 'Wallet top-up guard & CashBox lock',
  },
  {
    packageName: 'com.kudabank.app',
    label: 'Kuda Bank',
    category: 'Banking & Wallets',
    riskNote: 'Card payment switch & Fixed Savings',
  },
  {
    packageName: 'com.moniepoint.personal',
    label: 'Moniepoint',
    category: 'Banking & Wallets',
    riskNote: 'Transfer cap & merchant guard',
  },
  {
    packageName: 'com.gtbank.gtworldv1',
    label: 'GTWorld',
    category: 'Banking & Wallets',
    riskNote: 'GTCard web checkout lock',
  },
  {
    packageName: 'com.accessbank.nextgen',
    label: 'AccessMore',
    category: 'Banking & Wallets',
    riskNote: 'Virtual card freeze & daily limit',
  },
  {
    packageName: 'com.zenithbank.eazymoney',
    label: 'Zenith Bank',
    category: 'Banking & Wallets',
    riskNote: 'Online card spend freeze',
  },
  {
    packageName: 'com.uba.vericash',
    label: 'UBA Mobile',
    category: 'Banking & Wallets',
    riskNote: 'Debit card channel control',
  },
  {
    packageName: 'com.firstbank.firstmobile',
    label: 'FirstMobile',
    category: 'Banking & Wallets',
    riskNote: 'Transfer limit & card lock',
  },
  {
    packageName: 'co.uk.getmondo',
    label: 'Monzo',
    category: 'Banking & Wallets',
    riskNote: 'MCC 7995 Gambling Block (48h cooldown)',
  },
  {
    packageName: 'com.starlingbank.android',
    label: 'Starling Bank',
    category: 'Banking & Wallets',
    riskNote: 'Card-level gambling block',
  },
  {
    packageName: 'com.revolut.revolut',
    label: 'Revolut',
    category: 'Banking & Wallets',
    riskNote: 'Gambling block & locked pocket vault',
  },
  {
    packageName: 'com.chase.sig.android',
    label: 'Chase',
    category: 'Banking & Wallets',
    riskNote: 'Gambling merchant transaction freeze',
  },

  // Browsers
  {
    packageName: 'com.android.chrome',
    label: 'Google Chrome',
    category: 'Browsers',
    riskNote: 'Monitors & filters web browsing + custom tabs',
  },
  {
    packageName: 'com.opera.mini.native',
    label: 'Opera Mini',
    category: 'Browsers',
    riskNote: 'Closes data-compression proxy bypasses',
  },
  {
    packageName: 'com.opera.browser',
    label: 'Opera Browser',
    category: 'Browsers',
    riskNote: 'Stops built-in browser VPN bypasses',
  },
  {
    packageName: 'com.brave.browser',
    label: 'Brave Browser',
    category: 'Browsers',
    riskNote: 'Filters secondary privacy browser sessions',
  },
  {
    packageName: 'org.mozilla.firefox',
    label: 'Firefox',
    category: 'Browsers',
    riskNote: 'Enforces on-device DNS rules inside Firefox',
  },
  {
    packageName: 'com.sec.android.app.sbrowser',
    label: 'Samsung Internet',
    category: 'Browsers',
    riskNote: 'Blocks incognito & secret tabs',
  },
  {
    packageName: 'com.microsoft.emmx',
    label: 'Microsoft Edge',
    category: 'Browsers',
    riskNote: 'Secondary mobile browser guard',
  },

  // Social & In-App Browsers
  {
    packageName: 'org.telegram.messenger',
    label: 'Telegram',
    category: 'Social & In-App Links',
    riskNote: 'Channel guard for tipping bots & booking codes',
  },
  {
    packageName: 'com.twitter.android',
    label: 'X (Twitter)',
    category: 'Social & In-App Links',
    riskNote: 'Stops matchday bet-slip promo threads',
  },
  {
    packageName: 'com.instagram.android',
    label: 'Instagram',
    category: 'Social & In-App Links',
    riskNote: 'Intercepts bio-link & story casino promos',
  },
  {
    packageName: 'com.zhiliaoapp.musically',
    label: 'TikTok',
    category: 'Social & In-App Links',
    riskNote: 'Blocks Aviator & crash-game promo links',
  },
  {
    packageName: 'com.whatsapp',
    label: 'WhatsApp',
    category: 'Social & In-App Links',
    riskNote: 'Guards shared group booking-code links',
  },
  {
    packageName: 'com.reddit.frontpage',
    label: 'Reddit',
    category: 'Social & In-App Links',
    riskNote: 'Intercepts sportsbook bonus & crypto casino links',
  },
];

const PACKAGE_META_MAP = new Map<string, CategorizedDeviceApp>(
  DEVICE_APP_CATALOG.map((item) => [item.packageName.toLowerCase(), item]),
);

const KNOWN_BRAND_FALLBACKS: Record<string, string> = {
  sportybet: 'SportyBet App',
  bet9ja: 'Bet9ja App',
  betking: 'BetKing App',
  xbet: '1xBet App',
  '1xbet': '1xBet App',
  msport: 'MSport App',
  betway: 'Betway App',
  betpawa: 'betPawa App',
  bangbet: 'BangBet App',
  paripesa: 'Paripesa App',
  parimatch: 'Parimatch App',
  betwinner: 'BetWinner App',
  melbet: 'Melbet App',
  merrybet: 'Merrybet App',
  nairabet: 'Nairabet App',
  stake: 'Stake App',
  bet365: 'bet365 App',
  roobet: 'Roobet App',
  rollbit: 'Rollbit App',
  draftkings: 'DraftKings App',
  fanduel: 'FanDuel App',
  opay: 'OPay',
  palmpay: 'PalmPay',
  kudabank: 'Kuda Bank',
  moniepoint: 'Moniepoint',
  gtworld: 'GTWorld',
  accessbank: 'AccessMore',
  zenithbank: 'Zenith Bank',
  sbrowser: 'Samsung Internet',
};

export function looksLikeAndroidPackageId(value: string): boolean {
  const cleaned = (value || '').trim().toLowerCase();
  if (!cleaned || /\s/.test(cleaned) || !cleaned.includes('.')) return false;
  if (/^https?:\/\//i.test(cleaned)) return false;

  if (PACKAGE_META_MAP.has(cleaned)) return true;
  if (GamblingRegistry.knownGamblingAppPackages.has(cleaned)) return true;

  const segments = cleaned.split('.');
  if (segments.length < 3) return false;

  const first = segments[0];
  const last = segments[segments.length - 1];
  const commonAppSuffix =
    last === 'app' ||
    last === 'android' ||
    last === 'client' ||
    last === 'mobile' ||
    last === 'native' ||
    last === 'browser' ||
    last === 'messenger';
  const commonJavaPrefix =
    first === 'com' || first === 'org' || first === 'ng' || first === 'io' || first === 'co' || first === 'team';

  return commonJavaPrefix && (commonAppSuffix || segments.length >= 3);
}

export function resolveDeviceAppMeta(
  packageName: string,
  fallbackLabel?: string,
): { label: string; category: DeviceAppCategory; riskNote: string } {
  const key = (packageName || '').trim().toLowerCase();
  const catalogHit = PACKAGE_META_MAP.get(key);
  if (catalogHit) {
    return {
      label: catalogHit.label,
      category: catalogHit.category,
      riskNote: catalogHit.riskNote,
    };
  }

  const label = resolveFriendlyAppName(fallbackLabel || packageName);
  return {
    label,
    category: 'Betting & Trading Apps',
    riskNote: 'Custom blocked app rule',
  };
}

export function resolveFriendlyAppName(targetOrPkg: string): string {
  const trimmed = (targetOrPkg || '').trim();
  if (!trimmed) return 'Unknown App';

  const lower = trimmed.toLowerCase();
  const catalogHit = PACKAGE_META_MAP.get(lower);
  if (catalogHit) return catalogHit.label;

  if (!looksLikeAndroidPackageId(lower)) {
    return trimmed;
  }

  const parts = lower.split('.').filter(Boolean);
  for (const part of parts) {
    const known = KNOWN_BRAND_FALLBACKS[part];
    if (known) return known;
  }

  const genericTokens = new Set(['com', 'org', 'net', 'ng', 'io', 'co', 'uk', 'app', 'android', 'client', 'mobile', 'main']);
  const meaningful = parts.find((p) => !genericTokens.has(p)) ?? parts[1] ?? parts[0];
  return `${meaningful.charAt(0).toUpperCase()}${meaningful.slice(1)} App`;
}
