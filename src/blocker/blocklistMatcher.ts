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
  adBlockerEnabled?: boolean;
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

const INTERNAL_SCHEME_PREFIXES = [
  'chrome://', 'chrome-native://', 'about:', 'edge://', 'brave://',
  'opera://', 'vivaldi://', 'duckduckgo://', 'firefox://',
  'file://', 'content://', 'data:', 'blob:', 'javascript:',
];

const AMBIGUOUS_BRAND_STEMS = new Set([
  'stake', 'blaze', 'shuffle', 'wild', 'flush', 'chips', 'howl', 'boom', 'rush',
  'coral', 'chance', 'fortuna', 'mirax', 'leon', 'pulsz', 'dabble', 'sleeper',
  'draft', 'lottery', 'lotto', 'bingo', 'casino', 'poker', 'slots', 'jackpot',
  'winner', 'golden', 'lucky', 'action', 'covers', 'mirror', 'super', 'magic',
  'royal', 'ruby', 'party', 'global', 'high5', 'trust', 'prime', 'crash', 'points',
  'vegas', 'spin', 'play', 'bet', 'sport', 'sports', 'games', 'match', 'score',
  'spread', 'circus', 'virgin', 'midnite', 'monopoly', 'galas', 'heart', 'foxy',
  'glossy', 'rosy', 'dotty', 'wink', 'pub', 'tab', 'hardrock', 'fanatics',
]);

const INSTANT_BRAND_PREFIXES: Array<[string, GamblingCategory, number]> = [
  ['1xbet', GamblingCategory.SPORTSBOOK, 4],
  ['1xbit', GamblingCategory.SPORTSBOOK, 4],
  ['22bet', GamblingCategory.SPORTSBOOK, 4],
  ['bet9ja', GamblingCategory.SPORTSBOOK, 5],
  ['betking', GamblingCategory.SPORTSBOOK, 5],
  ['msport', GamblingCategory.SPORTSBOOK, 5],
  ['betpawa', GamblingCategory.SPORTSBOOK, 5],
  ['bangbet', GamblingCategory.SPORTSBOOK, 5],
  ['paripesa', GamblingCategory.SPORTSBOOK, 5],
  ['melbet', GamblingCategory.SPORTSBOOK, 5],
  ['nairabet', GamblingCategory.SPORTSBOOK, 5],
  ['betwinner', GamblingCategory.SPORTSBOOK, 5],
  ['mozzartbet', GamblingCategory.SPORTSBOOK, 5],
  ['babaijebu', GamblingCategory.FANTASY_LOTTERY, 5],
  ['sportybet', GamblingCategory.SPORTSBOOK, 6],
  ['merrybet', GamblingCategory.SPORTSBOOK, 6],
  ['accessbet', GamblingCategory.SPORTSBOOK, 6],
  ['surebet247', GamblingCategory.SPORTSBOOK, 6],
  ['betbonanza', GamblingCategory.SPORTSBOOK, 6],
  ['winnersgoldenbet', GamblingCategory.SPORTSBOOK, 6],
  ['hollywoodbets', GamblingCategory.SPORTSBOOK, 6],
  ['williamhill', GamblingCategory.SPORTSBOOK, 6],
  ['paddypower', GamblingCategory.SPORTSBOOK, 6],
  ['ladbrokes', GamblingCategory.SPORTSBOOK, 6],
  ['premierbet', GamblingCategory.SPORTSBOOK, 6],
  ['sportpesa', GamblingCategory.SPORTSBOOK, 6],
  ['draftkings', GamblingCategory.SPORTSBOOK, 6],
  ['pokerstars', GamblingCategory.POKER_BINGO, 6],
  ['partypoker', GamblingCategory.POKER_BINGO, 6],
  ['prizepicks', GamblingCategory.FANTASY_LOTTERY, 6],
  ['underdogfantasy', GamblingCategory.FANTASY_LOTTERY, 6],
  ['parlayplay', GamblingCategory.FANTASY_LOTTERY, 6],
  ['lottoland', GamblingCategory.FANTASY_LOTTERY, 6],
  ['chumbacasino', GamblingCategory.CASINO, 6],
  ['luckylandslots', GamblingCategory.CASINO, 6],
  ['jackpotcitycasino', GamblingCategory.CASINO, 6],
];

