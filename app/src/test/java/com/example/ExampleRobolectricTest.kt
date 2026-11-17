package com.example

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.data.ProtectionPreferences
import com.example.data.ThemeMode
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
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
  }
}
