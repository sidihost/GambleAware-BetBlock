import React from 'react';
import { AnchorRoute } from '../data/types';

export const LiquidGlassBackdrop: React.FC<{
  isProtected: boolean;
  children: React.ReactNode;
}> = ({ isProtected, children }) => {
  const ringOpacity = isProtected ? 0.14 : 0.06;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[var(--canvas)] text-[var(--ink)] transition-colors duration-200">
      {/* Drifting Black & Pink liquid organic spheres + orbital hairline rings */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="animate-drift-a absolute -top-24 -right-20 h-[420px] w-[420px] rounded-full opacity-90"
          style={{ backgroundColor: 'var(--blob-one)' }}
        />
        <div
          className="animate-drift-b absolute top-[30%] -left-28 h-[340px] w-[340px] rounded-full opacity-90"
          style={{ backgroundColor: 'var(--blob-two)' }}
        />
        <div
          className="animate-drift-a absolute -bottom-24 right-[15%] h-[440px] w-[440px] rounded-full opacity-90"
          style={{ backgroundColor: 'var(--blob-three)' }}
        />
        <svg className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <circle
            cx="50%"
            cy="24%"
            r="260"
            fill="none"
            stroke="var(--active-fill)"
            strokeWidth="0.85"
            strokeOpacity={ringOpacity}
          />
          <circle
            cx="50%"
            cy="24%"
            r="390"
            fill="none"
            stroke="var(--active-fill)"
            strokeWidth="0.75"
            strokeOpacity={ringOpacity * 0.72}
          />
          <circle
            cx="50%"
            cy="24%"
            r="530"
            fill="none"
            stroke="var(--active-fill)"
            strokeWidth="0.75"
            strokeOpacity={ringOpacity * 0.45}
          />
        </svg>
      </div>
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
};

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  tourKey?: string;
  muted?: boolean;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  onClick,
  tourKey,
  muted = false,
}) => {
  const baseClass = `rounded-[26px] border backdrop-blur-xl transition-colors duration-150 ${
    muted
      ? 'bg-[var(--muted-fill)] border-[var(--subtle-border)]'
      : 'bg-[var(--glass-fill)] border-[var(--glass-border)]'
  } ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        data-tour-key={tourKey}
        className={`${baseClass} w-full text-left cursor-pointer hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]`}
      >
        {children}
      </button>
    );
  }

  return (
    <div data-tour-key={tourKey} className={baseClass}>
      {children}
    </div>
  );
};

export const LiquidSectionHeader: React.FC<{
  title: string;
  subtitle?: string;
}> = ({ title, subtitle }) => (
  <div className="w-full">
    <h3 className="font-display text-base font-semibold tracking-tight text-[var(--ink)]">
      {title}
    </h3>
    {subtitle ? (
      <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-muted)]">{subtitle}</p>
    ) : null}
  </div>
);

export const LiquidStatusButton: React.FC<{
  label: string;
  isActive: boolean;
  icon: React.ReactNode;
  onClick?: () => void;
}> = ({ label, isActive, icon, onClick }) => {
  const classes = `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ${
    isActive
      ? 'bg-[var(--active-fill)] text-[var(--active-content)] border-[var(--active-fill)]'
      : 'bg-[var(--muted-fill)] text-[var(--ink-muted)] border-[var(--subtle-border)]'
  }`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${classes} cursor-pointer hover:opacity-90`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <span className={classes}>
      {icon}
      <span>{label}</span>
    </span>
  );
};

