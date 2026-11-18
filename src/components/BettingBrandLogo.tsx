import React from 'react';
import {
  BETTING_BRAND_CATALOG,
  BrandGlyphShape,
  ResolvedBrandIdentity,
  resolveBettingBrand,
} from '../blocker/brandCatalog';

export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<
  BrandLogoSize,
  { box: string; svg: string; mono: string; radius: string }
> = {
  xs: { box: 'h-6 w-6', svg: 'h-3.5 w-3.5', mono: 'text-[9px]', radius: 'rounded-[7px]' },
  sm: { box: 'h-8 w-8', svg: 'h-4 w-4', mono: 'text-[10px]', radius: 'rounded-[9px]' },
  md: { box: 'h-10 w-10', svg: 'h-5 w-5', mono: 'text-[11px]', radius: 'rounded-[12px]' },
  lg: { box: 'h-14 w-14', svg: 'h-7 w-7', mono: 'text-sm', radius: 'rounded-[16px]' },
  xl: { box: 'h-[72px] w-[72px]', svg: 'h-9 w-9', mono: 'text-lg', radius: 'rounded-[20px]' },
};

function renderGlyphPath(glyph: BrandGlyphShape, accentColor: string): React.ReactNode {
  switch (glyph) {
    case 'lightning':
      return (
        <path
          d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"
          fill={accentColor}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      );
    case 'ball9':
      return (
        <>
          <circle cx="12" cy="12" r="9" fill="none" stroke={accentColor} strokeWidth="2.2" />
          <circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M15 10c0 3.5-1.6 6-4.2 6.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </>
      );
    case 'crown':
      return (
        <path
          d="M3 18h18l-1.5-10-4.5 4-3-6-3 6-4.5-4L3 18z"
          fill={accentColor}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      );
    case 'diagonal':
      return (
        <>
          <path d="M4 18L18 4" stroke={accentColor} strokeWidth="2.8" strokeLinecap="round" />
          <path d="M7 6l10 12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M17 6L7 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </>
      );
    case 'badge':
      return (
        <>
          <rect x="3" y="5" width="18" height="14" rx="4" fill="none" stroke={accentColor} strokeWidth="2" />
          <path d="M7 12h10" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.2" fill="currentColor" />
        </>
      );
    case 'slash':
      return (
        <>
          <path d="M5 17L11 7h3l-6 10H5z" fill={accentColor} />
          <path d="M11 17L17 7h3l-6 10h-3z" fill="currentColor" />
        </>
      );
    case 'wave':
      return (
        <path
          d="M3 14c2.5-4.5 5-4.5 7.5 0s5 4.5 7.5 0c1-1.8 2-2.8 3-3"
          fill="none"
          stroke={accentColor}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      );
    case 'wing':
      return (
        <path
          d="M3 17l4.5-10L12 13l4.5-6L21 17h-3.5l-1.8-4.2L12 17l-3.7-4.2L6.5 17H3z"
          fill={accentColor}
        />
      );
    case 'paw':
      return (
        <>
          <circle cx="7" cy="8.5" r="1.8" fill={accentColor} />
          <circle cx="12" cy="6.8" r="1.8" fill={accentColor} />
          <circle cx="17" cy="8.5" r="1.8" fill={accentColor} />
          <path
            d="M7.5 16.5c0-2.8 2-4.8 4.5-4.8s4.5 2 4.5 4.8c0 1.4-1.3 2.2-4.5 2.2s-4.5-.8-4.5-2.2z"
            fill={accentColor}
          />
        </>
      );
    case 'star':
      return (
        <path
          d="M12 2.5l2.8 5.9 6.5.9-4.7 4.5 1.1 6.4L12 17.2l-5.7 3 1.1-6.4-4.7-4.5 6.5-.9L12 2.5z"
          fill={accentColor}
        />
      );
    case 'split':
      return (
        <>
          <path d="M5 5h6v14H5z" fill={accentColor} rx="1" />
          <path d="M13 5h6v14h-6z" fill="currentColor" opacity="0.88" />
        </>
      );
    case 'chevron':
      return (
        <>
          <path d="M6 16l6-6 6 6" fill="none" stroke={accentColor} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 11l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 'trophy':
      return (
        <path
          d="M7 4h10v5a5 5 0 01-10 0V4zM5 5h2v3H5a1 1 0 01-1-1V6a1 1 0 011-1zm12 0h2a1 1 0 011 1v1a1 1 0 01-1 1h-2V5zM12 14v5m-4 0h8"
          fill="none"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case 'crest':
      return (
        <path
          d="M12 3l7 3v5c0 4.8-3 8.5-7 10-4-1.5-7-5.2-7-10V6l7-3z"
          fill="none"
          stroke={accentColor}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      );
    case 'octagon':
      return (
        <polygon
          points="8,3 16,3 21,8 21,16 16,21 8,21 3,16 3,8"
          fill="none"
          stroke={accentColor}
          strokeWidth="2.1"
        />
      );
    case 'laurel':
      return (
        <>
          <path d="M7 18c-3-3-3-9 1-13" fill="none" stroke={accentColor} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M17 18c3-3 3-9-1-13" fill="none" stroke={accentColor} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="12" cy="11.5" r="3" fill="currentColor" />
        </>
      );
    case 'clover':
      return (
        <>
          <circle cx="12" cy="7.5" r="3" fill={accentColor} />
          <circle cx="8" cy="13" r="3" fill={accentColor} />
          <circle cx="16" cy="13" r="3" fill={accentColor} />
          <path d="M12 13v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case 'arrows':
      return (
        <>
          <path d="M5 9h12l-3-3m3 3l-3 3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 15H7l3-3m-3 3l3 3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case 'spade':
      return (
        <path
          d="M12 3C8.5 7 5 10.2 5 13.4A3.6 3.6 0 008.6 17c1.3 0 2.4-.6 3.1-1.5L10.5 21h3l-1.2-5.5c.7.9 1.8 1.5 3.1 1.5a3.6 3.6 0 003.6-3.6C19 10.2 15.5 7 12 3z"
          fill={accentColor}
        />
      );
    case 'hexagon':
      return (
        <polygon
          points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5"
          fill="none"
          stroke={accentColor}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      );
    case 'diamond':
      return (
        <polygon
          points="12,2.5 21,12 12,21.5 3,12"
          fill={accentColor}
          fillOpacity="0.92"
        />
      );
  }
}

export const BettingBrandLogo: React.FC<{
  target: string;
  size?: BrandLogoSize;
  showSubBadge?: boolean;
  className?: string;
}> = ({ target, size = 'md', showSubBadge = false, className = '' }) => {
  const identity: ResolvedBrandIdentity = resolveBettingBrand(target);
  const dims = SIZE_CLASSES[size];

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-black/15 shadow-xs select-none dark:border-white/20 ${dims.box} ${dims.radius} ${className}`}
      style={{
        backgroundColor: identity.bgColor,
        color: identity.fgColor,
      }}
      title={identity.displayName}
      aria-label={`${identity.displayName} brand icon`}
    >
      {identity.brand ? (
        <div className="relative flex h-full w-full items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className={`${dims.svg} opacity-95`}
            aria-hidden="true"
          >
            {renderGlyphPath(identity.brand.glyph, identity.accentColor)}
          </svg>
          {size === 'lg' || size === 'xl' ? (
            <span
              className={`absolute right-1 bottom-0.5 rounded px-1 font-mono font-extrabold tracking-tighter uppercase ${
                size === 'xl' ? 'text-[10px]' : 'text-[8px]'
              }`}
              style={{
                backgroundColor: 'rgba(0,0,0,0.55)',
                color: identity.accentColor,
              }}
            >
              {identity.monogram}
            </span>
          ) : null}
        </div>
      ) : (
        <span className={`font-mono font-extrabold tracking-tight ${dims.mono}`}>
          {identity.monogram}
        </span>
      )}

      {showSubBadge && identity.isExactCatalogMatch ? (
        <span
          className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: identity.accentColor }}
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
};

export const FeaturedBrandsWall: React.FC<{
  limit?: number;
  compact?: boolean;
  onSelectDomain?: (domain: string) => void;
}> = ({ limit = 16, compact = false, onSelectDomain }) => {
  const brands = BETTING_BRAND_CATALOG.slice(0, limit);

  return (
    <div
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
    >
      {brands.map((brand) => {
        const inner = (
          <>
            <BettingBrandLogo target={brand.primaryDomain} size={compact ? 'xs' : 'sm'} />
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-xs font-semibold text-[var(--ink)]">{brand.name}</p>
              <p className="truncate font-mono text-[10px] text-[var(--ink-muted)]">
                {brand.primaryDomain}
              </p>
            </div>
          </>
        );

        if (onSelectDomain) {
          return (
            <button
              key={brand.id}
              type="button"
              onClick={() => onSelectDomain(brand.primaryDomain)}
              className="flex cursor-pointer items-center gap-2 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-2.5 py-2 transition-colors hover:bg-[var(--muted-fill)]"
            >
              {inner}
            </button>
          );
        }

        return (
          <div
            key={brand.id}
            className="flex items-center gap-2 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-2.5 py-2"
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
};
