import React from 'react';
import {
  Anchor,
  Cloud,
  CloudOff,
  Download,
  LockKeyhole,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import { AnchorRoute, CloudAccountInfo, CloudSyncStatus } from '../data/types';

interface AppHeaderProps {
  currentRoute: AnchorRoute;
  onSelectRoute: (route: AnchorRoute) => void;
  cloudUser: CloudAccountInfo | null;
  cloudSyncStatus: CloudSyncStatus;
  onSyncClick: () => void;
}

const DESKTOP_NAV: Array<{
  route: AnchorRoute;
  label: string;
  icon: React.ReactNode;
}> = [
  { route: 'shield', label: 'Protect', icon: <Anchor className="h-4 w-4" /> },
  { route: 'blocklist', label: 'Rules', icon: <SlidersHorizontal className="h-4 w-4" /> },
  { route: 'activity', label: 'Progress', icon: <TrendingUp className="h-4 w-4" /> },
  { route: 'lock', label: 'Lock', icon: <LockKeyhole className="h-4 w-4" /> },
  { route: 'download', label: 'Download', icon: <Download className="h-4 w-4" /> },
];

export const BrandAnchorMark: React.FC<{ className?: string }> = ({
  className = 'h-8 w-8',
}) => (
  <svg
    viewBox="0 0 36 36"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <rect
      x="1.5"
      y="1.5"
      width="33"
      height="33"
      rx="10"
      fill="var(--active-fill)"
    />
    <circle cx="18" cy="11.5" r="2.6" stroke="var(--active-content)" strokeWidth="2.1" />
    <line x1="18" y1="14.2" x2="18" y2="26.5" stroke="var(--active-content)" strokeWidth="2.2" strokeLinecap="round" />
    <line x1="12.5" y1="17.2" x2="23.5" y2="17.2" stroke="var(--active-content)" strokeWidth="2.1" strokeLinecap="round" />
    <path
      d="M10.5 21.5C11.8 25.4 14.7 27.3 18 27.3C21.3 27.3 24.2 25.4 25.5 21.5"
      stroke="var(--active-content)"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentRoute,
  onSelectRoute,
  cloudUser,
  cloudSyncStatus,
  onSyncClick,
}) => {
  const isOnDownload = currentRoute === 'download';

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--subtle-border)] bg-[var(--glass-fill)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 md:h-16 md:px-6">
        {/* Left Zone: Brand Crest + Name */}
        <button
          type="button"
          onClick={() => onSelectRoute('shield')}
          className="flex min-w-0 shrink-0 cursor-pointer items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]"
        >
          <BrandAnchorMark className="h-8 w-8 shrink-0" />
          <div className="min-w-0 leading-tight">
            <span className="block font-display text-base font-bold tracking-tight whitespace-nowrap text-[var(--ink)] md:text-lg">
              GambleAware
            </span>
            <span className="hidden font-mono text-[10px] tracking-wider whitespace-nowrap text-[var(--accent-ink)] uppercase sm:block">
              Nigeria · Free Guard
            </span>
          </div>
        </button>

        {/* Center Zone: Single-Line Desktop Navigation */}
        <nav
          aria-label="Desktop navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {DESKTOP_NAV.map((item) => {
            const selected = item.route === currentRoute;
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => onSelectRoute(item.route)}
                className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm whitespace-nowrap transition-colors ${
                  selected
                    ? 'bg-[var(--active-fill)] font-semibold text-[var(--active-content)]'
                    : 'font-medium text-[var(--ink-muted)] hover:bg-[var(--muted-fill)] hover:text-[var(--ink)]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Zone: Free Cloud Sync Trigger + Primary Action CTA */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onSyncClick}
            aria-label={
              cloudUser
                ? `Cloud sync active for ${cloudUser.email || cloudUser.displayName}`
                : 'Sign in for free Cloud Sync'
            }
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-2.5 text-xs font-medium whitespace-nowrap text-[var(--ink)] transition-colors hover:opacity-90 sm:px-3"
          >
            {cloudSyncStatus === 'error' ? (
              <CloudOff className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
            ) : (
              <Cloud
                className={`h-3.5 w-3.5 shrink-0 ${
                  cloudUser ? 'text-[var(--accent-ink)]' : 'text-[var(--ink-muted)]'
                }`}
              />
            )}
            <span className="hidden sm:inline">
              {cloudUser
                ? cloudSyncStatus === 'connecting'
                  ? 'Syncing…'
                  : 'Synced'
                : 'Free Sync'}
            </span>
          </button>

          {isOnDownload ? (
            <button
              type="button"
              onClick={() => onSelectRoute('shield')}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--active-fill)] px-3.5 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] hover:opacity-90 sm:px-4 sm:text-sm"
            >
              <Anchor className="h-3.5 w-3.5 shrink-0" />
              <span>Open Guard</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelectRoute('download')}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--active-fill)] px-3.5 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] hover:opacity-90 sm:px-4 sm:text-sm"
            >
              <Download className="h-3.5 w-3.5 shrink-0" />
              <span>Get App</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
