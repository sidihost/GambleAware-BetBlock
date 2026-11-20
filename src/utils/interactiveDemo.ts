import { BlockFilterConfig, BlocklistMatcher } from '../blocker/blocklistMatcher';
import {
  BETTING_BRAND_CATALOG,
  BettingBrandMeta,
  ResolvedBrandIdentity,
  resolveBettingBrand,
} from '../blocker/brandCatalog';
import { GAMBLING_CATEGORY_META, GamblingCategory } from '../blocker/gamblingCategory';
import { GamblingRegistry } from '../blocker/gamblingRegistry';
import { analyzePromoAndExpectedLoss, PromoNeutralizationReport } from './tiltRadar';

export type SandboxVerdictStatus = 'IDLE' | 'BLOCKED' | 'ALLOWED';

export interface SandboxPreset {
  id: string;
  label: string;
  query: string;
  hint: string;
}

export const SANDBOX_PRESETS: readonly SandboxPreset[] = [
  {
    id: 'sporty-prefix',
    label: 'sporty',
    query: 'sporty',
    hint: 'Keystroke prefix block',
  },
  {
    id: 'playstore-sportybet',
    label: 'Play Store: SportyBet',
    query: 'playstore: SportyBet',
    hint: 'Play Store download guard',
  },
  {
    id: 'bet9ja-deposit',
    label: 'bet9ja.com/deposit?code=AB99X',
    query: 'bet9ja.com/deposit?code=AB99X',
    hint: 'Cashier & booking code',
  },
  {
    id: 'popads-tracker',
    label: 'popads.net',
    query: 'popads.net',
    hint: 'Betting popunder ad',
  },
  {
    id: 'vpn-proton',
    label: 'protonvpn.com (Allowed)',
    query: 'protonvpn.com',
    hint: 'VPN coexistence pass',
  },
  {
    id: 'gamcare-safe',
    label: 'gamcare.org.uk',
    query: 'gamcare.org.uk',
    hint: 'Protected helpline',
  },
] as const;

export const DEFAULT_SANDBOX_CONFIG: BlockFilterConfig = {
  blockSportsbooks: true,
  blockCasinos: true,
  blockPokerAndBingo: true,
  blockCryptoBetting: true,
  blockFantasyAndLottery: true,
  strictKeywordFilter: true,
  searchGuardEnabled: true,
  adBlockerEnabled: true,
  playStoreGuardEnabled: true,
  customBlockedDomains: new Set<string>(),
  allowlistedDomains: new Set<string>(),
  customBlockedPackages: new Set<string>(),
  customBlockedAppNames: new Set<string>(),
};

export interface SandboxEvaluation {
  status: SandboxVerdictStatus;
  query: string;
  matchedTarget: string;
  categoryLabel: string;
  detectionLayer: string;
  reason: string;
  latencyLabel: string;
  isSafeSupportAllowlisted: boolean;
  brandIdentity: ResolvedBrandIdentity | null;
  promoReport: PromoNeutralizationReport | null;
}

function classifyDetectionLayer(reason: string): string {
  const lower = reason.toLowerCase();
  if (lower.includes('play store')) return 'Play Store Download Guard';
  if (lower.includes('sideload') || lower.includes('apk')) return 'APK Install Guard';
  if (lower.includes('while typing')) return 'Keystroke Prefix Engine';
  if (lower.includes('redirect')) return 'Redirect Link Unwrapper';
  if (lower.includes('ad') || lower.includes('affiliate') || lower.includes('popunder')) {
    return 'Ad & Popunder Shield';
  }
  if (lower.includes('search')) return 'Search Query Guard';
  if (lower.includes('strict keyword')) return 'Heuristic Keyword Engine';
  if (lower.includes('custom')) return 'Custom Blocklist Rule';
  return 'On-Device Domain Registry';
}

