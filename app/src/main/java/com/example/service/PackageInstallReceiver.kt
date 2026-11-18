package com.example.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.example.data.AnchorRepository

class PackageInstallReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED && action != Intent.ACTION_MY_PACKAGE_REPLACED) {
            return
        }

        val repository = AnchorRepository.getInstance(context.applicationContext)
        val settings = repository.prefs.currentSnapshot()
        if (settings.isProtectionEnabled && GambleAwareVpnService.isPrepared(context)) {
            GambleAwareVpnService.start(context)
        }
    }
}
