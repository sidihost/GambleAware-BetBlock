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
      {/* Seamless soft radial pink glow + concentric architectural rings */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute top-1/2 left-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'var(--preloader-halo)' }}
        />
        <svg className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <circle
            cx="50%"
            cy="47%"
            r="142"
            fill="none"
            stroke="var(--active-fill)"
            strokeWidth="0.9"
            strokeOpacity="0.18"
          />
          <circle
            cx="50%"
            cy="47%"
            r="224"
            fill="none"
            stroke="var(--active-fill)"
            strokeWidth="0.75"
            strokeOpacity="0.11"
          />
          <circle
            cx="50%"
            cy="47%"
            r="316"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="0.65"
            strokeOpacity="0.06"
          />
        </svg>
      </div>

      {/* Center Emblem + Dual Orbital Rings */}
      <div className="animate-preloader-fade-up relative z-10 flex flex-col items-center text-center">
        <div className="relative flex h-[132px] w-[132px] items-center justify-center">
          {/* Outer precision rotating orbital arc */}
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
              strokeWidth="1.15"
              strokeOpacity="0.55"
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

          {/* Inner counter-rotating subtle accent arc */}
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

          {/* Liquid Glass Medallion Container */}
          <div className="animate-orb-pulse flex h-[80px] w-[80px] items-center justify-center rounded-[24px] border border-[var(--glass-border)] bg-[var(--glass-fill)] shadow-[0_18px_40px_-14px_rgba(216,27,120,0.28)] backdrop-blur-xl">
            <BrandGMark className="h-[60px] w-[60px]" />
          </div>
        </div>

        {/* Display Brand Lockup */}
        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl">
          GambleAware
        </h1>
        <p className="mt-1 text-xs font-medium tracking-wide text-[var(--ink-muted)]">
          On-device recovery &amp; betting shield
        </p>

        {/* Hairline Progress Sweep Track */}
        <div
          aria-hidden="true"
          className="mt-5 h-[3px] w-44 overflow-hidden rounded-full bg-[var(--muted-fill)]"
        >
          <div className="animate-preloader-sweep h-full w-full rounded-full bg-[var(--active-fill)]" />
        </div>

        <button
          type="button"
          onClick={handleInstantDismiss}
          className="mt-5 cursor-pointer rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-[var(--ink-muted)] transition-colors hover:bg-[var(--muted-fill)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
