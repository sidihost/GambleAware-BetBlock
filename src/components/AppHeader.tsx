import React from 'react';
import { Download, Moon, Sun } from 'lucide-react';

/**
 * Refined GambleAware Sovereign Shield-Lock Emblem matching public/icon.svg
 */
export const BrandAnchorMark: React.FC<{ className?: string }> = ({
  className = 'h-9 w-9',
}) => (
  <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className={className}>
    <defs>
      <radialGradient id="hdr-obs" cx="34%" cy="20%" r="84%">
        <stop offset="0%" stopColor="#29091B" />
        <stop offset="52%" stopColor="#0D080C" />
        <stop offset="100%" stopColor="#060608" />
      </radialGradient>
      <linearGradient id="hdr-pearl" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="68%" stopColor="#FBF3F7" />
        <stop offset="100%" stopColor="#E7CFD9" />
      </linearGradient>
      <linearGradient id="hdr-pink" x1="15%" y1="0%" x2="85%" y2="100%">
        <stop offset="0%" stopColor="#FF8CC8" />
        <stop offset="48%" stopColor="#FF3D9A" />
        <stop offset="100%" stopColor="#D11372" />
      </linearGradient>
    </defs>

    {/* Obsidian Squircle Tile */}
    <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="10.5" fill="url(#hdr-obs)" />
    <rect
      x="1.15"
      y="1.15"
      width="37.7"
      height="37.7"
      rx="10.1"
      stroke="#FF7BC0"
      strokeOpacity="0.42"
      strokeWidth="0.9"
    />
    <circle cx="20" cy="20" r="14.2" stroke="#FF3D9A" strokeOpacity="0.18" strokeWidth="0.65" />

    {/* Outer Pearl-White Architectural Shield */}
    <path
      d="M20 8.2L30.2 11.7V19.6C30.2 26.2 25.5 30.2 20 32.2C14.5 30.2 9.8 26.2 9.8 19.6V11.7L20 8.2Z"
      fill="url(#hdr-pearl)"
    />
    <path
      d="M20 8.2L30.2 11.7V19.6C30.2 26.2 25.5 30.2 20 32.2V8.2Z"
      fill="#D2B6C5"
      opacity="0.2"
    />

    {/* Inner Electric Pink Lock Chamber */}
    <path
      d="M20 11.4L27.2 13.9V19.4C27.2 24.3 23.8 27.3 20 28.9C16.2 27.3 12.8 24.3 12.8 19.4V13.9L20 11.4Z"
      fill="url(#hdr-pink)"
    />

    {/* Precision Obsidian Keyhole Core */}
    <circle cx="20" cy="18.6" r="2.2" fill="#09070B" />
    <path d="M18.8 20.1H21.2L21.8 24.3H18.2L18.8 20.1Z" fill="#09070B" />
  </svg>
);

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#install-guide', label: 'How to Install' },
  { href: '#comparison', label: 'vs. Gamban' },
];

interface AppHeaderProps {
  isDarkTheme?: boolean;
  onToggleTheme?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ isDarkTheme = false, onToggleTheme }) => (
  <header className="sticky top-0 z-30 w-full border-b border-[var(--subtle-border)] bg-[var(--glass-fill)] backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:gap-8 md:px-6">
      {/* Zone 1: Sovereign Brand Lockup */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="flex shrink-0 cursor-pointer items-center gap-2.5 text-left whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]"
      >
        <BrandAnchorMark className="h-9 w-9 shrink-0" />
        <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap text-[var(--ink)]">
          GambleAware
        </span>
      </button>

      {/* Zone 2: Clean Typographic Section Links */}
      <nav aria-label="Primary sections" className="hidden items-center gap-7 md:flex">
        {NAV_LINKS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="shrink-0 text-sm font-medium whitespace-nowrap text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)] hover:underline hover:underline-offset-4"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Zone 3: Understated Theme Switcher + Primary APK Download */}
      <div className="flex shrink-0 items-center gap-2.5">
        {onToggleTheme ? (
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDarkTheme ? 'Switch to White theme' : 'Switch to Black & Pink theme'}
            title={isDarkTheme ? 'Switch to White theme' : 'Switch to Black & Pink theme'}
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink)] transition-colors hover:bg-[var(--muted-fill)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]"
          >
            {isDarkTheme ? (
              <Sun className="h-4 w-4 text-[var(--accent-ink)]" />
            ) : (
              <Moon className="h-4 w-4 text-[var(--accent-ink)]" />
            )}
          </button>
        ) : null}

        <a
          href="/downloads/GambleAware-Nigeria.apk"
          download="GambleAware.apk"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] transition-opacity hover:opacity-90 sm:px-5 sm:text-sm"
        >
          <Download className="h-4 w-4 shrink-0" />
          <span>Download APK</span>
        </a>
      </div>
    </div>
  </header>
);
