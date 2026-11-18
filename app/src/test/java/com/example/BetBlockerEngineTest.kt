package com.example

import com.example.blocker.BlockFilterConfig
import com.example.blocker.BlocklistMatcher
import com.example.blocker.GamblingCategory
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BetBlockerEngineTest {

    @Test
    fun blocksKnownGamblingDomainsAndSubdomains() {
        val config = BlockFilterConfig()
        val bet365 = BlocklistMatcher.matchDomainOrUrl("https://m.bet365.com/#/HO/", config)
        assertTrue(bet365.isBlocked)
        assertEquals(GamblingCategory.SPORTSBOOK, bet365.category)

        val stake = BlocklistMatcher.matchDomainOrUrl("play.stake.com", config)
        assertTrue(stake.isBlocked)
        assertEquals(GamblingCategory.CRYPTO_BETTING, stake.category)

        val poker = BlocklistMatcher.matchDomainOrUrl("www.pokerstars.com", config)
        assertTrue(poker.isBlocked)
        assertEquals(GamblingCategory.POKER_BINGO, poker.category)
    }

    @Test
    fun neverFalsePositivesOnSafeDomains() {
        val config = BlockFilterConfig(strictKeywordFilter = true)
        assertFalse(BlocklistMatcher.matchDomainOrUrl("betterhelp.com", config).isBlocked)
        assertFalse(BlocklistMatcher.matchDomainOrUrl("alphabet.com", config).isBlocked)
        assertFalse(BlocklistMatcher.matchDomainOrUrl("diabetes.org", config).isBlocked)
        assertFalse(BlocklistMatcher.matchDomainOrUrl("bethesda.net", config).isBlocked)
        assertFalse(BlocklistMatcher.matchDomainOrUrl("gamblersanonymous.org", config).isBlocked)
        assertFalse(BlocklistMatcher.matchDomainOrUrl("google.com", config).isBlocked)
    }

    @Test
    fun respectsCategoryTogglesCustomRulesAndAllowlist() {
        val disabledSportsbooks = BlockFilterConfig(blockSportsbooks = false)
        assertFalse(BlocklistMatcher.matchDomainOrUrl("bet365.com", disabledSportsbooks).isBlocked)
        assertTrue(BlocklistMatcher.matchDomainOrUrl("stake.com", disabledSportsbooks).isBlocked)

        val customAndAllow = BlockFilterConfig(
            customBlockedDomains = setOf("mycustombet.io"),
            allowlistedDomains = setOf("stake.com"),
        )
        assertTrue(BlocklistMatcher.matchDomainOrUrl("sub.mycustombet.io", customAndAllow).isBlocked)
        assertFalse(BlocklistMatcher.matchDomainOrUrl("stake.com", customAndAllow).isBlocked)
    }

    @Test
    fun blocksWebViewMirrorPagesAndInAppBrowsers() {
        val config = BlockFilterConfig(strictKeywordFilter = true)

        // Multi-signal gambling UI inside an unindexed WebView mirror
        val mirrorUi = BlocklistMatcher.matchWebViewContent(
            visibleTexts = listOf("Mirror Portal", "Live Betting", "Bet Slip", "Place Bet"),
            hasWebView = true,
            config = config,
        )
        assertTrue(mirrorUi.isBlocked)

        // Single unrelated phrase outside WebView should not false-positive
        val normalApp = BlocklistMatcher.matchWebViewContent(
            visibleTexts = listOf("Welcome", "Deposit Bonus"),
            hasWebView = false,
            config = config,
        )
        assertFalse(normalApp.isBlocked)

        // Safe recovery support page must never be blocked
        val recoveryPage = BlocklistMatcher.matchWebViewContent(
            visibleTexts = listOf("gamblersanonymous.org", "Help for online casino addiction", "roulette"),
            hasWebView = true,
            config = config,
        )
        assertFalse(recoveryPage.isBlocked)
    }

    @Test
    fun blocksStrictKeywordsKnownAppsAndObfuscatedAppLabels() {
        val config = BlockFilterConfig(strictKeywordFilter = true)
        assertTrue(BlocklistMatcher.matchDomainOrUrl("lucky777casino.xyz", config).isBlocked)
        assertTrue(BlocklistMatcher.matchAppPackage("com.draftkings.sportsbook", config).isBlocked)
        assertTrue(BlocklistMatcher.matchAppPackage("com.custom.sportsbook.app", config).isBlocked)
        assertTrue(
            BlocklistMatcher.matchAppPackage(
                packageName = "com.obfuscated.client",
                config = config,
                appLabel = "Bet365 Sports",
            ).isBlocked,
        )
        assertFalse(BlocklistMatcher.matchAppPackage("com.android.chrome", config, "Chrome").isBlocked)
    }

    @Test
    fun blocksDirectGamblingSearchesWhilePreservingRecoverySupport() {
        val guardOn = BlockFilterConfig(searchGuardEnabled = true)
        val guardOff = BlockFilterConfig(searchGuardEnabled = false)

        assertTrue(
            BlocklistMatcher.matchDomainOrUrl(
                "https://www.google.com/search?q=bet365+login",
                guardOn,
            ).isBlocked,
        )
        assertTrue(
            BlocklistMatcher.matchSearchQueryInUrl(
                "https://duckduckgo.com/?q=stake+casino+bonus",
            ).isBlocked,
        )
        assertFalse(
            BlocklistMatcher.matchDomainOrUrl(
                "https://www.google.com/search?q=bet365+login",
                guardOff,
            ).isBlocked,
        )
        assertFalse(
            BlocklistMatcher.matchDomainOrUrl(
                "https://www.google.com/search?q=gamblers+anonymous+help",
                guardOn,
            ).isBlocked,
        )
        assertFalse(
            BlocklistMatcher.matchDomainOrUrl(
                "https://www.google.com/search?q=how+to+quit+betting+addiction",
                guardOn,
            ).isBlocked,
        )
    }

    @Test
    fun blocksSportyBetAndRegionalBookmakersByDefault() {
        val defaultConfig = BlockFilterConfig()
        val sites = listOf(
            "https://www.sportybet.com/ng/",
            "https://sportybet.ng",
            "https://sportybet.com.gh",
            "https://m.bet9ja.com",
            "https://www.betking.com",
            "https://www.msport.com/ng",
            "https://www.betpawa.co.ke",
            "https://1xbet.ng",
            "https://paripesa.com",
            "https://www.bangbet.com",
            "https://www.hollywoodbets.net",
            "https://www.google.com/search?q=sportybet+login",
        )
        for (url in sites) {
            assertTrue("Expected blocked by default: $url", BlocklistMatcher.matchDomainOrUrl(url, defaultConfig).isBlocked)
        }
        assertTrue(BlocklistMatcher.matchAppPackage("com.sportybet.android", defaultConfig, "SportyBet").isBlocked)
        assertTrue(BlocklistMatcher.matchAppPackage("com.bet9ja.android", defaultConfig, "Bet9ja").isBlocked)
        assertTrue(BlocklistMatcher.matchAppPackage("com.kingmakers.betking", defaultConfig, "BetKing").isBlocked)
    }

    @Test
    fun chromeNewTabAndInternalPagesNeverTriggerFalsePositiveClose() {
        val defaultConfig = BlockFilterConfig()
        assertFalse(BlocklistMatcher.matchDomainOrUrl("chrome://newtab", defaultConfig).isBlocked)
        assertFalse(BlocklistMatcher.matchDomainOrUrl("chrome-native://newtab/", defaultConfig).isBlocked)
        assertFalse(BlocklistMatcher.matchBrowserAddressText("Search or type web address", defaultConfig).isBlocked)
        assertFalse(BlocklistMatcher.matchAppPackage("com.android.chrome", defaultConfig, "Chrome").isBlocked)
        assertFalse(BlocklistMatcher.matchAppPackage("com.chrome.beta", defaultConfig, "Chrome Beta").isBlocked)
        assertFalse(
            BlocklistMatcher.matchWebViewContent(
                visibleTexts = listOf("Discover", "Football headlines", "sportybet.com odds review", "Search or type web address"),
                hasWebView = false,
                config = defaultConfig,
            ).isBlocked,
        )
        assertTrue(
            BlocklistMatcher.matchDomainOrUrl("https://www.sportybet.com/ng/m/login", defaultConfig).isBlocked,
        )
    }
}
