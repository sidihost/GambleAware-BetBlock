import { GamblingCategory } from './gamblingCategory';

export type BrandGlyphShape =
  | 'lightning'
  | 'ball9'
  | 'crown'
  | 'diagonal'
  | 'badge'
  | 'slash'
  | 'wave'
  | 'wing'
  | 'paw'
  | 'star'
  | 'split'
  | 'chevron'
  | 'trophy'
  | 'crest'
  | 'octagon'
  | 'laurel'
  | 'clover'
  | 'arrows'
  | 'spade'
  | 'hexagon'
  | 'diamond';

export interface BettingBrandMeta {
  id: string;
  name: string;
  primaryDomain: string;
  aliases: string[];
  category: GamblingCategory;
  region: string;
  bgColor: string;
  accentColor: string;
  fgColor: string;
  monogram: string;
  glyph: BrandGlyphShape;
}

export const BETTING_BRAND_CATALOG: BettingBrandMeta[] = [
  {
    id: 'sportybet',
    name: 'SportyBet',
    primaryDomain: 'sportybet.com',
    aliases: ['sportybet.ng', 'sportybet.com.gh', 'sportybet.co.ke', 'sportybet.co.tz', 'sportybet.co.zm', 'sportybet.ug', 'sporty.com', 'sportycasino.com'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'Africa / Global',
    bgColor: '#E41827',
    accentColor: '#FFFFFF',
    fgColor: '#FFFFFF',
    monogram: 'S',
    glyph: 'lightning',
  },
  {
    id: 'bet9ja',
    name: 'Bet9ja',
    primaryDomain: 'bet9ja.com',
    aliases: ['bet9ja.ng', 'web.bet9ja.com', 'sports.bet9ja.com', 'vsmobile.bet9ja.com', 'casino.bet9ja.com', 'bet9jaagent.com'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'Nigeria',
    bgColor: '#107C41',
    accentColor: '#F5C518',
    fgColor: '#FFFFFF',
    monogram: '9ja',
    glyph: 'ball9',
  },
  {
    id: 'betking',
    name: 'BetKing',
    primaryDomain: 'betking.com',
    aliases: ['betking.ng', 'virtual.betking.com'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'Nigeria',
    bgColor: '#0B2C5F',
    accentColor: '#F6A800',
    fgColor: '#FFFFFF',
    monogram: 'BK',
    glyph: 'crown',
  },
  {
    id: '1xbet',
    name: '1xBet',
    primaryDomain: '1xbet.com',
    aliases: ['1xbet.ng', '1xbet.co.ke', '1xbet.com.gh', '1xbet.co.zm', '1xbet.ci', '1xbet.sn', '1xbet.cm', '1xbet.in', '1xbit.com', '1xslot.com'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'Global',
    bgColor: '#1A56DB',
    accentColor: '#38BDF8',
    fgColor: '#FFFFFF',
    monogram: '1X',
    glyph: 'diagonal',
  },
  {
    id: 'bet365',
    name: 'Bet365',
    primaryDomain: 'bet365.com',
    aliases: ['bet365.ng', 'bet365.co.za', 'bet365.es', 'bet365.it', 'bet365.com.au', 'bet365.ca', 'bet365casino.com'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'UK / Global',
    bgColor: '#027B5B',
    accentColor: '#FFDF1B',
    fgColor: '#FFFFFF',
    monogram: '365',
    glyph: 'badge',
  },
  {
    id: 'betway',
    name: 'Betway',
    primaryDomain: 'betway.com',
    aliases: ['betway.com.ng', 'betway.co.za', 'betway.co.uk', 'betway.com.gh', 'betway.co.ke', 'betway.co.tz', 'betway.co.zm', 'betway.ug'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'Africa / UK',
    bgColor: '#111827',
    accentColor: '#00A826',
    fgColor: '#FFFFFF',
    monogram: 'bw',
    glyph: 'slash',
  },
  {
    id: 'stake',
    name: 'Stake',
    primaryDomain: 'stake.com',
    aliases: ['stake.us', 'stake.bet', 'stake.games', 'stake.ac', 'stake.com.br', 'stake.jp', 'stake.kim'],
    category: GamblingCategory.CRYPTO_BETTING,
    region: 'Crypto / Global',
    bgColor: '#0F212E',
    accentColor: '#00E701',
    fgColor: '#FFFFFF',
    monogram: 'S',
    glyph: 'wave',
  },
  {
    id: 'msport',
    name: 'MSport',
    primaryDomain: 'msport.com',
    aliases: ['msport.ng', 'msport.co.ke', 'msport.com.gh', 'msport.co.ug', 'msport.co.zm'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'Africa',
    bgColor: '#111318',
    accentColor: '#FACC15',
    fgColor: '#FFFFFF',
    monogram: 'M',
    glyph: 'wing',
  },
  {
    id: 'betpawa',
    name: 'betPawa',
    primaryDomain: 'betpawa.com',
    aliases: ['betpawa.ng', 'betpawa.co.ke', 'betpawa.com.gh', 'betpawa.ug', 'betpawa.co.tz', 'betpawa.co.zm', 'betpawa.rw', 'betpawa.cm'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'Africa',
    bgColor: '#111827',
    accentColor: '#9EE01A',
    fgColor: '#FFFFFF',
    monogram: 'bP',
    glyph: 'paw',
  },
  {
    id: 'bangbet',
    name: 'BangBet',
    primaryDomain: 'bangbet.com',
    aliases: ['bangbet.ng', 'bangbet.co.ke', 'bangbet.com.gh', 'bangbet.co.ug'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'Africa',
    bgColor: '#1B3B82',
    accentColor: '#F97316',
    fgColor: '#FFFFFF',
    monogram: 'BB',
    glyph: 'star',
  },
  {
    id: 'paripesa',
    name: 'PariPesa',
    primaryDomain: 'paripesa.com',
    aliases: ['paripesa.ng', 'paripesa.co.ke', 'paripesa.bet', 'paripesa.cm', 'paripesa.gh'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'Africa / Global',
    bgColor: '#1E3A8A',
    accentColor: '#22C55E',
    fgColor: '#FFFFFF',
    monogram: 'PP',
    glyph: 'split',
  },
  {
    id: '22bet',
    name: '22Bet',
    primaryDomain: '22bet.com',
    aliases: ['22bet.ng', '22bet.co.ke', '22bet.com.gh', '22bet.co.tz', '22bet.co.zm', '22bet.ug', '22bet.in'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'Global',
    bgColor: '#0A3622',
    accentColor: '#E11D48',
    fgColor: '#FFFFFF',
    monogram: '22',
    glyph: 'chevron',
  },
  {
    id: 'melbet',
    name: 'MelBet',
    primaryDomain: 'melbet.com',
    aliases: ['melbet.ng', 'melbet.co.ke', 'melbet.com.gh', 'melbet.in', 'melbet.eg'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'Global',
    bgColor: '#171717',
    accentColor: '#F59E0B',
    fgColor: '#FFFFFF',
    monogram: 'MB',
    glyph: 'chevron',
  },
  {
    id: 'betwinner',
    name: 'BetWinner',
    primaryDomain: 'betwinner.com',
    aliases: ['betwinner.ng', 'betwinner.ke', 'betwinner.gh', 'betwinner.in'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'Global',
    bgColor: '#064E3B',
    accentColor: '#FBBF24',
    fgColor: '#FFFFFF',
    monogram: 'BW',
    glyph: 'trophy',
  },
  {
    id: 'parimatch',
    name: 'Parimatch',
    primaryDomain: 'parimatch.com',
    aliases: ['parimatch.ng', 'parimatch.co.tz', 'parimatch.in', 'parimatch.co.uk', 'parimatch.global'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'Europe / Africa',
    bgColor: '#111111',
    accentColor: '#FFE600',
    fgColor: '#FFFFFF',
    monogram: 'PM',
    glyph: 'slash',
  },
  {
    id: 'nairabet',
    name: 'NairaBet',
    primaryDomain: 'nairabet.com',
    aliases: ['nairabet.ng'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'Nigeria',
    bgColor: '#14532D',
    accentColor: '#4ADE80',
    fgColor: '#FFFFFF',
    monogram: 'NB',
    glyph: 'crest',
  },
  {
    id: 'merrybet',
    name: 'MerryBet',
    primaryDomain: 'merrybet.com',
    aliases: ['merrybet.ng'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'Nigeria',
    bgColor: '#991B1B',
    accentColor: '#FDE047',
    fgColor: '#FFFFFF',
    monogram: 'MB',
    glyph: 'crest',
  },
  {
    id: 'hollywoodbets',
    name: 'Hollywoodbets',
    primaryDomain: 'hollywoodbets.net',
    aliases: ['hollywoodbets.co.uk'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'South Africa / UK',
    bgColor: '#4C1D95',
    accentColor: '#FACC15',
    fgColor: '#FFFFFF',
    monogram: 'H',
    glyph: 'star',
  },
  {
    id: 'draftkings',
    name: 'DraftKings',
    primaryDomain: 'draftkings.com',
    aliases: ['sportsbook.draftkings.com'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'North America',
    bgColor: '#111827',
    accentColor: '#61B510',
    fgColor: '#FFFFFF',
    monogram: 'DK',
    glyph: 'crown',
  },
  {
    id: 'fanduel',
    name: 'FanDuel',
    primaryDomain: 'fanduel.com',
    aliases: ['sportsbook.fanduel.com', 'fanduelracing.com'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'North America',
    bgColor: '#1493FF',
    accentColor: '#FFFFFF',
    fgColor: '#FFFFFF',
    monogram: 'FD',
    glyph: 'crest',
  },
  {
    id: 'betmgm',
    name: 'BetMGM',
    primaryDomain: 'betmgm.com',
    aliases: ['sports.betmgm.com', 'betmgmcasino.com', 'betmgmpoker.com'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'North America',
    bgColor: '#141414',
    accentColor: '#C5A059',
    fgColor: '#FFFFFF',
    monogram: 'MGM',
    glyph: 'octagon',
  },
  {
    id: 'caesars',
    name: 'Caesars',
    primaryDomain: 'caesars.com',
    aliases: ['caesarssportsbook.com', 'caesars.co.uk'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'North America',
    bgColor: '#0D3B26',
    accentColor: '#D4AF37',
    fgColor: '#FFFFFF',
    monogram: 'CZR',
    glyph: 'laurel',
  },
  {
    id: 'williamhill',
    name: 'William Hill',
    primaryDomain: 'williamhill.com',
    aliases: ['williamhill.us', 'williamhill.co.uk', 'vegas.williamhill.com'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'UK / Europe',
    bgColor: '#00205B',
    accentColor: '#FFD100',
    fgColor: '#FFFFFF',
    monogram: 'WH',
    glyph: 'crest',
  },
  {
    id: 'ladbrokes',
    name: 'Ladbrokes',
    primaryDomain: 'ladbrokes.com',
    aliases: ['ladbrokes.com.au', 'ladbrokes.be', 'ladbrokescasino.com', 'ladbrokesbingo.com'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'UK / Australia',
    bgColor: '#D3141E',
    accentColor: '#FFFFFF',
    fgColor: '#FFFFFF',
    monogram: 'L',
    glyph: 'badge',
  },
  {
    id: 'paddypower',
    name: 'Paddy Power',
    primaryDomain: 'paddypower.com',
    aliases: ['paddypowergames.com', 'paddypowerbingo.com'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'UK / Ireland',
    bgColor: '#006B47',
    accentColor: '#A7F3D0',
    fgColor: '#FFFFFF',
    monogram: 'PP',
    glyph: 'clover',
  },
  {
    id: 'betfair',
    name: 'Betfair',
    primaryDomain: 'betfair.com',
    aliases: ['betfair.com.au', 'betfair.es', 'betfaircasino.com', 'betfairbingo.com'],
    category: GamblingCategory.SPORTSBOOK,
    region: 'UK / Global',
    bgColor: '#FFB80C',
    accentColor: '#111111',
    fgColor: '#111111',
    monogram: 'BF',
    glyph: 'arrows',
  },
  {
    id: 'pokerstars',
    name: 'PokerStars',
    primaryDomain: 'pokerstars.com',
    aliases: ['pokerstars.uk', 'pokerstars.eu', 'pokerstars.es', 'pokerstars.fr', 'pokerstarscasino.com'],
    category: GamblingCategory.POKER_BINGO,
    region: 'Global Poker',
    bgColor: '#111111',
    accentColor: '#E11D48',
    fgColor: '#FFFFFF',
    monogram: 'PS',
    glyph: 'spade',
  },
  {
    id: 'roobet',
    name: 'Roobet',
    primaryDomain: 'roobet.com',
    aliases: ['roobet.fun'],
    category: GamblingCategory.CRYPTO_BETTING,
    region: 'Crypto Casino',
    bgColor: '#1C152B',
    accentColor: '#E8A838',
    fgColor: '#FFFFFF',
    monogram: 'R',
    glyph: 'crown',
  },
  {
    id: 'rollbit',
    name: 'Rollbit',
    primaryDomain: 'rollbit.com',
    aliases: [],
    category: GamblingCategory.CRYPTO_BETTING,
    region: 'Crypto Casino',
    bgColor: '#0F172A',
    accentColor: '#6366F1',
    fgColor: '#FFFFFF',
    monogram: 'RB',
    glyph: 'hexagon',
  },
  {
    id: 'bcgame',
    name: 'BC.Game',
    primaryDomain: 'bc.game',
    aliases: ['bcgame.top', 'bc.fun', 'bcgame.im'],
    category: GamblingCategory.CRYPTO_BETTING,
    region: 'Crypto Casino',
    bgColor: '#111827',
    accentColor: '#24EE89',
    fgColor: '#FFFFFF',
    monogram: 'BC',
    glyph: 'hexagon',
  },
  {
    id: 'prizepicks',
    name: 'PrizePicks',
    primaryDomain: 'prizepicks.com',
    aliases: [],
    category: GamblingCategory.FANTASY_LOTTERY,
    region: 'North America',
    bgColor: '#1E1B4B',
    accentColor: '#8B5CF6',
    fgColor: '#FFFFFF',
    monogram: 'P',
    glyph: 'diamond',
  },
  {
    id: 'underdogfantasy',
    name: 'Underdog',
    primaryDomain: 'underdogfantasy.com',
    aliases: [],
    category: GamblingCategory.FANTASY_LOTTERY,
    region: 'North America',
    bgColor: '#18181B',
    accentColor: '#FACC15',
    fgColor: '#FFFFFF',
    monogram: 'U',
    glyph: 'chevron',
  },
];

const HOST_TO_BRAND_MAP = new Map<string, BettingBrandMeta>();
for (const brand of BETTING_BRAND_CATALOG) {
  HOST_TO_BRAND_MAP.set(brand.primaryDomain.toLowerCase(), brand);
  for (const alias of brand.aliases) {
    HOST_TO_BRAND_MAP.set(alias.toLowerCase(), brand);
  }
}

const FALLBACK_COLORS = [
  { bgColor: '#1E293B', accentColor: '#F43F5E' },
  { bgColor: '#18181B', accentColor: '#EC4899' },
  { bgColor: '#1E1B4B', accentColor: '#38BDF8' },
  { bgColor: '#064E3B', accentColor: '#34D399' },
  { bgColor: '#3F1D2B', accentColor: '#FB7185' },
];

export interface ResolvedBrandIdentity {
  brand: BettingBrandMeta | null;
  displayName: string;
  monogram: string;
  bgColor: string;
  accentColor: string;
  fgColor: string;
  isExactCatalogMatch: boolean;
}

export function cleanBrandLookupKey(rawTarget: string): string {
  let s = rawTarget.trim().toLowerCase();
  if (!s) return '';
  const schemeIdx = s.indexOf('://');
  if (schemeIdx >= 0) s = s.slice(schemeIdx + 3);
  s = s.split('/')[0].split('?')[0].split('#')[0];
  const atIdx = s.lastIndexOf('@');
  if (atIdx >= 0) s = s.slice(atIdx + 1);
  const colonIdx = s.indexOf(':');
  if (colonIdx >= 0) s = s.slice(0, colonIdx);
  if (s.startsWith('www.')) s = s.slice(4);
  return s;
}

export function resolveBettingBrand(rawTarget: string): ResolvedBrandIdentity {
  const cleanedHost = cleanBrandLookupKey(rawTarget);

  if (cleanedHost) {
    let candidate = cleanedHost;
    while (candidate.length > 0) {
      const exact = HOST_TO_BRAND_MAP.get(candidate);
      if (exact) {
        return {
          brand: exact,
          displayName: exact.name,
          monogram: exact.monogram,
          bgColor: exact.bgColor,
          accentColor: exact.accentColor,
          fgColor: exact.fgColor,
          isExactCatalogMatch: true,
        };
      }
      const dotIdx = candidate.indexOf('.');
      candidate = dotIdx >= 0 && dotIdx < candidate.length - 1 ? candidate.slice(dotIdx + 1) : '';
    }
  }

  // Also check app/keyword substring (e.g. "SportyBet App", "Bet9ja Mobile", "Stake Casino")
  const alphaLower = rawTarget.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (alphaLower) {
    for (const brand of BETTING_BRAND_CATALOG) {
      const stem = brand.primaryDomain.split('.')[0].replace(/[^a-z0-9]/g, '');
      if (alphaLower.includes(brand.id) || (stem.length >= 4 && alphaLower.includes(stem))) {
        return {
          brand,
          displayName: brand.name,
          monogram: brand.monogram,
          bgColor: brand.bgColor,
          accentColor: brand.accentColor,
          fgColor: brand.fgColor,
          isExactCatalogMatch: true,
        };
      }
    }
  }

  // Deterministic stylized monogram fallback
  const stem = (cleanedHost ? cleanedHost.split('.')[0] : rawTarget.trim()) || 'Bet';
  const cleanLetters = stem.replace(/[^a-zA-Z0-9]/g, '');
  const monogram = (cleanLetters.slice(0, 2) || 'B').toUpperCase();
  const displayName = stem.charAt(0).toUpperCase() + stem.slice(1);
  let hash = 0;
  for (let i = 0; i < stem.length; i++) {
    hash = (hash * 31 + stem.charCodeAt(i)) >>> 0;
  }
  const palette = FALLBACK_COLORS[hash % FALLBACK_COLORS.length];

  return {
    brand: null,
    displayName,
    monogram,
    bgColor: palette.bgColor,
    accentColor: palette.accentColor,
    fgColor: '#FFFFFF',
    isExactCatalogMatch: false,
  };
}
