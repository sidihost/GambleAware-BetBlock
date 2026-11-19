import React from 'react';
import { AnchorRoute } from '../data/types';

export const LiquidGlassBackdrop: React.FC<{
  isProtected: boolean;
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[var(--canvas)] text-[var(--ink)] transition-colors duration-200">
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
  'data-testid'?: string;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className = '',
  onClick,
  tourKey,
  muted = false,
  'data-testid': dataTestId,
}) => {
  const baseClass = `rounded-2xl border transition-colors duration-150 ${
    muted
      ? 'bg-[var(--muted-fill)] border-[var(--subtle-border)]'
      : 'bg-[var(--surface)] border-[var(--subtle-border)]'
  } ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        data-tour-key={tourKey}
        data-testid={dataTestId}
        className={`${baseClass} w-full cursor-pointer text-left hover:border-[var(--glass-border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]`}
      >
        {children}
      </button>
    );
  }

  return (
    <div data-tour-key={tourKey} data-testid={dataTestId} className={baseClass}>
      {children}
    </div>
  );
};

export const LiquidSectionHeader: React.FC<{
  title: string;
  subtitle?: string;
}> = ({ title, subtitle }) => (
  <div className="w-full">
    <h3 className="font-display text-[15px] font-semibold tracking-tight text-[var(--ink)]">
      {title}
    </h3>
    {subtitle ? (
      <p className="mt-0.5 text-xs leading-snug text-[var(--ink-muted)]">{subtitle}</p>
    ) : null}
  </div>
);

export const LiquidStatusButton: React.FC<{
  label: string;
  isActive: boolean;
  icon: React.ReactNode;
  onClick?: () => void;
}> = ({ label, isActive, icon, onClick }) => {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 hover:opacity-90 ${
          isActive
            ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
            : 'border-[var(--subtle-border)] bg-[var(--muted-fill)] text-[var(--ink-muted)]'
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider uppercase whitespace-nowrap ${
        isActive ? 'text-[var(--accent-ink)]' : 'text-[var(--ink-muted)]'
      }`}
    >
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
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)] ${
      checked
        ? 'border-[var(--active-fill)] bg-[var(--active-fill)]'
        : 'border-[var(--subtle-border)] bg-[var(--muted-fill)]'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full transition-transform duration-150 ${
        checked
          ? 'translate-x-5.5 bg-[var(--active-content)]'
          : 'translate-x-1 bg-[var(--ink-muted)]'
      }`}
    />
  </button>
);

export const LiquidShieldOrb: React.FC<{
  isProtected: boolean;
  isLocked: boolean;
  onClick: () => void;
  sizeClass?: string;
  tourKey?: string;
}> = ({
  isProtected,
  isLocked,
  onClick,
  sizeClass = 'h-[124px] w-[124px]',
  tourKey,
}) => {
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const isMajor = i % 5 === 0;
    const angleRad = ((i * 6 - 90) * Math.PI) / 180;
    const outerR = 78.2;
    const innerR = isMajor ? 69.8 : 74.2;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    const opacity = isProtected
      ? isMajor
        ? 0.92
        : 0.32
      : isMajor
        ? 0.35
        : 0.14;
    return {
      x1: 90 + innerR * cosA,
      y1: 90 + innerR * sinA,
      x2: 90 + outerR * cosA,
      y2: 90 + outerR * sinA,
      strokeWidth: isMajor ? 1.75 : 0.85,
      stroke: isProtected && isMajor ? 'var(--active-fill)' : 'currentColor',
      opacity,
    };
  });

  const emblemStroke = isProtected ? 'var(--active-content)' : 'var(--accent-ink)';

  return (
    <button
      type="button"
      onClick={onClick}
      data-tour-key={tourKey}
      aria-label={isProtected ? 'GambleAware Shield Active — tap to inspect' : 'Activate GambleAware Shield'}
      className={`group relative flex cursor-pointer items-center justify-center rounded-full transition-transform duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--active-fill)] ${sizeClass}`}
    >
      <svg viewBox="0 0 180 180" className="h-full w-full">
        <circle
          cx="90"
          cy="90"
          r="84"
          fill="var(--active-fill)"
          fillOpacity={isProtected ? 0.08 : 0.03}
          className={isProtected ? 'animate-orb-pulse origin-center' : ''}
        />

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

        <circle
          cx="90"
          cy="90"
          r="62"
          fill="var(--active-fill)"
          fillOpacity={isProtected ? 0.13 : 0.05}
        />

        {isLocked ? (
          <circle
            cx="90"
            cy="90"
            r="83.2"
            fill="none"
            stroke="var(--active-fill)"
            strokeOpacity={0.92}
            strokeWidth="1.5"
          />
        ) : null}

        <circle
          cx="90"
          cy="90"
          r="50.5"
          fill={isProtected ? 'var(--active-fill)' : 'var(--muted-fill)'}
          stroke="var(--active-fill)"
          strokeOpacity={isProtected ? 0.72 : 0.35}
          strokeWidth="1.4"
        />
        <circle
          cx="90"
          cy="90"
          r="45.2"
          fill="none"
          stroke={emblemStroke}
          strokeOpacity={isProtected ? 0.24 : 0.16}
          strokeWidth="0.9"
        />

        <g transform="translate(90 90) scale(1.18) translate(-54 -54)">
          <path
            d="M68,36 L63.5,41 L45,41 L41,45 L41,63 L45,67 L63,67 L67.5,71.8 L63.8,74.5 L42,74.5 L33.5,66 L33.5,42 L42,33.5 L64.2,33.5 Z"
            fill={emblemStroke}
          />
          <path
            d="M52,50.5 L74.5,50.5 L74.5,65.5 L67.2,72.5 L67.2,57.5 L48.5,57.5 Z"
            fill={isProtected ? '#FF8CC8' : '#FF3D9A'}
          />
          <path
            d="M70.5,34.5 Q70.5,39.8 75.8,39.8 Q70.5,39.8 70.5,45.1 Q70.5,39.8 65.2,39.8 Q70.5,39.8 70.5,34.5 Z"
            fill={isProtected ? '#FFFFFF' : '#FF3D9A'}
          />
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
    className="fixed right-0 bottom-2 left-0 z-30 flex justify-center px-2.5 md:hidden"
  >
    <div className="w-full max-w-[460px] rounded-2xl border border-[var(--subtle-border)] bg-[var(--glass-fill)] p-1 shadow-md backdrop-blur-md">
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const selected = item.route === selectedRoute;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => onSelect(item.route)}
              className={`flex min-h-[44px] cursor-pointer flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)] ${
                selected
                  ? 'bg-[var(--active-fill)] font-semibold text-[var(--active-content)]'
                  : 'font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              {item.icon}
              <span className="mt-1 shrink-0 text-[10px] leading-none whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  </nav>
);
