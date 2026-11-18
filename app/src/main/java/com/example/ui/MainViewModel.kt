package com.example.ui

import android.app.Application
import android.app.admin.DevicePolicyManager
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.blocker.BlockMatchResult
import com.example.blocker.BlocklistMatcher
import com.example.blocker.BrandCatalog
import com.example.blocker.GamblingCategory
import com.example.blocker.GamblingRegistry
import com.example.blocker.TiltRadarEngine
import com.example.blocker.TiltRadarEvaluation
import com.example.data.AnchorRepository
import com.example.data.BlockedAppEntity
import com.example.data.BlockedDomainEntity
import com.example.data.BlockedEventEntity
import com.example.data.InstalledAppInfo
import com.example.data.ProtectionSettingsState
import com.example.data.ThemeMode
import com.example.data.UrgeLogEntity
import com.example.service.GambleAwareAccessibilityService
import com.example.service.GambleAwareDeviceAdminReceiver
import com.example.service.GambleAwareNotifications
import com.example.service.PrivateDnsInspector
import com.example.service.PrivateDnsStatus
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Calendar
import java.util.Locale

data class DailyBlockStat(
    val dayLabel: String,
    val count: Int,
)

data class CategoryBreakdown(
    val category: GamblingCategory,
    val count: Int,
)

data class TriggerBreakdown(
    val triggerTag: String,
    val count: Int,
)

data class GroupedBlockedTarget(
    val key: String,
    val target: String,
    val attemptCount: Int,
    val latestTimestamp: Long,
    val latestSource: String,
    val sources: List<String>,
    val categoryName: String,
    val isApp: Boolean,
)

fun isAppBlockSource(source: String): Boolean =
    source.equals("App Shield", ignoreCase = true) ||
        source.equals("Install Guard", ignoreCase = true) ||
        source.contains("App", ignoreCase = true)

fun normalizeBlockedTarget(rawTarget: String): String {
    val trimmed = rawTarget.trim()
    if (trimmed.isEmpty()) return "Unknown site"
    val normalized = BlocklistMatcher.normalizeDomain(trimmed)
    return if (normalized.isNotEmpty() && !trimmed.contains(' ') && normalized.contains('.')) {
        normalized
    } else {
        trimmed
    }
}

fun formatBlockedTargetDisplay(rawTarget: String): String {
    val trimmed = rawTarget.trim()
    if (trimmed.isEmpty()) return "Betting Platform"
    val resolved = BrandCatalog.resolve(trimmed)
    if (resolved.isExactCatalogMatch) {
        return resolved.displayName
    }
    if (trimmed.startsWith("com.", ignoreCase = true) || trimmed.startsWith("org.", ignoreCase = true)) {
        val lastSeg = trimmed.substringAfterLast('.').ifBlank { trimmed }
        return lastSeg.replaceFirstChar { it.uppercaseChar() }
    }
    val domainStripped = BlocklistMatcher.normalizeDomain(trimmed)
    if (domainStripped.contains('.')) {
        return domainStripped.substringBefore('.').replaceFirstChar { it.uppercaseChar() }
    }
    return resolved.displayName
}

fun buildGroupedBlockedTargets(events: List<BlockedEventEntity>): List<GroupedBlockedTarget> {
    if (events.isEmpty()) return emptyList()

    data class Accumulator(
        val key: String,
        var target: String,
        var attemptCount: Int,
        var latestTimestamp: Long,
        var latestSource: String,
        val sources: LinkedHashSet<String>,
        var categoryName: String,
        var isApp: Boolean,
    )

    val byKey = linkedMapOf<String, Accumulator>()
    for (event in events) {
        val cleanTarget = normalizeBlockedTarget(event.target)
        val appBlock = isAppBlockSource(event.source)
        val groupKey = (if (appBlock) "app:" else "site:") + cleanTarget.lowercase(Locale.US)
        val existing = byKey[groupKey]
        if (existing == null) {
            byKey[groupKey] = Accumulator(
                key = groupKey,
                target = cleanTarget,
                attemptCount = 1,
                latestTimestamp = event.timestamp,
                latestSource = event.source,
                sources = linkedSetOf(event.source),
                categoryName = event.categoryName,
                isApp = appBlock,
            )
        } else {
            existing.attemptCount += 1
            existing.sources.add(event.source)
            if (event.timestamp >= existing.latestTimestamp) {
                existing.latestTimestamp = event.timestamp
                existing.latestSource = event.source
                existing.categoryName = event.categoryName
                existing.target = cleanTarget
            }
        }
    }

    return byKey.values
        .map { acc ->
            GroupedBlockedTarget(
                key = acc.key,
                target = acc.target,
                attemptCount = acc.attemptCount,
                latestTimestamp = acc.latestTimestamp,
                latestSource = acc.latestSource,
                sources = acc.sources.toList(),
                categoryName = acc.categoryName,
                isApp = acc.isApp,
            )
        }
        .sortedWith(
            compareByDescending<GroupedBlockedTarget> { it.latestTimestamp }
                .thenByDescending { it.attemptCount },
        )
}

