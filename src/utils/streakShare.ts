import { formatNaira } from './currency';

export interface CleanStreakShareInput {
  cleanDays: number;
  cleanHoursRemainder: number;
  cleanMinutesRemainder: number;
  cleanSecondsRemainder: number;
  estimatedSavedAmount: number;
  totalUrgeResistedCount: number;
  totalBlockedCount: number;
  nextMilestoneTitle: string;
  nextMilestoneDays: number;
  shareUrl?: string;
}

export interface CleanStreakSharePayload {
  title: string;
  text: string;
  url: string;
  combinedText: string;
}

export interface ShareAdapter {
  share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
  copyText?: (text: string) => Promise<void>;
}

export type ShareCleanStreakOutcome =
  | { status: 'shared'; method: 'native' }
  | { status: 'copied'; method: 'clipboard' }
  | { status: 'cancelled' }
  | { status: 'unavailable'; fallbackText: string };

const pad2 = (value: number): string => String(Math.max(0, Math.floor(value))).padStart(2, '0');

export function buildCleanStreakSharePayload(
  input: CleanStreakShareInput,
): CleanStreakSharePayload {
  const safeDays = Math.max(0, Math.floor(input.cleanDays));
  const dayWord = safeDays === 1 ? 'day' : 'days';
  const elapsed = `${pad2(input.cleanHoursRemainder)}h ${pad2(input.cleanMinutesRemainder)}m ${pad2(input.cleanSecondsRemainder)}s`;
  const saved = formatNaira(Math.max(0, Math.floor(input.estimatedSavedAmount)));
  const urges = Math.max(0, Math.floor(input.totalUrgeResistedCount));
  const blocked = Math.max(0, Math.floor(input.totalBlockedCount));
  const url = input.shareUrl?.trim() || 'https://gambleaware.vercel.app';

  const title = `GambleAware Clean Streak: ${safeDays} ${dayWord} betting-free`;
  const lines = [
    `I'm ${safeDays} ${dayWord} (${elapsed}) betting-free with GambleAware.`,
    `• Estimated saved: ${saved}`,
    `• Urges resisted: ${urges} | Betting sites blocked: ${blocked}`,
    `• Next milestone: ${input.nextMilestoneTitle} (${input.nextMilestoneDays}d)`,
  ];
  const text = lines.join('\n');

  return {
    title,
    text,
    url,
    combinedText: `${text}\n${url}`,
  };
}

export async function shareCleanStreakStats(
  input: CleanStreakShareInput,
  adapter?: ShareAdapter,
): Promise<ShareCleanStreakOutcome> {
  const payload = buildCleanStreakSharePayload(input);
  const nav =
    typeof navigator !== 'undefined'
      ? (navigator as Navigator & {
          share?: (data: ShareData) => Promise<void>;
          clipboard?: { writeText: (text: string) => Promise<void> };
        })
      : undefined;

  const nativeShare = adapter?.share ?? (nav?.share ? nav.share.bind(nav) : undefined);
  if (nativeShare) {
    try {
      await nativeShare({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      });
      return { status: 'shared', method: 'native' };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { status: 'cancelled' };
      }
      // Fall through to clipboard fallback if native share fails/disallowed
    }
  }

  const copyText =
    adapter?.copyText ??
    (nav?.clipboard?.writeText ? nav.clipboard.writeText.bind(nav.clipboard) : undefined);
  if (copyText) {
    try {
      await copyText(payload.combinedText);
      return { status: 'copied', method: 'clipboard' };
    } catch {
      // Fall through to unavailable
    }
  }

  return { status: 'unavailable', fallbackText: payload.combinedText };
}
