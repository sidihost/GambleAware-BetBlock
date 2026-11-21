package com.example.data

import android.content.Context
import android.content.SharedPreferences
import android.os.SystemClock
import com.example.blocker.CommitmentClockGuard
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.security.MessageDigest

enum class ThemeMode(val label: String) {
    SYSTEM("System"),
    LIGHT("White"),
    DARK("Black & Pink"),
}

enum class GoalCategory(val label: String) {
    STREAK("Streak"),
    SAVINGS("Savings"),
    MILESTONE("Milestone"),
}

data class RecoveryGoalItem(
    val id: String,
    val title: String,
    val category: GoalCategory = GoalCategory.STREAK,
    val targetDays: Int = 30,
    val targetAmountNgn: Int = 0,
    val whyNote: String = "",
    val isPrimary: Boolean = false,
    val isCompleted: Boolean = false,
    val createdAtMs: Long = System.currentTimeMillis(),
)

data class ProtectionSettingsState(
    val isProtectionEnabled: Boolean = true,
    val blockSportsbooks: Boolean = true,
    val blockCasinos: Boolean = true,
    val blockPokerAndBingo: Boolean = true,
    val blockCryptoBetting: Boolean = true,
    val blockFantasyAndLottery: Boolean = true,
    val strictKeywordFilter: Boolean = true,
    val browserShieldEnabled: Boolean = true,
    val appShieldEnabled: Boolean = true,
    val searchGuardEnabled: Boolean = true,
    val adBlockerEnabled: Boolean = true,
    val playStoreGuardEnabled: Boolean = true,
    val antiTamperLockEnabled: Boolean = true,
    val lockUntilEpochMs: Long = 0L,
    val lockRemainingAnchorMs: Long = 0L,
    val lastElapsedRealtimeMs: Long = -1L,
    val hasPin: Boolean = false,
    val protectionStartedAtMs: Long = 0L,
    val dailyBetSpendEstimate: Int = 5000,
    val themeMode: ThemeMode = ThemeMode.LIGHT,
    val hasCompletedTour: Boolean = false,
    val hasCompletedInitialSetup: Boolean = false,
    val preferredName: String = "",
    val notificationsEnabled: Boolean = true,
    val lastNotifiedMilestoneDay: Int = 0,
    val bankedUrgeSavingsNgn: Int = 0,
    val bankedUrgeCount: Int = 0,
    val depositGuardEnabled: Boolean = true,
    val buddyPartnerName: String = "",
    val buddyChallengeCode: String = "",
    val rateLimitEnabled: Boolean = true,
    val maxAttemptsPer10Min: Int = 3,
    val dailyAttemptCap: Int = 10,
    val cooldownMinutes: Int = 15,
    val rateLimitCooldownUntilMs: Long = 0L,
    val lateNightGuardEnabled: Boolean = true,
    val matchdayGuardEnabled: Boolean = true,
    val paydayGuardEnabled: Boolean = true,
    val goals: List<RecoveryGoalItem> = emptyList(),
    val completedBankChecks: Set<String> = emptySet(),
) {
    fun isTimeLocked(
        nowMs: Long = System.currentTimeMillis(),
        nowElapsedMs: Long = safeElapsedRealtime(),
    ): Boolean {
        return remainingLockMs(nowMs, nowElapsedMs) > 0L
    }

    fun isAnyLockActive(nowMs: Long = System.currentTimeMillis()): Boolean {
        return isTimeLocked(nowMs) || hasPin
    }

    fun remainingLockMs(
        nowMs: Long = System.currentTimeMillis(),
        nowElapsedMs: Long = safeElapsedRealtime(),
    ): Long {
        return CommitmentClockGuard.computeEffectiveRemainingMs(
            lockUntilEpochMs = lockUntilEpochMs,
            lockRemainingAnchorMs = lockRemainingAnchorMs,
            lastElapsedRealtimeMs = lastElapsedRealtimeMs,
            nowWallMs = nowMs,
            nowElapsedRealtimeMs = nowElapsedMs,
        )
    }

    companion object {
        private fun safeElapsedRealtime(): Long = runCatching {
            SystemClock.elapsedRealtime()
        }.getOrDefault(-1L)
    }
}