fun formatAttemptCountLabel(count: Int): String = "$count blocked"

fun formatBlockedRelativeTime(timestampMs: Long, nowMs: Long = System.currentTimeMillis()): String {
    val diffMs = (nowMs - timestampMs).coerceAtLeast(0L)
    val minuteMs = 60_000L
    val hourMs = 3_600_000L
    val dayMs = 86_400_000L
    return when {
        diffMs < minuteMs -> "Just now"
        diffMs < hourMs -> "${diffMs / minuteMs}m ago"
        diffMs < dayMs -> "${diffMs / hourMs}h ago"
        diffMs < 7 * dayMs -> "${diffMs / dayMs}d ago"
        else -> java.text.SimpleDateFormat("MMM d", Locale.getDefault()).format(java.util.Date(timestampMs))
    }
}

fun buildCleanStreakShareText(state: MainUiState): String {
    val dayWord = if (state.cleanDays == 1) "day" else "days"
    val elapsed = String.format(
        Locale.US,
        "%02dh %02dm %02ds",
        state.cleanHoursRemainder,
        state.cleanMinutesRemainder,
        state.cleanSecondsRemainder,
    )
    val savedFormatted =
        "₦" + NumberFormat.getIntegerInstance(Locale("en", "NG")).format(state.estimatedSavedAmount)
    return buildString {
        appendLine("I'm ${state.cleanDays} $dayWord ($elapsed) betting-free with GambleAware.")
        appendLine("• Estimated saved: $savedFormatted")
        appendLine("• Urges resisted: ${state.totalUrgeResistedCount} | Betting sites blocked: ${state.totalBlockedCount}")
        append("• Next milestone: ${state.nextMilestone.title} (${state.nextMilestone.days}d)")
    }
}

data class RecoveryMilestone(
    val days: Int,
    val label: String,
    val title: String,
)

val RECOVERY_MILESTONES = listOf(
    RecoveryMilestone(1, "1d", "First 24h"),
    RecoveryMilestone(3, "3d", "Urge Peak"),
    RecoveryMilestone(7, "7d", "One Week"),
    RecoveryMilestone(14, "14d", "Two Weeks"),
    RecoveryMilestone(30, "30d", "One Month"),
    RecoveryMilestone(90, "90d", "Rewired"),
    RecoveryMilestone(180, "180d", "Half Year"),
    RecoveryMilestone(365, "365d", "One Year"),
    RecoveryMilestone(730, "730d", "Two Years"),
)

