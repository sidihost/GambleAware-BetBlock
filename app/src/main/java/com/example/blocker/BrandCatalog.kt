package com.example.blocker

data class BettingBrandMeta(
    val id: String,
    val name: String,
    val primaryDomain: String,
    val aliases: List<String>,
    val category: GamblingCategory,
    val region: String,
    val bgHex: Long,
    val accentHex: Long,
    val fgHex: Long,
    val monogram: String,
)

data class ResolvedBrandIdentity(
    val brand: BettingBrandMeta?,
    val displayName: String,
    val monogram: String,
    val bgHex: Long,
    val accentHex: Long,
    val fgHex: Long,
    val isExactCatalogMatch: Boolean,
)

object BrandCatalog {

    val featuredBrands: List<BettingBrandMeta> = listOf(
        BettingBrandMeta("sportybet", "SportyBet", "sportybet.com", listOf("sportybet.ng", "sportybet.com.gh", "sportybet.co.ke", "sportybet.co.tz", "sportybet.co.zm", "sportybet.ug", "sporty.com", "sportycasino.com"), GamblingCategory.SPORTSBOOK, "Africa / Global", 0xFFE41B23, 0xFFFFE0E1, 0xFFFFFFFF, "S"),
        BettingBrandMeta("bet9ja", "Bet9ja", "bet9ja.com", listOf("bet9ja.ng", "web.bet9ja.com", "sports.bet9ja.com", "vsmobile.bet9ja.com", "casino.bet9ja.com"), GamblingCategory.SPORTSBOOK, "Nigeria", 0xFF107C41, 0xFFF5C518, 0xFFFFFFFF, "9ja"),
        BettingBrandMeta("betking", "BetKing", "betking.com", listOf("betking.ng", "virtual.betking.com"), GamblingCategory.SPORTSBOOK, "Nigeria", 0xFF0B2C5F, 0xFFF6A800, 0xFFFFFFFF, "BK"),
        BettingBrandMeta("1xbet", "1xBet", "1xbet.com", listOf("1xbet.ng", "1xbet.co.ke", "1xbet.com.gh", "1xbet.co.zm", "1xbet.in", "1xbit.com"), GamblingCategory.SPORTSBOOK, "Global", 0xFF1A56DB, 0xFF38BDF8, 0xFFFFFFFF, "1X"),
        BettingBrandMeta("bet365", "Bet365", "bet365.com", listOf("bet365.ng", "bet365.co.za", "bet365.es", "bet365.com.au", "bet365casino.com"), GamblingCategory.SPORTSBOOK, "UK / Global", 0xFF027B5B, 0xFFFFDF1B, 0xFFFFFFFF, "365"),
        BettingBrandMeta("betway", "Betway", "betway.com", listOf("betway.com.ng", "betway.co.za", "betway.co.uk", "betway.com.gh", "betway.co.ke"), GamblingCategory.SPORTSBOOK, "Africa / UK", 0xFF111827, 0xFF00A826, 0xFFFFFFFF, "bw"),
        BettingBrandMeta("stake", "Stake", "stake.com", listOf("stake.us", "stake.bet", "stake.games", "stake.ac", "stake.com.br"), GamblingCategory.CRYPTO_BETTING, "Crypto", 0xFF0F212E, 0xFF00E701, 0xFFFFFFFF, "S"),
        BettingBrandMeta("msport", "MSport", "msport.com", listOf("msport.ng", "msport.co.ke", "msport.com.gh", "msport.co.ug"), GamblingCategory.SPORTSBOOK, "Africa", 0xFF111318, 0xFFFACC15, 0xFFFFFFFF, "M"),
        BettingBrandMeta("betpawa", "betPawa", "betpawa.com", listOf("betpawa.ng", "betpawa.co.ke", "betpawa.com.gh", "betpawa.ug"), GamblingCategory.SPORTSBOOK, "Africa", 0xFF111827, 0xFF9EE01A, 0xFFFFFFFF, "bP"),
        BettingBrandMeta("bangbet", "BangBet", "bangbet.com", listOf("bangbet.ng", "bangbet.co.ke", "bangbet.com.gh"), GamblingCategory.SPORTSBOOK, "Africa", 0xFF1B3B82, 0xFFF97316, 0xFFFFFFFF, "BB"),
        BettingBrandMeta("paripesa", "PariPesa", "paripesa.com", listOf("paripesa.ng", "paripesa.co.ke", "paripesa.bet"), GamblingCategory.SPORTSBOOK, "Africa / Global", 0xFF1E3A8A, 0xFF22C55E, 0xFFFFFFFF, "PP"),
        BettingBrandMeta("22bet", "22Bet", "22bet.com", listOf("22bet.ng", "22bet.co.ke", "22bet.com.gh", "22bet.co.tz"), GamblingCategory.SPORTSBOOK, "Global", 0xFF0A3622, 0xFFE11D48, 0xFFFFFFFF, "22"),
        BettingBrandMeta("melbet", "MelBet", "melbet.com", listOf("melbet.ng", "melbet.co.ke", "melbet.com.gh"), GamblingCategory.SPORTSBOOK, "Global", 0xFF171717, 0xFFF59E0B, 0xFFFFFFFF, "MB"),
        BettingBrandMeta("betwinner", "BetWinner", "betwinner.com", listOf("betwinner.ng", "betwinner.ke", "betwinner.gh"), GamblingCategory.SPORTSBOOK, "Global", 0xFF064E3B, 0xFFFBBF24, 0xFFFFFFFF, "BW"),
        BettingBrandMeta("parimatch", "Parimatch", "parimatch.com", listOf("parimatch.ng", "parimatch.co.tz", "parimatch.in"), GamblingCategory.SPORTSBOOK, "Europe / Africa", 0xFF111111, 0xFFFFE600, 0xFFFFFFFF, "PM"),
        BettingBrandMeta("nairabet", "NairaBet", "nairabet.com", listOf("nairabet.ng"), GamblingCategory.SPORTSBOOK, "Nigeria", 0xFF14532D, 0xFF4ADE80, 0xFFFFFFFF, "NB"),
        BettingBrandMeta("merrybet", "MerryBet", "merrybet.com", listOf("merrybet.ng"), GamblingCategory.SPORTSBOOK, "Nigeria", 0xFF991B1B, 0xFFFDE047, 0xFFFFFFFF, "MB"),
        BettingBrandMeta("hollywoodbets", "Hollywoodbets", "hollywoodbets.net", listOf("hollywoodbets.co.uk"), GamblingCategory.SPORTSBOOK, "South Africa", 0xFF4C1D95, 0xFFFACC15, 0xFFFFFFFF, "H"),
        BettingBrandMeta("draftkings", "DraftKings", "draftkings.com", listOf("sportsbook.draftkings.com"), GamblingCategory.SPORTSBOOK, "North America", 0xFF111827, 0xFF61B510, 0xFFFFFFFF, "DK"),
        BettingBrandMeta("fanduel", "FanDuel", "fanduel.com", listOf("sportsbook.fanduel.com", "fanduelracing.com"), GamblingCategory.SPORTSBOOK, "North America", 0xFF1493FF, 0xFFFFFFFF, 0xFFFFFFFF, "FD"),
        BettingBrandMeta("betmgm", "BetMGM", "betmgm.com", listOf("sports.betmgm.com", "betmgmcasino.com"), GamblingCategory.SPORTSBOOK, "North America", 0xFF141414, 0xFFC5A059, 0xFFFFFFFF, "MGM"),
        BettingBrandMeta("caesars", "Caesars", "caesars.com", listOf("caesarssportsbook.com"), GamblingCategory.SPORTSBOOK, "North America", 0xFF0D3B26, 0xFFD4AF37, 0xFFFFFFFF, "CZR"),
        BettingBrandMeta("williamhill", "William Hill", "williamhill.com", listOf("williamhill.us", "williamhill.co.uk"), GamblingCategory.SPORTSBOOK, "UK / Europe", 0xFF00205B, 0xFFFFD100, 0xFFFFFFFF, "WH"),
        BettingBrandMeta("ladbrokes", "Ladbrokes", "ladbrokes.com", listOf("ladbrokes.com.au", "ladbrokescasino.com"), GamblingCategory.SPORTSBOOK, "UK / Australia", 0xFFD3141E, 0xFFFFFFFF, 0xFFFFFFFF, "L"),
        BettingBrandMeta("paddypower", "Paddy Power", "paddypower.com", listOf("paddypowergames.com", "paddypowerbingo.com"), GamblingCategory.SPORTSBOOK, "UK / Ireland", 0xFF006B47, 0xFFA7F3D0, 0xFFFFFFFF, "PP"),
        BettingBrandMeta("betfair", "Betfair", "betfair.com", listOf("betfair.com.au", "betfaircasino.com"), GamblingCategory.SPORTSBOOK, "UK / Global", 0xFFFFB80C, 0xFF111111, 0xFF111111, "BF"),
        BettingBrandMeta("pokerstars", "PokerStars", "pokerstars.com", listOf("pokerstars.uk", "pokerstars.eu", "pokerstars.es", "pokerstarscasino.com"), GamblingCategory.POKER_BINGO, "Global Poker", 0xFF111111, 0xFFE11D48, 0xFFFFFFFF, "PS"),
        BettingBrandMeta("roobet", "Roobet", "roobet.com", listOf("roobet.fun"), GamblingCategory.CRYPTO_BETTING, "Crypto Casino", 0xFF1C152B, 0xFFE8A838, 0xFFFFFFFF, "R"),
        BettingBrandMeta("rollbit", "Rollbit", "rollbit.com", emptyList(), GamblingCategory.CRYPTO_BETTING, "Crypto Casino", 0xFF0F172A, 0xFF6366F1, 0xFFFFFFFF, "RB"),
        BettingBrandMeta("bcgame", "BC.Game", "bc.game", listOf("bcgame.top", "bc.fun", "bcgame.im"), GamblingCategory.CRYPTO_BETTING, "Crypto Casino", 0xFF111827, 0xFF24EE89, 0xFFFFFFFF, "BC"),
        BettingBrandMeta("prizepicks", "PrizePicks", "prizepicks.com", emptyList(), GamblingCategory.FANTASY_LOTTERY, "North America", 0xFF1E1B4B, 0xFF8B5CF6, 0xFFFFFFFF, "P"),
        BettingBrandMeta("underdogfantasy", "Underdog", "underdogfantasy.com", emptyList(), GamblingCategory.FANTASY_LOTTERY, "North America", 0xFF18181B, 0xFFFACC15, 0xFFFFFFFF, "U"),
    )

