import { GAMBLING_CATEGORY_META, GamblingCategory } from './gamblingCategory';
import { GamblingRegistry } from './gamblingRegistry';

export interface BlockFilterConfig {
  blockSportsbooks: boolean;
  blockCasinos: boolean;
  blockPokerAndBingo: boolean;
  blockCryptoBetting: boolean;
  blockFantasyAndLottery: boolean;
  strictKeywordFilter: boolean;
  searchGuardEnabled: boolean;
  customBlockedDomains: Set<string>;
  allowlistedDomains: Set<string>;
  customBlockedPackages: Set<string>;
}

export interface BlockMatchResult {
  isBlocked: boolean;
  matchedTarget: string;
  category: GamblingCategory;
  reason: string;
}

const DOMAIN_TOKEN_REGEX = /(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,10}(?:\/[^\s]*)?/;
const RECOVERY_TERMS = [
  'addiction', 'help', 'quit', 'stop gambling', 'recovery', 'support',
  'hotline', 'therapy', 'counseling', 'gamcare', 'begambleaware',
  'gamblers anonymous', 'self exclusion', 'gamstop', 'gamban', 'gambleaware',
];
const SEARCH_QUERY_PARAM_REGEX = /[?&](?:q|p|query|text)=([^&#]+)/;

function isCategoryEnabled(category: GamblingCategory, config: BlockFilterConfig): boolean {
  switch (category) {
    case GamblingCategory.SPORTSBOOK:
      return config.blockSportsbooks;
    case GamblingCategory.CASINO:
      return config.blockCasinos;
    case GamblingCategory.POKER_BINGO:
      return config.blockPokerAndBingo;
    case GamblingCategory.CRYPTO_BETTING:
      return config.blockCryptoBetting;
    case GamblingCategory.FANTASY_LOTTERY:
      return config.blockFantasyAndLottery;
    case GamblingCategory.CUSTOM:
      return true;
  }
}

function matchesDomainHierarchy(host: string, domainSet: Set<string>): string | null {
  if (domainSet.size === 0) return null;
  let candidate = host;
  while (candidate.length > 0) {
    if (domainSet.has(candidate)) return candidate;
    const dotIdx = candidate.indexOf('.');
    candidate = dotIdx >= 0 && dotIdx < candidate.length - 1 ? candidate.substring(dotIdx + 1) : '';
  }
  return null;
}

export const BlocklistMatcher = {
  normalizeDomain(rawInput: string): string {
    let s = rawInput.trim().toLowerCase();
    if (!s) return '';
    const schemeIndex = s.indexOf('://');
    if (schemeIndex >= 0) s = s.substring(schemeIndex + 3);
    const slashIndex = s.indexOf('/');
    if (slashIndex >= 0) s = s.substring(0, slashIndex);
    const queryIndex = s.indexOf('?');
    if (queryIndex >= 0) s = s.substring(0, queryIndex);
    const hashIndex = s.indexOf('#');
    if (hashIndex >= 0) s = s.substring(0, hashIndex);
    const atIndex = s.lastIndexOf('@');
    if (atIndex >= 0) s = s.substring(atIndex + 1);
    const colonIndex = s.indexOf(':');
    if (colonIndex >= 0) s = s.substring(0, colonIndex);
    while (s.endsWith('.')) s = s.slice(0, -1);
    if (s.startsWith('www.')) s = s.slice(4);
    return s;
  },

  matchSearchQueryInUrl(rawUrl: string): BlockMatchResult {
    const lower = rawUrl.toLowerCase();
    const isSearchEngineUrl =
      lower.includes('/search') ||
      lower.includes('google.') ||
      lower.includes('bing.com') ||
      lower.includes('duckduckgo.com') ||
      lower.includes('yahoo.com');
    if (!isSearchEngineUrl) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }

    const match = SEARCH_QUERY_PARAM_REGEX.exec(lower);
    if (!match) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }

    let decoded: string;
    try {
      decoded = decodeURIComponent(match[1].replace(/\+/g, ' ')).toLowerCase();
    } catch {
      decoded = match[1].replace(/\+/g, ' ');
    }

    if (RECOVERY_TERMS.some((term) => decoded.includes(term))) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }

    for (const brand of GamblingRegistry.gamblingBrandTokens) {
      if (decoded.includes(brand)) {
        return {
          isBlocked: true,
          matchedTarget: brand,
          category: GamblingCategory.SPORTSBOOK,
          reason: 'Blocked gambling search query',
        };
      }
    }

    return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
  },

  matchDomainOrUrl(rawDomainOrUrl: string, config: BlockFilterConfig): BlockMatchResult {
    if (config.searchGuardEnabled) {
      const searchMatch = this.matchSearchQueryInUrl(rawDomainOrUrl);
      if (searchMatch.isBlocked) return searchMatch;
    }

    const host = this.normalizeDomain(rawDomainOrUrl);
    if (!host || !host.includes('.')) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }

    if (matchesDomainHierarchy(host, GamblingRegistry.safeDomains) !== null) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }
    if (matchesDomainHierarchy(host, config.allowlistedDomains) !== null) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }

    const customMatch = matchesDomainHierarchy(host, config.customBlockedDomains);
    if (customMatch !== null) {
      return {
        isBlocked: true,
        matchedTarget: customMatch,
        category: GamblingCategory.CUSTOM,
        reason: 'Matched custom blocked domain',
      };
    }

    let candidate = host;
    while (candidate.length > 0) {
      const category = GamblingRegistry.domainToCategory.get(candidate);
      if (category !== undefined) {
        if (isCategoryEnabled(category, config)) {
          return {
            isBlocked: true,
            matchedTarget: candidate,
            category,
            reason: `Matched ${GAMBLING_CATEGORY_META[category].displayName} registry`,
          };
        }
        return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
      }
      const dotIdx = candidate.indexOf('.');
      candidate = dotIdx >= 0 && dotIdx < candidate.length - 1 ? candidate.substring(dotIdx + 1) : '';
    }

    if (config.strictKeywordFilter) {
      for (const keyword of GamblingRegistry.strictHostKeywords) {
        if (host.includes(keyword)) {
          return {
            isBlocked: true,
            matchedTarget: host,
            category: GamblingCategory.CASINO,
            reason: `Matched strict keyword "${keyword}"`,
          };
        }
      }
    }

    return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
  },

  matchBrowserAddressText(addressText: string, config: BlockFilterConfig): BlockMatchResult {
    const trimmed = addressText.trim();
    if (trimmed.length < 4) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }

    if (!trimmed.includes(' ')) {
      const direct = this.matchDomainOrUrl(trimmed, config);
      if (direct.isBlocked) return direct;
    }

    const tokenMatch = DOMAIN_TOKEN_REGEX.exec(trimmed.toLowerCase());
    if (tokenMatch) {
      const domainResult = this.matchDomainOrUrl(tokenMatch[0], config);
      if (domainResult.isBlocked) return domainResult;
    }

    return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
  },

  matchAppPackage(packageName: string, config: BlockFilterConfig, appLabel?: string): BlockMatchResult {
    const pkg = packageName.trim().toLowerCase();
    if (!pkg) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }

    if (config.customBlockedPackages.has(pkg)) {
      return {
        isBlocked: true,
        matchedTarget: appLabel ?? pkg,
        category: GamblingCategory.CUSTOM,
        reason: 'Blocked custom app',
      };
    }

    if (GamblingRegistry.knownGamblingAppPackages.has(pkg)) {
      return {
        isBlocked: true,
        matchedTarget: appLabel ?? pkg,
        category: GamblingCategory.SPORTSBOOK,
        reason: 'Matched known betting app',
      };
    }

    if (
      pkg.startsWith('com.android.') ||
      pkg.startsWith('com.google.android.') ||
      pkg.startsWith('org.mozilla.') ||
      pkg.startsWith('com.sec.android.') ||
      pkg.startsWith('com.microsoft.') ||
      pkg.startsWith('com.brave.') ||
      pkg.startsWith('com.opera.')
    ) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }

    for (const keyword of GamblingRegistry.gamblingPackageKeywords) {
      if (pkg.includes(keyword)) {
        return {
          isBlocked: true,
          matchedTarget: appLabel ?? pkg,
          category: GamblingCategory.SPORTSBOOK,
          reason: `Matched betting app signature "${keyword}"`,
        };
      }
    }

    const normalizedLabel = appLabel?.trim().toLowerCase() ?? '';
    if (normalizedLabel) {
      for (const brand of GamblingRegistry.gamblingBrandTokens) {
        if (normalizedLabel.includes(brand)) {
          return {
            isBlocked: true,
            matchedTarget: appLabel ?? pkg,
            category: GamblingCategory.SPORTSBOOK,
            reason: `Matched betting app name "${brand}"`,
          };
        }
      }
    }

    return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
  },
};
