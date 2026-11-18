import React from 'react';
import {
  BETTING_BRAND_CATALOG,
  ResolvedBrandIdentity,
  resolveBettingBrand,
} from '../blocker/brandCatalog';
import { GAMBLING_CATEGORY_META } from '../blocker/gamblingCategory';

export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<
  BrandLogoSize,
  { box: string; svg: string; mono: string; radius: string }
> = {
  xs: { box: 'h-6 w-6', svg: 'h-6 w-6', mono: 'text-[9px]', radius: 'rounded-md' },
  sm: { box: 'h-8 w-8', svg: 'h-8 w-8', mono: 'text-[10px]', radius: 'rounded-lg' },
  md: { box: 'h-9 w-9', svg: 'h-9 w-9', mono: 'text-[11px]', radius: 'rounded-xl' },
  lg: { box: 'h-12 w-12', svg: 'h-12 w-12', mono: 'text-sm', radius: 'rounded-2xl' },
  xl: { box: 'h-16 w-16', svg: 'h-16 w-16', mono: 'text-lg', radius: 'rounded-2xl' },
};

/**
 * Renders authentic per-brand vector SVG logos inside a 32x32 coordinate system
 * tailored to each betting platform's real visual identity.
 */
function renderAuthenticBrandSvg(
  brandId: string,
  accentColor: string,
  fgColor: string,
): React.ReactNode {
  switch (brandId) {
    case 'sportybet':
      // SportyBet: Exact official red badge (#E41827) with signature white 'S' & two offset dots
      return (
        <g transform="translate(7.97 5.85) scale(0.058)">
          <path
            d="M164 86c-14 0-25-2-33 2-9 6-19 17-20 27-2 5 13 15 23 19 7 3 17 1 25 1 72 1 114 63 90 130-18 48-63 77-119 76l-17-76c12-1 24 1 32-4 10-6 16-17 24-26-10-6-18-14-28-19-6-3-15-1-23-1-62-3-99-43-96-101C25 58 79 4 132 7c6 1 16 8 17 14 7 20 10 41 15 65z"
            fill="#FFFFFF"
          />
          <path
            d="M92 303c1 25-21 47-46 47-24 0-45-21-46-45s18-45 43-46c26-2 48 19 49 44z"
            fill="#FFFFFF"
          />
          <path
            d="M277 44c1 26-20 48-45 48-24 0-44-20-45-45-1-26 19-47 45-47 25 0 44 19 45 44z"
            fill="#FFFFFF"
          />
        </g>
      );

    case 'bet9ja':
      // Bet9ja: Signature green with bold yellow '9', crisp white 'ja', and red accent swoosh
      return (
        <g>
          <path
            d="M6 22.8c5.8 2.4 13.8 2.2 19.8-.5"
            fill="none"
            stroke="#EF4444"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <text
            x="10.2"
            y="19.5"
            textAnchor="middle"
            fill="#F5C518"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontStyle="italic"
            fontSize="16.5"
          >
            9
          </text>
          <text
            x="20.4"
            y="19.2"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial, sans-serif"
            fontWeight="800"
            fontStyle="italic"
            fontSize="11.5"
          >
            ja
          </text>
        </g>
      );

    case 'betking':
      // BetKing: Royal navy with golden 3-point crown above bold 'BK' wordmark
      return (
        <g>
          <path
            d="M9 13.2h14l1.1-5.4-3.7 2.8-4.4-4-4.4 4-3.7-2.8 1.1 5.4z"
            fill="#F6A800"
          />
          <text
            x="16"
            y="24.2"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="11"
            letterSpacing="0.5"
          >
            BK
          </text>
        </g>
      );

    case '1xbet':
      // 1xBet: Crisp white '1' paired with iconic tilted sky-blue 'X'
      return (
        <g>
          <path
            d="M7.2 10.6L11.2 8.2V23.8H8V12.5l-1.9 1.1 1.1-3z"
            fill="#FFFFFF"
          />
          <path
            d="M14.3 9.2h3.8l3 4.9 3.5-4.9h3.5l-5.2 7 5.2 7.6h-3.8l-3.3-5.2-3.7 5.2h-3.4l5.4-7.4-5-7.2z"
            fill="#38BDF8"
          />
        </g>
      );

    case 'bet365':
      // Bet365: Iconic deep green tile with crisp white 'bet' + vibrant yellow '365'
      return (
        <g>
          <text
            x="16"
            y="14.2"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial, sans-serif"
            fontWeight="800"
            fontSize="10"
            letterSpacing="-0.2"
          >
            bet
          </text>
          <text
            x="16"
            y="24.5"
            textAnchor="middle"
            fill="#FFDF1B"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="11.2"
            letterSpacing="-0.4"
          >
            365
          </text>
        </g>
      );

    case 'betway':
      // Betway: Dark obsidian with crisp white 'b' + signature emerald green solid dot
      return (
        <g>
          <text
            x="12.5"
            y="22.2"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="17"
          >
            b
          </text>
          <circle cx="22.5" cy="18.8" r="4.1" fill="#00A826" />
        </g>
      );

    case 'stake':
      // Stake: Deep slate-navy with signature italic cursive 'S' ribbon + neon green spark dot
      return (
        <g>
          <path
            d="M22.2 8.8c-1.8-1-4.8-1.2-7.1-.1-2.5 1.2-3.4 3.5-2.1 5.1 1 1.2 2.9 1.6 4.7 2.1 2 .5 2.7 1.1 2.4 2.3-.3 1.2-1.8 1.9-3.6 1.8-1.9-.1-3.4-.9-4.5-1.9l-2 2.6c1.5 1.4 3.9 2.3 6.5 2.3 3.6 0 6.5-1.7 7-4.5.4-2.3-.9-3.9-3.6-4.7-1.9-.5-3.4-.9-3.4-1.9 0-.9 1.1-1.5 2.6-1.4 1.3.1 2.4.5 3.3 1.1l-.2-2.8z"
            fill="#FFFFFF"
          />
          <circle cx="23.5" cy="23.2" r="2.1" fill="#00E701" />
        </g>
      );

    case 'msport':
      // MSport: Bold yellow angular double-wing geometric 'M' emblem
      return (
        <g>
          <path
            d="M5.5 23.2L9.8 8.8h4l2.2 6.8 2.2-6.8h4l4.3 14.4h-3.9l-2.3-8.1-2.6 7.1h-3.4l-2.6-7.1-2.3 8.1H5.5z"
            fill="#FACC15"
          />
          <path d="M8.5 24.8h15" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
        </g>
      );

    case 'betpawa':
      // betPawa: Dark base with neon-lime 'bP' + signature paw accent
      return (
        <g>
          <text
            x="15.2"
            y="22.4"
            textAnchor="middle"
            fill="#9EE01A"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="14.5"
            letterSpacing="-0.6"
          >
            bP
          </text>
          <circle cx="24.2" cy="8.2" r="1.4" fill="#9EE01A" />
          <circle cx="26.8" cy="10.4" r="1.2" fill="#9EE01A" />
          <circle cx="22.1" cy="10.4" r="1.2" fill="#9EE01A" />
        </g>
      );

    case 'bangbet':
      // BangBet: Royal blue with energetic orange/white 'BB' emblem & flash spark
      return (
        <g>
          <text
            x="15.5"
            y="21.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="13.5"
            letterSpacing="-0.5"
          >
            BB
          </text>
          <path d="M23.5 6.5l1.1 2.2 2.4.4-1.7 1.7.4 2.4-2.2-1.1-2.2 1.1.4-2.4-1.7-1.7 2.4-.4 1.1-2.2z" fill="#F97316" />
        </g>
      );

    case 'paripesa':
      // PariPesa: Split royal blue + emerald green diagonal shield with 'PP'
      return (
        <g>
          <path d="M0 24L32 8v24H0V24z" fill="#15803D" opacity="0.45" />
          <text
            x="16"
            y="21.2"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="13.5"
          >
            PP
          </text>
          <circle cx="24.5" cy="9" r="2.2" fill="#22C55E" />
        </g>
      );

    case '22bet':
      // 22Bet: Deep emerald green with bold crisp white '22' + crimson sports stripe
      return (
        <g>
          <path d="M4 23.8L28 21v2.8H4z" fill="#E11D48" />
          <text
            x="16"
            y="19.8"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontStyle="italic"
            fontSize="14.5"
            letterSpacing="-0.5"
          >
            22
          </text>
        </g>
      );

    case 'melbet':
      // MelBet: Charcoal black with iconic gold 'M' crown-ribbon + white accent
      return (
        <g>
          <path
            d="M5.5 22.5V10.2h4.2l6.3 7.2 6.3-7.2h4.2v12.3h-3.6v-7l-6.9 7.4-6.9-7.4v7H5.5z"
            fill="#F59E0B"
          />
          <rect x="6" y="7" width="20" height="1.8" rx="0.9" fill="#FFFFFF" opacity="0.85" />
        </g>
      );

    case 'betwinner':
      // BetWinner: Emerald green with golden 'BW' and victory laurel arc
      return (
        <g>
          <path
            d="M7.5 23.2c4.5 2.4 12.5 2.4 17 0"
            fill="none"
            stroke="#FBBF24"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <text
            x="16"
            y="19.8"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="12.5"
          >
            BW
          </text>
          <circle cx="16" cy="7.5" r="1.8" fill="#FBBF24" />
        </g>
      );

    case 'parimatch':
      // Parimatch: Iconic black with slanted neon-yellow 'PM' stripes
      return (
        <g>
          <path d="M4 6.5h24L25.5 11H4V6.5z" fill="#FFE600" />
          <text
            x="16"
            y="24.5"
            textAnchor="middle"
            fill="#FFE600"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontStyle="italic"
            fontSize="13.2"
          >
            PM
          </text>
        </g>
      );

    case 'nairabet':
      // NairaBet: Heritage Nigerian green with crisp white+mint '₦B' mark
      return (
        <g>
          <rect x="4.5" y="4.5" width="23" height="23" rx="6" fill="none" stroke="#4ADE80" strokeWidth="1.5" />
          <text
            x="16"
            y="20.6"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="13"
          >
            ₦B
          </text>
        </g>
      );

    case 'merrybet':
      // MerryBet: Bold crimson badge with gold crest & 'MB'
      return (
        <g>
          <path
            d="M16 4.5l9.5 3.5v7.5c0 5.6-3.9 9.7-9.5 11.8-5.6-2.1-9.5-6.2-9.5-11.8V8L16 4.5z"
            fill="none"
            stroke="#FDE047"
            strokeWidth="1.7"
          />
          <text
            x="16"
            y="19.8"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="11.2"
          >
            MB
          </text>
        </g>
      );

    case 'hollywoodbets':
      // Hollywoodbets: Signature purple badge with golden Hollywood star & bold 'H'
      return (
        <g>
          <path
            d="M16 4.8l2 4.2 4.6.6-3.3 3.2.8 4.6-4.1-2.2-4.1 2.2.8-4.6-3.3-3.2 4.6-.6 2-4.2z"
            fill="#FACC15"
            opacity="0.92"
          />
          <text
            x="16"
            y="26.8"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="10.5"
            letterSpacing="0.5"
          >
            HB
          </text>
        </g>
      );

    case 'draftkings':
      // DraftKings: Signature dark badge with neon-green 3-point crown + crisp 'DK'
      return (
        <g>
          <path
            d="M9.5 12.8h13l1.2-5.3-3.8 2.8L16 6l-3.9 4.3-3.8-2.8 1.2 5.3z"
            fill="#61B510"
          />
          <text
            x="16"
            y="24.2"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="11.5"
          >
            DK
          </text>
        </g>
      );

    case 'fanduel':
      // FanDuel: Signature bright sky-blue shield with crisp white 'FD' crest
      return (
        <g>
          <path
            d="M16 4.5l10 3.4v7.6c0 5.8-4.2 9.8-10 11.8-5.8-2-10-6-10-11.8V7.9l10-3.4z"
            fill="#FFFFFF"
            fillOpacity="0.18"
            stroke="#FFFFFF"
            strokeWidth="1.6"
          />
          <text
            x="16"
            y="20.4"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="11.5"
          >
            FD
          </text>
        </g>
      );

    case 'betmgm':
      // BetMGM: Black & champagne-gold luxury octagon crest with bold 'MGM'
      return (
        <g>
          <polygon
            points="10,4.5 22,4.5 27.5,10 27.5,22 22,27.5 10,27.5 4.5,22 4.5,10"
            fill="none"
            stroke="#C5A059"
            strokeWidth="1.7"
          />
          <text
            x="16"
            y="19.6"
            textAnchor="middle"
            fill="#C5A059"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="8.8"
            letterSpacing="0.4"
          >
            MGM
          </text>
        </g>
      );

    case 'caesars':
      // Caesars: Classic green & gold Roman laurel wreath with 'C'
      return (
        <g>
          <path
            d="M10.2 23.2c-3.8-3.4-4-10.6.5-15.2"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M21.8 23.2c3.8-3.4 4-10.6-.5-15.2"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <text
            x="16"
            y="20.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Georgia, serif"
            fontWeight="900"
            fontSize="12.5"
          >
            C
          </text>
        </g>
      );

    case 'williamhill':
      // William Hill: Royal navy & gold stripe heritage badge with 'WH'
      return (
        <g>
          <rect x="4" y="6" width="24" height="2.4" rx="1.2" fill="#FFD100" />
          <rect x="4" y="23.6" width="24" height="2.4" rx="1.2" fill="#FFD100" />
          <text
            x="16"
            y="20.2"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="11.5"
          >
            WH
          </text>
        </g>
      );

    case 'ladbrokes':
      // Ladbrokes: Classic bright crimson tile with crisp white geometric 'L' ticket badge
      return (
        <g>
          <rect x="4.5" y="4.5" width="23" height="23" rx="5" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeOpacity="0.45" />
          <path d="M10.5 8.5h4.2v11.2h7.6v3.8H10.5V8.5z" fill="#FFFFFF" />
        </g>
      );

    case 'paddypower':
      // Paddy Power: Irish emerald with crisp white 3-leaf shamrock + 'PP'
      return (
        <g>
          <circle cx="16" cy="9.5" r="2.8" fill="#A7F3D0" />
          <circle cx="12.4" cy="13.5" r="2.8" fill="#A7F3D0" />
          <circle cx="19.6" cy="13.5" r="2.8" fill="#A7F3D0" />
          <path d="M16 14v4" stroke="#A7F3D0" strokeWidth="1.8" strokeLinecap="round" />
          <text
            x="16"
            y="26.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="9.5"
          >
            PP
          </text>
        </g>
      );

    case 'betfair':
      // Betfair: Signature gold-yellow badge with iconic bold black opposing exchange arrows
      return (
        <g>
          <path d="M10.5 7.5v11.5H7.2l4.8 5.8 4.8-5.8h-3.3V7.5h-3z" fill="#111111" />
          <path d="M21.5 24.5V13h3.3l-4.8-5.8-4.8 5.8h3.3v11.5h3z" fill="#111111" />
        </g>
      );

    case 'pokerstars':
      // PokerStars: Iconic crimson spade containing a crisp white 5-point star
      return (
        <g>
          <path
            d="M16 4.2c-4.8 5.4-9.5 9.6-9.5 14a4.8 4.8 0 004.8 4.8c1.7 0 3.2-.8 4.1-2L13.8 27h4.4l-1.6-6c.9 1.2 2.4 2 4.1 2a4.8 4.8 0 004.8-4.8c0-4.4-4.7-8.6-9.5-14z"
            fill="#E11D48"
          />
          <path
            d="M16 11.2l1.2 2.6 2.9.4-2.1 2 .5 2.9-2.5-1.4-2.5 1.4.5-2.9-2.1-2 2.9-.4 1.2-2.6z"
            fill="#FFFFFF"
          />
        </g>
      );

    case 'roobet':
      // Roobet: Deep purple with golden crown + bold 'R'
      return (
        <g>
          <path d="M10.5 10.5h11l.8-3.8-2.9 2L16 5.5l-3.4 3.2-2.9-2 .8 3.8z" fill="#E8A838" />
          <text
            x="16"
            y="24.2"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="13.5"
          >
            R
          </text>
        </g>
      );

    case 'rollbit':
      // Rollbit: Dark slate with indigo isometric hex & bold 'RB'
      return (
        <g>
          <polygon
            points="16,4.2 26.2,10 26.2,22 16,27.8 5.8,22 5.8,10"
            fill="#6366F1"
            fillOpacity="0.24"
            stroke="#818CF8"
            strokeWidth="1.6"
          />
          <text
            x="16"
            y="20.2"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="11"
          >
            RB
          </text>
        </g>
      );

    case 'bcgame':
      // BC.Game: Charcoal obsidian with signature electric-mint hex shield + 'BC'
      return (
        <g>
          <polygon
            points="16,4.2 26,9.8 26,22.2 16,27.8 6,22.2 6,9.8"
            fill="none"
            stroke="#24EE89"
            strokeWidth="2"
          />
          <text
            x="16"
            y="20.2"
            textAnchor="middle"
            fill="#24EE89"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="11.5"
          >
            BC
          </text>
        </g>
      );

    case 'prizepicks':
      // PrizePicks: Deep violet with neon lavender diamond crest + 'P'
      return (
        <g>
          <polygon
            points="16,4 27.5,16 16,28 4.5,16"
            fill="#8B5CF6"
            fillOpacity="0.28"
            stroke="#A78BFA"
            strokeWidth="1.7"
          />
          <text
            x="16"
            y="20.5"
            textAnchor="middle"
            fill="#FFFFFF"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="12.8"
          >
            P
          </text>
        </g>
      );

    case 'underdogfantasy':
      // Underdog: Charcoal obsidian with vibrant gold-yellow shield & bold 'UD'
      return (
        <g>
          <path
            d="M7 7.5h18v10c0 4.8-3.8 8.3-9 10-5.2-1.7-9-5.2-9-10v-10z"
            fill="#FACC15"
          />
          <text
            x="16"
            y="20.5"
            textAnchor="middle"
            fill="#18181B"
            fontFamily="Outfit, Arial Black, sans-serif"
            fontWeight="900"
            fontSize="11"
          >
            UD
          </text>
        </g>
      );

    default:
      return (
        <text
          x="16"
          y="20.5"
          textAnchor="middle"
          fill={accentColor || fgColor}
          fontFamily="Outfit, Arial Black, sans-serif"
          fontWeight="900"
          fontSize="12"
        >
          {brandId.slice(0, 2).toUpperCase()}
        </text>
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
        <svg viewBox="0 0 32 32" className={dims.svg} aria-hidden="true">
          {renderAuthenticBrandSvg(identity.brand.id, identity.accentColor, identity.fgColor)}
        </svg>
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {brands.map((brand) => {
        const inner = (
          <>
            <BettingBrandLogo target={brand.primaryDomain} size={compact ? 'xs' : 'sm'} />
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-xs font-semibold text-[var(--ink)]">{brand.name}</p>
              <p className="truncate font-mono text-[10px] text-[var(--ink-muted)]">
                {GAMBLING_CATEGORY_META[brand.category].displayName.split(' ')[0]} · {brand.region}
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
              className="flex min-w-0 cursor-pointer items-center gap-2 rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-2.5 py-2 transition-colors hover:bg-[var(--muted-fill)]"
            >
              {inner}
            </button>
          );
        }

        return (
          <div
            key={brand.id}
            className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-2.5 py-2"
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
};