class ProtectionPreferences private constructor(context: Context) {

    private val prefs: SharedPreferences = context.applicationContext.getSharedPreferences(
        PREFS_NAME,
        Context.MODE_PRIVATE,
    )

    private val _state = MutableStateFlow(readState())
    val state: StateFlow<ProtectionSettingsState> = _state.asStateFlow()

    private fun readState(): ProtectionSettingsState {
        val themeOrdinal = prefs.getInt(KEY_THEME_MODE, ThemeMode.LIGHT.ordinal)
            .coerceIn(0, ThemeMode.entries.lastIndex)
        val startedAt = prefs.getLong(KEY_STARTED_AT_MS, 0L)
        val enabled = prefs.getBoolean(KEY_PROTECTION_ENABLED, true)
        if (enabled && startedAt == 0L) {
            prefs.edit().putLong(KEY_STARTED_AT_MS, System.currentTimeMillis()).apply()
        }
        return ProtectionSettingsState(
            isProtectionEnabled = enabled,
            blockSportsbooks = prefs.getBoolean(KEY_BLOCK_SPORTSBOOKS, true),
            blockCasinos = prefs.getBoolean(KEY_BLOCK_CASINOS, true),
            blockPokerAndBingo = prefs.getBoolean(KEY_BLOCK_POKER_BINGO, true),
            blockCryptoBetting = prefs.getBoolean(KEY_BLOCK_CRYPTO, true),
            blockFantasyAndLottery = prefs.getBoolean(KEY_BLOCK_FANTASY_LOTTERY, true),
            strictKeywordFilter = prefs.getBoolean(KEY_STRICT_KEYWORDS, true),
            browserShieldEnabled = prefs.getBoolean(KEY_BROWSER_SHIELD, true),
            appShieldEnabled = prefs.getBoolean(KEY_APP_SHIELD, true),
            searchGuardEnabled = prefs.getBoolean(KEY_SEARCH_GUARD, true),
            adBlockerEnabled = prefs.getBoolean(KEY_AD_BLOCKER_ENABLED, true),
            playStoreGuardEnabled = prefs.getBoolean(KEY_PLAY_STORE_GUARD, true),
            antiTamperLockEnabled = prefs.getBoolean(KEY_ANTI_TAMPER, true),
            lockUntilEpochMs = prefs.getLong(KEY_LOCK_UNTIL_MS, 0L),
            lockRemainingAnchorMs = prefs.getLong(KEY_LOCK_REMAINING_ANCHOR_MS, 0L),
            lastElapsedRealtimeMs = prefs.getLong(KEY_LAST_ELAPSED_REALTIME_MS, -1L),
            hasPin = !prefs.getString(KEY_PIN_HASH, null).isNullOrEmpty(),
            protectionStartedAtMs = prefs.getLong(KEY_STARTED_AT_MS, System.currentTimeMillis()),
            dailyBetSpendEstimate = prefs.getInt(KEY_DAILY_SPEND, 5000),
            themeMode = ThemeMode.entries[themeOrdinal],
            hasCompletedTour = prefs.getBoolean(KEY_HAS_COMPLETED_TOUR, false),
            hasCompletedInitialSetup = prefs.getBoolean(KEY_HAS_COMPLETED_INITIAL_SETUP, false),
            preferredName = prefs.getString(KEY_PREFERRED_NAME, "").orEmpty(),
            notificationsEnabled = prefs.getBoolean(KEY_NOTIFICATIONS_ENABLED, true),
            lastNotifiedMilestoneDay = prefs.getInt(KEY_LAST_MILESTONE_DAY, 0),
            bankedUrgeSavingsNgn = prefs.getInt(KEY_BANKED_URGE_SAVINGS_NGN, 0),
            bankedUrgeCount = prefs.getInt(KEY_BANKED_URGE_COUNT, 0),
            depositGuardEnabled = prefs.getBoolean(KEY_DEPOSIT_GUARD_ENABLED, true),
            buddyPartnerName = prefs.getString(KEY_BUDDY_PARTNER_NAME, "").orEmpty(),
            buddyChallengeCode = prefs.getString(KEY_BUDDY_CHALLENGE_CODE, "").orEmpty(),
            rateLimitEnabled = prefs.getBoolean(KEY_RATE_LIMIT_ENABLED, true),
            maxAttemptsPer10Min = prefs.getInt(KEY_RATE_LIMIT_BURST, 3).coerceIn(2, 20),
            dailyAttemptCap = prefs.getInt(KEY_RATE_LIMIT_DAILY_CAP, 10).coerceIn(3, 100),
            cooldownMinutes = prefs.getInt(KEY_RATE_LIMIT_COOLDOWN_MIN, 15).coerceIn(5, 120),
            rateLimitCooldownUntilMs = prefs.getLong(KEY_RATE_LIMIT_COOLDOWN_UNTIL, 0L),
            lateNightGuardEnabled = prefs.getBoolean(KEY_LATE_NIGHT_GUARD, true),
            matchdayGuardEnabled = prefs.getBoolean(KEY_MATCHDAY_GUARD, true),
            paydayGuardEnabled = prefs.getBoolean(KEY_PAYDAY_GUARD, true),
            goals = decodeGoals(prefs.getString(KEY_RECOVERY_GOALS, null)),
            completedBankChecks = prefs.getStringSet(KEY_BANK_FREEZE_CHECKS, emptySet()).orEmpty().toSet(),
        )
    }

