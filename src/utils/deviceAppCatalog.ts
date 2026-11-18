import { InstalledAppInfo } from '../data/types';

export interface CategorizedDeviceApp extends InstalledAppInfo {
  category: 'Browsers' | 'Social & In-App Links' | 'Betting & Trading Apps';
  riskNote: string;
}

export const DEVICE_APP_CATALOG: CategorizedDeviceApp[] = [
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
    riskNote: 'High-risk channel for tipping bots & booking codes',
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
  // High-Risk Betting & Trading Apps
  {
    packageName: 'com.sportybet.android',
    label: 'SportyBet App',
    category: 'Betting & Trading Apps',
    riskNote: 'Sportsbook app',
  },
  {
    packageName: 'com.bet9ja.android',
    label: 'Bet9ja App',
    category: 'Betting & Trading Apps',
    riskNote: 'Sportsbook & virtuals app',
  },
  {
    packageName: 'com.betking.android',
    label: 'BetKing App',
    category: 'Betting & Trading Apps',
    riskNote: 'Sportsbook app',
  },
  {
    packageName: 'org.xbet.client',
    label: '1xBet App',
    category: 'Betting & Trading Apps',
    riskNote: 'Casino & live odds app',
  },
  {
    packageName: 'com.msport.android',
    label: 'MSport App',
    category: 'Betting & Trading Apps',
    riskNote: 'Sportsbook & Super6 app',
  },
  {
    packageName: 'com.stake.android',
    label: 'Stake App',
    category: 'Betting & Trading Apps',
    riskNote: 'Crypto casino & sportsbook',
  },
  {
    packageName: 'com.bet365.sport',
    label: 'bet365 App',
    category: 'Betting & Trading Apps',
    riskNote: 'Global sportsbook & casino',
  },
];
