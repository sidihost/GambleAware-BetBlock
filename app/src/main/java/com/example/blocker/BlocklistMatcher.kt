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
    val adBlockerEnabled: Boolean = true,
    val playStoreGuardEnabled: Boolean = true,
    val customBlockedDomains: Set<String> = emptySet(),
    val allowlistedDomains: Set<String> = emptySet(),
    val customBlockedPackages: Set<String> = emptySet(),
    val customBlockedAppNames: Set<String> = emptySet(),
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

    private val internalSchemePrefixes = listOf(
        "chrome://", "chrome-native://", "about:", "edge://", "brave://",
        "opera://", "vivaldi://", "duckduckgo://", "firefox://",
        "file://", "content://", "data:", "blob:", "javascript:",
    )

    private val homoglyphMap: Map<Char, Char> = mapOf(
        '\u0430' to 'a', '\u0435' to 'e', '\u043e' to 'o', '\u0440' to 'p', '\u0441' to 'c',
        '\u0445' to 'x', '\u0456' to 'i', '\u0458' to 'j', '\u0443' to 'y', '\u043a' to 'k',
        '\u03b1' to 'a', '\u03b5' to 'e', '\u03bf' to 'o', '\u03c1' to 'p', '\u03b9' to 'i',
    )

    private val redirectParamRegex = Regex(
        """[?&](?:u|url|redirect|redirect_url|next|dest|destination|target|r|link|to)=([^&#]+)""",
        RegexOption.IGNORE_CASE,
    )

    private fun foldHomoglyphs(input: String): String {
        val sb = StringBuilder(input.length)
        for (ch in input) {
            sb.append(homoglyphMap[ch] ?: ch)
        }
        return sb.toString()
    }

    private fun extractRedirectTargets(rawInput: String): List<String> {
        val out = mutableListOf<String>()
        for (match in redirectParamRegex.findAll(rawInput)) {
            if (out.size >= 4) break
            val rawVal = match.groupValues[1]
            val decoded = try {
                URLDecoder.decode(rawVal, "UTF-8")
            } catch (_: Exception) {
                rawVal.replace('+', ' ')
            }
            if (decoded.isNotEmpty() && decoded != rawInput) {
                out.add(decoded)
            }
        }
        return out
    }

    fun normalizeDomain(rawInput: String): String {
        var s = foldHomoglyphs(rawInput.trim().lowercase())
        if (s.isEmpty()) return ""
        if (internalSchemePrefixes.any { s.startsWith(it) }) return ""
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

    @JvmOverloads
    fun matchDomainOrUrl(
        rawDomainOrUrl: String,
        config: BlockFilterConfig,
        depth: Int = 0,
    ): BlockMatchResult {
        val rawLower = foldHomoglyphs(rawDomainOrUrl.trim().lowercase())
        if (internalSchemePrefixes.any { rawLower.startsWith(it) }) {
            return BlockMatchResult(isBlocked = false)
        }

        if (depth < 2) {
            for (wrapped in extractRedirectTargets(rawDomainOrUrl)) {
                val innerMatch = matchDomainOrUrl(wrapped, config, depth + 1)
                if (innerMatch.isBlocked) {
                    return innerMatch.copy(
                        reason = "Unwrapped redirect link (${innerMatch.reason})",
                    )
                }
            }
        }

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

        if (config.adBlockerEnabled) {
            matchesDomainHierarchy(host, GamblingRegistry.adNetworkDomains)?.let { adHost ->
                return BlockMatchResult(
                    isBlocked = true,
                    matchedTarget = adHost,
                    category = GamblingCategory.CASINO,
                    reason = "Blocked gambling ad / affiliate tracker",
                )
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
        val lower = foldHomoglyphs(rawUrl).lowercase()
        val isSearchEngineUrl = lower.contains("/search") ||
            lower.contains("google.") ||
            lower.contains("bing.com") ||
            lower.contains("duckduckgo.com") ||
            lower.contains("yahoo.com")
        if (!isSearchEngineUrl) return BlockMatchResult(isBlocked = false)

        val match = searchQueryParamRegex.find(lower) ?: return BlockMatchResult(isBlocked = false)
        val decoded = try {
            foldHomoglyphs(URLDecoder.decode(match.groupValues[1], "UTF-8")).lowercase()
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

    private val ambiguousBrandStems: Set<String> = setOf(
        "stake", "blaze", "shuffle", "wild", "flush", "chips", "howl", "boom", "rush",
        "coral", "chance", "fortuna", "mirax", "leon", "pulsz", "dabble", "sleeper",
        "draft", "lottery", "lotto", "bingo", "casino", "poker", "slots", "jackpot",
        "winner", "golden", "lucky", "action", "covers", "mirror", "super", "magic",
        "royal", "ruby", "party", "global", "high5", "trust", "prime", "crash", "points",
        "vegas", "spin", "play", "bet", "sport", "sports", "games", "match", "score",
        "spread", "circus", "virgin", "midnite", "monopoly", "galas", "heart", "foxy",
        "glossy", "rosy", "dotty", "wink", "pub", "tab", "hardrock", "fanatics",
    )

    private val distinctiveLongPrefixes: List<Pair<String, GamblingCategory>> by lazy {
        listOf(
            "sportybet" to GamblingCategory.SPORTSBOOK,
            "betbonanza" to GamblingCategory.SPORTSBOOK,
            "winnersgoldenbet" to GamblingCategory.SPORTSBOOK,
            "hollywoodbets" to GamblingCategory.SPORTSBOOK,
            "williamhill" to GamblingCategory.SPORTSBOOK,
            "paddypower" to GamblingCategory.SPORTSBOOK,
            "ladbrokes" to GamblingCategory.SPORTSBOOK,
            "mozzartbet" to GamblingCategory.SPORTSBOOK,
            "premierbet" to GamblingCategory.SPORTSBOOK,
            "sportpesa" to GamblingCategory.SPORTSBOOK,
            "merrybet" to GamblingCategory.SPORTSBOOK,
            "nairabet" to GamblingCategory.SPORTSBOOK,
            "accessbet" to GamblingCategory.SPORTSBOOK,
            "surebet247" to GamblingCategory.SPORTSBOOK,
            "betwinner" to GamblingCategory.SPORTSBOOK,
            "draftkings" to GamblingCategory.SPORTSBOOK,
            "pokerstars" to GamblingCategory.POKER_BINGO,
            "partypoker" to GamblingCategory.POKER_BINGO,
            "prizepicks" to GamblingCategory.FANTASY_LOTTERY,
            "underdogfantasy" to GamblingCategory.FANTASY_LOTTERY,
            "parlayplay" to GamblingCategory.FANTASY_LOTTERY,
            "lottoland" to GamblingCategory.FANTASY_LOTTERY,
            "babaijebu" to GamblingCategory.FANTASY_LOTTERY,
            "chumbacasino" to GamblingCategory.CASINO,
            "luckylandslots" to GamblingCategory.CASINO,
            "jackpotcitycasino" to GamblingCategory.CASINO,
        )
    }

    private val unambiguousTypedStems: List<Pair<String, GamblingCategory>> by lazy {
        val out = LinkedHashMap<String, GamblingCategory>()
        for ((domain, category) in GamblingRegistry.domainToCategory) {
            val stem = domain.substringBefore('.')
            if (stem.length >= 5 &&
                stem !in ambiguousBrandStems &&
                GamblingRegistry.safeDomains.none { it.contains(stem) }
            ) {
                out.putIfAbsent(stem, category)
            }
        }
        // Explicitly preserve multi-word brand tokens (e.g. "sporty bet", "paddy power")
        for (brand in GamblingRegistry.gamblingBrandTokens) {
            if (brand.contains(' ') && brand.length >= 6 &&
                GamblingRegistry.safeDomains.none { it.contains(brand) }
            ) {
                out.putIfAbsent(brand, GamblingCategory.SPORTSBOOK)
            }
        }
        out.entries
            .sortedByDescending { it.key.length }
            .map { it.key to it.value }
    }

    fun matchBrowserAddressText(addressText: String, config: BlockFilterConfig): BlockMatchResult {
        val trimmed = addressText.trim()
        if (trimmed.length < 4) return BlockMatchResult(isBlocked = false)
        val lower = trimmed.lowercase()
        if (internalSchemePrefixes.any { lower.startsWith(it) }) {
            return BlockMatchResult(isBlocked = false)
        }

        if (!trimmed.contains(' ')) {
            val direct = matchDomainOrUrl(trimmed, config)
            if (direct.isBlocked) return direct
        }

        val tokenMatch = domainTokenRegex.find(lower)
        if (tokenMatch != null) {
            val domainResult = matchDomainOrUrl(tokenMatch.value, config)
            if (domainResult.isBlocked) return domainResult
        }

        return BlockMatchResult(isBlocked = false)
    }

    /**
     * Evaluates browser address bar / search bar text *while* the user is still typing
     * (even before pressing Enter or typing ".com").
     * Strictly skips recovery/help queries, internal browser pages, and safe domains.
     */
    fun matchTypedBrowserInput(rawInput: String, config: BlockFilterConfig): BlockMatchResult {
        val trimmed = rawInput.trim()
        if (trimmed.length < 4) return BlockMatchResult(isBlocked = false)

        val lower = trimmed.lowercase()
        if (internalSchemePrefixes.any { lower.startsWith(it) }) {
            return BlockMatchResult(isBlocked = false)
        }
        if (recoveryTerms.any { lower.contains(it) }) {
            return BlockMatchResult(isBlocked = false)
        }

        // Never interrupt while user is typing known safe or allowlisted sites
        val stripped = lower.removePrefix("https://").removePrefix("http://").removePrefix("www.")
        if (GamblingRegistry.safeDomains.any { safe ->
                val safeStem = safe.substringBefore('.')
                stripped.startsWith(safe) || (safeStem.length >= 5 && stripped.startsWith(safeStem))
            }
        ) {
            return BlockMatchResult(isBlocked = false)
        }
        if (config.allowlistedDomains.any { allowed ->
                val allowStem = allowed.substringBefore('.')
                stripped.startsWith(allowed) || (allowStem.length >= 5 && stripped.startsWith(allowStem))
            }
        ) {
            return BlockMatchResult(isBlocked = false)
        }

        // 1. Standard domain/URL & search query check
        val standardMatch = matchBrowserAddressText(trimmed, config)
        if (standardMatch.isBlocked) return standardMatch

        // 2. Partial domain typing with dot (e.g. "sportybet.c", "bet9ja.n", "stake.c", "bc.g")
        val noSpace = !lower.contains(' ')
        if (noSpace && stripped.contains('.')) {
            val beforeSlash = stripped.substringBefore('/').substringBefore('?').substringBefore('#')
            val typedStem = beforeSlash.substringBefore('.')
            val typedTldStart = beforeSlash.substringAfter('.', "")
            if (typedTldStart.isNotEmpty()) {
                for (custom in config.customBlockedDomains) {
                    val customStem = custom.substringBefore('.')
                    if (typedStem == customStem || beforeSlash == custom) {
                        return BlockMatchResult(
                            isBlocked = true,
                            matchedTarget = custom,
                            category = GamblingCategory.CUSTOM,
                            reason = "Blocked immediately while typing $custom",
                        )
                    }
                }
                for ((domain, category) in GamblingRegistry.domainToCategory) {
                    if (!isCategoryEnabled(category, config)) continue
                    val domStem = domain.substringBefore('.')
                    val domTld = domain.substringAfter('.', "")
                    if (typedStem == domStem && domTld.startsWith(typedTldStart)) {
                        return BlockMatchResult(
                            isBlocked = true,
                            matchedTarget = domain,
                            category = category,
                            reason = "Blocked immediately while typing $domain",
                        )
                    }
                }
            }
        }

        // 3. Custom blocked domain stems typed directly (e.g. "mybookie")
        for (custom in config.customBlockedDomains) {
            val stem = custom.substringBefore('.')
            if (stem.length >= 5 && containsWholeTokenOrDirectStem(lower, stripped, stem)) {
                return BlockMatchResult(
                    isBlocked = true,
                    matchedTarget = custom,
                    category = GamblingCategory.CUSTOM,
                    reason = "Blocked custom site while typing",
                )
            }
        }

        // 4. Unambiguous gambling brand/domain stems typed before ".com" (e.g. "sportybet", "bet9ja", "1xbet")
        for ((stem, category) in unambiguousTypedStems) {
            if (!isCategoryEnabled(category, config)) continue
            if (containsWholeTokenOrDirectStem(lower, stripped, stem)) {
                return BlockMatchResult(
                    isBlocked = true,
                    matchedTarget = stem,
                    category = category,
                    reason = "Blocked \"$stem\" immediately while typing",
                )
            }
        }

        // 5. Instant 4-6 char unambiguous prefix & distinctive >= 7 char URL prefix detection while typing
        if (noSpace && stripped.length >= 4 && !stripped.contains(' ')) {
            for ((prefix, category) in GamblingRegistry.instantTypedPrefixes) {
                if (!isCategoryEnabled(category, config)) continue
                if (stripped.startsWith(prefix)) {
                    return BlockMatchResult(
                        isBlocked = true,
                        matchedTarget = prefix.trimEnd('.'),
                        category = category,
                        reason = "Blocked immediately while typing $prefix",
                    )
                }
            }
        }
        if (noSpace && stripped.length >= 7 && !stripped.contains('.')) {
            for ((fullBrand, category) in distinctiveLongPrefixes) {
                if (!isCategoryEnabled(category, config)) continue
                if (fullBrand.startsWith(stripped)) {
                    return BlockMatchResult(
                        isBlocked = true,
                        matchedTarget = fullBrand,
                        category = category,
                        reason = "Blocked \"$fullBrand\" immediately while typing",
                    )
                }
            }
        }

        // 6. Multi-word betting intent while typing in browser omnibox/search bar
        if (config.searchGuardEnabled) {
            for (intent in TYPED_BETTING_INTENT_PHRASES) {
                if (lower.contains(intent)) {
                    return BlockMatchResult(
                        isBlocked = true,
                        matchedTarget = intent,
                        category = GamblingCategory.SPORTSBOOK,
                        reason = "Blocked betting search while typing",
                    )
                }
            }
        }

        return BlockMatchResult(isBlocked = false)
    }

    private fun containsWholeTokenOrDirectStem(lower: String, strippedUrl: String, stem: String): Boolean {
        if (strippedUrl == stem || strippedUrl.startsWith("$stem.")) return true
        val idx = lower.indexOf(stem)
        if (idx < 0) return false
        val beforeOk = idx == 0 || !lower[idx - 1].isLetterOrDigit()
        val endIdx = idx + stem.length
        val afterOk = endIdx == lower.length || !lower[endIdx].isLetterOrDigit()
        return beforeOk && afterOk
    }

    private val TYPED_BETTING_INTENT_PHRASES = listOf(
        "stake casino", "stake bet", "stake login",
        "online casino", "live casino", "crypto casino",
        "place bet", "betting site", "betting odds",
        "sports betting", "sportsbook", "aviator game",
    )

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

        if (hasWebView) {
            for (text in visibleTexts) {
                val match = matchBrowserAddressText(text, config)
                if (match.isBlocked) return match
            }
        } else {
            // Outside an actual WebView, only match explicit http/https URLs (never Discover headlines or UI strings)
            for (text in visibleTexts) {
                val lower = text.trim().lowercase()
                if (lower.startsWith("http://") || lower.startsWith("https://")) {
                    val match = matchBrowserAddressText(text, config)
                    if (match.isBlocked) return match
                }
            }
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

        // Never block GambleAware itself or third-party VPN clients (Zero-VPN coexistence)
        if (pkg == "com.imoogle.gambleaware" || pkg in GamblingRegistry.safeVpnAppPackages) {
            return BlockMatchResult(isBlocked = false)
        }

        // User-selected custom blocked apps always take precedence over everyday allowlist
        if (config.customBlockedPackages.contains(pkg)) {
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

        // Never touch everyday non-betting apps, system apps, browsers, or banking apps
        if (pkg in GamblingRegistry.safeEverydayAppPackages ||
            pkg.startsWith("com.android.") || pkg.startsWith("com.google.android.") ||
            pkg.startsWith("com.chrome.") || pkg.startsWith("org.mozilla.") ||
            pkg.startsWith("com.sec.android.") || pkg.startsWith("com.microsoft.") ||
            pkg.startsWith("com.brave.") || pkg.startsWith("com.opera.") ||
            pkg.startsWith("com.duckduckgo.") || pkg.startsWith("com.vivaldi.") ||
            pkg.startsWith("com.kiwibrowser.") || pkg.startsWith("org.chromium.")
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
        if (normalizedLabel.isNotEmpty() && !recoveryTerms.any { normalizedLabel.contains(it) }) {
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

    private val storeActionSignals = listOf(
        "install", "download", "get", "update", "play", "open",
        "contains ads", "in-app purchases", "do you want to install",
        "install this app", "install anyway", "package installer",
        "sportsbook", "online casino", "betting", "gambling", "real money",
    )

    private val storeCategoryGamblingTitles = listOf(
        "sports betting", "online casino", "live casino", "slot machine",
        "real money slots", "crypto casino", "poker & casino", "betting app",
        "aviator predictor", "aviator game", "crash casino",
    )

    /**
     * Evaluates Google Play Store, OEM App Stores, and Android APK Package Installer screens
     * to automatically block downloading or sideloading betting apps (and user-blocked apps)
     * while leaving all non-betting apps, VPNs, banking apps, and recovery apps untouched.
     */
    fun matchAppStoreOrInstaller(
        isApkInstaller: Boolean,
        searchTexts: List<String>,
        visibleTexts: List<String>,
        config: BlockFilterConfig,
    ): BlockMatchResult {
        if (!config.playStoreGuardEnabled) return BlockMatchResult(isBlocked = false)

        val cleanedSearch = searchTexts
            .map { foldHomoglyphs(it.trim()).lowercase() }
            .filter { it.length >= 3 }
        val cleanedVisible = visibleTexts
            .map { foldHomoglyphs(it.trim()).lowercase() }
            .filter { it.isNotEmpty() }

        val joinedVisible = cleanedVisible.joinToString(" ")

        // Always protect recovery, self-exclusion, and GambleAware pages
        if (cleanedSearch.any { s -> recoveryTerms.any { s.contains(it) } }) {
            return BlockMatchResult(isBlocked = false)
        }
        if (joinedVisible.contains("gambleaware") || joinedVisible.contains("com.imoogle.gambleaware")) {
            return BlockMatchResult(isBlocked = false)
        }

        // 1. Play Store / App Store search bar queries for betting apps or custom blocked apps
        for (query in cleanedSearch) {
            if (query.contains("vpn") && GamblingRegistry.gamblingBrandTokens.none { query.contains(it) }) {
                continue
            }
            for (customName in config.customBlockedAppNames) {
                val cleanCustom = customName.trim().lowercase()
                if (cleanCustom.length >= 4 && containsWholeTokenOrDirectStem(query, query, cleanCustom)) {
                    return BlockMatchResult(
                        isBlocked = true,
                        matchedTarget = customName,
                        category = GamblingCategory.CUSTOM,
                        reason = "Blocked Play Store search for custom blocked app \"$customName\"",
                    )
                }
            }
            for (brand in GamblingRegistry.gamblingBrandTokens) {
                if (brand.length >= 4 && containsWholeTokenOrDirectStem(query, query, brand)) {
                    return BlockMatchResult(
                        isBlocked = true,
                        matchedTarget = brand,
                        category = GamblingCategory.SPORTSBOOK,
                        reason = "Blocked Play Store search for betting app \"$brand\"",
                    )
                }
            }
            for ((stem, category) in unambiguousTypedStems) {
                if (!isCategoryEnabled(category, config)) continue
                if (containsWholeTokenOrDirectStem(query, query, stem)) {
                    return BlockMatchResult(
                        isBlocked = true,
                        matchedTarget = stem,
                        category = category,
                        reason = "Blocked Play Store search for \"$stem\"",
                    )
                }
            }
            if (storeCategoryGamblingTitles.any { query.contains(it) }) {
                val matchedPhrase = storeCategoryGamblingTitles.first { query.contains(it) }
                return BlockMatchResult(
                    isBlocked = true,
                    matchedTarget = matchedPhrase,
                    category = GamblingCategory.CASINO,
                    reason = "Blocked Play Store gambling search \"$matchedPhrase\"",
                )
            }
        }

        if (cleanedVisible.isEmpty()) return BlockMatchResult(isBlocked = false)
        if (recoveryTerms.any { joinedVisible.contains(it) }) {
            return BlockMatchResult(isBlocked = false)
        }

        // Only trigger on actual app detail / download / APK installer screens (not generic Home feeds)
        val hasInstallContext = isApkInstaller || storeActionSignals.any { joinedVisible.contains(it) }
        if (!hasInstallContext) return BlockMatchResult(isBlocked = false)

        // Focus primarily on prominent texts (app title, developer name, prompt header)
        val prominentTexts = cleanedVisible.take(16)
        val prominentJoined = prominentTexts.joinToString(" ")

        // 2. Match user's custom blocked app names in store listing or APK installer
        for (customName in config.customBlockedAppNames) {
            val cleanCustom = customName.trim().lowercase()
            if (cleanCustom.length >= 4 && containsWholeTokenOrDirectStem(prominentJoined, prominentJoined, cleanCustom)) {
                return BlockMatchResult(
                    isBlocked = true,
                    matchedTarget = customName,
                    category = GamblingCategory.CUSTOM,
                    reason = if (isApkInstaller) {
                        "Blocked sideloading custom blocked app \"$customName\""
                    } else {
                        "Blocked Play Store download of custom blocked app \"$customName\""
                    },
                )
            }
        }

        // 3. Match known gambling brands in prominent store listing or APK install dialog
        for (brand in GamblingRegistry.gamblingBrandTokens) {
            if (brand.length >= 4 && containsWholeTokenOrDirectStem(prominentJoined, prominentJoined, brand)) {
                return BlockMatchResult(
                    isBlocked = true,
                    matchedTarget = brand,
                    category = GamblingCategory.SPORTSBOOK,
                    reason = if (isApkInstaller) {
                        "Blocked sideloading betting APK \"$brand\""
                    } else {
                        "Blocked Play Store download of betting app \"$brand\""
                    },
                )
            }
        }

        // 4. Match unambiguous betting domain/brand stems (e.g. sportybet, bet9ja, betking, 1xbet, draftkings)
        for ((stem, category) in unambiguousTypedStems) {
            if (!isCategoryEnabled(category, config)) continue
            if (containsWholeTokenOrDirectStem(prominentJoined, prominentJoined, stem)) {
                return BlockMatchResult(
                    isBlocked = true,
                    matchedTarget = stem,
                    category = category,
                    reason = if (isApkInstaller) {
                        "Blocked sideloading betting APK \"$stem\""
                    } else {
                        "Blocked Play Store download of \"$stem\""
                    },
                )
            }
        }

        // 5. Generic casino/sportsbook app listing with explicit install button + gambling category title
        val hasExplicitInstallBtn = cleanedVisible.any {
            it == "install" || it == "download" || it == "get" || it.contains("do you want to install")
        }
        if (hasExplicitInstallBtn) {
            for (phrase in storeCategoryGamblingTitles) {
                if (prominentJoined.contains(phrase)) {
                    return BlockMatchResult(
                        isBlocked = true,
                        matchedTarget = phrase,
                        category = GamblingCategory.CASINO,
                        reason = if (isApkInstaller) {
                            "Blocked gambling APK installation ($phrase)"
                        } else {
                            "Blocked Play Store gambling app ($phrase)"
                        },
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
