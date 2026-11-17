package com.example.service

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.example.MainActivity
import com.example.R

object GambleAwareNotifications {

    private const val CHANNEL_ID = "gambleaware_recovery_alerts"
    private const val CHANNEL_NAME = "Recovery & Shield Alerts"
    private const val CHANNEL_DESC = "Streak milestones, lock countdown alerts, and Install Guard blocks"

    private const val NOTIF_ID_INSTALL_GUARD = 4101
    private const val NOTIF_ID_MILESTONE = 4102
    private const val NOTIF_ID_LOCK = 4103
    private const val NOTIF_ID_TEST = 4104

    private val MILESTONE_DAYS = listOf(1, 3, 7, 14, 30, 60, 90, 180, 365)

    fun hasNotificationPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS,
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val existing = manager.getNotificationChannel(CHANNEL_ID)
            if (existing == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH,
                ).apply {
                    description = CHANNEL_DESC
                }
                manager.createNotificationChannel(channel)
            }
        }
    }

    fun notifyInstallGuardBlock(context: Context, appLabel: String) {
        postNotification(
            context = context,
            notificationId = NOTIF_ID_INSTALL_GUARD,
            title = "GambleAware Blocked Betting App",
            body = "$appLabel was detected and blocked automatically by Install Guard.",
        )
    }

    fun notifyLockActivated(context: Context, days: Int) {
        postNotification(
            context = context,
            notificationId = NOTIF_ID_LOCK,
            title = "Commitment Lock Active ($days Day${if (days == 1) "" else "s"})",
            body = "Uninstall and tamper protection stay locked until your timer finishes.",
        )
    }

    fun notifyMilestoneIfEligible(
        context: Context,
        cleanDays: Int,
        estimatedSaved: Int,
        lastNotifiedDay: Int,
        onMarkNotified: (Int) -> Unit,
    ) {
        val reached = MILESTONE_DAYS.lastOrNull { it <= cleanDays } ?: return
        if (reached <= lastNotifiedDay) return

        val posted = postNotification(
            context = context,
            notificationId = NOTIF_ID_MILESTONE,
            title = "$reached Day${if (reached == 1) "" else "s"} Betting-Free",
            body = "You've stayed clear for $reached day${if (reached == 1) "" else "s"} and kept ~$$estimatedSaved. Keep going.",
        )
        if (posted) {
            onMarkNotified(reached)
        }
    }

    fun notifyTestAlert(context: Context): Boolean {
        return postNotification(
            context = context,
            notificationId = NOTIF_ID_TEST,
            title = "GambleAware Alerts Active",
            body = "Local milestone, Commitment Lock, and Install Guard notifications are enabled.",
        )
    }

    private fun postNotification(
        context: Context,
        notificationId: Int,
        title: String,
        body: String,
    ): Boolean {
        if (!hasNotificationPermission(context)) return false
        ensureChannel(context)

        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        return try {
            NotificationManagerCompat.from(context).notify(notificationId, notification)
            true
        } catch (_: SecurityException) {
            false
        }
    }
}
