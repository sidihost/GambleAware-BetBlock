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
        if (action != Intent.ACTION_PACKAGE_ADDED) return

        val installedPkg = intent.data?.schemeSpecificPart?.lowercase() ?: return
        if (installedPkg == context.packageName.lowercase()) return

        val repository = AnchorRepository.getInstance(context.applicationContext)
        val settings = repository.prefs.currentSnapshot()
        if (!settings.isProtectionEnabled || !settings.appShieldEnabled) return

        val appLabel = try {
            val pm = context.packageManager
            val appInfo = pm.getApplicationInfo(installedPkg, 0)
            pm.getApplicationLabel(appInfo)?.toString()
        } catch (_: Exception) {
            null
        }

        val match = BlocklistMatcher.matchAppPackage(
            packageName = installedPkg,
            config = repository.getCurrentFilterConfig(),
            appLabel = appLabel,
        )

        if (match.isBlocked) {
            CoroutineScope(Dispatchers.IO).launch {
                repository.logBlockedEvent(
                    target = match.matchedTarget,
                    source = "Install Guard",
                    category = match.category,
                )
            }

            val warnIntent = Intent(context, BlockedInterventionActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra(BlockedInterventionActivity.EXTRA_TARGET, match.matchedTarget)
                putExtra(BlockedInterventionActivity.EXTRA_SOURCE, "Install Guard")
                putExtra(BlockedInterventionActivity.EXTRA_CATEGORY, match.category.displayName)
                putExtra(BlockedInterventionActivity.EXTRA_IS_ANTI_TAMPER, false)
            }
            context.startActivity(warnIntent)
        }
    }
}
