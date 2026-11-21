package com.example.blocker

import com.example.data.BlockedEventEntity
import com.example.data.ProtectionSettingsState
import java.util.Calendar
import java.util.Locale

enum class RateLimitSeverity {
    CALM,
    WARNING,
    COOLDOWN_ACTIVE,
}

data class RateLimitStatus(
    val isEnabled: Boolean,
    val attemptsInWindow: Int,
    val effectiveBurstLimit: Int,
    val attemptsToday: Int,
    val dailyAttemptCap: Int,
    val cooldownRemainingMs: Long,
    val isInCooldown: Boolean,
    val isHighRiskWindowNow: Boolean,
    val activeRiskLabel: String?,
    val severity: RateLimitSeverity,
) {
    val burstProgressFraction: Float
        get() = if (effectiveBurstLimit <= 0) 0f
        else (attemptsInWindow.toFloat() / effectiveBurstLimit.toFloat()).coerceIn(0f, 1f)

    val dailyProgressFraction: Float
        get() = if (dailyAttemptCap <= 0) 0f
        else (attemptsToday.toFloat() / dailyAttemptCap.toFloat()).coerceIn(0f, 1f)
}

object RateLimiterEngine {
    const val BURST_WINDOW_MS: Long = 10L * 60L * 1000L

    fun activeHighRiskLabel(
        settings: ProtectionSettingsState,
        nowMs: Long = System.currentTimeMillis(),
    ): String? {
        val cal = Calendar.getInstance().apply { timeInMillis = nowMs }
        val hour = cal.get(Calendar.HOUR_OF_DAY)
        val dayOfWeek = cal.get(Calendar.DAY_OF_WEEK)
        val dayOfMonth = cal.get(Calendar.DAY_OF_MONTH)

        if (settings.lateNightGuardEnabled && (hour >= 22 || hour < 5)) {
            return "Late-Night Shield"
        }
        val isMatchdayWindow =
            (dayOfWeek == Calendar.FRIDAY && hour >= 17) ||
                dayOfWeek == Calendar.SATURDAY ||
                dayOfWeek == Calendar.SUNDAY
        if (settings.matchdayGuardEnabled && isMatchdayWindow) {
            return "Matchday Window"
        }
        if (settings.paydayGuardEnabled && (dayOfMonth >= 25 || dayOfMonth <= 3)) {
            return "Payday Protection"
        }
        return null
    }

    fun effectiveBurstLimit(
        settings: ProtectionSettingsState,
        nowMs: Long = System.currentTimeMillis(),
    ): Int {
        val base = settings.maxAttemptsPer10Min.coerceIn(2, 20)
        return if (activeHighRiskLabel(settings, nowMs) != null) {
            (base - 1).coerceAtLeast(2)
        } else {
            base
        }
    }

    fun evaluate(
        events: List<BlockedEventEntity>,
        todayBlockedCount: Int,
        settings: ProtectionSettingsState,
        nowMs: Long = System.currentTimeMillis(),
    ): RateLimitStatus {
        val windowStart = nowMs - BURST_WINDOW_MS
        val attemptsInWindow = events.count { it.timestamp in windowStart..nowMs }
        val riskLabel = activeHighRiskLabel(settings, nowMs)
        val effectiveLimit = effectiveBurstLimit(settings, nowMs)
        val dailyCap = settings.dailyAttemptCap.coerceIn(3, 100)
        val cooldownRemaining = (settings.rateLimitCooldownUntilMs - nowMs).coerceAtLeast(0L)
        val inCooldown = settings.rateLimitEnabled && cooldownRemaining > 0L

        val severity = when {
            !settings.rateLimitEnabled -> RateLimitSeverity.CALM
            inCooldown -> RateLimitSeverity.COOLDOWN_ACTIVE
            attemptsInWindow >= (effectiveLimit - 1).coerceAtLeast(1) ||
                todayBlockedCount >= (dailyCap * 0.75f).toInt().coerceAtLeast(1) -> RateLimitSeverity.WARNING
            else -> RateLimitSeverity.CALM
        }

        return RateLimitStatus(
            isEnabled = settings.rateLimitEnabled,
            attemptsInWindow = attemptsInWindow,
            effectiveBurstLimit = effectiveLimit,
            attemptsToday = todayBlockedCount,
            dailyAttemptCap = dailyCap,
            cooldownRemainingMs = cooldownRemaining,
            isInCooldown = inCooldown,
            isHighRiskWindowNow = riskLabel != null,
            activeRiskLabel = riskLabel,
            severity = severity,
        )
    }

    fun computeNextCooldownUntilMs(
        attemptsInWindow: Int,
        attemptsToday: Int,
        settings: ProtectionSettingsState,
        nowMs: Long = System.currentTimeMillis(),
    ): Long {
        if (!settings.rateLimitEnabled) return 0L
        val effectiveLimit = effectiveBurstLimit(settings, nowMs)
        val dailyCap = settings.dailyAttemptCap.coerceIn(3, 100)
        val cooldownMs = settings.cooldownMinutes.coerceIn(5, 120).toLong() * 60_000L
        val hitBurst = attemptsInWindow >= effectiveLimit
        val hitDaily = attemptsToday >= dailyCap
        if (!hitBurst && !hitDaily) return settings.rateLimitCooldownUntilMs
        val multiplier = if (hitDaily) 2L else 1L
        return maxOf(settings.rateLimitCooldownUntilMs, nowMs + cooldownMs * multiplier)
    }

    fun formatCooldownMmSs(remainingMs: Long): String {
        val totalSeconds = (remainingMs.coerceAtLeast(0L) + 999L) / 1000L
        val minutes = totalSeconds / 60L
        val seconds = totalSeconds % 60L
        return String.format(Locale.US, "%02d:%02d", minutes, seconds)
    }
}
