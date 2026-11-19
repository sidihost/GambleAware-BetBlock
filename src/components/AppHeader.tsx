import React, { useState } from 'react';
import { Download, Menu, X } from 'lucide-react';
import {
  ANDROID_APK_DOWNLOAD_URL,
  APK_DOWNLOAD_FILENAME,
} from '../utils/platformCompatibility';

/**
 * Architectural GambleAware Geometric G Logo — crisp vector emblem
 */
export const BrandGMark: React.FC<{ className?: string }> = ({
  className = 'h-9 w-9',
}) => (
  <svg viewBox="0 0 108 108" fill="none" aria-hidden="true" className={className}>
    <rect x="2" y="2" width="104" height="104" rx="24" fill="#0A0B10" />
    <rect
      x="2.8"
      y="2.8"
      width="102.4"
      height="102.4"
      rx="23.2"
      stroke="#FF3D9A"
      strokeOpacity="0.4"
      strokeWidth="1.4"
    />
    <circle cx="54" cy="54" r="38" fill="#260B19" fillOpacity="0.48" />

    <g transform="translate(54 54) scale(1.42) translate(-54 -54)">
      <path
        d="M68,36 L63.5,41 L45,41 L41,45 L41,63 L45,67 L63,67 L67.5,71.8 L63.8,74.5 L42,74.5 L33.5,66 L33.5,42 L42,33.5 L64.2,33.5 Z"
        fill="#FFFFFF"
      />
      <path
        d="M52,50.5 L74.5,50.5 L74.5,65.5 L67.2,72.5 L67.2,57.5 L48.5,57.5 Z"
        fill="#FF3D9A"
      />
      <path d="M67.2,57.5 L74.5,50.5 L74.5,65.5 L67.2,72.5 Z" fill="#C4116B" />
      <path
        d="M70.5,34.5 Q70.5,39.8 75.8,39.8 Q70.5,39.8 70.5,45.1 Q70.5,39.8 65.2,39.8 Q70.5,39.8 70.5,34.5 Z"
        fill="#FF72B8"
      />
      <circle cx="70.5" cy="39.8" r="1.45" fill="#FFFFFF" />
    </g>
  </svg>
);

export const BrandAnchorMark = BrandGMark;

export const BrandGIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <path
      d="M17.2 6.8L15.1 9H8.8L7.2 10.6V13.4L8.8 15H14.8L16.8 17.1L15.2 18.5H7.6L4.2 15.1V8.9L7.6 5.5H15.6L17.2 6.8Z"
      fill="currentColor"
    />
    <path
      d="M11.6 10.9H19.4V16.6L16.5 19.2V13.5H9.8L11.6 10.9Z"
      fill="currentColor"
    />
    <circle cx="18.1" cy="7.1" r="1.4" fill="currentColor" />
  </svg>
);

const NAV_LINKS = [
  { href: '#live-filter', label: 'Live Filter' },
  { href: '#coverage', label: 'Coverage' },
  { href: '#architecture', label: 'Architecture' },
  { href: '#compare', label: 'Compare' },
  { href: '#install', label: 'Install' },
];

export const AppHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleBrandClick = () => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[var(--subtle-border)] bg-[var(--glass-fill)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={handleBrandClick}
          className="flex shrink-0 cursor-pointer items-center gap-2.5 text-left whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]"
        >
          <BrandGMark className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
          <span className="font-display text-base font-bold tracking-tight text-[var(--ink)]">
            GambleAware
          </span>
        </button>

        {/* Zone 2: Primary Section Navigation */}
        <nav
          aria-label="Primary sections"
          className="hidden items-center gap-7 lg:flex"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="shrink-0 text-sm font-medium whitespace-nowrap text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Primary CTA */}
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={ANDROID_APK_DOWNLOAD_URL}
            download={APK_DOWNLOAD_FILENAME}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span>Download APK</span>
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink)] transition-colors hover:bg-[var(--muted-fill)] lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Menu Drawer */}
      {mobileMenuOpen ? (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-[var(--subtle-border)] bg-[var(--surface)] px-4 py-3 lg:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-11 items-center rounded-xl px-3 text-sm font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="mt-2 border-t border-[var(--subtle-border)] pt-3">
            <a
              href={ANDROID_APK_DOWNLOAD_URL}
              download={APK_DOWNLOAD_FILENAME}
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>Download Android App (APK)</span>
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
};