    private val hostMap: Map<String, BettingBrandMeta> by lazy {
        buildMap {
            for (brand in featuredBrands) {
                put(brand.primaryDomain.lowercase(), brand)
                for (alias in brand.aliases) {
                    put(alias.lowercase(), brand)
                }
            }
        }
    }

    private val fallbackPalettes = listOf(
        0xFF1E293BL to 0xFFF43F5EL,
        0xFF18181BL to 0xFFEC4899L,
        0xFF1E1B4BL to 0xFF38BDF8L,
        0xFF064E3BL to 0xFF34D399L,
        0xFF3F1D2BL to 0xFFFB7185L,
    )

    fun resolve(rawTarget: String): ResolvedBrandIdentity {
        val cleanedHost = BlocklistMatcher.normalizeDomain(rawTarget)
        if (cleanedHost.isNotEmpty()) {
            var candidate = cleanedHost
            while (candidate.isNotEmpty()) {
                val exact = hostMap[candidate]
                if (exact != null) {
                    return ResolvedBrandIdentity(
                        brand = exact,
                        displayName = exact.name,
                        monogram = exact.monogram,
                        bgHex = exact.bgHex,
                        accentHex = exact.accentHex,
                        fgHex = exact.fgHex,
                        isExactCatalogMatch = true,
                    )
                }
                val dotIdx = candidate.indexOf('.')
                candidate = if (dotIdx >= 0 && dotIdx < candidate.length - 1) {
                    candidate.substring(dotIdx + 1)
                } else {
                    ""
                }
            }
        }

        val alphaLower = rawTarget.trim().lowercase().filter { it.isLetterOrDigit() }
        if (alphaLower.isNotEmpty()) {
            for (brand in featuredBrands) {
                val stem = brand.primaryDomain.substringBefore('.').filter { it.isLetterOrDigit() }
                if (alphaLower.contains(brand.id) || (stem.length >= 4 && alphaLower.contains(stem))) {
                    return ResolvedBrandIdentity(
                        brand = brand,
                        displayName = brand.name,
                        monogram = brand.monogram,
                        bgHex = brand.bgHex,
                        accentHex = brand.accentHex,
                        fgHex = brand.fgHex,
                        isExactCatalogMatch = true,
                    )
                }
            }
        }

        val stem = (if (cleanedHost.isNotEmpty()) cleanedHost.substringBefore('.') else rawTarget.trim())
            .ifEmpty { "Bet" }
        val letters = stem.filter { it.isLetterOrDigit() }
        val monogram = (letters.take(2).ifEmpty { "B" }).uppercase()
        val displayName = stem.replaceFirstChar { it.uppercaseChar() }
        var hash = 0
        for (ch in stem) {
            hash = hash * 31 + ch.code
        }
        val palette = fallbackPalettes[kotlin.math.abs(hash) % fallbackPalettes.size]
        return ResolvedBrandIdentity(
            brand = null,
            displayName = displayName,
            monogram = monogram,
            bgHex = palette.first,
            accentHex = palette.second,
            fgHex = 0xFFFFFFFF,
            isExactCatalogMatch = false,
        )
    }
}