    private fun update(block: SharedPreferences.Editor.() -> Unit) {
        prefs.edit().apply(block).apply()
        _state.value = readState()
    }

    fun setProtectionEnabled(enabled: Boolean) {
        val now = System.currentTimeMillis()
        update {
            putBoolean(KEY_PROTECTION_ENABLED, enabled)
            if (enabled && prefs.getLong(KEY_STARTED_AT_MS, 0L) == 0L) {
                putLong(KEY_STARTED_AT_MS, now)
            }
        }
    }

    fun resetStreakStart() {
        update {
            putLong(KEY_STARTED_AT_MS, System.currentTimeMillis())
        }
    }

    fun setBlockSportsbooks(enabled: Boolean) = update { putBoolean(KEY_BLOCK_SPORTSBOOKS, enabled) }
    fun setBlockCasinos(enabled: Boolean) = update { putBoolean(KEY_BLOCK_CASINOS, enabled) }
    fun setBlockPokerAndBingo(enabled: Boolean) = update { putBoolean(KEY_BLOCK_POKER_BINGO, enabled) }
    fun setBlockCryptoBetting(enabled: Boolean) = update { putBoolean(KEY_BLOCK_CRYPTO, enabled) }
    fun setBlockFantasyAndLottery(enabled: Boolean) = update { putBoolean(KEY_BLOCK_FANTASY_LOTTERY, enabled) }
    fun setStrictKeywordFilter(enabled: Boolean) = update { putBoolean(KEY_STRICT_KEYWORDS, enabled) }
    fun setBrowserShieldEnabled(enabled: Boolean) = update { putBoolean(KEY_BROWSER_SHIELD, enabled) }
    fun setAppShieldEnabled(enabled: Boolean) = update { putBoolean(KEY_APP_SHIELD, enabled) }
    fun setSearchGuardEnabled(enabled: Boolean) = update { putBoolean(KEY_SEARCH_GUARD, enabled) }
    fun setAdBlockerEnabled(enabled: Boolean) = update { putBoolean(KEY_AD_BLOCKER_ENABLED, enabled) }
    fun setPlayStoreGuardEnabled(enabled: Boolean) = update { putBoolean(KEY_PLAY_STORE_GUARD, enabled) }
    fun setAntiTamperLockEnabled(enabled: Boolean) = update { putBoolean(KEY_ANTI_TAMPER, enabled) }
    fun setDailyBetSpendEstimate(amount: Int) = update { putInt(KEY_DAILY_SPEND, amount.coerceIn(0, 10_000_000)) }
    fun setThemeMode(mode: ThemeMode) = update { putInt(KEY_THEME_MODE, mode.ordinal) }
    fun setHasCompletedTour(completed: Boolean) = update { putBoolean(KEY_HAS_COMPLETED_TOUR, completed) }
    fun setPreferredName(name: String) = update { putString(KEY_PREFERRED_NAME, name.trim().take(40)) }
    fun setNotificationsEnabled(enabled: Boolean) = update { putBoolean(KEY_NOTIFICATIONS_ENABLED, enabled) }
    fun setLastNotifiedMilestoneDay(day: Int) = update { putInt(KEY_LAST_MILESTONE_DAY, day) }
    fun setDepositGuardEnabled(enabled: Boolean) = update { putBoolean(KEY_DEPOSIT_GUARD_ENABLED, enabled) }

