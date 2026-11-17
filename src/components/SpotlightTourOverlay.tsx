import React, { useEffect, useState } from 'react';
import { Globe, Lock, Search, Shield, TrendingUp, Wind } from 'lucide-react';
import { AnchorRoute } from '../data/types';

export interface SpotlightTourStep {
  id: string;
  route: AnchorRoute;
  targetKey: string;
  badge: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  highlights: string[];
}

export const SPOTLIGHT_TOUR_STEPS: SpotlightTourStep[] = [
  {
    id: 'shield_orb',
    route: 'shield',
    targetKey: 'shield_orb',
    badge: '1 OF 6 • LIVE SHIELD',
    title: 'One-Tap Black & Pink Shield',
    body: "Tap this chronograph orb anytime to inspect or arm GambleAware's zero-VPN Web, Search & App Shield.",
    icon: <Shield className="h-5 w-5" />,
    highlights: ['Zero VPN', 'Instant Blocking'],
  },
  {
    id: 'sos_calm_bar',
    route: 'shield',
    targetKey: 'sos_calm_bar',
    badge: '2 OF 6 • URGE SUPPORT',
    title: 'SOS 60s Calm Reset & Urge Log',
    body: 'Feeling tempted? Start a guided 60-second breathing reset or log a resisted urge to track triggers.',
    icon: <Wind className="h-5 w-5" />,
    highlights: ['60s Breathing', 'Trigger Journal'],
  },
  {
    id: 'filter_tester',
    route: 'shield',
    targetKey: 'filter_tester',
    badge: '3 OF 6 • DEFAULT BLOCKING',
    title: 'SportyBet & 350+ Sites Blocked Live',
    body: 'We auto-selected "sportybet.com" here to show instant blocking. SportyBet, Bet9ja, BetKing, 1xBet, Bet365 & Stake are blocked by default.',
    icon: <Search className="h-5 w-5" />,
    highlights: ['SportyBet', 'Bet9ja', '1xBet', 'Bet365'],
  },
  {
    id: 'blocklist_guards',
    route: 'blocklist',
    targetKey: 'blocklist_guards',
    badge: '4 OF 6 • REAL-TIME GUARDS',
    title: 'WebView, Search & APK Install Guard',
    body: 'Blocks Chrome, Custom Tabs, social WebViews, betting searches & newly installed betting APKs. All 5 gambling categories start ON by default.',
    icon: <Globe className="h-5 w-5" />,
    highlights: ['Search Guard', 'WebView Guard', 'Install Guard'],
  },
  {
    id: 'progress_dashboard',
    route: 'activity',
    targetKey: 'progress_dashboard',
    badge: '5 OF 6 • VISUAL PROGRESS',
    title: 'Betting-Free Days Chart',
    body: 'Scrub across the interactive Black & Pink chart to inspect your betting-free days, money saved in ₦, and milestone badges.',
    icon: <TrendingUp className="h-5 w-5" />,
    highlights: ['Days Clean', 'Milestones', 'Est. Saved'],
  },
  {
    id: 'lock_timer',
    route: 'lock',
    targetKey: 'lock_timer',
    badge: '6 OF 6 • ANTI-UNINSTALL LOCK',
    title: 'Lock Uninstalls Until Timer Ends',
    body: 'Choose 1 to 90 days and enable Device Admin. GambleAware prevents uninstalls or tampering until the countdown reaches zero.',
    icon: <Lock className="h-5 w-5" />,
    highlights: ['Anti-Uninstall', '4-Digit PIN'],
  },
];

