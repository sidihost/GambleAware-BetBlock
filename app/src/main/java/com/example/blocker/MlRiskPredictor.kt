package com.example.blocker

import com.example.data.BlockedEventEntity
import com.example.data.ProtectionSettingsState
import com.example.data.UrgeLogEntity
import java.util.Calendar
import kotlin.math.exp
import kotlin.math.ln
import kotlin.math.roundToInt

enum class MlRiskRegime {
    LOW,
    MODERATE,
    HIGH,
    CRITICAL,
}

data class MlFeatureFactor(
    val id: String,
    val label: String,
    val impactPct: Int,
    val isProtective: Boolean,
    val detail: String,
)

data class MlRiskEvaluation(
    val relapseProbabilityPct: Int,
    val confidencePct: Int,
    val riskRegime: MlRiskRegime,
    val predictedPeakWindow: String,
    val headline: String,
    val summary: String,
    val topFactors: List<MlFeatureFactor>,
    val recommendedLockDays: Int,
)

object MlRiskPredictor {

    private fun clamp01(v: Double): Double = v.coerceIn(0.0, 1.0)

    private fun sigmoid(z: Double): Double = 1.0 / (1.0 + exp(-z))

    fun evaluate(
        events: List<BlockedEventEntity>,
        urgeLogs: List<UrgeLogEntity>,
        settings: ProtectionSettingsState,
        cleanDays: Int,
        isLockedNow: Boolean,
        nowMs: Long = System.currentTimeMillis(),
    ): MlRiskEvaluation {
        var tenMinCount = 0
        var sixtyMinCount = 0
        var dayCount = 0
        var lateNightSignals = 0
        var weekendSignals = 0
        val cal = Calendar.getInstance()

        for (ev in events) {
            val ageMs = (nowMs - ev.timestamp).coerceAtLeast(0L)
            if (ageMs <= 600_000L) tenMinCount++
            if (ageMs <= 3_600_000L) sixtyMinCount++
            if (ageMs <= 86_400_000L) dayCount++
            if (ageMs <= 14L * 86_400_000L) {
                cal.timeInMillis = ev.timestamp
                val hr = cal.get(Calendar.HOUR_OF_DAY)
                val dow = cal.get(Calendar.DAY_OF_WEEK)
                if (hr >= 22 || hr < 5) lateNightSignals++
                if (dow == Calendar.FRIDAY || dow == Calendar.SATURDAY || dow == Calendar.SUNDAY) {
                    weekendSignals++
                }
            }
        }

        for (u in urgeLogs) {
            val ageMs = (nowMs - u.timestamp).coerceAtLeast(0L)
            if (ageMs <= 14L * 86_400_000L) {
                cal.timeInMillis = u.timestamp
                val hr = cal.get(Calendar.HOUR_OF_DAY)
                val dow = cal.get(Calendar.DAY_OF_WEEK)
                if (hr >= 22 || hr < 5) lateNightSignals++
                if (dow == Calendar.FRIDAY || dow == Calendar.SATURDAY || dow == Calendar.SUNDAY) {
                    weekendSignals++
                }
            }
        }

        cal.timeInMillis = nowMs
        val currentHour = cal.get(Calendar.HOUR_OF_DAY)
        val currentDow = cal.get(Calendar.DAY_OF_WEEK)
        val isLateNightNow = currentHour >= 22 || currentHour < 5
        val isWeekendNow =
            currentDow == Calendar.FRIDAY || currentDow == Calendar.SATURDAY || currentDow == Calendar.SUNDAY

        val attemptBurst = clamp01(tenMinCount * 0.24 + sixtyMinCount * 0.12 + dayCount * 0.05)
        val signalDenom = (events.size + urgeLogs.size).coerceAtLeast(1).toDouble()
        val lateNight = clamp01((lateNightSignals / signalDenom) * 0.72 + if (isLateNightNow) 0.30 else 0.0)
        val matchday = clamp01((weekendSignals / signalDenom) * 0.65 + if (isWeekendNow) 0.25 else 0.0)

        val recentWins = urgeLogs.count { nowMs - it.timestamp <= 30L * 86_400_000L }
        val urgeResistance = clamp01(recentWins * 0.14)
        val cleanAdaptation = clamp01(ln(1.0 + cleanDays.coerceAtLeast(0)) / ln(91.0))
        val lockBarrier = clamp01(
            (if (isLockedNow) 0.45 else 0.0) +
                (if (settings.strictKeywordFilter) 0.22 else 0.0) +
                (if (settings.adBlockerEnabled) 0.18 else 0.0),
        )

        val rawContributions = listOf(
            Quad("attempt_burst", "Attempt Velocity", 1.85 * attemptBurst, false,
                if (sixtyMinCount > 0) "$tenMinCount blocked in 10m • $sixtyMinCount in 60m" else "$dayCount blocked today"),
            Quad("late_night", "Late-Night Risk Window", 1.15 * lateNight, false,
                if (isLateNightNow) "Currently inside 10 PM – 5 AM fatigue window" else "$lateNightSignals late-night attempts"),
            Quad("matchday", "Matchday & Weekend Cluster", 0.90 * matchday, false,
                if (isWeekendNow) "Weekend fixture risk window active" else "$weekendSignals Fri–Sun signals"),
            Quad("clean_streak", "Clean-Streak Rewiring", -1.75 * cleanAdaptation, true,
                if (cleanDays > 0) "${cleanDays}d clean reduces urge reactivity" else "Building Day-1 recovery baseline"),
            Quad("urge_resistance", "Urge Wins Resisted", -1.15 * urgeResistance, true,
                if (recentWins > 0) "$recentWins resisted urges strengthening self-control" else "Log resisted urges to train predictions"),
            Quad("lock_barrier", "Lock & Filter Strength", -0.95 * lockBarrier, true,
                if (isLockedNow) "Time Lock + strict firewalls armed" else "Activate Lock Timer for maximum safety"),
        )

        val logit = -0.25 + rawContributions.sumOf { it.contrib }
        val prob = (sigmoid(logit) * 100.0).roundToInt().coerceIn(3, 97)
        val regime = when {
            prob >= 72 -> MlRiskRegime.CRITICAL
            prob >= 50 -> MlRiskRegime.HIGH
            prob >= 28 -> MlRiskRegime.MODERATE
            else -> MlRiskRegime.LOW
        }

        val absSum = rawContributions.sumOf { kotlin.math.abs(it.contrib) }.coerceAtLeast(0.25)
        val topFactors = rawContributions
            .filter { kotlin.math.abs(it.contrib) >= 0.04 }
            .sortedByDescending { kotlin.math.abs(it.contrib) }
            .take(4)
            .map { q ->
                MlFeatureFactor(
                    id = q.id,
                    label = q.label,
                    impactPct = ((kotlin.math.abs(q.contrib) / absSum) * 100.0).roundToInt().coerceIn(4, 68),
                    isProtective = q.isProtective,
                    detail = q.detail,
                )
            }

        val peakWindow = when {
            lateNight >= 0.45 -> "Tonight 10:00 PM – 5:00 AM"
            matchday >= 0.45 -> "Live Matchdays & Weekends"
            attemptBurst >= 0.35 -> "Immediate Next 60 Minutes"
            else -> "Balanced Low-Risk Baseline"
        }

        val confidence = (54 + ((events.size + urgeLogs.size) * 3).coerceAtMost(36) + if (cleanDays >= 3) 6 else 0)
            .coerceIn(50, 96)

        val recDays = when (regime) {
            MlRiskRegime.CRITICAL -> 365
            MlRiskRegime.HIGH -> 180
            MlRiskRegime.MODERATE -> 90
            MlRiskRegime.LOW -> 30
        }

        val headline = when (regime) {
            MlRiskRegime.CRITICAL -> "High Urge Probability — Lock Shield"
            MlRiskRegime.HIGH -> "Elevated Relapse Risk Detected"
            MlRiskRegime.MODERATE -> "Moderate Risk Window Ahead"
            MlRiskRegime.LOW -> "Low Relapse Probability"
        }

        val summary = "On-device risk engine: $prob% short-term urge probability ($confidence% confidence) • Peak danger: $peakWindow."

        return MlRiskEvaluation(
            relapseProbabilityPct = prob,
            confidencePct = confidence,
            riskRegime = regime,
            predictedPeakWindow = peakWindow,
            headline = headline,
            summary = summary,
            topFactors = topFactors,
            recommendedLockDays = recDays,
        )
    }

    private data class Quad(
        val id: String,
        val label: String,
        val contrib: Double,
        val isProtective: Boolean,
        val detail: String,
    )
}
