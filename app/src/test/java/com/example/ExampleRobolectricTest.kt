package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.AnchorRepository
import com.example.data.ProtectionPreferences
import com.example.data.ProtectionSettingsState
import com.example.data.ThemeMode
import com.example.ui.MainUiState
import com.example.ui.components.SPOTLIGHT_TOUR_STEPS
import com.example.ui.components.TourTargetKeys
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

    @Test
    fun `read string from context`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val appName = context.getString(R.string.app_name)
        assertEquals("GambleAware", appName)
    }

    @Test
    fun `defaults to white theme and shows tour on first launch`() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val snapshot = ProtectionPreferences.getInstance(context).currentSnapshot()
        assertEquals(ThemeMode.LIGHT, snapshot.themeMode)
        assertFalse(snapshot.hasCompletedTour)
        assertTrue(snapshot.notificationsEnabled)
    }

    @Test
    fun `urge logs persist in Room database v2`() = runBlocking {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val repo = AnchorRepository.getInstance(context)
        repo.clearUrgeLogs()
        repo.logUrgeResisted("Matchday", "Closed browser before kickoff")
        repo.logUrgeResisted("Boredom", "Started 60s calm breathing")
        val logs = repo.recentUrgeLogs.first()
        val count = repo.totalUrgeResistedCount.first()
        assertEquals(2, count)
        assertEquals(2, logs.size)
        assertTrue(logs.any { it.triggerTag == "Matchday" })
        assertTrue(logs.any { it.triggerTag == "Boredom" })
    }

    @Test
    fun `progress dashboard calculates betting free days savings and milestone`() {
        val now = 1_700_000_000_000L
        val fiveDaysAgo = now - (5L * 24 * 60 * 60 * 1000) - (6L * 60 * 60 * 1000)
        val state = MainUiState(
            settings = ProtectionSettingsState(
                isProtectionEnabled = true,
                protectionStartedAtMs = fiveDaysAgo,
                dailyBetSpendEstimate = 25,
            ),
            currentTimeMs = now,
        )
        assertEquals(5, state.cleanDays)
        assertEquals(6, state.cleanHoursRemainder)
        assertEquals(7, state.nextMilestone.days)
        assertTrue(state.estimatedSavedAmount >= 130)
        assertTrue(state.milestoneProgressFraction > 0.7f)
    }

    @Test
    fun `spotlight tour defines all 6 auto-select steps`() {
        assertEquals(6, SPOTLIGHT_TOUR_STEPS.size)
        assertEquals(TourTargetKeys.SHIELD_ORB, SPOTLIGHT_TOUR_STEPS[0].targetKey)
        assertEquals(TourTargetKeys.SOS_CALM_BAR, SPOTLIGHT_TOUR_STEPS[1].targetKey)
        assertEquals(TourTargetKeys.FILTER_TESTER, SPOTLIGHT_TOUR_STEPS[2].targetKey)
        assertEquals(TourTargetKeys.BLOCKLIST_GUARDS, SPOTLIGHT_TOUR_STEPS[3].targetKey)
        assertEquals(TourTargetKeys.PROGRESS_DASHBOARD, SPOTLIGHT_TOUR_STEPS[4].targetKey)
        assertEquals(TourTargetKeys.LOCK_TIMER, SPOTLIGHT_TOUR_STEPS[5].targetKey)
    }
}
