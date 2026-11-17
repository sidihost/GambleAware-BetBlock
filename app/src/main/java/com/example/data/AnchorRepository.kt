package com.example.data

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import com.example.blocker.BlockFilterConfig
import com.example.blocker.BlocklistMatcher
import com.example.blocker.GamblingCategory
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.withContext
import java.util.Calendar
import java.util.concurrent.atomic.AtomicReference

data class InstalledAppInfo(
    val packageName: String,
    val label: String,
)

class AnchorRepository private constructor(context: Context) {

    private val appContext = context.applicationContext
    private val dao = BetBlockerDatabase.getInstance(appContext).dao()
    val prefs = ProtectionPreferences.getInstance(appContext)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _accessibilityRunning = MutableStateFlow(false)
    val accessibilityRunning: StateFlow<Boolean> = _accessibilityRunning.asStateFlow()

    val settings: StateFlow<ProtectionSettingsState> = prefs.state

    val customDomains: StateFlow<List<BlockedDomainEntity>> = dao.observeAllDomains()
        .stateIn(scope, SharingStarted.Eagerly, emptyList())

    val customBlockedApps: StateFlow<List<BlockedAppEntity>> = dao.observeBlockedApps()
        .stateIn(scope, SharingStarted.Eagerly, emptyList())

    val recentEvents: Flow<List<BlockedEventEntity>> = dao.observeRecentEvents()

    val totalBlockedCount: Flow<Int> = dao.observeTotalBlockedCount()

    val recentUrgeLogs: Flow<List<UrgeLogEntity>> = dao.observeRecentUrgeLogs()

    val totalUrgeResistedCount: Flow<Int> = dao.observeTotalUrgeCount()

    private val startOfTodayMs: Long
        get() = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis

    val todayBlockedCount: Flow<Int> = dao.observeBlockedCountSince(startOfTodayMs)

    val lastSevenDaysEvents: Flow<List<BlockedEventEntity>> =
        dao.observeEventsSince(System.currentTimeMillis() - 7L * 24 * 60 * 60 * 1000)

    private val cachedConfig = AtomicReference(BlockFilterConfig())

    val filterConfig: StateFlow<BlockFilterConfig> = combine(
        prefs.state,
        customDomains,
        customBlockedApps,
    ) { settingsState, domains, apps ->
        BlockFilterConfig(
            blockSportsbooks = settingsState.blockSportsbooks,
            blockCasinos = settingsState.blockCasinos,
            blockPokerAndBingo = settingsState.blockPokerAndBingo,
            blockCryptoBetting = settingsState.blockCryptoBetting,
            blockFantasyAndLottery = settingsState.blockFantasyAndLottery,
            strictKeywordFilter = settingsState.strictKeywordFilter,
            searchGuardEnabled = settingsState.searchGuardEnabled,
            customBlockedDomains = domains.filter { !it.isAllowlisted }.map { it.domain }.toSet(),
            allowlistedDomains = domains.filter { it.isAllowlisted }.map { it.domain }.toSet(),
            customBlockedPackages = apps.map { it.packageName.lowercase() }.toSet(),
        ).also { cachedConfig.set(it) }
    }.stateIn(scope, SharingStarted.Eagerly, BlockFilterConfig())

    fun getCurrentFilterConfig(): BlockFilterConfig = cachedConfig.get()

    fun setAccessibilityRunning(running: Boolean) {
        _accessibilityRunning.value = running
    }

    suspend fun addCustomDomain(rawDomain: String, isAllowlisted: Boolean) {
        val normalized = BlocklistMatcher.normalizeDomain(rawDomain)
        if (normalized.isEmpty() || !normalized.contains('.')) return
        dao.upsertDomain(
            BlockedDomainEntity(
                domain = normalized,
                isAllowlisted = isAllowlisted,
                categoryName = GamblingCategory.CUSTOM.name,
            ),
        )
    }

    suspend fun removeCustomDomain(domain: String) {
        dao.deleteDomain(domain)
    }

    suspend fun addBlockedApp(packageName: String, label: String) {
        dao.upsertBlockedApp(
            BlockedAppEntity(
                packageName = packageName.lowercase(),
                appLabel = label,
            ),
        )
    }

    suspend fun removeBlockedApp(packageName: String) {
        dao.deleteBlockedApp(packageName.lowercase())
    }

    suspend fun logBlockedEvent(
        target: String,
        source: String,
        category: GamblingCategory,
    ) {
        dao.insertEvent(
            BlockedEventEntity(
                target = target,
                source = source,
                categoryName = category.name,
            ),
        )
    }

    suspend fun clearEventHistory() {
        dao.clearAllEvents()
    }

    suspend fun logUrgeResisted(triggerTag: String, note: String) {
        dao.insertUrgeLog(
            UrgeLogEntity(
                triggerTag = triggerTag.trim().ifEmpty { "General" },
                note = note.trim(),
            ),
        )
    }

    suspend fun clearUrgeLogs() {
        dao.clearAllUrgeLogs()
    }

    suspend fun loadLaunchableUserApps(): List<InstalledAppInfo> = withContext(Dispatchers.IO) {
        val pm = appContext.packageManager
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val resolved = pm.queryIntentActivities(intent, PackageManager.MATCH_ALL)
        val selfPkg = appContext.packageName
        resolved
            .mapNotNull { info ->
                val pkg = info.activityInfo?.packageName ?: return@mapNotNull null
                if (pkg == selfPkg) return@mapNotNull null
                val label = info.loadLabel(pm)?.toString()?.trim().orEmpty().ifEmpty { pkg }
                InstalledAppInfo(packageName = pkg, label = label)
            }
            .distinctBy { it.packageName }
            .sortedBy { it.label.lowercase() }
    }

    companion object {
        @Volatile
        private var INSTANCE: AnchorRepository? = null

        fun getInstance(context: Context): AnchorRepository {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: AnchorRepository(context).also { INSTANCE = it }
            }
        }
    }
}
