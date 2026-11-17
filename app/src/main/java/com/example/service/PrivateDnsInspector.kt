package com.example.service

import android.content.Context
import android.net.ConnectivityManager
import android.os.Build

data class PrivateDnsStatus(
    val isActive: Boolean,
    val serverHost: String?,
)

object PrivateDnsInspector {
    fun inspect(context: Context): PrivateDnsStatus {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            return PrivateDnsStatus(isActive = false, serverHost = null)
        }
        return try {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
                ?: return PrivateDnsStatus(false, null)
            val activeNetwork = cm.activeNetwork ?: return PrivateDnsStatus(false, null)
            val props = cm.getLinkProperties(activeNetwork) ?: return PrivateDnsStatus(false, null)
            PrivateDnsStatus(
                isActive = props.isPrivateDnsActive,
                serverHost = props.privateDnsServerName,
            )
        } catch (_: Exception) {
            PrivateDnsStatus(isActive = false, serverHost = null)
        }
    }
}
