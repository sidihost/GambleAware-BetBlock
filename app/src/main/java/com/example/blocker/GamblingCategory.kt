package com.example.blocker

enum class GamblingCategory(
    val displayName: String,
    val description: String,
) {
    SPORTSBOOK(
        displayName = "Sportsbooks & Odds",
        description = "Sports betting platforms, bookmakers, and live odds exchanges",
    ),
    CASINO(
        displayName = "Online Casinos & Slots",
        description = "Virtual casinos, slots, roulette, blackjack, and sweepstakes casinos",
    ),
    POKER_BINGO(
        displayName = "Poker & Bingo",
        description = "Real-money poker networks, card rooms, and online bingo halls",
    ),
    CRYPTO_BETTING(
        displayName = "Crypto Gambling",
        description = "Blockchain casinos, crash games, and crypto sportsbooks",
    ),
    FANTASY_LOTTERY(
        displayName = "Daily Fantasy & Lottery",
        description = "Paid fantasy pick'em apps, pools, and instant online lotteries",
    ),
    CUSTOM(
        displayName = "Custom Rules",
        description = "Domains and apps you personally added to your blocklist",
    ),
}