const TYPED_BETTING_INTENT_PHRASES = [
  'stake casino', 'stake bet', 'stake login',
  'online casino', 'live casino', 'crypto casino',
  'place bet', 'betting site', 'betting odds',
  'sports betting', 'sportsbook', 'aviator game',
];

const TYPED_AD_TRACKER_TERMS = [
  'popads', 'popcash', 'adsterra', 'propellerads', 'exoclick',
  '1xpartners', '1xbetpartners', 'bet365affiliates', 'betting ad', 'casino ad', 'gambling popunder',
];

let cachedUnambiguousTypedStems: Array<[string, GamblingCategory]> | null = null;

function getUnambiguousTypedStems(): Array<[string, GamblingCategory]> {
  if (cachedUnambiguousTypedStems) return cachedUnambiguousTypedStems;
  const map = new Map<string, GamblingCategory>();
  const safeList = Array.from(GamblingRegistry.safeDomains);

  for (const [domain, category] of GamblingRegistry.domainToCategory.entries()) {
    const stem = domain.split('.')[0];
    if (
      stem.length >= 5 &&
      !AMBIGUOUS_BRAND_STEMS.has(stem) &&
      !safeList.some((s) => s.includes(stem)) &&
      !map.has(stem)
    ) {
      map.set(stem, category);
    }
  }
  for (const brand of GamblingRegistry.gamblingBrandTokens) {
    if (
      brand.includes(' ') &&
      brand.length >= 6 &&
      !safeList.some((s) => s.includes(brand)) &&
      !map.has(brand)
    ) {
      map.set(brand, GamblingCategory.SPORTSBOOK);
    }
  }
  cachedUnambiguousTypedStems = Array.from(map.entries()).sort((a, b) => b[0].length - a[0].length);
  return cachedUnambiguousTypedStems;
}

function containsWholeTokenOrDirectStem(lower: string, strippedUrl: string, stem: string): boolean {
  if (strippedUrl === stem || strippedUrl.startsWith(`${stem}.`)) return true;
  const idx = lower.indexOf(stem);
  if (idx < 0) return false;
  const beforeOk = idx === 0 || !/[a-z0-9]/.test(lower[idx - 1]);
  const endIdx = idx + stem.length;
  const afterOk = endIdx === lower.length || !/[a-z0-9]/.test(lower[endIdx]);
  return beforeOk && afterOk;
}

function stripProtocolAndWww(lower: string): string {
  let s = lower;
  if (s.startsWith('https://')) s = s.slice(8);
  else if (s.startsWith('http://')) s = s.slice(7);
  if (s.startsWith('www.')) s = s.slice(4);
  return s;
}

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

const HOMOGLYPH_MAP: Record<string, string> = {
  '\u0430': 'a', '\u0435': 'e', '\u043e': 'o', '\u0440': 'p', '\u0441': 'c',
  '\u0445': 'x', '\u0456': 'i', '\u0458': 'j', '\u0443': 'y', '\u043a': 'k',
  '\u03b1': 'a', '\u03b5': 'e', '\u03bf': 'o', '\u03c1': 'p', '\u03b9': 'i',
};

function foldHomoglyphs(input: string): string {
  let normalized = input.normalize('NFKC');
  let out = '';
  for (const ch of normalized) {
    out += HOMOGLYPH_MAP[ch] ?? ch;
  }
  return out;
}

