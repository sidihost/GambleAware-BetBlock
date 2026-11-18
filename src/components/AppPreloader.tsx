import React, { useEffect, useRef, useState } from 'react';
import { BrandGMark } from './AppHeader';

interface AppPreloaderProps {
  visible: boolean;
  onDismiss: () => void;
}

export const AppPreloader: React.FC<AppPreloaderProps> = ({ visible, onDismiss }) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!visible) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const displayDurationMs = prefersReduced ? 240 : 1000;
    const leaveTransitionMs = prefersReduced ? 120 : 320;

    let unmountTimer = 0;
    const fadeTimer = window.setTimeout(() => {
      setIsLeaving(true);
      unmountTimer = window.setTimeout(() => {
        onDismissRef.current();
      }, leaveTransitionMs);
    }, displayDurationMs);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(unmountTimer);
    };
  }, [visible]);

  if (!visible) return null;

  const handleInstantDismiss = () => {
    setIsLeaving(true);
    window.setTimeout(() => onDismissRef.current(), 180);
  };

  return (
    <div
      role="status"
      aria-label="Loading GambleAware"
      data-testid="app-preloader"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[var(--canvas)] px-6 text-[var(--ink)] transition-[opacity,transform] duration-300 ease-out ${
        isLeaving ? 'pointer-events-none scale-[1.015] opacity-0' : 'scale-100 opacity-100'
      }`}
    >
      <div className="animate-preloader-fade-up relative z-10 flex flex-col items-center text-center">
        <div className="relative flex h-[120px] w-[120px] items-center justify-center">
          <svg
            viewBox="0 0 132 132"
            aria-hidden="true"
            className="animate-preloader-spin absolute inset-0 h-full w-full"
          >
            <circle
              cx="66"
              cy="66"
              r="60"
              fill="none"
              stroke="var(--subtle-border)"
              strokeWidth="1.25"
            />
            <circle
              cx="66"
              cy="66"
              r="60"
              fill="none"
              stroke="var(--active-fill)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="112 268"
            />
          </svg>

          <svg
            viewBox="0 0 132 132"
            aria-hidden="true"
            className="animate-preloader-spin-reverse absolute inset-0 h-full w-full"
          >
            <circle
              cx="66"
              cy="66"
              r="50"
              fill="none"
              stroke="var(--accent-ink)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeDasharray="54 260"
              strokeOpacity="0.65"
            />
          </svg>

          <div className="flex h-[78px] w-[78px] items-center justify-center rounded-[22px] border border-[var(--subtle-border)] bg-[var(--surface)] shadow-sm">
            <BrandGMark className="h-[58px] w-[58px]" />
          </div>
        </div>

        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
          GambleAware
        </h1>
        <p className="mt-1 text-xs font-medium tracking-wide text-[var(--ink-muted)]">
          On-device recovery &amp; betting shield
        </p>

        <div
          aria-hidden="true"
          className="mt-5 h-[3px] w-44 overflow-hidden rounded-full bg-[var(--muted-fill)]"
        >
          <div className="animate-preloader-sweep h-full w-full rounded-full bg-[var(--active-fill)]" />
        </div>

        <button
          type="button"
          onClick={handleInstantDismiss}
          className="mt-5 min-h-[36px] cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold text-[var(--ink-muted)] transition-colors hover:bg-[var(--muted-fill)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
