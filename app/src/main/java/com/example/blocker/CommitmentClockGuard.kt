package com.example.blocker

/**
 * Pure, unit-testable anti-clock-tampering helper for Commitment Lock.
 *
 * Prevents users from bypassing an active Commitment Lock by manually jumping
 * Android's Date & Time forward while keeping legitimate reboots and normal
 * wall-clock progression completely seamless.
 */
object CommitmentClockGuard {

    /** Maximum wall-clock skew allowed ahead of real uptime delta before flagging a clock jump. */
    private const val MAX_ALLOWED_CLOCK_SKEW_MS = 30L * 60L * 1000L // 30 minutes

    /**
     * Computes remaining Commitment Lock milliseconds using both wall-clock expiry and
     * monotonic uptime tracking so sudden forward Date/Time jumps cannot expire the lock early.
     *
     * @param lockUntilEpochMs Wall-clock target unlock timestamp (0 if unlocked).
     * @param lockRemainingAnchorMs Remaining lock duration recorded at the last trusted sync.
     * @param lastElapsedRealtimeMs SystemClock.elapsedRealtime() at the last trusted sync.
     * @param nowWallMs Current System.currentTimeMillis().
     * @param nowElapsedRealtimeMs Current SystemClock.elapsedRealtime().
     */
    fun computeEffectiveRemainingMs(
        lockUntilEpochMs: Long,
        lockRemainingAnchorMs: Long,
        lastElapsedRealtimeMs: Long,
        nowWallMs: Long,
        nowElapsedRealtimeMs: Long,
    ): Long {
        if (lockUntilEpochMs <= 0L) return 0L
        val wallRemaining = (lockUntilEpochMs - nowWallMs).coerceAtLeast(0L)

        // If we have a valid monotonic anchor from the same boot session, enforce monotonic decay
        // so jumping Android's Date & Time forward cannot prematurely zero out the timer.
        val hasSameBootAnchor =
            lockRemainingAnchorMs > 0L &&
                lastElapsedRealtimeMs >= 0L &&
                nowElapsedRealtimeMs >= lastElapsedRealtimeMs

        if (!hasSameBootAnchor) {
            return wallRemaining
        }

        val realElapsedMs = (nowElapsedRealtimeMs - lastElapsedRealtimeMs).coerceAtLeast(0L)
        val monotonicRemaining = (lockRemainingAnchorMs - realElapsedMs).coerceAtLeast(0L)

        // If wall-clock says much less time remains than monotonic uptime proves has elapsed,
        // the system clock was moved forward — honor the monotonic remaining lock duration.
        return if (monotonicRemaining > wallRemaining + MAX_ALLOWED_CLOCK_SKEW_MS) {
            monotonicRemaining
        } else {
            wallRemaining
        }
    }

    /**
     * Detects whether a Settings screen is exposing Date & Time manipulation controls.
     */
    fun isDateTimeTamperScreen(visibleTexts: List<String>): Boolean {
        if (visibleTexts.isEmpty()) return false
        val joined = visibleTexts.joinToString(" ").lowercase()
        val hasDateTimeHeader =
            joined.contains("date & time") ||
                joined.contains("date and time") ||
                joined.contains("set time automatically") ||
                joined.contains("automatic date & time") ||
                joined.contains("use network-provided time")
        if (!hasDateTimeHeader) return false
        return joined.contains("set date") ||
            joined.contains("set time") ||
            joined.contains("set time automatically") ||
            joined.contains("automatic date") ||
            joined.contains("time zone")
    }
}
