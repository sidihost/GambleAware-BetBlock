package com.example.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.example.blocker.BlocklistMatcher
import com.example.data.AnchorRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class PackageInstallReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        val appContext = context.applicationContext
        val repository = AnchorRepository.getInstance(appContext)
        val settings = repository.prefs.currentSnapshot()

        when (action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            -> {
                if (settings.isProtectionEnabled && GambleAwareVpnService.isPrepared(appContext)) {
                    GambleAwareVpnService.start(appContext)
                }
            }
            Intent.ACTION_PACKAGE_ADDED,
            Intent.ACTION_PACKAGE_REPLACED,
            -> {
                val pkgName = intent.data?.schemeSpecificPart ?: return
                if (!settings.isProtectionEnabled || !settings.appShieldEnabled) return
                val config = repository.getCurrentFilterConfig()
                val appLabel = runCatching {
                    val pm = appContext.packageManager
                    val ai = pm.getApplicationInfo(pkgName, 0)
                    pm.getApplicationLabel(ai).toString()
                }.getOrNull()

                val match = BlocklistMatcher.matchAppPackage(pkgName, config, appLabel)
                if (match.isBlocked) {
                    val targetLabel = appLabel ?: match.matchedTarget
                    if (settings.notificationsEnabled) {
                        GambleAwareNotifications.notifyInstallGuardBlock(appContext, targetLabel)
                    }
                    CoroutineScope(Dispatchers.IO).launch {
                        repository.logBlockedEvent(
                            target = targetLabel,
                            source = "Install Guard",
                            category = match.category,
                        )
                    }
                }
            }
        }
    }
}