export function evaluateSandboxQuery(
  rawInput: string,
  config: BlockFilterConfig = DEFAULT_SANDBOX_CONFIG,
  assumedStakeNgn: number = 5000,
): SandboxEvaluation {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      status: 'IDLE',
      query: '',
      matchedTarget: '',
      categoryLabel: '',
      detectionLayer: '',
      reason: 'Enter any betting domain, Play Store query (e.g. playstore: SportyBet), VPN app, or recovery helpline to inspect the on-device verdict.',
      latencyLabel: '<1 ms',
      isSafeSupportAllowlisted: false,
      brandIdentity: null,
      promoReport: null,
    };
  }

  const lower = trimmed.toLowerCase();
  const isPlayStoreQuery = lower.startsWith('playstore:') || lower.startsWith('play store:');
  const isApkQuery = lower.startsWith('apk:');

  if (isPlayStoreQuery || isApkQuery) {
    const appQuery = trimmed.slice(trimmed.indexOf(':') + 1).trim();
    const storeMatch = BlocklistMatcher.matchAppStoreOrInstaller(
      isApkQuery,
      isApkQuery ? [] : [appQuery],
      [appQuery, 'Install', isApkQuery ? 'Do you want to install this app?' : 'About this app'],
      config,
    );

    if (storeMatch.isBlocked) {
      const categoryLabel = GAMBLING_CATEGORY_META[storeMatch.category]?.displayName ?? 'Blocked App';
      const detectionLayer = classifyDetectionLayer(storeMatch.reason);
      const brandIdentity = resolveBettingBrand(storeMatch.matchedTarget || appQuery);
      const promoReport = analyzePromoAndExpectedLoss(appQuery, assumedStakeNgn);

      return {
        status: 'BLOCKED',
        query: trimmed,
        matchedTarget: storeMatch.matchedTarget || appQuery,
        categoryLabel,
        detectionLayer,
        reason: storeMatch.reason,
        latencyLabel: '<9 ms',
        isSafeSupportAllowlisted: false,
        brandIdentity,
        promoReport,
      };
    }

    const isVpnApp = appQuery.toLowerCase().includes('vpn') || appQuery.toLowerCase().includes('warp');
    return {
      status: 'ALLOWED',
      query: trimmed,
      matchedTarget: appQuery || trimmed,
      categoryLabel: isVpnApp ? 'Third-Party VPN Allowed' : 'Non-Betting App Allowed',
      detectionLayer: isVpnApp ? 'VPN Coexistence Pass' : 'Play Store Safe Pass',
      reason: isVpnApp
        ? 'Third-party VPN apps download and run freely without affecting GambleAware or weakening your Commitment Lock.'
        : 'Everyday, banking, and non-betting apps download normally from Play Store without interference.',
      latencyLabel: '<4 ms',
      isSafeSupportAllowlisted: false,
      brandIdentity: null,
      promoReport: null,
    };
  }

  const typedResult = BlocklistMatcher.matchTypedBrowserInput(trimmed, config);
  const urlResult = typedResult.isBlocked
    ? typedResult
    : BlocklistMatcher.matchDomainOrUrl(trimmed, config);
  const finalMatch = urlResult.isBlocked
    ? urlResult
    : BlocklistMatcher.matchAdOrTrackerUrl(trimmed, config);

  if (finalMatch.isBlocked) {
    const categoryLabel = GAMBLING_CATEGORY_META[finalMatch.category]?.displayName ?? 'Blocked Rule';
    const detectionLayer = classifyDetectionLayer(finalMatch.reason);
    const brandIdentity = resolveBettingBrand(finalMatch.matchedTarget || trimmed);
    const promoReport = analyzePromoAndExpectedLoss(trimmed, assumedStakeNgn);

    return {
      status: 'BLOCKED',
      query: trimmed,
      matchedTarget: finalMatch.matchedTarget || trimmed,
      categoryLabel,
      detectionLayer,
      reason: finalMatch.reason,
      latencyLabel: detectionLayer === 'Keystroke Prefix Engine' ? '<12 ms' : '<8 ms',
      isSafeSupportAllowlisted: false,
      brandIdentity,
      promoReport,
    };
  }

  const normalizedHost = BlocklistMatcher.normalizeDomain(trimmed);
  const isVpnSafe =
    (normalizedHost.length > 0 && GamblingRegistry.safeVpnDomains.has(normalizedHost)) ||
    lower.includes('protonvpn') ||
    lower.includes('mullvad') ||
    lower.includes('nordvpn');

  if (isVpnSafe) {
    return {
      status: 'ALLOWED',
      query: trimmed,
      matchedTarget: normalizedHost || trimmed,
      categoryLabel: 'Third-Party VPN Coexistence',
      detectionLayer: 'VPN Coexistence Pass',
      reason: 'GambleAware runs without using Android’s VPN slot — ProtonVPN, Mullvad, NordVPN, and WARP work freely without weakening your Commitment Lock.',
      latencyLabel: '<3 ms',
      isSafeSupportAllowlisted: false,
      brandIdentity: null,
      promoReport: null,
    };
  }

  const isSafeSupport =
    (normalizedHost.length > 0 && GamblingRegistry.safeDomains.has(normalizedHost)) ||
    lower.includes('gamcare') ||
    lower.includes('gambleaware') ||
    lower.includes('recovery') ||
    lower.includes('help');

  return {
    status: 'ALLOWED',
    query: trimmed,
    matchedTarget: normalizedHost || trimmed,
    categoryLabel: isSafeSupport ? 'Protected Recovery Resource' : 'Clean Traffic',
    detectionLayer: isSafeSupport ? 'Safe-Support Guard' : 'On-Device Filter Pass',
    reason: isSafeSupport
      ? 'Explicitly allowlisted so recovery, therapy, and helpline portals are never blocked.'
      : 'No gambling operator, mirror domain, or betting ad tracker matched. Everyday apps stay untouched.',
    latencyLabel: '<4 ms',
    isSafeSupportAllowlisted: isSafeSupport,
    brandIdentity: null,
    promoReport: null,
  };
}

export type BrandFilterTab = 'ALL' | GamblingCategory;

export function filterCoveredBrands(
  category: BrandFilterTab,
  searchQuery: string,
): BettingBrandMeta[] {
  const cleanQuery = searchQuery.trim().toLowerCase();
  return BETTING_BRAND_CATALOG.filter((brand) => {
    if (category !== 'ALL' && brand.category !== category) {
      return false;
    }
    if (!cleanQuery) return true;
    return (
      brand.name.toLowerCase().includes(cleanQuery) ||
      brand.primaryDomain.toLowerCase().includes(cleanQuery) ||
      brand.region.toLowerCase().includes(cleanQuery) ||
      brand.aliases.some((alias) => alias.toLowerCase().includes(cleanQuery))
    );
  });
}

export interface RegistryMetrics {
  domainCount: number;
  appCount: number;
  adTrackerCount: number;
  safeDomainCount: number;
  brandCount: number;
}

export function getRegistryMetrics(): RegistryMetrics {
  return {
    domainCount: GamblingRegistry.domainToCategory.size,
    appCount: GamblingRegistry.knownGamblingAppPackages.size,
    adTrackerCount: GamblingRegistry.gamblingAdTrackerDomains.size,
    safeDomainCount: GamblingRegistry.safeDomains.size,
    brandCount: BETTING_BRAND_CATALOG.length,
  };
}