export const LiquidSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}> = ({ checked, onChange, ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)] ${
      checked
        ? 'bg-[var(--active-fill)] border-[var(--active-fill)]'
        : 'bg-[var(--muted-fill)] border-[var(--subtle-border)]'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full transition-transform duration-150 ${
        checked
          ? 'translate-x-6 bg-[var(--active-content)]'
          : 'translate-x-1 bg-[var(--ink-muted)]'
      }`}
    />
  </button>
);

export const LiquidShieldOrb: React.FC<{
  isProtected: boolean;
  isLocked: boolean;
  onClick: () => void;
  tourKey?: string;
}> = ({ isProtected, isLocked, onClick, tourKey }) => {
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const isMajor = i % 5 === 0;
    const angleRad = ((i * 6 - 90) * Math.PI) / 180;
    const outerR = 77.4;
    const innerR = isMajor ? 69.3 : 73.35;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    const opacity = isProtected
      ? isMajor
        ? 0.88
        : 0.32
      : isMajor
        ? 0.35
        : 0.14;
    return {
      x1: 90 + innerR * cosA,
      y1: 90 + innerR * sinA,
      x2: 90 + outerR * cosA,
      y2: 90 + outerR * sinA,
      strokeWidth: isMajor ? 1.6 : 0.85,
      stroke: isProtected && isMajor ? 'var(--active-fill)' : 'currentColor',
      opacity,
    };
  });

  return (
    <button
      type="button"
      onClick={onClick}
      data-tour-key={tourKey}
      aria-label={isProtected ? 'GambleAware Shield Active — tap to manage' : 'Activate GambleAware Shield'}
      className="group relative flex h-[180px] w-[180px] cursor-pointer items-center justify-center rounded-full transition-transform duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--active-fill)]"
    >
      <svg viewBox="0 0 180 180" className="h-full w-full">
        {/* Outer translucent pink aura */}
        <circle
          cx="90"
          cy="90"
          r="84"
          fill="var(--active-fill)"
          fillOpacity={isProtected ? 0.10 : 0.04}
          className={isProtected ? 'animate-orb-pulse origin-center' : ''}
        />

        {/* 60-tick precision chronograph bezel */}
        {ticks.map((t, idx) => (
          <line
            key={idx}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.stroke}
            strokeWidth={t.strokeWidth}
            strokeOpacity={t.opacity}
            strokeLinecap="round"
          />
        ))}

        {/* Inner frosted halo */}
        <circle
          cx="90"
          cy="90"
          r="62"
          fill="var(--active-fill)"
          fillOpacity={isProtected ? 0.16 : 0.06}
        />

        {/* Hardened lock bezel circle */}
        {isLocked ? (
          <circle
            cx="90"
            cy="90"
            r="82.8"
            fill="none"
            stroke="var(--active-fill)"
            strokeOpacity={0.92}
            strokeWidth="1.5"
          />
        ) : null}

        {/* Core Black & Pink orb */}
        <circle
          cx="90"
          cy="90"
          r="50.4"
          fill={isProtected ? 'var(--active-fill)' : 'var(--muted-fill)'}
          stroke="var(--active-fill)"
          strokeOpacity={isProtected ? 0.6 : 0.3}
          strokeWidth="1.35"
        />

        {/* Geometric Anchor & North-Star Compass Crest */}
        <g
          stroke={isProtected ? 'var(--active-content)' : 'var(--accent-ink)'}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="90" cy="74.2" r="4.0" strokeWidth="2.5" />
          <line x1="90" y1="78.5" x2="90" y2="108.5" strokeWidth="2.8" />
          <line x1="78.5" y1="86.5" x2="101.5" y2="86.5" strokeWidth="2.5" />
          <path d="M 71.5 96.5 Q 76 111.5 90 111.5 Q 104 111.5 108.5 96.5" strokeWidth="2.8" />
          <path d="M 68.5 99.5 L 71.5 96.2 L 75.2 98.8" strokeWidth="2.3" />
          <path d="M 111.5 99.5 L 108.5 96.2 L 104.8 98.8" strokeWidth="2.3" />
        </g>
      </svg>
    </button>
  );
};

export interface NavItemConfig {
  route: AnchorRoute;
  label: string;
  icon: React.ReactNode;
}

export const LiquidFloatingNavBar: React.FC<{
  items: NavItemConfig[];
  selectedRoute: AnchorRoute;
  onSelect: (route: AnchorRoute) => void;
}> = ({ items, selectedRoute, onSelect }) => (
  <nav
    aria-label="Primary navigation"
    className="fixed bottom-3 left-0 right-0 z-30 flex justify-center px-3 md:hidden"
  >
    <div className="w-full max-w-[540px] rounded-[30px] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-1.5 backdrop-blur-xl">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const selected = item.route === selectedRoute;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => onSelect(item.route)}
              className={`flex min-h-[48px] cursor-pointer flex-col items-center justify-center rounded-[24px] px-1.5 py-2 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)] ${
                selected
                  ? 'bg-[var(--active-fill)] text-[var(--active-content)] font-semibold'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)] font-medium'
              }`}
            >
              {item.icon}
              <span className="mt-1 text-[10px] leading-none whitespace-nowrap shrink-0">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  </nav>
);