export const SpotlightTourOverlay: React.FC<{
  onSelectStep: (step: SpotlightTourStep) => void;
  onDismissTour: () => void;
  onFinishAndEnableShield: () => void;
}> = ({ onSelectStep, onDismissTour, onFinishAndEnableShield }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const step = SPOTLIGHT_TOUR_STEPS[stepIndex];
  const isLastStep = stepIndex === SPOTLIGHT_TOUR_STEPS.length - 1;

  useEffect(() => {
    onSelectStep(step);
    const measure = () => {
      const el = document.querySelector(`[data-tour-key="${step.targetKey}"]`) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setSpotlightRect(rect);
          }
        }, 220);
      } else {
        setSpotlightRect(null);
      }
    };
    const timer = window.setTimeout(measure, 90);
    window.addEventListener('resize', measure);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [step, onSelectStep]);

  const pad = 8;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

  const hole = spotlightRect
    ? {
        left: Math.max(0, spotlightRect.left - pad),
        top: Math.max(0, spotlightRect.top - pad),
        width: Math.min(vw, spotlightRect.width + pad * 2),
        height: Math.min(vh, spotlightRect.height + pad * 2),
      }
    : null;

  const placeBelow = hole
    ? vh - (hole.top + hole.height) >= hole.top || vh - (hole.top + hole.height) > 280
    : true;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="GambleAware Guided Tour"
      className="fixed inset-0 z-50"
    >
      {/* Scrim with spotlight cutout */}
      <svg className="pointer-events-auto fixed inset-0 h-full w-full">
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {hole ? (
              <rect
                x={hole.left}
                y={hole.top}
                width={hole.width}
                height={hole.height}
                rx="24"
                ry="24"
                fill="black"
              />
            ) : null}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.78)"
          mask="url(#tour-spotlight-mask)"
        />
        {hole ? (
          <rect
            x={hole.left}
            y={hole.top}
            width={hole.width}
            height={hole.height}
            rx="24"
            ry="24"
            fill="none"
            stroke="var(--active-fill)"
            strokeWidth="2"
          />
        ) : null}
      </svg>

      {/* Top Skip Bar */}
      <div className="relative z-10 mx-auto flex max-w-[600px] items-center justify-between px-5 pt-4">
        <span className="rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ink)] backdrop-blur-xl">
          GambleAware Tour
        </span>
        <button
          type="button"
          onClick={onDismissTour}
          className="cursor-pointer rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] px-4 py-1.5 text-xs font-semibold text-[var(--ink)] backdrop-blur-xl hover:opacity-90"
        >
          Skip
        </button>
      </div>

      {/* Floating Coachmark Card */}
      <div
        className={`pointer-events-none fixed left-0 right-0 z-10 flex justify-center px-4 ${
          !hole
            ? 'top-1/2 -translate-y-1/2'
            : placeBelow
              ? 'bottom-5'
              : 'top-16'
        }`}
      >
        <div className="pointer-events-auto w-full max-w-[460px] rounded-[28px] border border-[var(--subtle-border)] bg-[var(--surface)] p-5 text-[var(--ink)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--active-fill)] text-[var(--active-content)]">
              {step.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] tracking-wider text-[var(--ink-muted)]">
                {step.badge}
              </p>
              <h2 className="font-display text-base font-bold text-[var(--ink)]">{step.title}</h2>
            </div>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">{step.body}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {step.highlights.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink)]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Step progress indicators */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {SPOTLIGHT_TOUR_STEPS.map((s, idx) => (
              <span
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === stepIndex
                    ? 'w-5 bg-[var(--active-fill)]'
                    : 'w-2 bg-[var(--subtle-border)]'
                }`}
              />
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {isLastStep ? (
              <>
                <button
                  type="button"
                  onClick={onFinishAndEnableShield}
                  className="h-12 w-full cursor-pointer rounded-full bg-[var(--active-fill)] text-sm font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90"
                >
                  Enable Web & App Shield
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                    className="h-11 cursor-pointer rounded-full border border-[var(--subtle-border)] text-sm font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={onDismissTour}
                    className="h-11 cursor-pointer rounded-full border border-[var(--subtle-border)] text-sm font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
                  >
                    Finish
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                {stepIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                    className="h-12 flex-1 cursor-pointer rounded-full border border-[var(--subtle-border)] text-sm font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
                  >
                    Back
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    setStepIndex((i) => Math.min(SPOTLIGHT_TOUR_STEPS.length - 1, i + 1))
                  }
                  className="h-12 flex-[1.4] cursor-pointer rounded-full bg-[var(--active-fill)] text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