    fun setRateLimitConfig(
        enabled: Boolean = _state.value.rateLimitEnabled,
        maxAttemptsPer10Min: Int = _state.value.maxAttemptsPer10Min,
        dailyAttemptCap: Int = _state.value.dailyAttemptCap,
        cooldownMinutes: Int = _state.value.cooldownMinutes,
    ) {
        update {
            putBoolean(KEY_RATE_LIMIT_ENABLED, enabled)
            putInt(KEY_RATE_LIMIT_BURST, maxAttemptsPer10Min.coerceIn(2, 20))
            putInt(KEY_RATE_LIMIT_DAILY_CAP, dailyAttemptCap.coerceIn(3, 100))
            putInt(KEY_RATE_LIMIT_COOLDOWN_MIN, cooldownMinutes.coerceIn(5, 120))
            if (!enabled) {
                putLong(KEY_RATE_LIMIT_COOLDOWN_UNTIL, 0L)
            }
        }
    }

    fun setRateLimitCooldownUntil(untilMs: Long) {
        update {
            putLong(KEY_RATE_LIMIT_COOLDOWN_UNTIL, untilMs.coerceAtLeast(0L))
        }
    }

    fun setHighRiskSchedule(
        lateNight: Boolean = _state.value.lateNightGuardEnabled,
        matchday: Boolean = _state.value.matchdayGuardEnabled,
        payday: Boolean = _state.value.paydayGuardEnabled,
    ) {
        update {
            putBoolean(KEY_LATE_NIGHT_GUARD, lateNight)
            putBoolean(KEY_MATCHDAY_GUARD, matchday)
            putBoolean(KEY_PAYDAY_GUARD, payday)
        }
    }

    fun saveGoals(goals: List<RecoveryGoalItem>) {
        update {
            putString(KEY_RECOVERY_GOALS, encodeGoals(goals))
        }
    }

    fun toggleBankFreezeCheck(itemId: String) {
        val current = _state.value.completedBankChecks.toMutableSet()
        if (!current.add(itemId)) {
            current.remove(itemId)
        }
        update {
            putStringSet(KEY_BANK_FREEZE_CHECKS, current)
        }
    }

    fun replayWelcomeSetup() {
        update {
            putBoolean(KEY_HAS_COMPLETED_INITIAL_SETUP, false)
        }
    }

    fun bankUrgeStake(amountNgn: Int) {
        val safeAmount = amountNgn.coerceIn(100, 10_000_000)
        val currentSavings = prefs.getInt(KEY_BANKED_URGE_SAVINGS_NGN, 0)
        val currentCount = prefs.getInt(KEY_BANKED_URGE_COUNT, 0)
        update {
            putInt(KEY_BANKED_URGE_SAVINGS_NGN, (currentSavings + safeAmount).coerceAtMost(Int.MAX_VALUE / 2))
            putInt(KEY_BANKED_URGE_COUNT, currentCount + 1)
        }
    }

