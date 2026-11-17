import React from 'react';
import { CheckCircle2, Cloud, LogOut, RefreshCw } from 'lucide-react';
import { CloudAccountInfo, CloudSyncStatus } from '../data/types';
import { LiquidGlassCard } from './LiquidGlass';

interface CloudSyncCardProps {
  cloudUser: CloudAccountInfo | null;
  cloudSyncStatus: CloudSyncStatus;
  lastSyncedAtMs: number | null;
  cloudErrorMsg: string | null;
  onSignInGoogle: () => void;
  onSignOut: () => void;
  onForceSync: () => void;
}

export const CloudSyncCard: React.FC<CloudSyncCardProps> = ({
  cloudUser,
  cloudSyncStatus,
  lastSyncedAtMs,
  cloudErrorMsg,
  onSignInGoogle,
  onSignOut,
  onForceSync,
}) => {
  const lastSyncLabel = lastSyncedAtMs
    ? new Date(lastSyncedAtMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Ready';

  return (
    <LiquidGlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
              cloudUser
                ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                : 'bg-[var(--muted-fill)] text-[var(--accent-ink)]'
            }`}
          >
            <Cloud className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-semibold text-[var(--ink)]">
                Free Cloud Backup
              </h3>
              <span className="font-mono text-[11px] font-semibold text-[var(--accent-ink)]">
                ₦0 Forever
              </span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-muted)]">
              {cloudUser
                ? `Synced to Firestore as ${cloudUser.email || cloudUser.displayName}`
                : 'Everything runs 100% free on your device. Sign in with Google to back up your streak, Naira savings & custom rules across devices.'}
            </p>
          </div>
        </div>
      </div>

      {cloudErrorMsg ? (
        <p className="mt-3 rounded-[14px] border border-[var(--glass-border)] bg-[var(--muted-fill)] px-3 py-2 text-xs text-[var(--accent-ink)]">
          {cloudErrorMsg}
        </p>
      ) : null}

      {cloudUser ? (
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-xs text-[var(--ink)]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
            <span>
              {cloudSyncStatus === 'connecting'
                ? 'Syncing changes…'
                : `Live Cloud Sync • ${lastSyncLabel}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onForceSync}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--ink)] hover:opacity-90"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Sync</span>
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border border-[var(--subtle-border)] px-3 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSignInGoogle}
          disabled={cloudSyncStatus === 'connecting'}
          className="mt-3.5 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] transition-opacity hover:opacity-90 disabled:opacity-65 sm:text-sm"
        >
          <Cloud className="h-4 w-4 shrink-0" />
          <span>
            {cloudSyncStatus === 'connecting'
              ? 'Connecting Google…'
              : 'Sync with Google'}
          </span>
        </button>
      )}
    </LiquidGlassCard>
  );
};
