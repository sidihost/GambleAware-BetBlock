package com.example.blocker

import com.example.data.BlockedEventEntity
import java.util.Locale

enum class TiltRiskLevel {
    CALM,
    ELEVATED,
    CRITICAL,
}

data class TiltRadarEvaluation(
    val level: TiltRiskLevel,
    val attemptsLast10Min: Int,
    val attemptsLast60Min: Int,
    val cooldownSuggestedSec: Int,
    val headline: String,
    val guidance: String,
)

object TiltRadarEngine {

    fun evaluate(
        events: List<BlockedEventEntity>,
        nowMs: Long = System.currentTimeMillis(),
    ): TiltRadarEvaluation {
        val tenMinAgo = nowMs - 10 * 60_000L
        val hourAgo = nowMs - 60 * 60_000L

        var attemptsLast10Min = 0
        var attemptsLast60Min = 0

        for (ev in events) {
            if (ev.timestamp >= hourAgo) {
                attemptsLast60Min += 1
                if (ev.timestamp >= tenMinAgo) {
                    attemptsLast10Min += 1
                }
            }
        }

        return when {
            attemptsLast10Min >= 5 || attemptsLast60Min >= 8 -> TiltRadarEvaluation(
                level = TiltRiskLevel.CRITICAL,
                attemptsLast10Min = attemptsLast10Min,
                attemptsLast60Min = attemptsLast60Min,
                cooldownSuggestedSec = 300,
                headline = "Chasing-Loss Spike Detected",
                guidance = "$attemptsLast10Min rapid attempts in 10 min. Lock your Commitment Timer and bank this stake instead.",
            )
            attemptsLast10Min >= 2 || attemptsLast60Min >= 4 -> TiltRadarEvaluation(
                level = TiltRiskLevel.ELEVATED,
                attemptsLast10Min = attemptsLast10Min,
                attemptsLast60Min = attemptsLast60Min,
                cooldownSuggestedSec = 90,
                headline = "Impulse Velocity Rising",
                guidance = "$attemptsLast60Min blocked attempts this hour. Pause for 60s breathing before opening any browser.",
            )
            else -> TiltRadarEvaluation(
                level = TiltRiskLevel.CALM,
                attemptsLast10Min = attemptsLast10Min,
                attemptsLast60Min = attemptsLast60Min,
                cooldownSuggestedSec = 0,
                headline = "Baseline Calm",
                guidance = "Zero impulse spikes in the last hour. Your shields are holding steady.",
            )
        }
    }

    fun generateBuddyChallengeCode(nowMs: Long = System.currentTimeMillis()): String {
        val bucket = ((nowMs / 1000L) % 900_000L).toInt()
        val num = (100_000 + bucket).toString()
        return "${num.substring(0, 3)}-${num.substring(3, 6)}"
    }

    fun computeExpectedBuddyResponse(
        challengeCode: String,
        partnerSalt: String,
    ): String {
        val cleanChallenge = challengeCode.filter { it.isLetterOrDigit() }.uppercase(Locale.US)
        val cleanSalt = partnerSalt.trim().lowercase(Locale.US).ifEmpty { "gambleaware" }
        val combined = "$cleanChallenge:$cleanSalt:buddy_unlock_v1"

        var h1 = 0x811c9dc5u
        var h2 = 0x9e3779b9u
        for (i in combined.indices) {
            val ch = combined[i].code.toUInt()
            h1 = (h1 xor ch) * 0x01000193u
            h2 = (h2 xor (ch + (i * 17).toUInt())) * 0x85ebca6bu
        }
        val sixDigit = ((h1 xor h2) % 1_000_000u).toInt()
        return String.format(Locale.US, "%06d", sixDigit)
    }

    fun verifyBuddyUnlockCode(
        challengeCode: String,
        partnerSalt: String,
        candidateResponse: String,
    ): Boolean {
        val normalized = candidateResponse.filter { it.isDigit() }
        if (normalized.length != 6) return false
        val expected = computeExpectedBuddyResponse(challengeCode, partnerSalt)
        var diff = 0
        for (i in 0 until 6) {
            diff = diff or (normalized[i].code xor expected[i].code)
        }
        return diff == 0
    }
}
