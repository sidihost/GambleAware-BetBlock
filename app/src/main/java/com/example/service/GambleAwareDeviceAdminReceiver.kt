package com.example.service

import android.app.admin.DeviceAdminReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.example.data.AnchorRepository
import java.util.Locale

class GambleAwareDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        val repository = AnchorRepository.getInstance(context.applicationContext)
        repository.prefs.setAntiTamperLockEnabled(true)
        repository.prefs.setProtectionEnabled(true)
        if (GambleAwareVpnService.isPrepared(context)) {
            GambleAwareVpnService.start(context)
        }
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        val settings = AnchorRepository.getInstance(context.applicationContext).prefs.currentSnapshot()
        val now = System.currentTimeMillis()
        return when {
            settings.isTimeLocked(now) -> {
                val remaining = settings.remainingLockMs(now)
                val totalHours = (remaining / 3_600_000L).coerceAtLeast(1L)
                val days = totalHours / 24L
                val hours = totalHours % 24L
                val span = String.format(Locale.US, "%dd %dh", days, hours)
                "Commitment Lock is active ($span remaining). Disabling Device Admin will unlock app uninstalls — pause and breathe before weakening your recovery shield."
            }
            settings.antiTamperLockEnabled -> {
                "GambleAware Uninstall Lock is armed. Removing Device Admin weakens your barrier against sudden betting urges."
            }
            else -> {
                "Deactivating GambleAware Uninstall Lock allows app removal."
            }
        }
    }

    companion object {
        fun componentName(context: Context): ComponentName {
            return ComponentName(context.applicationContext, GambleAwareDeviceAdminReceiver::class.java)
        }
    }
}
