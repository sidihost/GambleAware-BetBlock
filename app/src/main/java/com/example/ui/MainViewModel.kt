package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.blocker.BlockMatchResult
import com.example.blocker.BlocklistMatcher
import com.example.blocker.GamblingCategory
import com.example.blocker.GamblingRegistry
import com.example.data.AnchorRepository
import com.example.data.BlockedAppEntity
import com.example.data.BlockedDomainEntity
import com.example.data.BlockedEventEntity
import com.example.data.InstalledAppInfo
import com.example.data.ProtectionSettingsState
import com.example.data.ThemeMode
import com.example.service.AnchorDeviceAdminReceiver
import com.example.service.BetBlockerAccessibilityService
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

data class MainUiState(
    val settings: ProtectionSettingsState = ProtectionSettingsState(),
    val isAccessibilityEnabled: Boolean = false,
    val isDeviceAdminEnabled: Boolean = false,
    val privateDnsStatus: PrivateDnsStatus = PrivateDnsStatus(false, null),
    val customBlockedDomains: List<BlockedDomainEntity> = emptyList(),
    val allowlistedDomains: List<BlockedDomainEntity> = emptyList(),
    val customBlockedApps: List<BlockedAppEntity> = emptyList(),
    val recentEvents: List<BlockedEventEntity> = emptyList(),
    val totalBlockedCount: Int = 0,
    val todayBlockedCount: Int = 0,
    val sevenDayStats: List<DailyBlockStat> = emptyList(),
    val categoryBreakdown: List<CategoryBreakdown> = emptyList(),
    val installedApps: List<InstalledAppInfo> = emptyList(),
    val isLoadingApps: Boolean = false,
    val testQueryInput: String = "",
    val testMatchResult: BlockMatchResult? = null,
    val statusBannerMessage: String? = null,
    val builtInDomainCount: Int = GamblingRegistry.domainToCategory.size,
    val currentTimeMs: Long = System.currentTimeMillis(),
) {
    val isFullyArmed: Boolean
        get() = settings.isProtectionEnabled && isAccessibilityEnabled

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

    val cleanDays: Int
        get() {
            val start = settings.protectionStartedAtMs
            if (!settings.isProtectionEnabled || start <= 0L) return 0
            val diff = (currentTimeMs - start).coerceAtLeast(0L)
            return (diff / (24L * 60 * 60 * 1000)).toInt()
        }

    val cleanHoursRemainder: Int
        get() {
            val start = settings.protectionStartedAtMs
            if (!settings.isProtectionEnabled || start <= 0L) return 0
            val diff = (currentTimeMs - start).coerceAtLeast(0L)
            return ((diff / (60L * 60 * 1000)) % 24).toInt()
        }

    val estimatedSavedAmount: Int
        get() {
            val start = settings.protectionStartedAtMs
            if (!settings.isProtectionEnabled || start <= 0L) return 0
            val daysFraction = (currentTimeMs - start).coerceAtLeast(0L) /
                (24.0 * 60.0 * 60.0 * 1000.0)
            return (daysFraction * settings.dailyBetSpendEstimate).toInt()
        }
}

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = AnchorRepository.getInstance(application)
    private val installedAppsFlow = MutableStateFlow<List<InstalledAppInfo>>(emptyList())
    private val loadingAppsFlow = MutableStateFlow(false)
    private val systemAccessibilityFlow = MutableStateFlow(
        BetBlockerAccessibilityService.isEnabledInSystem(application),
    )
    private val deviceAdminFlow = MutableStateFlow(
        AnchorDeviceAdminReceiver.isAdminActive(application),
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
        systemAccessibilityFlow,
        repository.accessibilityRunning,
        deviceAdminFlow,
        privateDnsFlow,
    ) { settings, sysAcc, svcAcc, adminActive, dnsStatus ->
        Tuple5(settings, sysAcc || svcAcc, adminActive, dnsStatus, Unit)
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

    val uiState: StateFlow<MainUiState> = combine(
        systemHealthFlow,
        dataFlow,
        interactiveFlow,
        bannerFlow,
        tickerFlow,
    ) { health, data, interactive, banner, nowMs ->
        val settings = health.first
        val domains = data.first
        val weekEvents = interactive.first
        MainUiState(
            settings = settings,
            isAccessibilityEnabled = health.second,
            isDeviceAdminEnabled = health.third,
            privateDnsStatus = health.fourth,
            customBlockedDomains = domains.filter { !it.isAllowlisted },
            allowlistedDomains = domains.filter { it.isAllowlisted },
            customBlockedApps = data.second,
            recentEvents = data.third,
            totalBlockedCount = data.fourth,
            todayBlockedCount = data.fifth,
            sevenDayStats = buildSevenDayStats(weekEvents),
            categoryBreakdown = buildCategoryBreakdown(data.third),
            installedApps = interactive.second,
            isLoadingApps = interactive.third,
            testQueryInput = interactive.fourth,
            testMatchResult = interactive.fifth,
            statusBannerMessage = banner,
            currentTimeMs = nowMs,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = MainUiState(),
    )

    fun refreshSystemServiceStatus() {
        val ctx = getApplication<Application>()
        val enabled = BetBlockerAccessibilityService.isEnabledInSystem(ctx)
        systemAccessibilityFlow.value = enabled
        if (!enabled) {
            repository.setAccessibilityRunning(false)
        }
        deviceAdminFlow.value = AnchorDeviceAdminReceiver.isAdminActive(ctx)
        privateDnsFlow.value = PrivateDnsInspector.inspect(ctx)
    }

    fun enableProtection() {
        repository.prefs.setProtectionEnabled(true)
        bannerFlow.value = if (uiState.value.isAccessibilityEnabled) {
            "GambleAware Shield active"
        } else {
            "Enable Accessibility Shield to intercept sites & apps"
        }
    }

    fun disableProtection() {
        repository.prefs.setProtectionEnabled(false)
        bannerFlow.value = "Protection paused"
    }

    fun deactivateDeviceAdmin() {
        val ctx = getApplication<Application>()
        AnchorDeviceAdminReceiver.deactivateAdmin(ctx)
        deviceAdminFlow.value = AnchorDeviceAdminReceiver.isAdminActive(ctx)
        bannerFlow.value = "Uninstall lock deactivated"
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

    fun setAntiTamperEnabled(enabled: Boolean) {
        repository.prefs.setAntiTamperLockEnabled(enabled)
    }

    fun setThemeMode(mode: ThemeMode) {
        repository.prefs.setThemeMode(mode)
    }

    fun setDailySpendEstimate(amount: Int) {
        repository.prefs.setDailyBetSpendEstimate(amount)
    }

    fun addCustomDomain(rawDomain: String, isAllowlisted: Boolean) {
        val normalized = BlocklistMatcher.normalizeDomain(rawDomain)
        if (normalized.isEmpty() || !normalized.contains('.')) {
            bannerFlow.value = "Enter a valid domain such as example.com"
            return
        }
        viewModelScope.launch {
            repository.addCustomDomain(normalized, isAllowlisted)
            bannerFlow.value = if (isAllowlisted) {
                "Allowlisted $normalized"
            } else {
                "Blocked $normalized"
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
            testResultFlow.value = BlocklistMatcher.matchDomainOrUrl(
                query,
                repository.getCurrentFilterConfig(),
            )
        }
    }

    private fun retestIfNeeded() {
        val q = testQueryFlow.value
        if (q.isNotBlank()) {
            testResultFlow.value = BlocklistMatcher.matchDomainOrUrl(
                q,
                repository.getCurrentFilterConfig(),
            )
        }
    }

    fun activateTimeLock(days: Int, enableAntiTamper: Boolean) {
        val durationMs = days.toLong() * 24L * 60L * 60L * 1000L
        repository.prefs.activateTimeLock(durationMs)
        if (enableAntiTamper) {
            repository.prefs.setAntiTamperLockEnabled(true)
        }
        bannerFlow.value = "Commitment Lock active for $days day${if (days == 1) "" else "s"}"
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
        bannerFlow.value = "Clean streak restarted"
    }

    fun completeTour() {
        repository.prefs.setHasCompletedTour(true)
    }

    fun replayTour() {
        repository.prefs.setHasCompletedTour(false)
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

    private data class Tuple5<A, B, C, D, E>(
        val first: A,
        val second: B,
        val third: C,
        val fourth: D,
        val fifth: E,
    )
}