data class MainUiState(
    val settings: ProtectionSettingsState = ProtectionSettingsState(),
    val isShieldServiceRunning: Boolean = false,
    val isAccessibilityEnabled: Boolean = false,
    val isDeviceAdminEnabled: Boolean = false,
    val privateDnsStatus: PrivateDnsStatus = PrivateDnsStatus(false, null),
    val customBlockedDomains: List<BlockedDomainEntity> = emptyList(),
    val allowlistedDomains: List<BlockedDomainEntity> = emptyList(),
    val customBlockedApps: List<BlockedAppEntity> = emptyList(),
    val recentEvents: List<BlockedEventEntity> = emptyList(),
    val groupedBlockedTargets: List<GroupedBlockedTarget> = emptyList(),
    val recentUrgeLogs: List<UrgeLogEntity> = emptyList(),
    val totalBlockedCount: Int = 0,
    val todayBlockedCount: Int = 0,
    val totalUrgeResistedCount: Int = 0,
    val sevenDayStats: List<DailyBlockStat> = emptyList(),
    val categoryBreakdown: List<CategoryBreakdown> = emptyList(),
    val triggerBreakdown: List<TriggerBreakdown> = emptyList(),
    val installedApps: List<InstalledAppInfo> = emptyList(),
    val isLoadingApps: Boolean = false,
    val testQueryInput: String = "",
    val testMatchResult: BlockMatchResult? = null,
    val statusBannerMessage: String? = null,
    val builtInDomainCount: Int = GamblingRegistry.domainToCategory.size,
    val currentTimeMs: Long = System.currentTimeMillis(),
) {
    val isFullyArmed: Boolean
        get() = settings.isProtectionEnabled && (isShieldServiceRunning || isAccessibilityEnabled)

    val isTimeLockedNow: Boolean
        get() = settings.isTimeLocked(currentTimeMs)

    val remainingLockMsNow: Long
        get() = settings.remainingLockMs(currentTimeMs)

    val lockCountdownFormatted: String
        get() {
            val remaining = remainingLockMsNow
            if (remaining <= 0L) return "00d 00h 00m 00s"
            val totalSeconds = remaining / 1000L
            val days = totalSeconds / 86400L
            val hours = (totalSeconds % 86400L) / 3600L
            val minutes = (totalSeconds % 3600L) / 60L
            val seconds = totalSeconds % 60L
            return String.format(Locale.US, "%02dd %02dh %02dm %02ds", days, hours, minutes, seconds)
        }

    val lockClockQuad: List<Pair<String, String>>
        get() {
            val remaining = remainingLockMsNow
            val totalSeconds = (remaining / 1000L).coerceAtLeast(0L)
            val days = totalSeconds / 86400L
            val hours = (totalSeconds % 86400L) / 3600L
            val minutes = (totalSeconds % 3600L) / 60L
            val seconds = totalSeconds % 60L
            return listOf(
                String.format(Locale.US, "%02d", days) to "DAYS",
                String.format(Locale.US, "%02d", hours) to "HRS",
                String.format(Locale.US, "%02d", minutes) to "MIN",
                String.format(Locale.US, "%02d", seconds) to "SEC",
            )
        }

    val cleanElapsedMs: Long
        get() {
            val start = settings.protectionStartedAtMs
            if (!settings.isProtectionEnabled || start <= 0L) return 0L
            return (currentTimeMs - start).coerceAtLeast(0L)
        }

    val cleanExactDays: Float
        get() = (cleanElapsedMs / (24.0 * 60.0 * 60.0 * 1000.0)).toFloat()

    val cleanDays: Int
        get() = (cleanElapsedMs / (24L * 60 * 60 * 1000)).toInt()

    val cleanHoursRemainder: Int
        get() = ((cleanElapsedMs / (60L * 60 * 1000)) % 24).toInt()

    val cleanMinutesRemainder: Int
        get() = ((cleanElapsedMs / (60L * 1000)) % 60).toInt()

    val cleanSecondsRemainder: Int
        get() = ((cleanElapsedMs / 1000L) % 60).toInt()

    val nextMilestone: RecoveryMilestone
        get() = RECOVERY_MILESTONES.firstOrNull { it.days > cleanDays } ?: RECOVERY_MILESTONES.last()

    val milestoneProgressFraction: Float
        get() {
            val target = nextMilestone.days.toFloat().coerceAtLeast(1f)
            return (cleanExactDays / target).coerceIn(0f, 1f)
        }

    val estimatedSavedAmount: Int
        get() = (cleanExactDays * settings.dailyBetSpendEstimate).toInt() + settings.bankedUrgeSavingsNgn

    val tiltRadar: TiltRadarEvaluation
        get() = TiltRadarEngine.evaluate(recentEvents, currentTimeMs)
}

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = AnchorRepository.getInstance(application)
    private val installedAppsFlow = MutableStateFlow<List<InstalledAppInfo>>(emptyList())
    private val loadingAppsFlow = MutableStateFlow(false)
    private val accessibilityEnabledFlow = MutableStateFlow(
        GambleAwareAccessibilityService.isEnabled(application),
    )
    private val deviceAdminActiveFlow = MutableStateFlow(
        checkDeviceAdminActive(application),
    )
    private val privateDnsFlow = MutableStateFlow(
        PrivateDnsInspector.inspect(application),
    )
    private val testQueryFlow = MutableStateFlow("")
    private val testResultFlow = MutableStateFlow<BlockMatchResult?>(null)
    private val bannerFlow = MutableStateFlow<String?>(null)

    private val tickerFlow = flow {
        while (true) {
            emit(System.currentTimeMillis())
            delay(1000L)
        }
    }

    private val systemHealthFlow = combine(
        repository.settings,
        repository.shieldRunning,
        accessibilityEnabledFlow,
        privateDnsFlow,
        deviceAdminActiveFlow,
    ) { settings, shieldRunning, accessibilityEnabled, dnsStatus, deviceAdminActive ->
        Tuple5(settings, shieldRunning, accessibilityEnabled, dnsStatus, deviceAdminActive)
    }

    private val dataFlow = combine(
        repository.customDomains,
        repository.customBlockedApps,
        repository.recentEvents,
        repository.totalBlockedCount,
        repository.todayBlockedCount,
    ) { domains, apps, recent, total, today ->
        Tuple5(domains, apps, recent, total, today)
    }

    private val interactiveFlow = combine(
        repository.lastSevenDaysEvents,
        installedAppsFlow,
        loadingAppsFlow,
        testQueryFlow,
        testResultFlow,
    ) { weekEvents, apps, loading, query, result ->
        Tuple5(weekEvents, apps, loading, query, result)
    }

    private val urgeFlow = combine(
        repository.recentUrgeLogs,
        repository.totalUrgeResistedCount,
    ) { logs, total ->
        logs to total
    }

    private val metaFlow = combine(
        bannerFlow,
        tickerFlow,
        urgeFlow,
    ) { banner, nowMs, urges ->
        Triple(banner, nowMs, urges)
    }

    val uiState: StateFlow<MainUiState> = combine(
        systemHealthFlow,
        dataFlow,
        interactiveFlow,
        metaFlow,
    ) { health, data, interactive, meta ->
        val settings = health.first
        val domains = data.first
        val weekEvents = interactive.first
        val banner = meta.first
        val nowMs = meta.second
        val urgeLogs = meta.third.first
        val totalUrges = meta.third.second

        val state = MainUiState(
            settings = settings,
            isShieldServiceRunning = health.second,
            isAccessibilityEnabled = health.third,
            isDeviceAdminEnabled = health.fifth,
            privateDnsStatus = health.fourth,
            customBlockedDomains = domains.filter { !it.isAllowlisted },
            allowlistedDomains = domains.filter { it.isAllowlisted },
            customBlockedApps = data.second,
            recentEvents = data.third,
            groupedBlockedTargets = buildGroupedBlockedTargets(data.third),
            recentUrgeLogs = urgeLogs,
            totalBlockedCount = data.fourth,
            todayBlockedCount = data.fifth,
            totalUrgeResistedCount = totalUrges,
            sevenDayStats = buildSevenDayStats(weekEvents),
            categoryBreakdown = buildCategoryBreakdown(data.third),
            triggerBreakdown = buildTriggerBreakdown(urgeLogs),
            installedApps = interactive.second,
            isLoadingApps = interactive.third,
            testQueryInput = interactive.fourth,
            testMatchResult = interactive.fifth,
            statusBannerMessage = banner,
            currentTimeMs = nowMs,
        )

        if (settings.notificationsEnabled && state.cleanDays >= 1) {
            GambleAwareNotifications.notifyMilestoneIfEligible(
                context = getApplication(),
                cleanDays = state.cleanDays,
                estimatedSaved = state.estimatedSavedAmount,
                lastNotifiedDay = settings.lastNotifiedMilestoneDay,
                onMarkNotified = { day -> repository.prefs.setLastNotifiedMilestoneDay(day) },
            )
        }

        state
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = MainUiState(),
    )

    private fun checkDeviceAdminActive(ctx: Context): Boolean {
        return runCatching {
            val dpm = ctx.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
            dpm?.isAdminActive(GambleAwareDeviceAdminReceiver.componentName(ctx)) == true
        }.getOrDefault(false)
    }

    fun refreshSystemServiceStatus() {
        val ctx = getApplication<Application>()
        val accessibilityReady = GambleAwareAccessibilityService.isEnabled(ctx)
        accessibilityEnabledFlow.value = accessibilityReady
        repository.setShieldRunning(accessibilityReady)
        deviceAdminActiveFlow.value = checkDeviceAdminActive(ctx)
        privateDnsFlow.value = PrivateDnsInspector.inspect(ctx)
    }

    fun deactivateDeviceAdmin(): Boolean {
        val snap = repository.prefs.currentSnapshot()
        if (snap.isTimeLocked() || snap.antiTamperLockEnabled) {
            bannerFlow.value = "Uninstall Lock stays armed until your Commitment Lock ends"
            return false
        }
        val ctx = getApplication<Application>()
        runCatching {
            val dpm = ctx.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
            val admin = GambleAwareDeviceAdminReceiver.componentName(ctx)
            if (dpm?.isAdminActive(admin) == true) {
                dpm.removeActiveAdmin(admin)
            }
        }
        deviceAdminActiveFlow.value = checkDeviceAdminActive(ctx)
        bannerFlow.value = "Uninstall Lock deactivated"
        return true
    }

    fun bankUrgeStake(amountNgn: Int) {
        val safeAmount = amountNgn.coerceIn(100, 10_000_000)
        repository.prefs.bankUrgeStake(safeAmount)
        val formatted = "₦" + NumberFormat.getIntegerInstance(Locale("en", "NG")).format(safeAmount)
        bannerFlow.value = "Banked $formatted into your Recovery Vault instead of betting"
    }

    fun setDepositGuardEnabled(enabled: Boolean) {
        repository.prefs.setDepositGuardEnabled(enabled)
        bannerFlow.value = if (enabled) {
            "Cashier & Booking-Code Guard enabled"
        } else {
            "Deposit Guard paused"
        }
    }

    fun configureBuddyCoLock(partnerName: String) {
        val challenge = TiltRadarEngine.generateBuddyChallengeCode()
        repository.prefs.setBuddyPartner(partnerName, challenge)
        bannerFlow.value = "Trusted Buddy Co-Lock paired (${partnerName.trim().ifEmpty { "Partner" }})"
    }

    fun clearBuddyCoLock() {
        repository.prefs.clearBuddyPartner()
        bannerFlow.value = "Buddy Co-Lock cleared"
    }

    fun verifyBuddyUnlock(partnerSalt: String, candidateResponse: String): Boolean {
        val snap = repository.prefs.currentSnapshot()
        val challenge = snap.buddyChallengeCode.ifEmpty { return false }
        val ok = TiltRadarEngine.verifyBuddyUnlockCode(challenge, partnerSalt, candidateResponse)
        if (ok) {
            repository.prefs.unlockCommitmentViaBuddyApproval()
            bannerFlow.value = "Trusted Buddy approval verified — Commitment Lock unlocked"
        }
        return ok
    }

    fun enableProtection() {
        val ctx = getApplication<Application>()
        repository.prefs.setProtectionEnabled(true)
        val accessibilityReady = GambleAwareAccessibilityService.isEnabled(ctx)
        accessibilityEnabledFlow.value = accessibilityReady
        repository.setShieldRunning(accessibilityReady)
        bannerFlow.value = if (accessibilityReady) {
            "GambleAware All-Browser & Ad Shield active (Zero-VPN)"
        } else {
            "Turn on GambleAware Accessibility Shield for all-browser & app blocking"
        }
    }

    fun disableProtection() {
        repository.prefs.setProtectionEnabled(false)
        bannerFlow.value = "Protection paused"
    }

    fun setPreferredName(name: String) {
        repository.prefs.setPreferredName(name)
    }

    fun completeInitialSetup(name: String, lockDays: Int, enableProtection: Boolean = true) {
        val safeDays = if (lockDays <= 0) 0 else lockDays.coerceIn(1, 730)
        repository.prefs.completeInitialSetup(name, safeDays, enableProtection)
        refreshSystemServiceStatus()
        val first = name.trim().split(Regex("\\s+")).firstOrNull().orEmpty()
        bannerFlow.value = if (safeDays > 0) {
            val span = formatLockSpan(safeDays)
            if (first.isNotEmpty()) "Locked for $span — welcome, $first"
            else "All-Browser Shield & Lock armed for $span"
        } else {
            if (first.isNotEmpty()) "Preferences saved — welcome, $first"
            else "Setup saved — lock anytime you decide"
        }
    }

    fun skipInitialSetup() {
        repository.prefs.skipInitialSetup()
        refreshSystemServiceStatus()
        bannerFlow.value = "Exploring freely — enable Shield or Lock anytime"
    }

    fun updateCategory(category: GamblingCategory, enabled: Boolean) {
        when (category) {
            GamblingCategory.SPORTSBOOK -> repository.prefs.setBlockSportsbooks(enabled)
            GamblingCategory.CASINO -> repository.prefs.setBlockCasinos(enabled)
            GamblingCategory.POKER_BINGO -> repository.prefs.setBlockPokerAndBingo(enabled)
            GamblingCategory.CRYPTO_BETTING -> repository.prefs.setBlockCryptoBetting(enabled)
            GamblingCategory.FANTASY_LOTTERY -> repository.prefs.setBlockFantasyAndLottery(enabled)
            GamblingCategory.CUSTOM -> Unit
        }
        retestIfNeeded()
    }

    fun setStrictKeywordFilter(enabled: Boolean) {
        repository.prefs.setStrictKeywordFilter(enabled)
        retestIfNeeded()
    }

    fun setBrowserShieldEnabled(enabled: Boolean) {
        repository.prefs.setBrowserShieldEnabled(enabled)
    }

    fun setAppShieldEnabled(enabled: Boolean) {
        repository.prefs.setAppShieldEnabled(enabled)
    }

    fun setSearchGuardEnabled(enabled: Boolean) {
        repository.prefs.setSearchGuardEnabled(enabled)
    }

    fun setAdBlockerEnabled(enabled: Boolean) {
        repository.prefs.setAdBlockerEnabled(enabled)
        retestIfNeeded()
        bannerFlow.value = if (enabled) {
            "Gambling Ad & Popunder Blocker enabled"
        } else {
            "Gambling Ad Blocker paused"
        }
    }

    fun setAntiTamperEnabled(enabled: Boolean) {
        repository.prefs.setAntiTamperLockEnabled(enabled)
    }

    fun setThemeMode(mode: ThemeMode) {
        repository.prefs.setThemeMode(mode)
    }

    fun setDailySpendEstimate(amount: Int) {
        repository.prefs.setDailyBetSpendEstimate(amount)
    }

    fun setNotificationsEnabled(enabled: Boolean) {
        repository.prefs.setNotificationsEnabled(enabled)
        bannerFlow.value = if (enabled) {
            "Recovery & Lock notifications enabled"
        } else {
            "Recovery notifications muted"
        }
    }

    fun sendTestNotification() {
        val sent = GambleAwareNotifications.notifyTestAlert(getApplication())
        bannerFlow.value = if (sent) {
            "Test notification sent"
        } else {
            "Grant notification permission to receive alerts"
        }
    }

    fun addCustomDomain(rawDomain: String, isAllowlisted: Boolean) {
        val normalized = BlocklistMatcher.normalizeDomain(rawDomain)
        if (normalized.isEmpty() || !normalized.contains('.')) {
            bannerFlow.value = "Enter a valid website address"
            return
        }
        val cleanDisplay = formatBlockedTargetDisplay(normalized)
        viewModelScope.launch {
            repository.addCustomDomain(normalized, isAllowlisted)
            bannerFlow.value = if (isAllowlisted) {
                "Allowlisted $cleanDisplay"
            } else {
                "Blocked $cleanDisplay"
            }
            retestIfNeeded()
        }
    }

    fun removeCustomDomain(domain: String) {
        viewModelScope.launch {
            repository.removeCustomDomain(domain)
            bannerFlow.value = "Removed $domain"
            retestIfNeeded()
        }
    }

    fun addBlockedApp(app: InstalledAppInfo) {
        viewModelScope.launch {
            repository.addBlockedApp(app.packageName, app.label)
            bannerFlow.value = "Added ${app.label} to App Shield"
        }
    }

    fun removeBlockedApp(packageName: String) {
        viewModelScope.launch {
            repository.removeBlockedApp(packageName)
            bannerFlow.value = "Removed app rule"
        }
    }

    fun loadInstalledApps() {
        if (loadingAppsFlow.value) return
        loadingAppsFlow.value = true
        viewModelScope.launch {
            installedAppsFlow.value = repository.loadLaunchableUserApps()
            loadingAppsFlow.value = false
        }
    }

    fun updateTestQuery(query: String) {
        testQueryFlow.value = query
        if (query.isBlank()) {
            testResultFlow.value = null
        } else {
            testResultFlow.value = BlocklistMatcher.matchTypedBrowserInput(
                query,
                repository.getCurrentFilterConfig(),
            )
        }
    }

    private fun retestIfNeeded() {
        val q = testQueryFlow.value
        if (q.isNotBlank()) {
            testResultFlow.value = BlocklistMatcher.matchTypedBrowserInput(
                q,
                repository.getCurrentFilterConfig(),
            )
        }
    }

    fun activateTimeLock(days: Int, enableAntiTamper: Boolean) {
        val safeDays = days.coerceIn(1, 730)
        val durationMs = safeDays.toLong() * 24L * 60L * 60L * 1000L
        repository.prefs.activateTimeLock(durationMs)
        if (enableAntiTamper) {
            repository.prefs.setAntiTamperLockEnabled(true)
        }
        if (repository.prefs.currentSnapshot().notificationsEnabled) {
            GambleAwareNotifications.notifyLockActivated(getApplication(), safeDays)
        }
        bannerFlow.value = "Commitment Lock active for ${formatLockSpan(safeDays)}"
    }

    private fun formatLockSpan(days: Int): String = when (days) {
        1 -> "24 hours"
        180 -> "6 months"
        365 -> "1 year"
        730 -> "2 years"
        else -> "$days days"
    }

    fun setPin(pin: String) {
        if (pin.length == 4 && pin.all { it.isDigit() }) {
            repository.prefs.setPin(pin)
            bannerFlow.value = "Accountability PIN enabled"
        }
    }

    fun clearPin(currentPin: String): Boolean {
        return if (repository.prefs.verifyPin(currentPin)) {
            repository.prefs.clearPin()
            bannerFlow.value = "Accountability PIN removed"
            true
        } else {
            false
        }
    }

    fun verifyPin(pin: String): Boolean = repository.prefs.verifyPin(pin)

    fun resetStreak() {
        repository.prefs.resetStreakStart()
        repository.prefs.setLastNotifiedMilestoneDay(0)
        bannerFlow.value = "Clean streak restarted"
    }

    fun completeTour() {
        repository.prefs.setHasCompletedTour(true)
    }

    fun replayTour() {
        repository.prefs.setHasCompletedTour(false)
    }

    fun logUrgeResisted(triggerTag: String, note: String) {
        viewModelScope.launch {
            repository.logUrgeResisted(triggerTag, note)
            bannerFlow.value = "Urge resisted & logged ($triggerTag)"
        }
    }

    fun clearEventHistory() {
        viewModelScope.launch {
            repository.clearEventHistory()
            bannerFlow.value = "Blocked activity log cleared"
        }
    }

    fun clearBanner() {
        bannerFlow.value = null
    }

    private fun buildSevenDayStats(events: List<BlockedEventEntity>): List<DailyBlockStat> {
        val dayLabels = arrayOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
        val cal = Calendar.getInstance()
        val countsByDayKey = mutableMapOf<String, Int>()
        for (event in events) {
            val c = Calendar.getInstance().apply { timeInMillis = event.timestamp }
            val key = "${c.get(Calendar.YEAR)}-${c.get(Calendar.DAY_OF_YEAR)}"
            countsByDayKey[key] = (countsByDayKey[key] ?: 0) + 1
        }
        return (6 downTo 0).map { daysAgo ->
            val c = (cal.clone() as Calendar).apply { add(Calendar.DAY_OF_YEAR, -daysAgo) }
            val key = "${c.get(Calendar.YEAR)}-${c.get(Calendar.DAY_OF_YEAR)}"
            val label = if (daysAgo == 0) "Today" else dayLabels[c.get(Calendar.DAY_OF_WEEK) - 1]
            DailyBlockStat(dayLabel = label, count = countsByDayKey[key] ?: 0)
        }
    }

    private fun buildCategoryBreakdown(events: List<BlockedEventEntity>): List<CategoryBreakdown> {
        if (events.isEmpty()) return emptyList()
        return events
            .groupingBy { it.categoryName }
            .eachCount()
            .entries
            .mapNotNull { (name, count) ->
                val cat = GamblingCategory.entries.firstOrNull { it.name == name } ?: GamblingCategory.CUSTOM
                CategoryBreakdown(category = cat, count = count)
            }
            .sortedByDescending { it.count }
    }

    private fun buildTriggerBreakdown(logs: List<UrgeLogEntity>): List<TriggerBreakdown> {
        if (logs.isEmpty()) return emptyList()
        return logs
            .groupingBy { it.triggerTag }
            .eachCount()
            .entries
            .map { (tag, count) -> TriggerBreakdown(tag, count) }
            .sortedByDescending { it.count }
    }

    private data class Tuple5<A, B, C, D, E>(
        val first: A,
        val second: B,
        val third: C,
        val fourth: D,
        val fifth: E,
    )
}
