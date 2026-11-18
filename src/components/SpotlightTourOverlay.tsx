import React, { useEffect, useState } from 'react';
import { Globe, LockKeyhole, Search, TrendingUp, Wind } from 'lucide-react';
import { AnchorRoute } from '../data/types';
import { BrandGIcon } from './AppHeader';

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
    badge: '1 of 6 · Shield',
    title: 'Turn Protection On or Off',
    body: 'Tap the GambleAware button anytime to turn your gambling blocker on or check your status.',
    icon: <BrandGIcon className="h-5 w-5" />,
    highlights: ['One-Tap Control', 'Instant Blocking'],
  },
  {
    id: 'sos_calm_bar',
    route: 'shield',
    targetKey: 'sos_calm_bar',
    badge: '2 of 6 · Support',
    title: '60-Second Breather & Victory Log',
    body: 'When you feel tempted, take a 60-second breathing reset or record each urge you beat.',
    icon: <Wind className="h-5 w-5" />,
    highlights: ['60s Breathing', 'Track Wins'],
  },
  {
    id: 'domain_lookup',
    route: 'shield',
    targetKey: 'domain_lookup',
    badge: '3 of 6 · Check Sites',
    title: 'Check or Block Any Website',
    body: 'Type any betting site name to see if it is already blocked or add a new site to your list.',
    icon: <Search className="h-5 w-5" />,
    highlights: ['Quick Check', 'Custom Sites'],
  },
  {
    id: 'blocklist_guards',
    route: 'blocklist',
    targetKey: 'blocklist_guards',
    badge: '4 of 6 · Blocklist',
    title: 'Choose What Stays Blocked',
    body: 'Pick which betting categories, websites, search results, and mobile apps GambleAware blocks for you.',
    icon: <Globe className="h-5 w-5" />,
    highlights: ['Websites', 'Search Results', 'Betting Apps'],
  },
  {
    id: 'progress_dashboard',
    route: 'activity',
    targetKey: 'progress_dashboard',
    badge: '5 of 6 · Progress',
    title: 'See Days Clean & Money Saved',
    body: 'Watch your betting-free streak grow, see blocked attempts, and track how much Naira you have saved.',
    icon: <TrendingUp className="h-5 w-5" />,
    highlights: ['Days Clean', 'Goals', '₦ Saved'],
  },
  {
    id: 'lock_timer',
    route: 'lock',
    targetKey: 'lock_timer',
    badge: '6 of 6 · Lock Timer',
    title: 'Set a Protection Timer',
    body: 'Choose 1 day to 2 years to lock your blocker and PIN so you cannot switch protection off mid-urge.',
    icon: <LockKeyhole className="h-5 w-5" />,
    highlights: ['Lock Timer', '4-Digit PIN'],
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
        <span className="font-mono text-xs font-semibold tracking-wider text-white uppercase">
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
        <div className="pointer-events-auto w-full max-w-[420px] rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-4 text-[var(--ink)] sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--active-fill)] text-[var(--active-content)]">
              {step.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] tracking-wider text-[var(--ink-muted)]">
                {step.badge}
              </p>
              <h2 className="font-display text-[15px] font-bold text-[var(--ink)]">{step.title}</h2>
            </div>
          </div>

          <p className="mt-2.5 text-xs leading-relaxed text-[var(--ink-muted)] sm:text-sm">{step.body}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] font-semibold text-[var(--accent-ink)]">
            {step.highlights.map((tag, idx) => (
              <span key={tag}>
                {idx > 0 ? '· ' : ''}
                {tag}
              </span>
            ))}
          </div>

          {/* Step progress indicators */}
          <div className="mt-3.5 flex items-center justify-center gap-1.5">
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

          <div className="mt-3.5 space-y-2">
            {isLastStep ? (
              <>
                <button
                  type="button"
                  onClick={onFinishAndEnableShield}
                  className="h-10 w-full cursor-pointer rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90 sm:text-sm"
                >
                  Enable Web & App Shield
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                    className="h-9 cursor-pointer rounded-full border border-[var(--subtle-border)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)] sm:text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={onDismissTour}
                    className="h-9 cursor-pointer rounded-full border border-[var(--subtle-border)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)] sm:text-sm"
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
                    className="h-10 flex-1 cursor-pointer rounded-full border border-[var(--subtle-border)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)] sm:text-sm"
                  >
                    Back
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    setStepIndex((i) => Math.min(SPOTLIGHT_TOUR_STEPS.length - 1, i + 1))
                  }
                  className="h-10 flex-[1.4] cursor-pointer rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90 sm:text-sm"
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
