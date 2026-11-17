package com.example.blocker

import java.net.URLDecoder

data class BlockFilterConfig(
    val blockSportsbooks: Boolean = true,
    val blockCasinos: Boolean = true,
    val blockPokerAndBingo: Boolean = true,
    val blockCryptoBetting: Boolean = true,
    val blockFantasyAndLottery: Boolean = true,
    val strictKeywordFilter: Boolean = true,
    val searchGuardEnabled: Boolean = true,
    val customBlockedDomains: Set<String> = emptySet(),
    val allowlistedDomains: Set<String> = emptySet(),
    val customBlockedPackages: Set<String> = emptySet(),
)

data class BlockMatchResult(
    val isBlocked: Boolean,
    val matchedTarget: String = "",
    val category: GamblingCategory = GamblingCategory.CUSTOM,
    val reason: String = "",
)

object BlocklistMatcher {

    private val domainTokenRegex = Regex("""(?:https?://)?(?:[a-z0-9-]+\.)+[a-z]{2,10}(?:/[^\s]*)?""")
    private val recoveryTerms = listOf(
        "addiction", "help", "quit", "stop gambling", "recovery", "support",
        "hotline", "therapy", "counseling", "gamcare", "begambleaware",
        "gamblers anonymous", "self exclusion", "gamstop", "gamban", "gambleaware",
    )
    private val searchQueryParamRegex = Regex("""[?&](?:q|p|query|text)=([^&#]+)""")

    fun normalizeDomain(rawInput: String): String {
        var s = rawInput.trim().lowercase()
        if (s.isEmpty()) return ""
        val schemeIndex = s.indexOf("://")
        if (schemeIndex >= 0) {
            s = s.substring(schemeIndex + 3)
        }
        val slashIndex = s.indexOf('/')
        if (slashIndex >= 0) {
            s = s.substring(0, slashIndex)
        }
        val queryIndex = s.indexOf('?')
        if (queryIndex >= 0) {
            s = s.substring(0, queryIndex)
        }
        val hashIndex = s.indexOf('#')
        if (hashIndex >= 0) {
            s = s.substring(0, hashIndex)
        }
        val atIndex = s.lastIndexOf('@')
        if (atIndex >= 0) {
            s = s.substring(atIndex + 1)
        }
        val colonIndex = s.indexOf(':')
        if (colonIndex >= 0) {
            s = s.substring(0, colonIndex)
        }
        s = s.trimEnd('.')
        if (s.startsWith("www.")) {
            s = s.removePrefix("www.")
        }
        return s
    }

    fun matchDomainOrUrl(rawDomainOrUrl: String, config: BlockFilterConfig): BlockMatchResult {
        if (config.searchGuardEnabled) {
            val searchMatch = matchSearchQueryInUrl(rawDomainOrUrl)
            if (searchMatch.isBlocked) return searchMatch
        }

        val host = normalizeDomain(rawDomainOrUrl)
        if (host.isEmpty() || !host.contains('.')) {
            return BlockMatchResult(isBlocked = false)
        }

        if (matchesDomainHierarchy(host, GamblingRegistry.safeDomains) != null) {
            return BlockMatchResult(isBlocked = false)
        }
        if (matchesDomainHierarchy(host, config.allowlistedDomains) != null) {
            return BlockMatchResult(isBlocked = false)
        }

        matchesDomainHierarchy(host, config.customBlockedDomains)?.let { matched ->
            return BlockMatchResult(
                isBlocked = true,
                matchedTarget = matched,
                category = GamblingCategory.CUSTOM,
                reason = "Matched custom blocked domain",
            )
        }

        var candidate = host
        while (candidate.isNotEmpty()) {
            val category = GamblingRegistry.domainToCategory[candidate]
            if (category != null) {
                return if (isCategoryEnabled(category, config)) {
                    BlockMatchResult(
                        isBlocked = true,
                        matchedTarget = candidate,
                        category = category,
                        reason = "Matched ${category.displayName} registry",
                    )
                } else {
                    BlockMatchResult(isBlocked = false)
                }
            }
            val dotIdx = candidate.indexOf('.')
            candidate = if (dotIdx >= 0 && dotIdx < candidate.length - 1) {
                candidate.substring(dotIdx + 1)
            } else {
                ""
            }
        }

        if (config.strictKeywordFilter) {
            for (keyword in GamblingRegistry.strictHostKeywords) {
                if (host.contains(keyword)) {
                    return BlockMatchResult(
                        isBlocked = true,
                        matchedTarget = host,
                        category = GamblingCategory.CASINO,
                        reason = "Matched strict keyword \"$keyword\"",
                    )
                }
            }
        }

        return BlockMatchResult(isBlocked = false)
    }