    fun setBuddyPartner(partnerName: String, challengeCode: String) {
        val cleanName = partnerName.trim().take(40)
        val cleanCode = challengeCode.trim().take(16)
        update {
            putString(KEY_BUDDY_PARTNER_NAME, cleanName)
            putString(KEY_BUDDY_CHALLENGE_CODE, cleanCode)
        }
    }

    fun clearBuddyPartner() {
        update {
            remove(KEY_BUDDY_PARTNER_NAME)
            remove(KEY_BUDDY_CHALLENGE_CODE)
        }
    }

    fun unlockCommitmentViaBuddyApproval() {
        update {
            putLong(KEY_LOCK_UNTIL_MS, 0L)
            putLong(KEY_LOCK_REMAINING_ANCHOR_MS, 0L)
            putLong(KEY_LAST_ELAPSED_REALTIME_MS, -1L)
            putBoolean(KEY_ANTI_TAMPER, false)
            remove(KEY_BUDDY_CHALLENGE_CODE)
        }
    }

    fun completeInitialSetup(
        name: String,
        lockDays: Int,
        enableProtection: Boolean = true,
        dailyStakeNgn: Int? = null,
        starterGoalTitle: String? = null,
        starterGoalDays: Int = 30,
        starterGoalAmountNgn: Int = 0,
        maxAttemptsPer10Min: Int? = null,
        cooldownMinutes: Int? = null,
    ) {
        val safeDays = if (lockDays <= 0) 0 else lockDays.coerceIn(1, 730)
        val now = System.currentTimeMillis()
        val elapsedNow = runCatching { SystemClock.elapsedRealtime() }.getOrDefault(-1L)
        val currentUntil = prefs.getLong(KEY_LOCK_UNTIL_MS, 0L)
        val cleanName = name.trim().take(40)
        val existingGoals = _state.value.goals
        val updatedGoals = if (!starterGoalTitle.isNullOrBlank()) {
            val newGoal = RecoveryGoalItem(
                id = "goal_$now",
                title = starterGoalTitle.trim().take(80),
                category = if (starterGoalAmountNgn > 0) GoalCategory.SAVINGS else GoalCategory.STREAK,
                targetDays = starterGoalDays.coerceIn(1, 730),
                targetAmountNgn = starterGoalAmountNgn.coerceIn(0, 100_000_000),
                whyNote = "Set during GambleAware Welcome setup",
                isPrimary = true,
                isCompleted = false,
                createdAtMs = now,
            )
            listOf(newGoal) + existingGoals.map { it.copy(isPrimary = false) }
        } else {
            existingGoals
        }
        update {
            if (cleanName.isNotEmpty()) {
                putString(KEY_PREFERRED_NAME, cleanName)
            }
            if (dailyStakeNgn != null && dailyStakeNgn >= 0) {
                putInt(KEY_DAILY_SPEND, dailyStakeNgn.coerceIn(0, 10_000_000))
            }
            if (maxAttemptsPer10Min != null) {
                putInt(KEY_RATE_LIMIT_BURST, maxAttemptsPer10Min.coerceIn(2, 20))
            }
            if (cooldownMinutes != null) {
                putInt(KEY_RATE_LIMIT_COOLDOWN_MIN, cooldownMinutes.coerceIn(5, 120))
            }
            if (updatedGoals.isNotEmpty()) {
                putString(KEY_RECOVERY_GOALS, encodeGoals(updatedGoals))
            }
            putBoolean(KEY_HAS_COMPLETED_INITIAL_SETUP, true)
            putBoolean(KEY_HAS_COMPLETED_TOUR, true)
            putBoolean(KEY_PROTECTION_ENABLED, enableProtection || safeDays > 0)
            if (safeDays > 0) {
                val durationMs = safeDays.toLong() * 24L * 60L * 60L * 1000L
                val until = maxOf(currentUntil, now + durationMs)
                putBoolean(KEY_ANTI_TAMPER, true)
                putLong(KEY_LOCK_UNTIL_MS, until)
                putLong(KEY_LOCK_REMAINING_ANCHOR_MS, (until - now).coerceAtLeast(0L))
                putLong(KEY_LAST_ELAPSED_REALTIME_MS, elapsedNow)
            }
            if ((enableProtection || safeDays > 0) && prefs.getLong(KEY_STARTED_AT_MS, 0L) == 0L) {
                putLong(KEY_STARTED_AT_MS, now)
            }
        }
    }

