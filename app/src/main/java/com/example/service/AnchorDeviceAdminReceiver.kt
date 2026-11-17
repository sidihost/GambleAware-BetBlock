package com.example.service

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent

class AnchorDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        return "GambleAware Uninstall Lock is active. Wait until your Commitment Lock timer finishes before removing protection."
    }

    companion object {
        fun componentName(context: Context): ComponentName {
            return ComponentName(context.applicationContext, AnchorDeviceAdminReceiver::class.java)
        }

        fun isAdminActive(context: Context): Boolean {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
                ?: return false
            return dpm.isAdminActive(componentName(context))
        }

        fun buildEnableAdminIntent(context: Context): Intent {
            return Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, componentName(context))
                putExtra(
                    DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                    "GambleAware by Imoogle Technology uses Device Admin to block impulsive app removal until your Commitment Lock timer ends.",
                )
            }
        }

        fun deactivateAdmin(context: Context) {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
                ?: return
            val comp = componentName(context)
            if (dpm.isAdminActive(comp)) {
                dpm.removeActiveAdmin(comp)
            }
        }
    }
}
