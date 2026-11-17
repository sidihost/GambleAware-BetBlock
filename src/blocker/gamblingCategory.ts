export enum GamblingCategory {
  SPORTSBOOK = 'SPORTSBOOK',
  CASINO = 'CASINO',
  POKER_BINGO = 'POKER_BINGO',
  CRYPTO_BETTING = 'CRYPTO_BETTING',
  FANTASY_LOTTERY = 'FANTASY_LOTTERY',
  CUSTOM = 'CUSTOM',
}

export interface GamblingCategoryMeta {
  displayName: string;
  description: string;
}

export const GAMBLING_CATEGORY_META: Record<GamblingCategory, GamblingCategoryMeta> = {
  [GamblingCategory.SPORTSBOOK]: {
    displayName: 'Sportsbooks & Odds',
    description: 'Sports betting platforms, bookmakers, and live odds exchanges',
  },
  [GamblingCategory.CASINO]: {
    displayName: 'Online Casinos & Slots',
    description: 'Virtual casinos, slots, roulette, blackjack, and sweepstakes casinos',
  },
  [GamblingCategory.POKER_BINGO]: {
    displayName: 'Poker & Bingo',
    description: 'Real-money poker networks, card rooms, and online bingo halls',
  },
  [GamblingCategory.CRYPTO_BETTING]: {
    displayName: 'Crypto Gambling',
    description: 'Blockchain casinos, crash games, and crypto sportsbooks',
  },
  [GamblingCategory.FANTASY_LOTTERY]: {
    displayName: 'Daily Fantasy & Lottery',
    description: "Paid fantasy pick'em apps, pools, and instant online lotteries",
  },
  [GamblingCategory.CUSTOM]: {
    displayName: 'Custom Rules',
    description: 'Domains and apps you personally added to your blocklist',
  },
};
