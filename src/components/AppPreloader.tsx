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

    const displayDurationMs = prefersReduced ? 140 : 540;
    const leaveTransitionMs = prefersReduced ? 100 : 240;

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
    window.setTimeout(() => onDismissRef.current(), 140);
  };

  return (
    <div
      role="status"
      aria-label="Loading GambleAware"
      data-testid="app-preloader"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[var(--canvas)] px-6 text-[var(--ink)] transition-[opacity,transform] duration-200 ease-out ${
        isLeaving ? 'pointer-events-none scale-[1.01] opacity-0' : 'scale-100 opacity-100'
      }`}
    >
      <div className="animate-preloader-fade-up relative z-10 flex flex-col items-center text-center">
        <div className="relative flex h-[108px] w-[108px] items-center justify-center">
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
              strokeDasharray="108 272"
            />
          </svg>

          <div className="flex h-[70px] w-[70px] items-center justify-center rounded-[20px] border border-[var(--subtle-border)] bg-[var(--surface)]">
            <BrandGMark className="h-[52px] w-[52px]" />
          </div>
        </div>

        <p className="mt-5 font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
          GambleAware
        </p>
        <p className="mt-1 text-xs font-medium text-[var(--ink-muted)]">
          On-device gambling blocker &amp; recovery shield
        </p>

        <div
          aria-hidden="true"
          className="mt-4 h-[2px] w-40 overflow-hidden rounded-full bg-[var(--muted-fill)]"
        >
          <div className="animate-preloader-sweep h-full w-full rounded-full bg-[var(--active-fill)]" />
        </div>

        <button
          type="button"
          onClick={handleInstantDismiss}
          className="mt-4 min-h-[34px] cursor-pointer rounded-full px-4 py-1 text-xs font-semibold text-[var(--ink-muted)] transition-colors hover:bg-[var(--muted-fill)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
