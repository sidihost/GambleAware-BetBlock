package com.example.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.example.blocker.BlocklistMatcher
import com.example.data.AnchorRepository
import com.example.ui.BlockedInterventionActivity
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
                repository.setShieldRunning(
                    settings.isProtectionEnabled && GambleAwareAccessibilityService.isEnabled(appContext),
                )
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
                    runCatching {
                        val blockIntent = Intent(appContext, BlockedInterventionActivity::class.java).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                            putExtra(BlockedInterventionActivity.EXTRA_TARGET, targetLabel)
                            putExtra(BlockedInterventionActivity.EXTRA_SOURCE, "Install Guard")
                            putExtra(BlockedInterventionActivity.EXTRA_CATEGORY, match.category.displayName)
                            putExtra(BlockedInterventionActivity.EXTRA_PACKAGE_NAME, pkgName)
                        }
                        appContext.startActivity(blockIntent)
                    }
                }
            }
        }
    }
}