    fun matchSearchQueryInUrl(rawUrl: String): BlockMatchResult {
        val lower = rawUrl.lowercase()
        val isSearchEngineUrl = lower.contains("/search") ||
            lower.contains("google.") ||
            lower.contains("bing.com") ||
            lower.contains("duckduckgo.com") ||
            lower.contains("yahoo.com")
        if (!isSearchEngineUrl) return BlockMatchResult(isBlocked = false)

        val match = searchQueryParamRegex.find(lower) ?: return BlockMatchResult(isBlocked = false)
        val decoded = try {
            URLDecoder.decode(match.groupValues[1], "UTF-8").lowercase()
        } catch (_: Exception) {
            match.groupValues[1].replace('+', ' ')
        }

        if (recoveryTerms.any { decoded.contains(it) }) {
            return BlockMatchResult(isBlocked = false)
        }

        for (brand in GamblingRegistry.gamblingBrandTokens) {
            if (decoded.contains(brand)) {
                return BlockMatchResult(
                    isBlocked = true,
                    matchedTarget = brand,
                    category = GamblingCategory.SPORTSBOOK,
                    reason = "Blocked gambling search query",
                )
            }
        }
        return BlockMatchResult(isBlocked = false)
    }

    fun matchBrowserAddressText(addressText: String, config: BlockFilterConfig): BlockMatchResult {
        val trimmed = addressText.trim()
        if (trimmed.length < 4) return BlockMatchResult(isBlocked = false)

        if (!trimmed.contains(' ')) {
            val direct = matchDomainOrUrl(trimmed, config)
            if (direct.isBlocked) return direct
        }

        val tokenMatch = domainTokenRegex.find(trimmed.lowercase())
        if (tokenMatch != null) {
            val domainResult = matchDomainOrUrl(tokenMatch.value, config)
            if (domainResult.isBlocked) return domainResult
        }

        return BlockMatchResult(isBlocked = false)
    }

    fun matchWebViewContent(
        visibleTexts: List<String>,
        hasWebView: Boolean,
        config: BlockFilterConfig,
    ): BlockMatchResult {
        if (visibleTexts.isEmpty()) return BlockMatchResult(isBlocked = false)

        val joined = visibleTexts.joinToString(" ").lowercase()

        if (recoveryTerms.any { joined.contains(it) }) {
            return BlockMatchResult(isBlocked = false)
        }
        for (safe in GamblingRegistry.safeDomains) {
            if (joined.contains(safe)) {
                return BlockMatchResult(isBlocked = false)
            }
        }
        for (allowed in config.allowlistedDomains) {
            if (joined.contains(allowed)) {
                return BlockMatchResult(isBlocked = false)
            }
        }

        for (text in visibleTexts) {
            val match = matchBrowserAddressText(text, config)
            if (match.isBlocked) return match
        }

        if (!hasWebView || !config.strictKeywordFilter) {
            return BlockMatchResult(isBlocked = false)
        }

        val matchedSignals = LinkedHashSet<String>()
        for (signal in GamblingRegistry.webContentSignals) {
            if (joined.contains(signal)) {
                matchedSignals.add(signal)
                if (matchedSignals.size >= 2) {
                    return BlockMatchResult(
                        isBlocked = true,
                        matchedTarget = matchedSignals.joinToString(" + "),
                        category = GamblingCategory.CASINO,
                        reason = "Detected live gambling interface in WebView",
                    )
                }
            }
        }

        for (brand in GamblingRegistry.gamblingBrandTokens) {
            if (joined.contains(brand) && matchedSignals.isNotEmpty()) {
                return BlockMatchResult(
                    isBlocked = true,
                    matchedTarget = brand,
                    category = GamblingCategory.SPORTSBOOK,
                    reason = "Detected gambling brand page ($brand)",
                )
            }
        }

        return BlockMatchResult(isBlocked = false)
    }