    fun skipInitialSetup() {
        update {
            putBoolean(KEY_HAS_COMPLETED_INITIAL_SETUP, true)
            putBoolean(KEY_HAS_COMPLETED_TOUR, true)
        }
    }

    fun activateTimeLock(durationMs: Long) {
        val now = System.currentTimeMillis()
        val elapsedNow = runCatching { SystemClock.elapsedRealtime() }.getOrDefault(-1L)
        val currentUntil = prefs.getLong(KEY_LOCK_UNTIL_MS, 0L)
        val until = maxOf(currentUntil, now + durationMs)
        update {
            putLong(KEY_LOCK_UNTIL_MS, until)
            putLong(KEY_LOCK_REMAINING_ANCHOR_MS, (until - now).coerceAtLeast(0L))
            putLong(KEY_LAST_ELAPSED_REALTIME_MS, elapsedNow)
            putBoolean(KEY_PROTECTION_ENABLED, true)
            putBoolean(KEY_ANTI_TAMPER, true)
            if (prefs.getLong(KEY_STARTED_AT_MS, 0L) == 0L) {
                putLong(KEY_STARTED_AT_MS, now)
            }
        }
    }

    fun setPin(pin: String) {
        update {
            putString(KEY_PIN_HASH, hashPin(pin))
        }
    }

    fun clearPin() {
        update {
            remove(KEY_PIN_HASH)
        }
    }

    fun verifyPin(pin: String): Boolean {
        val stored = prefs.getString(KEY_PIN_HASH, null) ?: return true
        return stored == hashPin(pin)
    }

    fun currentSnapshot(): ProtectionSettingsState = _state.value

