package com.example.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import androidx.core.app.NotificationCompat
import com.example.MainActivity
import com.example.R
import com.example.blocker.BlocklistMatcher
import com.example.data.AnchorRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean

class GambleAwareVpnService : VpnService() {

    private val repository by lazy { AnchorRepository.getInstance(applicationContext) }
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val running = AtomicBoolean(false)
    private var vpnInterface: ParcelFileDescriptor? = null
    private var workerThread: Thread? = null
    private val recentLoggedHostTimestamps = ConcurrentHashMap<String, Long>()

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopVpnTunnel()
            stopSelf()
            return START_NOT_STICKY
        }
        startForegroundNotification()
        startVpnTunnel()
        return START_STICKY
    }

    override fun onRevoke() {
        stopVpnTunnel()
        super.onRevoke()
    }

    override fun onDestroy() {
        stopVpnTunnel()
        super.onDestroy()
    }

    private fun startForegroundNotification() {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (manager.getNotificationChannel(CHANNEL_ID) == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "GambleAware On-Device Shield",
                    NotificationManager.IMPORTANCE_LOW,
                ).apply {
                    description = "Persistent on-device DNS guard blocking gambling sites and betting apps"
                }
                manager.createNotificationChannel(channel)
            }
        }

        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            901,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_gambleaware)
            .setContentTitle("GambleAware Shield Active")
            .setContentText("On-device DNS guard is blocking betting websites and apps.")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(NOTIF_ID, notification)
        }
    }

    private fun startVpnTunnel() {
        if (running.getAndSet(true)) return

        val builder = Builder()
            .setSession("GambleAware DNS Shield")
            .setMtu(1500)
            .addAddress(LOCAL_TUN_ADDRESS, 32)
            .addDnsServer(VIRTUAL_DNS_SERVER)
            .addRoute(VIRTUAL_DNS_SERVER, 32)

        runCatching { builder.addDisallowedApplication(packageName) }

        val tun = runCatching { builder.establish() }.getOrNull()
        if (tun == null) {
            running.set(false)
            repository.setShieldRunning(false)
            stopSelf()
            return
        }

        vpnInterface = tun
        repository.setShieldRunning(true)

        workerThread = Thread(
            {
                runDnsLoop(tun)
            },
            "GambleAwareDnsLoop",
        ).apply {
            isDaemon = true
            start()
        }
    }

    private fun stopVpnTunnel() {
        running.set(false)
        repository.setShieldRunning(false)
        runCatching { vpnInterface?.close() }
        vpnInterface = null
        workerThread?.interrupt()
        workerThread = null
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            runCatching { stopForeground(STOP_FOREGROUND_REMOVE) }
        }
    }

    private fun runDnsLoop(tun: ParcelFileDescriptor) {
        val input = FileInputStream(tun.fileDescriptor)
        val output = FileOutputStream(tun.fileDescriptor)
        val buffer = ByteArray(4096)

        while (running.get() && !Thread.currentThread().isInterrupted) {
            val bytesRead = try {
                input.read(buffer)
            } catch (_: Exception) {
                break
            }
            if (bytesRead <= 0) {
                continue
            }

            val parsed = DnsPacketCodec.parseIpv4UdpDns(buffer, bytesRead) ?: continue
            val settings = repository.prefs.currentSnapshot()
            val match = if (settings.isProtectionEnabled) {
                BlocklistMatcher.matchDomainOrUrl(parsed.domainName, repository.getCurrentFilterConfig())
            } else {
                com.example.blocker.BlockMatchResult(isBlocked = false)
            }

            if (match.isBlocked) {
                val nxResponse = DnsPacketCodec.buildNxdomainResponse(parsed)
                synchronized(output) {
                    runCatching { output.write(nxResponse) }
                }
                logBlockedDomain(parsed.domainName, match.category)
            } else {
                val upstreamReply = forwardDnsQuery(parsed.dnsPayload)
                if (upstreamReply != null) {
                    val replyPacket = DnsPacketCodec.buildForwardResponse(parsed, upstreamReply)
                    synchronized(output) {
                        runCatching { output.write(replyPacket) }
                    }
                }
            }
        }
    }

    private fun forwardDnsQuery(dnsQuery: ByteArray): ByteArray? {
        for (resolverHost in UPSTREAM_DNS_SERVERS) {
            var socket: DatagramSocket? = null
            try {
                socket = DatagramSocket()
                if (!protect(socket)) {
                    socket.close()
                    continue
                }
                socket.soTimeout = 2500
                val address = InetAddress.getByName(resolverHost)
                val outPacket = DatagramPacket(dnsQuery, dnsQuery.size, address, 53)
                socket.send(outPacket)

                val recvBuf = ByteArray(2048)
                val inPacket = DatagramPacket(recvBuf, recvBuf.size)
                socket.receive(inPacket)
                return recvBuf.copyOf(inPacket.length)
            } catch (_: Exception) {
                // Try fallback resolver
            } finally {
                runCatching { socket?.close() }
            }
        }
        return null
    }

    private fun logBlockedDomain(domain: String, category: com.example.blocker.GamblingCategory) {
        val normalized = BlocklistMatcher.normalizeDomain(domain).ifEmpty { domain.trim().lowercase() }
        val now = System.currentTimeMillis()
        val prev = recentLoggedHostTimestamps[normalized]
        if (prev != null && now - prev < 3_000L) return
        recentLoggedHostTimestamps[normalized] = now

        serviceScope.launch {
            repository.logBlockedEvent(
                target = normalized,
                source = "DNS Shield",
                category = category,
            )
        }
    }

    companion object {
        private const val ACTION_START = "com.example.service.ACTION_START_SHIELD"
        private const val ACTION_STOP = "com.example.service.ACTION_STOP_SHIELD"
        private const val CHANNEL_ID = "gambleaware_vpn_shield"
        private const val NOTIF_ID = 4109
        private const val LOCAL_TUN_ADDRESS = "10.111.222.1"
        private const val VIRTUAL_DNS_SERVER = "10.111.222.2"
        private val UPSTREAM_DNS_SERVERS = listOf("1.1.1.3", "8.8.8.8")

        fun isPrepared(context: Context): Boolean {
            return prepare(context.applicationContext) == null
        }

        fun start(context: Context) {
            val intent = Intent(context.applicationContext, GambleAwareVpnService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.applicationContext.startForegroundService(intent)
            } else {
                context.applicationContext.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context.applicationContext, GambleAwareVpnService::class.java).apply {
                action = ACTION_STOP
            }
            context.applicationContext.startService(intent)
        }
    }
}
