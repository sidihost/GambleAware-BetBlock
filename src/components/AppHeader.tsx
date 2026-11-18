import React from 'react';
import {
  Anchor,
  Download,
  LockKeyhole,
  Moon,
  SlidersHorizontal,
  Sun,
  TrendingUp,
} from 'lucide-react';
import { AnchorRoute, ThemeMode } from '../data/types';

interface AppHeaderProps {
  currentRoute: AnchorRoute;
  onSelectRoute: (route: AnchorRoute) => void;
  themeMode: ThemeMode;
  onToggleQuickTheme: () => void;
}

const DESKTOP_NAV: Array<{
  route: AnchorRoute;
  label: string;
  icon: React.ReactNode;
}> = [
  { route: 'shield', label: 'Home', icon: <Anchor className="h-4 w-4" /> },
  { route: 'blocklist', label: 'Blocked', icon: <SlidersHorizontal className="h-4 w-4" /> },
  { route: 'activity', label: 'Progress', icon: <TrendingUp className="h-4 w-4" /> },
  { route: 'lock', label: 'Lock', icon: <LockKeyhole className="h-4 w-4" /> },
  { route: 'download', label: 'Get App', icon: <Download className="h-4 w-4" /> },
];

/**
 * Bespoke GambleAware Sovereign G-Vault Monogram matching public/icon.svg
 */
export const BrandAnchorMark: React.FC<{ className?: string }> = ({
  className = 'h-9 w-9',
}) => (
  <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className={className}>
    <defs>
      <radialGradient id="hdr-obs" cx="32%" cy="22%" r="85%">
        <stop offset="0%" stopColor="#2D091D" />
        <stop offset="50%" stopColor="#0C070B" />
        <stop offset="100%" stopColor="#050507" />
      </radialGradient>
      <linearGradient id="hdr-pink" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF9AD0" />
        <stop offset="55%" stopColor="#FF3D9A" />
        <stop offset="100%" stopColor="#D81B78" />
      </linearGradient>
    </defs>
    <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="10.5" fill="url(#hdr-obs)" />
    <rect
      x="1.25"
      y="1.25"
      width="37.5"
      height="37.5"
      rx="10"
      stroke="#FF72B8"
      strokeOpacity="0.38"
      strokeWidth="0.9"
    />
    {/* Architectural Pearl-White G Monolith */}
    <path
      d="M27.5 10.3L25 13H15.2L13 15.2V24.8L15.2 27H24.8L27.2 29.5L25.2 31H13.6L9.1 26.4V13.6L13.6 9.1H25.5L27.5 10.3Z"
      fill="#FFFFFF"
    />
    {/* Luminous Pink Locking Keystone */}
    <path
      d="M19.1 18.1H30.9V26.1L27 29.8V21.9H17L19.1 18.1Z"
      fill="url(#hdr-pink)"
    />
    <path d="M27 21.9L30.9 18.1V26.1L27 29.8V21.9Z" fill="#B80D62" />
    {/* North-Star Beacon */}
    <path
      d="M28.9 9.5Q28.9 12.3 31.7 12.3Q28.9 12.3 28.9 15.1Q28.9 12.3 26.1 12.3Q28.9 12.3 28.9 9.5Z"
      fill="#FF72B8"
    />
    <circle cx="28.9" cy="12.3" r="0.65" fill="#FFFFFF" />
  </svg>
);

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentRoute,
  onSelectRoute,
  themeMode,
  onToggleQuickTheme,
}) => {
  const isOnDownload = currentRoute === 'download';
  const isDarkActive =
    themeMode === ThemeMode.DARK ||
    (themeMode === ThemeMode.SYSTEM &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--subtle-border)] bg-[var(--glass-fill)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4 md:h-16 md:gap-4 md:px-6">
        {/* Left Zone: Sovereign G-Vault Crest + Brand Name (No domain clutter) */}
        <button
          type="button"
          onClick={() => onSelectRoute('shield')}
          className="flex min-w-0 shrink-0 cursor-pointer items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]"
        >
          <BrandAnchorMark className="h-9 w-9 shrink-0" />
          <span className="font-display text-base font-bold tracking-tight whitespace-nowrap text-[var(--ink)] md:text-lg">
            GambleAware
          </span>
        </button>

        {/* Center Zone: Single-Line Desktop Navigation */}
        <nav aria-label="Desktop navigation" className="hidden items-center gap-1 md:flex">
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

        {/* Right Zone: Instant Theme Switch + Primary Action CTA */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onToggleQuickTheme}
            aria-label={isDarkActive ? 'Switch to White theme' : 'Switch to Black & Pink theme'}
            title={isDarkActive ? 'Switch to White theme' : 'Switch to Black & Pink theme'}
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-2.5 text-xs font-semibold whitespace-nowrap text-[var(--ink)] transition-colors hover:opacity-90 sm:px-3"
          >
            {isDarkActive ? (
              <Sun className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
            ) : (
              <Moon className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
            )}
            <span className="hidden sm:inline">
              {isDarkActive ? 'White' : 'Black & Pink'}
            </span>
          </button>

          {isOnDownload ? (
            <button
              type="button"
              onClick={() => onSelectRoute('shield')}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--active-fill)] px-3 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] hover:opacity-90 sm:px-4 sm:text-sm"
            >
              <Anchor className="h-3.5 w-3.5 shrink-0" />
              <span>Open Guard</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelectRoute('download')}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--active-fill)] px-3 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] hover:opacity-90 sm:px-4 sm:text-sm"
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