    private fun hashPin(pin: String): String {
        val bytes = MessageDigest.getInstance("SHA-256")
            .digest("gambleaware_salt_v1:$pin".toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }

    private fun sanitizeField(raw: String): String =
        raw.replace("||", " ").replace("\n", " ").replace("\r", " ").trim()

    private fun encodeGoals(goals: List<RecoveryGoalItem>): String {
        return goals.take(20).joinToString("\n") { g ->
            listOf(
                sanitizeField(g.id),
                sanitizeField(g.title),
                g.category.name,
                g.targetDays.toString(),
                g.targetAmountNgn.toString(),
                sanitizeField(g.whyNote),
                if (g.isPrimary) "1" else "0",
                if (g.isCompleted) "1" else "0",
                g.createdAtMs.toString(),
            ).joinToString("||")
        }
    }

    private fun decodeGoals(raw: String?): List<RecoveryGoalItem> {
        if (raw.isNullOrBlank()) return emptyList()
        return raw.lines().mapNotNull { line ->
            val parts = line.split("||")
            if (parts.size < 9) return@mapNotNull null
            val category = runCatching { GoalCategory.valueOf(parts[2]) }.getOrDefault(GoalCategory.STREAK)
            RecoveryGoalItem(
                id = parts[0].ifBlank { "goal_${parts[8]}" },
                title = parts[1].ifBlank { return@mapNotNull null },
                category = category,
                targetDays = parts[3].toIntOrNull()?.coerceIn(1, 730) ?: 30,
                targetAmountNgn = parts[4].toIntOrNull()?.coerceIn(0, 100_000_000) ?: 0,
                whyNote = parts[5],
                isPrimary = parts[6] == "1",
                isCompleted = parts[7] == "1",
                createdAtMs = parts[8].toLongOrNull() ?: System.currentTimeMillis(),
            )
        }
    }

    companion object {
        private const val PREFS_NAME = "gambleaware_protection_prefs"
        private const val KEY_PROTECTION_ENABLED = "protection_enabled"
        private const val KEY_BLOCK_SPORTSBOOKS = "block_sportsbooks"
        private const val KEY_BLOCK_CASINOS = "block_casinos"
        private const val KEY_BLOCK_POKER_BINGO = "block_poker_bingo"
        private const val KEY_BLOCK_CRYPTO = "block_crypto"
        private const val KEY_BLOCK_FANTASY_LOTTERY = "block_fantasy_lottery"
        private const val KEY_STRICT_KEYWORDS = "strict_keywords"
        private const val KEY_BROWSER_SHIELD = "browser_shield"
        private const val KEY_APP_SHIELD = "app_shield"
        private const val KEY_SEARCH_GUARD = "search_guard"
        private const val KEY_AD_BLOCKER_ENABLED = "ad_blocker_enabled"
        private const val KEY_PLAY_STORE_GUARD = "play_store_guard"
        private const val KEY_ANTI_TAMPER = "anti_tamper"
        private const val KEY_LOCK_UNTIL_MS = "lock_until_ms"
        private const val KEY_LOCK_REMAINING_ANCHOR_MS = "lock_remaining_anchor_ms"
        private const val KEY_LAST_ELAPSED_REALTIME_MS = "last_elapsed_realtime_ms"
        private const val KEY_PIN_HASH = "pin_hash"
        private const val KEY_STARTED_AT_MS = "started_at_ms"
        private const val KEY_DAILY_SPEND = "daily_spend"
        private const val KEY_THEME_MODE = "theme_mode"
        private const val KEY_HAS_COMPLETED_TOUR = "has_completed_tour"
        private const val KEY_HAS_COMPLETED_INITIAL_SETUP = "has_completed_initial_setup"
        private const val KEY_PREFERRED_NAME = "preferred_name"
        private const val KEY_NOTIFICATIONS_ENABLED = "notifications_enabled"
        private const val KEY_LAST_MILESTONE_DAY = "last_milestone_day"
        private const val KEY_BANKED_URGE_SAVINGS_NGN = "banked_urge_savings_ngn"
        private const val KEY_BANKED_URGE_COUNT = "banked_urge_count"
        private const val KEY_DEPOSIT_GUARD_ENABLED = "deposit_guard_enabled"
        private const val KEY_BUDDY_PARTNER_NAME = "buddy_partner_name"
        private const val KEY_BUDDY_CHALLENGE_CODE = "buddy_challenge_code"
        private const val KEY_RATE_LIMIT_ENABLED = "rate_limit_enabled"
        private const val KEY_RATE_LIMIT_BURST = "rate_limit_burst"
        private const val KEY_RATE_LIMIT_DAILY_CAP = "rate_limit_daily_cap"
        private const val KEY_RATE_LIMIT_COOLDOWN_MIN = "rate_limit_cooldown_min"
        private const val KEY_RATE_LIMIT_COOLDOWN_UNTIL = "rate_limit_cooldown_until"
        private const val KEY_LATE_NIGHT_GUARD = "late_night_guard"
        private const val KEY_MATCHDAY_GUARD = "matchday_guard"
        private const val KEY_PAYDAY_GUARD = "payday_guard"
        private const val KEY_RECOVERY_GOALS = "recovery_goals_v1"
        private const val KEY_BANK_FREEZE_CHECKS = "bank_freeze_checks_v1"

        @Volatile
        private var INSTANCE: ProtectionPreferences? = null

        fun getInstance(context: Context): ProtectionPreferences {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: ProtectionPreferences(context).also { INSTANCE = it }
            }
        }
    }
}
