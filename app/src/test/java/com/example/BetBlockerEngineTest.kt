package com.example

import com.example.blocker.BlockFilterConfig
import com.example.blocker.BlocklistMatcher
import com.example.blocker.BrandCatalog
import com.example.blocker.CommitmentClockGuard
import com.example.blocker.GamblingCategory
import com.example.blocker.TiltRadarEngine
import com.example.blocker.TiltRiskLevel
import com.example.data.BlockedEventEntity
import com.example.data.ProtectionSettingsState
import com.example.ui.MainUiState
import com.example.ui.buildCleanStreakShareText
import com.example.ui.buildGroupedBlockedTargets
import com.example.ui.formatAttemptCountLabel
import com.example.ui.formatBlockedRelativeTime
import com.example.ui.formatBlockedTargetDisplay
import com.example.ui.normalizeBlockedTarget
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

    @Test
    fun blocksBettingSitesImmediatelyWhileTypingWithoutDotCom() {
        val defaultConfig = BlockFilterConfig(
            customBlockedDomains = setOf("mycustombet.io"),
            allowlistedDomains = setOf("allowbet.com"),
        )

        val blockedWhileTyping = listOf(
            "sportybet",
            "sportyb",
            "bet9ja",
            "1xbet",
            "betking",
            "msport",
            "bet365",
            "stake.c",
            "sportybet.n",
            "stake casino",
            "mycustombet",
        )
        for (typed in blockedWhileTyping) {
            assertTrue(
                "Expected immediate while-typing block for \"$typed\"",
                BlocklistMatcher.matchTypedBrowserInput(typed, defaultConfig).isBlocked,
            )
        }

        val allowedWhileTyping = listOf(
            "betterhelp",
            "bethesda",
            "alphabet",
            "diabetes",
            "stakeholder",
            "allowbet",
            "gamblers anonymous",
            "how to quit betting",
            "chrome://newtab",
            "Search or type web address",
            "bet",
            "sta",
        )
        for (safe in allowedWhileTyping) {
            assertFalse(
                "Expected safe input NOT to be blocked while typing: \"$safe\"",
                BlocklistMatcher.matchTypedBrowserInput(safe, defaultConfig).isBlocked,
            )
        }
    }

    @Test
    fun blocksInstantTypedPrefixesAndAdNetworksAndFormatsCleanTargets() {
        val adEnabled = BlockFilterConfig(adBlockerEnabled = true)
        val adDisabled = BlockFilterConfig(adBlockerEnabled = false)

        // 4-6 char prefixes intercepted while typing before .com
        for (prefix in listOf("sporty", "1xbe", "bet9j", "mspor", "betki")) {
            assertTrue(
                "Expected instant prefix block for '$prefix'",
                BlocklistMatcher.matchTypedBrowserInput(prefix, adEnabled).isBlocked,
            )
        }

        // Gambling ad / popunder networks blocked when adBlockerEnabled = true
        assertTrue(BlocklistMatcher.matchDomainOrUrl("https://cdn.popads.net/pop.js", adEnabled).isBlocked)
        assertTrue(BlocklistMatcher.matchDomainOrUrl("https://1xbet-promo.com/banner", adEnabled).isBlocked)
        assertFalse(BlocklistMatcher.matchDomainOrUrl("https://cdn.popads.net/pop.js", adDisabled).isBlocked)

        // Display names never expose .com or com.* clutter
        assertEquals("SportyBet", formatBlockedTargetDisplay("sportybet.com"))
        assertEquals("Bet9ja", formatBlockedTargetDisplay("bet9ja.com"))
        assertEquals("Bet9ja", formatBlockedTargetDisplay("com.bet9ja.android"))
    }

    @Test
    fun groupsBlockedSitesAndAppsLikeDuckDuckGoTrackingList() {
        val now = 1_700_000_000_000L
        assertEquals("sportybet.com", normalizeBlockedTarget("https://www.SportyBet.com/ng/"))
        assertEquals("bet9ja.com", normalizeBlockedTarget("bet9ja.com"))
        assertEquals("SportyBet App", normalizeBlockedTarget("SportyBet App"))

        val events = listOf(
            BlockedEventEntity(
                id = 1,
                target = "https://www.SportyBet.com/ng/",
                source = "Web Shield",
                categoryName = "Sportsbook",
                timestamp = now - 120_000L,
            ),
            BlockedEventEntity(
                id = 2,
                target = "sportybet.com",
                source = "Browser Shield",
                categoryName = "Sportsbook",
                timestamp = now - 30_000L,
            ),
            BlockedEventEntity(
                id = 3,
                target = "SportyBet App",
                source = "App Shield",
                categoryName = "Sportsbook",
                timestamp = now - 60_000L,
            ),
        )

        val grouped = buildGroupedBlockedTargets(events)
        assertEquals(2, grouped.size)

        val siteGroup = grouped[0]
        assertEquals("sportybet.com", siteGroup.target)
        assertEquals(2, siteGroup.attemptCount)
        assertEquals("2 blocked", formatAttemptCountLabel(siteGroup.attemptCount))
        assertEquals("Browser Shield", siteGroup.latestSource)
        assertFalse(siteGroup.isApp)
        assertEquals("Just now", formatBlockedRelativeTime(siteGroup.latestTimestamp, now))

        val appGroup = grouped[1]
        assertEquals("SportyBet App", appGroup.target)
        assertEquals(1, appGroup.attemptCount)
        assertTrue(appGroup.isApp)
    }

    @Test
    fun buildsFormattedCleanStreakShareSummary() {
        val now = 1_700_000_000_000L
        val started = now - (3L * 24 * 60 * 60 * 1000) - (5L * 60 * 60 * 1000)
        val state = MainUiState(
            settings = ProtectionSettingsState(
                isProtectionEnabled = true,
                protectionStartedAtMs = started,
                dailyBetSpendEstimate = 5000,
            ),
            totalUrgeResistedCount = 4,
            totalBlockedCount = 12,
            currentTimeMs = now,
        )
        val summary = buildCleanStreakShareText(state)
        assertTrue(summary.contains("3 days"))
        assertTrue(summary.contains("05h 00m 00s"))
        assertTrue(summary.contains("₦"))
        assertTrue(summary.contains("Urges resisted: 4"))
        assertTrue(summary.contains("Betting sites blocked: 12"))
    }

    @Test
    fun unwrapsRedirectLinksCatchesHomoglyphsAndResolvesExactBrandLogos() {
        val config = BlockFilterConfig()
        val igRedirect = BlocklistMatcher.matchDomainOrUrl(
            "https://l.instagram.com/?u=https%3A%2F%2Fsportybet.com%2Fng%2Fshare%3Fcode%3DABC123",
            config,
        )
        assertTrue(igRedirect.isBlocked)

        val spoof = BlocklistMatcher.matchDomainOrUrl("https://sp\u043ertybet.com", config)
        assertTrue(spoof.isBlocked)

        assertFalse(BlocklistMatcher.matchDomainOrUrl("paystack.com", config).isBlocked)
        assertFalse(BlocklistMatcher.matchDomainOrUrl("flutterwave.com", config).isBlocked)

        val sportyBrand = BrandCatalog.resolve("m.sportybet.ng")
        assertTrue(sportyBrand.isExactCatalogMatch)
        assertEquals("SportyBet", sportyBrand.displayName)
        assertEquals(0xFFE41B23, sportyBrand.bgHex)

        val bet9jaBrand = BrandCatalog.resolve("web.bet9ja.com")
        assertTrue(bet9jaBrand.isExactCatalogMatch)
        assertEquals("Bet9ja", bet9jaBrand.displayName)

        val now = 1_700_000_000_000L
        val criticalEvents = (1..5).map { idx ->
            BlockedEventEntity(
                id = idx.toLong(),
                target = "sportybet.com",
                source = "Browser Shield",
                categoryName = "SPORTSBOOK",
                timestamp = now - (idx * 10_000L),
            )
        }
        val eval = TiltRadarEngine.evaluate(criticalEvents, now)
        assertEquals(TiltRiskLevel.CRITICAL, eval.level)

        val challenge = TiltRadarEngine.generateBuddyChallengeCode(now)
        val token = TiltRadarEngine.computeExpectedBuddyResponse(challenge, "Tunde")
        assertTrue(TiltRadarEngine.verifyBuddyUnlockCode(challenge, "Tunde", token))
        assertFalse(TiltRadarEngine.verifyBuddyUnlockCode(challenge, "Other", token))
    }

    @Test
    fun blocksPlayStoreAndApkSideloadWhileAllowingVpnsAndEverydayApps() {
        val config = BlockFilterConfig(
            playStoreGuardEnabled = true,
            customBlockedAppNames = setOf("LuckySpinPro"),
        )

        // Play Store search for betting app
        assertTrue(
            BlocklistMatcher.matchAppStoreOrInstaller(
                isApkInstaller = false,
                searchTexts = listOf("SportyBet"),
                visibleTexts = listOf("Search apps & games", "SportyBet"),
                config = config,
            ).isBlocked,
        )

        // Play Store listing with Install button
        assertTrue(
            BlocklistMatcher.matchAppStoreOrInstaller(
                isApkInstaller = false,
                searchTexts = emptyList(),
                visibleTexts = listOf("Bet9ja Mobile", "Sports Betting", "Install", "Contains ads"),
                config = config,
            ).isBlocked,
        )

        // APK Sideload installer dialog for betting app
        assertTrue(
            BlocklistMatcher.matchAppStoreOrInstaller(
                isApkInstaller = true,
                searchTexts = emptyList(),
                visibleTexts = listOf("Do you want to install this app?", "1xBet", "Install", "Cancel"),
                config = config,
            ).isBlocked,
        )

        // Custom user-blocked app in Play Store
        assertTrue(
            BlocklistMatcher.matchAppStoreOrInstaller(
                isApkInstaller = false,
                searchTexts = listOf("LuckySpinPro"),
                visibleTexts = listOf("LuckySpinPro", "Install"),
                config = config,
            ).isBlocked,
        )

        // Third-party VPN search & install MUST be allowed
        assertFalse(
            BlocklistMatcher.matchAppStoreOrInstaller(
                isApkInstaller = false,
                searchTexts = listOf("ProtonVPN"),
                visibleTexts = listOf("Proton VPN: Fast & Secure", "Install"),
                config = config,
            ).isBlocked,
        )

        // Everyday / banking / recovery apps MUST be allowed
        assertFalse(
            BlocklistMatcher.matchAppStoreOrInstaller(
                isApkInstaller = false,
                searchTexts = listOf("WhatsApp Messenger"),
                visibleTexts = listOf("WhatsApp Messenger", "Install"),
                config = config,
            ).isBlocked,
        )
        assertFalse(
            BlocklistMatcher.matchAppStoreOrInstaller(
                isApkInstaller = false,
                searchTexts = listOf("GambleAware"),
                visibleTexts = listOf("GambleAware", "Install"),
                config = config,
            ).isBlocked,
        )
    }

    @Test
    fun allowsThirdPartyVpnsAndEverydayAppsWhileBlockingBettingApps() {
        val config = BlockFilterConfig(
            customBlockedPackages = setOf("com.custom.triggerapp"),
        )

        // VPNs must never be blocked
        assertFalse(BlocklistMatcher.matchAppPackage("ch.protonvpn.android", config, "Proton VPN").isBlocked)
        assertFalse(BlocklistMatcher.matchAppPackage("net.mullvad.mullvadvpn", config, "Mullvad VPN").isBlocked)
        assertFalse(BlocklistMatcher.matchAppPackage("com.nordvpn.android", config, "NordVPN").isBlocked)
        assertFalse(BlocklistMatcher.matchAppPackage("com.cloudflare.onedotonedotonedotone", config, "1.1.1.1 WARP").isBlocked)

        // Everyday / banking / social apps must never be blocked unless user explicitly adds them
        assertFalse(BlocklistMatcher.matchAppPackage("com.whatsapp", config, "WhatsApp").isBlocked)
        assertFalse(BlocklistMatcher.matchAppPackage("com.android.vending", config, "Google Play Store").isBlocked)

        // User-selected custom blocked app IS blocked
        assertTrue(BlocklistMatcher.matchAppPackage("com.custom.triggerapp", config, "Trigger App").isBlocked)
    }

    @Test
    fun commitmentClockGuardPreventsForwardClockJumpBypass() {
        val dayMs = 24L * 60 * 60 * 1000
        val startWall = 1_700_000_000_000L
        val lockDuration = 7L * dayMs
        val lockUntil = startWall + lockDuration
        val startUptime = 100_000L

        // User jumps Android system clock forward by 10 days after only 2 minutes of uptime
        val tamperedWall = startWall + 10L * dayMs
        val nowUptime = startUptime + 120_000L
        val remaining = CommitmentClockGuard.computeEffectiveRemainingMs(
            lockUntilEpochMs = lockUntil,
            lockRemainingAnchorMs = lockDuration,
            lastElapsedRealtimeMs = startUptime,
            nowWallMs = tamperedWall,
            nowElapsedRealtimeMs = nowUptime,
        )
        assertTrue("Expected lock to stay active despite clock jump", remaining > 6L * dayMs)

        // Legitimate completion: both wall clock and uptime pass 7 days
        val legitimateRemaining = CommitmentClockGuard.computeEffectiveRemainingMs(
            lockUntilEpochMs = lockUntil,
            lockRemainingAnchorMs = lockDuration,
            lastElapsedRealtimeMs = startUptime,
            nowWallMs = lockUntil + 5_000L,
            nowElapsedRealtimeMs = startUptime + lockDuration + 5_000L,
        )
        assertEquals(0L, legitimateRemaining)

        // Date & Time tamper screen detection
        assertTrue(
            CommitmentClockGuard.isDateTimeTamperScreen(
                listOf("Date & time", "Set time automatically", "Set date", "Set time"),
            ),
        )
        assertFalse(
            CommitmentClockGuard.isDateTimeTamperScreen(
                listOf("Display", "Dark theme", "Brightness level"),
            ),
        )
    }
}