const REDIRECT_PARAM_REGEX = /[?&](?:u|url|redirect|redirect_url|next|dest|destination|target|r|link|to)=([^&#]+)/gi;

function extractRedirectTargets(rawInput: string): string[] {
  const results: string[] = [];
  let match: RegExpExecArray | null;
  REDIRECT_PARAM_REGEX.lastIndex = 0;
  while ((match = REDIRECT_PARAM_REGEX.exec(rawInput)) !== null && results.length < 4) {
    try {
      const decoded = decodeURIComponent(match[1].replace(/\+/g, ' '));
      if (decoded && decoded !== rawInput) results.push(decoded);
    } catch {
      if (match[1] && match[1] !== rawInput) results.push(match[1]);
    }
  }
  return results;
}

export const BlocklistMatcher = {
  normalizeDomain(rawInput: string): string {
    let s = foldHomoglyphs(rawInput.trim().toLowerCase());
    if (!s) return '';
    if (INTERNAL_SCHEME_PREFIXES.some((prefix) => s.startsWith(prefix))) return '';
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
    const lower = foldHomoglyphs(rawUrl).toLowerCase();
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
      decoded = foldHomoglyphs(decodeURIComponent(match[1].replace(/\+/g, ' '))).toLowerCase();
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

  matchAdOrTrackerUrl(rawDomainOrUrl: string, config: BlockFilterConfig): BlockMatchResult {
    if (config.adBlockerEnabled === false) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }
    const lower = foldHomoglyphs(rawDomainOrUrl.trim().toLowerCase());
    if (!lower) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }

    const host = this.normalizeDomain(rawDomainOrUrl);
    if (host) {
      if (
        matchesDomainHierarchy(host, GamblingRegistry.safeDomains) !== null ||
        matchesDomainHierarchy(host, config.allowlistedDomains) !== null
      ) {
        return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
      }

      const adHostMatch = matchesDomainHierarchy(host, GamblingRegistry.gamblingAdTrackerDomains);
      if (adHostMatch !== null) {
        return {
          isBlocked: true,
          matchedTarget: adHostMatch,
          category: GamblingCategory.CASINO,
          reason: 'Blocked gambling ad or popunder tracker',
        };
      }
    }

    for (const sig of GamblingRegistry.gamblingAdUrlSignatures) {
      if (lower.includes(sig)) {
        return {
          isBlocked: true,
          matchedTarget: host || 'Betting Promo Tracker',
          category: GamblingCategory.SPORTSBOOK,
          reason: 'Blocked gambling affiliate or promo ad link',
        };
      }
    }

    return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
  },

  matchDomainOrUrl(rawDomainOrUrl: string, config: BlockFilterConfig, depth = 0): BlockMatchResult {
    const rawLower = foldHomoglyphs(rawDomainOrUrl.trim().toLowerCase());
    if (INTERNAL_SCHEME_PREFIXES.some((prefix) => rawLower.startsWith(prefix))) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }

    if (depth < 2) {
      for (const wrapped of extractRedirectTargets(rawDomainOrUrl)) {
        const innerMatch = this.matchDomainOrUrl(wrapped, config, depth + 1);
        if (innerMatch.isBlocked) {
          return {
            ...innerMatch,
            reason: `Unwrapped redirect link (${innerMatch.reason})`,
          };
        }
      }
    }

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

    const adMatch = this.matchAdOrTrackerUrl(rawDomainOrUrl, config);
    if (adMatch.isBlocked) return adMatch;

    return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
  },

  matchBrowserAddressText(addressText: string, config: BlockFilterConfig): BlockMatchResult {
    const trimmed = addressText.trim();
    if (trimmed.length < 4) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }
    const lower = trimmed.toLowerCase();
    if (INTERNAL_SCHEME_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }

    if (!trimmed.includes(' ')) {
      const direct = this.matchDomainOrUrl(trimmed, config);
      if (direct.isBlocked) return direct;
    }

    const tokenMatch = DOMAIN_TOKEN_REGEX.exec(lower);
    if (tokenMatch) {
      const domainResult = this.matchDomainOrUrl(tokenMatch[0], config);
      if (domainResult.isBlocked) return domainResult;
    }

    return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
  },

  matchTypedBrowserInput(rawInput: string, config: BlockFilterConfig): BlockMatchResult {
    const trimmed = rawInput.trim();
    if (trimmed.length < 4) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }

    const lower = trimmed.toLowerCase();
    if (INTERNAL_SCHEME_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }
    if (RECOVERY_TERMS.some((term) => lower.includes(term))) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }

    const stripped = stripProtocolAndWww(lower);
    const safeList = Array.from(GamblingRegistry.safeDomains);
    if (
      safeList.some((safe) => {
        const safeStem = safe.split('.')[0];
        return stripped.startsWith(safe) || (safeStem.length >= 5 && stripped.startsWith(safeStem));
      })
    ) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }

    const allowList = Array.from(config.allowlistedDomains);
    if (
      allowList.some((allowed) => {
        const allowStem = allowed.split('.')[0];
        return stripped.startsWith(allowed) || (allowStem.length >= 5 && stripped.startsWith(allowStem));
      })
    ) {
      return { isBlocked: false, matchedTarget: '', category: GamblingCategory.CUSTOM, reason: '' };
    }

    const standardMatch = this.matchBrowserAddressText(trimmed, config);
    if (standardMatch.isBlocked) return standardMatch;

    const noSpace = !lower.includes(' ');
    if (noSpace && stripped.includes('.')) {
      const beforeSlash = stripped.split('/')[0].split('?')[0].split('#')[0];
      const dotIdx = beforeSlash.indexOf('.');
      const typedStem = dotIdx >= 0 ? beforeSlash.slice(0, dotIdx) : beforeSlash;
      const typedTldStart = dotIdx >= 0 ? beforeSlash.slice(dotIdx + 1) : '';
      if (typedTldStart.length > 0) {
        for (const custom of config.customBlockedDomains) {
          const customStem = custom.split('.')[0];
          if (typedStem === customStem || beforeSlash === custom) {
            return {
              isBlocked: true,
              matchedTarget: custom,
              category: GamblingCategory.CUSTOM,
              reason: `Blocked immediately while typing ${custom}`,
            };
          }
        }
        for (const [domain, category] of GamblingRegistry.domainToCategory.entries()) {
          if (!isCategoryEnabled(category, config)) continue;
          const dDot = domain.indexOf('.');
          const domStem = dDot >= 0 ? domain.slice(0, dDot) : domain;
          const domTld = dDot >= 0 ? domain.slice(dDot + 1) : '';
          if (typedStem === domStem && domTld.startsWith(typedTldStart)) {
            return {
              isBlocked: true,
              matchedTarget: domain,
              category,
              reason: `Blocked immediately while typing ${domain}`,
            };
          }
        }
      }
    }

    for (const custom of config.customBlockedDomains) {
      const stem = custom.split('.')[0];
      if (stem.length >= 5 && containsWholeTokenOrDirectStem(lower, stripped, stem)) {
        return {
          isBlocked: true,
          matchedTarget: custom,
          category: GamblingCategory.CUSTOM,
          reason: 'Blocked custom site while typing',
        };
      }
    }

    for (const [stem, category] of getUnambiguousTypedStems()) {
      if (!isCategoryEnabled(category, config)) continue;
      if (containsWholeTokenOrDirectStem(lower, stripped, stem)) {
        return {
          isBlocked: true,
          matchedTarget: stem,
          category,
          reason: `Blocked "${stem}" immediately while typing`,
        };
      }
    }

    if (noSpace && !stripped.includes('.')) {
      for (const [fullBrand, category, minLen] of INSTANT_BRAND_PREFIXES) {
        if (!isCategoryEnabled(category, config)) continue;
        if (stripped.length >= minLen && fullBrand.startsWith(stripped)) {
          return {
            isBlocked: true,
            matchedTarget: fullBrand,
            category,
            reason: `Blocked "${fullBrand}" immediately while typing`,
          };
        }
      }
    }

    if (config.adBlockerEnabled !== false) {
      for (const adTerm of TYPED_AD_TRACKER_TERMS) {
        if (lower.includes(adTerm)) {
          return {
            isBlocked: true,
            matchedTarget: adTerm,
            category: GamblingCategory.CASINO,
            reason: 'Blocked gambling ad or affiliate tracker while typing',
          };
        }
      }
    }

    if (config.searchGuardEnabled) {
      for (const intent of TYPED_BETTING_INTENT_PHRASES) {
        if (lower.includes(intent)) {
          return {
            isBlocked: true,
            matchedTarget: intent,
            category: GamblingCategory.SPORTSBOOK,
            reason: 'Blocked betting search while typing',
          };
        }
      }
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