    fun matchAppPackage(
        packageName: String,
        config: BlockFilterConfig,
        appLabel: String? = null,
    ): BlockMatchResult {
        val pkg = packageName.trim().lowercase()
        if (pkg.isEmpty()) return BlockMatchResult(isBlocked = false)

        if (pkg in config.customBlockedPackages) {
            return BlockMatchResult(
                isBlocked = true,
                matchedTarget = appLabel ?: pkg,
                category = GamblingCategory.CUSTOM,
                reason = "Blocked custom app",
            )
        }

        if (pkg in GamblingRegistry.knownGamblingAppPackages) {
            return BlockMatchResult(
                isBlocked = true,
                matchedTarget = appLabel ?: pkg,
                category = GamblingCategory.SPORTSBOOK,
                reason = "Matched known betting app",
            )
        }

        if (pkg.startsWith("com.android.") || pkg.startsWith("com.google.android.") ||
            pkg.startsWith("org.mozilla.") || pkg.startsWith("com.sec.android.") ||
            pkg.startsWith("com.microsoft.") || pkg.startsWith("com.brave.") ||
            pkg.startsWith("com.opera.")
        ) {
            return BlockMatchResult(isBlocked = false)
        }

        for (keyword in GamblingRegistry.gamblingPackageKeywords) {
            if (pkg.contains(keyword)) {
                return BlockMatchResult(
                    isBlocked = true,
                    matchedTarget = appLabel ?: pkg,
                    category = GamblingCategory.SPORTSBOOK,
                    reason = "Matched betting app signature \"$keyword\"",
                )
            }
        }

        val normalizedLabel = appLabel?.trim()?.lowercase().orEmpty()
        if (normalizedLabel.isNotEmpty()) {
            for (brand in GamblingRegistry.gamblingBrandTokens) {
                if (normalizedLabel.contains(brand)) {
                    return BlockMatchResult(
                        isBlocked = true,
                        matchedTarget = appLabel ?: pkg,
                        category = GamblingCategory.SPORTSBOOK,
                        reason = "Matched betting app name \"$brand\"",
                    )
                }
            }
        }

        return BlockMatchResult(isBlocked = false)
    }

    private fun isCategoryEnabled(category: GamblingCategory, config: BlockFilterConfig): Boolean {
        return when (category) {
            GamblingCategory.SPORTSBOOK -> config.blockSportsbooks
            GamblingCategory.CASINO -> config.blockCasinos
            GamblingCategory.POKER_BINGO -> config.blockPokerAndBingo
            GamblingCategory.CRYPTO_BETTING -> config.blockCryptoBetting
            GamblingCategory.FANTASY_LOTTERY -> config.blockFantasyAndLottery
            GamblingCategory.CUSTOM -> true
        }
    }

    private fun matchesDomainHierarchy(host: String, domainSet: Set<String>): String? {
        if (domainSet.isEmpty()) return null
        var candidate = host
        while (candidate.isNotEmpty()) {
            if (candidate in domainSet) return candidate
            val dotIdx = candidate.indexOf('.')
            candidate = if (dotIdx >= 0 && dotIdx < candidate.length - 1) {
                candidate.substring(dotIdx + 1)
            } else {
                ""
            }
        }
        return null
    }
}
