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
    id: 'bet9ja-deposit',
    label: 'bet9ja.com/deposit?code=AB99X',
    query: 'bet9ja.com/deposit?code=AB99X',
    hint: 'Cashier & booking code',
  },
  {
    id: 'stake-crypto',
    label: 'stake.com',
    query: 'stake.com',
    hint: 'Crypto & crash casino',
  },
  {
    id: 'popads-tracker',
    label: 'popads.net',
    query: 'popads.net',
    hint: 'Betting popunder ad',
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
  customBlockedDomains: new Set<string>(),
  allowlistedDomains: new Set<string>(),
  customBlockedPackages: new Set<string>(),
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
      reason: 'Enter any betting domain, prefix, booking link, or recovery site to inspect the on-device verdict.',
      latencyLabel: '<1 ms',
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
  const isSafeSupport =
    (normalizedHost.length > 0 && GamblingRegistry.safeDomains.has(normalizedHost)) ||
    trimmed.toLowerCase().includes('gamcare') ||
    trimmed.toLowerCase().includes('gambleaware') ||
    trimmed.toLowerCase().includes('recovery') ||
    trimmed.toLowerCase().includes('help');

  return {
    status: 'ALLOWED',
    query: trimmed,
    matchedTarget: normalizedHost || trimmed,
    categoryLabel: isSafeSupport ? 'Protected Recovery Resource' : 'Clean Traffic',
    detectionLayer: isSafeSupport ? 'Safe-Support Guard' : 'On-Device Filter Pass',
    reason: isSafeSupport
      ? 'Explicitly allowlisted so recovery, therapy, and helpline portals are never blocked.'
      : 'No gambling operator, mirror domain, or betting ad tracker matched.',
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
