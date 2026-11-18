import { resolveBettingBrand } from '../blocker/brandCatalog';
import { BlockedEventEntity } from '../data/types';
import { looksLikeAndroidPackageId, resolveFriendlyAppName } from './deviceAppCatalog';

export interface GroupedBlockedSite {
  key: string;
  target: string;
  attemptCount: number;
  latestTimestamp: number;
  latestSource: string;
  sources: string[];
  categoryName: string;
  isApp: boolean;
}

/**
 * Normalizes a blocked target string (URL, domain, or app label/package ID) so repeated blocks
 * of the same site or app collapse cleanly under one human-readable site or app name.
 */
export function normalizeBlockedTarget(rawTarget: string): string {
  const trimmed = (rawTarget || '').trim();
  if (!trimmed) return 'Unknown Site';

  if (looksLikeAndroidPackageId(trimmed)) {
    return resolveFriendlyAppName(trimmed);
  }

  const hasSpaces = /\s/.test(trimmed);
  const looksLikeUrlOrDomain =
    /^https?:\/\//i.test(trimmed) ||
    (!hasSpaces && trimmed.includes('.'));

  if (!looksLikeUrlOrDomain) {
    return trimmed;
  }

  let candidate = trimmed.replace(/^[a-zA-Z]+:\/\//, '');
  candidate = candidate.split(/[/?#]/)[0] ?? candidate;
  candidate = candidate.split(':')[0] ?? candidate;
  candidate = candidate.replace(/^www\./i, '').replace(/\.$/, '').toLowerCase();

  if (looksLikeAndroidPackageId(candidate)) {
    return resolveFriendlyAppName(candidate);
  }

  return candidate || trimmed.toLowerCase();
}

const AD_TRACKER_DISPLAY_NAMES: Record<string, string> = {
  popads: 'PopAds Ad Network',
  popcash: 'PopCash Ad Network',
  propellerads: 'PropellerAds Tracker',
  adsterra: 'Adsterra Popunder',
  exoclick: 'ExoClick Ad Network',
  trafficjunky: 'TrafficJunky Ad Network',
  juicyads: 'JuicyAds Network',
  hilltopads: 'HilltopAds Popunder',
  clickadu: 'Clickadu Popunder',
  admaven: 'AdMaven Popunder',
  monetag: 'Monetag Ad Network',
  bet365affiliates: 'Bet365 Affiliate Tracker',
  '1xpartners': '1xBet Affiliate Tracker',
  '1xbetpartners': '1xBet Affiliate Tracker',
  partner1xbet: '1xBet Affiliate Tracker',
  betwaypartners: 'Betway Affiliate Tracker',
  stakeaffiliates: 'Stake Affiliate Tracker',
  melbetpartners: 'MelBet Affiliate Tracker',
  mostbetpartners: 'MostBet Affiliate Tracker',
  incomeaccess: 'Casino Affiliate Tracker',
  betterhelp: 'BetterHelp',
};

/**
 * Formats any blocked domain, URL, or Android package ID into a clean human-readable name
 * with zero raw `.com` suffixes or `com.*` package IDs exposed in the UI.
 */
export function formatBlockedTargetDisplay(rawTarget: string): string {
  const trimmed = (rawTarget || '').trim();
  if (!trimmed) return 'Betting Site';

  if (looksLikeAndroidPackageId(trimmed)) {
    return resolveFriendlyAppName(trimmed);
  }

  const normalized = normalizeBlockedTarget(trimmed);
  if (looksLikeAndroidPackageId(normalized)) {
    return resolveFriendlyAppName(normalized);
  }

  const resolved = resolveBettingBrand(normalized);
  if (resolved.isExactCatalogMatch) {
    return resolved.displayName;
  }

  const lower = normalized.toLowerCase();
  const baseHost = lower.replace(/^(?:m|wap|mobile|pay|web|sports|casino|app|www)\./, '');
  const stem = baseHost.includes('.') ? baseHost.split('.')[0] : baseHost.split(/[/?#\s]/)[0];
  if (stem && AD_TRACKER_DISPLAY_NAMES[stem]) {
    return AD_TRACKER_DISPLAY_NAMES[stem];
  }

  if (/\s/.test(trimmed) && !normalized.includes('.')) {
    return trimmed
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  const cleanLabel = (stem || normalized).replace(/[-_]+/g, ' ').trim();
  if (!cleanLabel) return 'Betting Site';
  return cleanLabel
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function isAppBlockSource(source: string): boolean {
  const normalized = (source || '').trim().toLowerCase();
  return normalized === 'app shield' || normalized === 'install guard';
}

export function groupBlockedEvents(events: readonly BlockedEventEntity[]): GroupedBlockedSite[] {
  if (!events || events.length === 0) return [];

  const groups = new Map<string, GroupedBlockedSite>();

  // Process newest-first so latestSource & categoryName reflect the most recent attempt
  const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp);

  for (const ev of sorted) {
    const cleanTarget = normalizeBlockedTarget(ev.target);
    const key = `${isAppBlockSource(ev.source) ? 'app' : 'site'}:${cleanTarget.toLowerCase()}`;
    const existing = groups.get(key);
    const evIsApp = isAppBlockSource(ev.source);

    if (!existing) {
      groups.set(key, {
        key,
        target: cleanTarget,
        attemptCount: 1,
        latestTimestamp: ev.timestamp,
        latestSource: ev.source,
        sources: [ev.source],
        categoryName: ev.categoryName,
        isApp: evIsApp,
      });
    } else {
      existing.attemptCount += 1;
      if (ev.timestamp > existing.latestTimestamp) {
        existing.latestTimestamp = ev.timestamp;
        existing.latestSource = ev.source;
        existing.categoryName = ev.categoryName;
      }
      if (!existing.sources.includes(ev.source)) {
        existing.sources.push(ev.source);
      }
      if (evIsApp) {
        existing.isApp = true;
      }
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.latestTimestamp - a.latestTimestamp);
}

export function formatAttemptCountLabel(count: number): string {
  const safe = Math.max(1, Math.floor(count));
  return safe === 1 ? '1 blocked' : `${safe} blocked`;
}

export function formatBlockedTimestamp(timestampMs: number, nowMs: number): string {
  const diffMs = Math.max(0, nowMs - timestampMs);
  if (diffMs < 60_000) return 'Just now';
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(timestampMs).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
