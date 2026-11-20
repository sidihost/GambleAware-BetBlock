import React, { useEffect, useState } from 'react';
import { ChevronRight, Download, Menu, X } from 'lucide-react';
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
  { href: '#live-filter', id: 'live-filter', label: 'Live Filter' },
  { href: '#coverage', id: 'coverage', label: 'Coverage' },
  { href: '#architecture', id: 'architecture', label: 'Features' },
  { href: '#compare', id: 'compare', label: 'Compare' },
  { href: '#install', id: 'install', label: 'Install' },
];

export const AppHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 12);

      const threshold = scrollY + 120;
      let current = '';
      for (const item of NAV_LINKS) {
        const sectionEl = document.getElementById(item.id);
        if (sectionEl && sectionEl.offsetTop <= threshold) {
          current = item.id;
        }
      }
      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 768px)');
    const handleViewportChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setMobileMenuOpen(false);
      }
    };
    mq.addEventListener('change', handleViewportChange);
    return () => mq.removeEventListener('change', handleViewportChange);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleBrandClick = () => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full border-b transition-colors duration-150 ${
          isScrolled || mobileMenuOpen
            ? 'border-[var(--subtle-border)] bg-[var(--surface)]'
            : 'border-[var(--subtle-border)] bg-[var(--surface)]/95'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6 lg:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={handleBrandClick}
            className="flex min-w-0 shrink-0 cursor-pointer items-center gap-2 text-left whitespace-nowrap sm:gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]"
          >
            <BrandGMark className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
            <span className="font-display text-[15px] font-bold tracking-tight text-[var(--ink)] sm:text-base">
              GambleAware
            </span>
          </button>

          {/* Zone 2: Primary Section Navigation (Tablet md: 768px+ & Desktop) */}
          <nav
            aria-label="Primary sections"
            className="hidden items-center md:flex md:gap-4 lg:gap-7"
          >
            {NAV_LINKS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'location' : undefined}
                  className={`relative shrink-0 py-1 text-[13px] font-medium whitespace-nowrap transition-colors lg:text-sm ${
                    isActive
                      ? 'font-semibold text-[var(--ink)] after:absolute after:right-0 after:bottom-0 after:left-0 after:h-[2px] after:rounded-full after:bg-[var(--active-fill)]'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Primary CTA + Responsive Mobile Menu Trigger */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <a
              href={ANDROID_APK_DOWNLOAD_URL}
              download={APK_DOWNLOAD_FILENAME}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-3 text-xs font-semibold whitespace-nowrap text-[var(--active-content)] transition-opacity hover:opacity-90 sm:h-10 sm:px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]"
            >
              <Download className="h-3.5 w-3.5 shrink-0" />
              <span>
                Download<span className="hidden min-[380px]:inline"> APK</span>
              </span>
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink)] transition-colors hover:bg-[var(--muted-fill)] md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Menu Drawer Overlay (< 768px) */}
        {mobileMenuOpen ? (
          <nav
            id="mobile-nav-drawer"
            aria-label="Mobile navigation"
            className="absolute inset-x-0 top-full z-40 border-b border-[var(--subtle-border)] bg-[var(--surface)] px-4 pt-2 pb-4 md:hidden"
          >
            <div className="mx-auto flex max-w-md flex-col gap-1">
              {NAV_LINKS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'location' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex h-11 items-center justify-between rounded-xl px-3.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-[var(--soft-accent-bg)] font-semibold text-[var(--accent-ink)]'
                        : 'font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </a>
                );
              })}

              <div className="mt-2 border-t border-[var(--subtle-border)] pt-3">
                <a
                  href={ANDROID_APK_DOWNLOAD_URL}
                  download={APK_DOWNLOAD_FILENAME}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span>Download Android App (APK)</span>
                </a>
              </div>
            </div>
          </nav>
        ) : null}
      </header>

      {/* Flat Backdrop Scrim to Dismiss Mobile Menu on Outside Tap */}
      {mobileMenuOpen ? (
        <div
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 top-14 z-30 bg-black/30 sm:top-16 md:hidden"
        />
      ) : null}
    </>
  );
};
