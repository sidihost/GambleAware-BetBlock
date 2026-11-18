import React from 'react';
import { Download } from 'lucide-react';

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

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#install-guide', label: 'How to Install' },
  { href: '#comparison', label: 'vs. Gamban' },
];

export const AppHeader: React.FC = () => (
  <header className="sticky top-0 z-30 w-full border-b border-[var(--subtle-border)] bg-[var(--glass-fill)] backdrop-blur-xl">
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 md:px-6">
      {/* Zone 1: Single-line Sovereign G-Vault Brand */}
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
            className="text-sm font-medium whitespace-nowrap shrink-0 text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)] hover:underline hover:underline-offset-4"
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Zone 3: Single Primary Download Action */}
      <a
        href="/downloads/GambleAware-Nigeria.apk"
        download="GambleAware.apk"
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] transition-opacity hover:opacity-90 sm:px-5 sm:text-sm"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>Download APK</span>
      </a>
    </div>
  </header>
);
