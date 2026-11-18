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

  return Array.from(groups.values()).sort((a, b) => b.latestTimestamp - a.timestamp);
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
