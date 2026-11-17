import React, { useEffect, useState } from 'react';
import { Lock, Shield, Wind } from 'lucide-react';
import { InterventionPayload } from '../data/types';
import { LiquidGlassBackdrop, LiquidGlassCard } from './LiquidGlass';

export const BlockedInterventionModal: React.FC<{
  payload: InterventionPayload;
  cleanDays: number;
  onClose: () => void;
}> = ({ payload, cleanDays, onClose }) => {
  const [isBreathingActive, setIsBreathingActive] = useState(payload.autoStartBreathing);
  const [calmSecondsLeft, setCalmSecondsLeft] = useState(60);

  useEffect(() => {
    if (!isBreathingActive) return;
    if (calmSecondsLeft <= 0) {
      setIsBreathingActive(false);
      return;
    }
    const id = window.setTimeout(() => {
      setCalmSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [isBreathingActive, calmSecondsLeft]);

  const cycleSecond = (60 - calmSecondsLeft) % 12;
  const phaseLabel =
    !isBreathingActive && calmSecondsLeft === 0
      ? 'Reset Complete'
      : !isBreathingActive
        ? '60s Calm Reset'
        : cycleSecond < 4
          ? 'Inhale'
          : cycleSecond < 8
            ? 'Hold'
            : 'Exhale';

  const ringScale = !isBreathingActive
    ? 0.56
    : cycleSecond < 4
      ? 0.94
      : cycleSecond < 8
        ? 0.94
        : 0.52;

  const toggleBreathing = () => {
    if (calmSecondsLeft === 0) {
      setCalmSecondsLeft(60);
      setIsBreathingActive(true);
    } else {
      setIsBreathingActive((prev) => !prev);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <LiquidGlassBackdrop isProtected={true}>
        <div className="flex min-h-screen items-center justify-center px-5 py-6">
          <LiquidGlassCard className="w-full max-w-[460px] p-6">
            <div className="flex flex-col items-center text-center">
              <span className="text-xs font-semibold text-[var(--ink-muted)]">GambleAware</span>

              <div className="mt-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--active-fill)] text-[var(--active-content)]">
                {payload.isAntiTamper ? (
                  <Lock className="h-8 w-8" />
                ) : (
                  <Shield className="h-8 w-8" />
                )}
              </div>

              <h2 className="mt-4 font-display text-2xl font-bold text-[var(--ink)]">
                {payload.isAntiTamper ? 'Uninstall & Tamper Locked' : 'Pause & Breathe'}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                {payload.isAntiTamper
                  ? 'Your GambleAware Commitment Lock prevents removing the app or weakening protection until the timer expires.'
                  : 'GambleAware intercepted this attempt before it could pull you back in. Urges fade within a few minutes.'}
              </p>

              {/* Intercept summary */}
              <div className="mt-5 flex w-full items-center justify-between rounded-[18px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-4 py-3.5 text-left">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-xs font-medium text-[var(--ink-muted)]">
                    {payload.source} • {payload.category}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-[var(--ink)]">
                    {payload.target}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-lg font-bold tabular-nums text-[var(--ink)]">
                    {cleanDays} d
                  </p>
                  <p className="text-[11px] text-[var(--ink-muted)]">Streak</p>
                </div>
              </div>

              {/* Interactive 60s Calm Reset Card */}
              <button
                type="button"
                onClick={toggleBreathing}
                className="mt-3.5 w-full cursor-pointer rounded-[20px] border border-[var(--subtle-border)] bg-[var(--surface)]/75 p-3.5 text-left transition-colors hover:opacity-95"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-[var(--ink)]" />
                    <span className="text-sm font-semibold text-[var(--ink)]">60s Calm Reset</span>
                  </div>
                  <span className="font-mono text-xs text-[var(--ink-muted)]">
                    {isBreathingActive
                      ? `${calmSecondsLeft}s • Tap to pause`
                      : calmSecondsLeft === 0
                        ? 'Completed • Restart'
                        : 'Tap to begin'}
                  </span>
                </div>

                {isBreathingActive || calmSecondsLeft < 60 ? (
                  <div className="mt-3 flex flex-col items-center pb-1">
                    <div className="relative flex h-[108px] w-[108px] items-center justify-center">
                      <svg viewBox="0 0 108 108" className="h-full w-full">
                        <circle
                          cx="54"
                          cy="54"
                          r="48"
                          fill="none"
                          stroke="currentColor"
                          strokeOpacity={0.14}
                          strokeWidth="1"
                        />
                        <circle
                          cx="54"
                          cy="54"
                          r={50 * ringScale}
                          fill="var(--active-fill)"
                          fillOpacity={0.16}
                          stroke="var(--active-fill)"
                          strokeWidth="1.85"
                          style={{ transition: 'r 950ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs font-semibold text-[var(--ink)]">{phaseLabel}</span>
                        <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                          {calmSecondsLeft}s
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="mt-5 h-12 w-full cursor-pointer rounded-full bg-[var(--active-fill)] text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                Return Safely Home
              </button>

              <button
                type="button"
                onClick={onClose}
                className="mt-2.5 h-12 w-full cursor-pointer rounded-full border border-[var(--subtle-border)] text-sm font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
              >
                Open GambleAware
              </button>

              <p className="mt-3.5 text-xs text-[var(--ink-muted)]">
                A product of Imoogle Technology
              </p>
            </div>
          </LiquidGlassCard>
        </div>
      </LiquidGlassBackdrop>
    </div>
  );
};
