package com.example.data

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.security.MessageDigest

enum class ThemeMode(val label: String) {
    SYSTEM("System"),
    LIGHT("White"),
    DARK("Black"),
}

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
    val antiTamperLockEnabled: Boolean = true,
    val lockUntilEpochMs: Long = 0L,
    val hasPin: Boolean = false,
    val protectionStartedAtMs: Long = 0L,
    val dailyBetSpendEstimate: Int = 25,
    val themeMode: ThemeMode = ThemeMode.LIGHT,
    val hasCompletedTour: Boolean = false,
) {
    fun isTimeLocked(nowMs: Long = System.currentTimeMillis()): Boolean {
        return lockUntilEpochMs > nowMs
    }

    fun isAnyLockActive(nowMs: Long = System.currentTimeMillis()): Boolean {
        return isTimeLocked(nowMs) || hasPin
    }

    fun remainingLockMs(nowMs: Long = System.currentTimeMillis()): Long {
        return (lockUntilEpochMs - nowMs).coerceAtLeast(0L)
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
            antiTamperLockEnabled = prefs.getBoolean(KEY_ANTI_TAMPER, true),
            lockUntilEpochMs = prefs.getLong(KEY_LOCK_UNTIL_MS, 0L),
            hasPin = !prefs.getString(KEY_PIN_HASH, null).isNullOrEmpty(),
            protectionStartedAtMs = prefs.getLong(KEY_STARTED_AT_MS, System.currentTimeMillis()),
            dailyBetSpendEstimate = prefs.getInt(KEY_DAILY_SPEND, 25),
            themeMode = ThemeMode.entries[themeOrdinal],
            hasCompletedTour = prefs.getBoolean(KEY_HAS_COMPLETED_TOUR, false),
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
    fun setAntiTamperLockEnabled(enabled: Boolean) = update { putBoolean(KEY_ANTI_TAMPER, enabled) }
    fun setDailyBetSpendEstimate(amount: Int) = update { putInt(KEY_DAILY_SPEND, amount.coerceIn(0, 10000)) }
    fun setThemeMode(mode: ThemeMode) = update { putInt(KEY_THEME_MODE, mode.ordinal) }
    fun setHasCompletedTour(completed: Boolean) = update { putBoolean(KEY_HAS_COMPLETED_TOUR, completed) }

    fun activateTimeLock(durationMs: Long) {
        val until = System.currentTimeMillis() + durationMs
        val currentUntil = prefs.getLong(KEY_LOCK_UNTIL_MS, 0L)
        update {
            putLong(KEY_LOCK_UNTIL_MS, maxOf(currentUntil, until))
            putBoolean(KEY_PROTECTION_ENABLED, true)
            putBoolean(KEY_ANTI_TAMPER, true)
            if (prefs.getLong(KEY_STARTED_AT_MS, 0L) == 0L) {
                putLong(KEY_STARTED_AT_MS, System.currentTimeMillis())
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
        private const val KEY_ANTI_TAMPER = "anti_tamper"
        private const val KEY_LOCK_UNTIL_MS = "lock_until_ms"
        private const val KEY_PIN_HASH = "pin_hash"
        private const val KEY_STARTED_AT_MS = "started_at_ms"
        private const val KEY_DAILY_SPEND = "daily_spend"
        private const val KEY_THEME_MODE = "theme_mode"
        private const val KEY_HAS_COMPLETED_TOUR = "has_completed_tour"

        @Volatile
        private var INSTANCE: ProtectionPreferences? = null

        fun getInstance(context: Context): ProtectionPreferences {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: ProtectionPreferences(context).also { INSTANCE = it }
            }
        }
    }
}
