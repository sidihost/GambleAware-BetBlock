package com.example.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.example.blocker.BlockMatchResult
import com.example.blocker.BlocklistMatcher
import com.example.blocker.GamblingCategory
import com.example.data.AnchorRepository
import com.example.ui.BlockedInterventionActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicReference

class GambleAwareAccessibilityService : AccessibilityService() {

    private val repository by lazy { AnchorRepository.getInstance(applicationContext) }
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val recentInterventions = ConcurrentHashMap<String, Long>()
    @Volatile
    private var lastAntiTamperTriggerMs: Long = 0L

    override fun onServiceConnected() {
        super.onServiceConnected()
        activeInstance.set(this)
        serviceInfo = serviceInfo?.apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or
                AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED or
                AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
            notificationTimeout = 100L
        }
        repository.setShieldRunning(true)
    }

    override fun onUnbind(intent: Intent?): Boolean {
        activeInstance.compareAndSet(this, null)
        repository.setShieldRunning(false)
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        activeInstance.compareAndSet(this, null)
        repository.setShieldRunning(false)
        super.onDestroy()
    }

    override fun onInterrupt() = Unit

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val pkg = event.packageName?.toString()?.lowercase()?.trim().orEmpty()
        if (pkg.isEmpty() || pkg == packageName.lowercase() || pkg == "com.android.systemui") {
            return
        }

        val settings = repository.prefs.currentSnapshot()
        val config = repository.getCurrentFilterConfig()
        val root = rootInActiveWindow

        // 1. Settings & Installer Anti-Tamper Lock (blocks Uninstall / Force Stop / Clear Data / Deactivate)
        if (pkg in SETTINGS_GUARD_PACKAGES &&
            (settings.isTimeLocked() || (settings.isProtectionEnabled && settings.antiTamperLockEnabled))
        ) {
            if (root != null && isTamperingGambleAwareSettings(root)) {
                triggerAntiTamperIntervention()
                return
            }
        }

        if (!settings.isProtectionEnabled) return

        // 2. Native Betting App Shield
        if (settings.appShieldEnabled &&
            pkg !in BROWSER_PACKAGES &&
            pkg !in SOCIAL_WEBVIEW_PACKAGES &&
            pkg !in SETTINGS_GUARD_PACKAGES
        ) {
            val appLabel = runCatching {
                val ai = packageManager.getApplicationInfo(pkg, 0)
                packageManager.getApplicationLabel(ai).toString()
            }.getOrNull()
            val appMatch = BlocklistMatcher.matchAppPackage(pkg, config, appLabel)
            if (appMatch.isBlocked) {
                performGlobalAction(GLOBAL_ACTION_HOME)
                triggerBlockIntervention(
                    match = appMatch,
                    source = "App Shield",
                )
                return
            }
        }

        val isBrowser = pkg in BROWSER_PACKAGES
        val isSocialWebView = pkg in SOCIAL_WEBVIEW_PACKAGES
        if (!settings.browserShieldEnabled || (!isBrowser && !isSocialWebView)) {
            return
        }

        // 3. Instant while-typing address bar & search query detection
        val addressCandidates = LinkedHashSet<String>()
        event.text?.forEach { cs ->
            val t = cs?.toString()?.trim().orEmpty()
            if (t.length >= 4 && t.length <= 320) {
                addressCandidates.add(t)
            }
        }
        val visibleTexts = ArrayList<String>(40)
        var hasWebView = false
        if (root != null) {
            hasWebView = collectWindowSignals(
                node = root,
                addressCandidates = addressCandidates,
                visibleTexts = visibleTexts,
                depth = 0,
            )
        }

        for (candidate in addressCandidates) {
            val typedMatch = BlocklistMatcher.matchTypedBrowserInput(candidate, config)
            if (typedMatch.isBlocked) {
                performGlobalAction(GLOBAL_ACTION_BACK)
                triggerBlockIntervention(
                    match = typedMatch,
                    source = if (isSocialWebView) "In-App WebView" else "Typed URL Guard",
                )
                return
            }
        }

        // 4. Live page / WebView / Popunder gambling ad inspection
        if (visibleTexts.isNotEmpty() && (isBrowser || hasWebView)) {
            val pageMatch = BlocklistMatcher.matchWebViewContent(
                visibleTexts = visibleTexts,
                hasWebView = isBrowser || hasWebView,
                config = config,
            )
            if (pageMatch.isBlocked) {
                performGlobalAction(GLOBAL_ACTION_BACK)
                triggerBlockIntervention(
                    match = pageMatch,
                    source = if (isSocialWebView) "In-App WebView" else "Browser Shield",
                )
            }
        }
    }

    private fun isTamperingGambleAwareSettings(root: AccessibilityNodeInfo): Boolean {
        val collected = ArrayList<String>(36)
        collectPlainTexts(root, collected, depth = 0, limit = 36)
        if (collected.isEmpty()) return false
        val joined = collected.joinToString(" ").lowercase()
        val mentionsApp = joined.contains("gambleaware") || joined.contains(packageName.lowercase())
        if (!mentionsApp) return false
        return ANTI_TAMPER_KEYWORDS.any { joined.contains(it) }
    }

    private fun collectPlainTexts(
        node: AccessibilityNodeInfo,
        out: MutableList<String>,
        depth: Int,
        limit: Int,
    ) {
        if (depth > 12 || out.size >= limit) return
        val txt = node.text?.toString()?.trim().orEmpty()
        if (txt.isNotEmpty() && txt.length <= 140) {
            out.add(txt)
        }
        val desc = node.contentDescription?.toString()?.trim().orEmpty()
        if (desc.isNotEmpty() && desc.length <= 140) {
            out.add(desc)
        }
        for (i in 0 until node.childCount) {
            if (out.size >= limit) break
            val child = node.getChild(i) ?: continue
            collectPlainTexts(child, out, depth + 1, limit)
        }
    }

    private fun collectWindowSignals(
        node: AccessibilityNodeInfo,
        addressCandidates: MutableSet<String>,
        visibleTexts: MutableList<String>,
        depth: Int,
    ): Boolean {
        if (depth > 14 || visibleTexts.size >= 40) return false
        var hasWebView = node.className?.toString()?.contains("WebView", ignoreCase = true) == true
        val viewId = node.viewIdResourceName?.lowercase().orEmpty()
        val className = node.className?.toString().orEmpty()
        val txt = node.text?.toString()?.trim().orEmpty()

        val isUrlField = node.isEditable ||
            className.endsWith("EditText") ||
            viewId.contains("url") ||
            viewId.contains("location") ||
            viewId.contains("address") ||
            viewId.contains("omnibox") ||
            viewId.contains("search_box")

        if (txt.isNotEmpty() && txt.length <= 320) {
            if (isUrlField) {
                addressCandidates.add(txt)
            }
            if (visibleTexts.size < 40 && txt.length <= 160) {
                visibleTexts.add(txt)
            }
        }

        for (i in 0 until node.childCount) {
            if (visibleTexts.size >= 40) break
            val child = node.getChild(i) ?: continue
            if (collectWindowSignals(child, addressCandidates, visibleTexts, depth + 1)) {
                hasWebView = true
            }
        }
        return hasWebView
    }

    private fun triggerAntiTamperIntervention() {
        val now = System.currentTimeMillis()
        if (now - lastAntiTamperTriggerMs < 1500L) return
        lastAntiTamperTriggerMs = now

        performGlobalAction(GLOBAL_ACTION_BACK)
        performGlobalAction(GLOBAL_ACTION_HOME)

        val intent = Intent(this, BlockedInterventionActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra(BlockedInterventionActivity.EXTRA_TARGET, "Settings Anti-Tamper Lock")
            putExtra(BlockedInterventionActivity.EXTRA_SOURCE, "Lock Guard")
            putExtra(BlockedInterventionActivity.EXTRA_CATEGORY, "Commitment Lock")
            putExtra(BlockedInterventionActivity.EXTRA_IS_ANTI_TAMPER, true)
        }
        startActivity(intent)
    }

    private fun triggerBlockIntervention(
        match: BlockMatchResult,
        source: String,
    ) {
        val rawTarget = match.matchedTarget.ifBlank { "Gambling site" }
        val normalizedKey = (BlocklistMatcher.normalizeDomain(rawTarget).ifEmpty { rawTarget }).lowercase()
        val now = System.currentTimeMillis()
        val prev = recentInterventions[normalizedKey]
        if (prev != null && now - prev < 2_500L) return
        recentInterventions[normalizedKey] = now

        serviceScope.launch {
            repository.logBlockedEvent(
                target = normalizedKey,
                source = source,
                category = match.category,
            )
        }

        val intent = Intent(this, BlockedInterventionActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra(BlockedInterventionActivity.EXTRA_TARGET, rawTarget)
            putExtra(BlockedInterventionActivity.EXTRA_SOURCE, source)
            putExtra(BlockedInterventionActivity.EXTRA_CATEGORY, match.category.displayName)
        }
        startActivity(intent)
    }

    companion object {
        private val activeInstance = AtomicReference<GambleAwareAccessibilityService?>(null)

        fun isEnabled(context: Context): Boolean {
            if (activeInstance.get() != null) return true
            val enabledServices = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
            ) ?: return false

            val expected = ComponentName(context, GambleAwareAccessibilityService::class.java)
            val fullName = expected.flattenToString()
            val shortName = expected.flattenToShortString()
            val splitter = TextUtils.SimpleStringSplitter(':')
            splitter.setString(enabledServices)
            while (splitter.hasNext()) {
                val component = splitter.next()
                if (component.equals(fullName, ignoreCase = true) ||
                    component.equals(shortName, ignoreCase = true)
                ) {
                    return true
                }
            }
            return false
        }

        val BROWSER_PACKAGES: Set<String> = setOf(
            "com.android.chrome",
            "com.chrome.beta",
            "com.chrome.dev",
            "com.chrome.canary",
            "com.sec.android.app.sbrowser",
            "org.mozilla.firefox",
            "org.mozilla.focus",
            "com.microsoft.emmx",
            "com.brave.browser",
            "com.opera.browser",
            "com.opera.mini.native",
            "com.opera.gx",
            "com.duckduckgo.mobile.android",
            "com.vivaldi.browser",
            "com.kiwibrowser.browser",
            "com.ucmobile.intl",
            "com.transsion.phoenix",
            "com.yandex.browser",
            "com.mi.globalbrowser",
            "com.huawei.browser",
            "org.torproject.torbrowser",
        )

        val SOCIAL_WEBVIEW_PACKAGES: Set<String> = setOf(
            "com.instagram.android",
            "com.zhiliaoapp.musically",
            "com.ss.android.ugc.trill",
            "org.telegram.messenger",
            "org.telegram.plus",
            "com.twitter.android",
            "com.whatsapp",
            "com.facebook.katana",
            "com.reddit.frontpage",
        )

        val SETTINGS_GUARD_PACKAGES: Set<String> = setOf(
            "com.android.settings",
            "com.google.android.packageinstaller",
            "com.android.packageinstaller",
            "com.miui.securitycenter",
            "com.samsung.android.lool",
        )

        private val ANTI_TAMPER_KEYWORDS = listOf(
            "uninstall",
            "force stop",
            "clear data",
            "clear storage",
            "deactivate",
            "device admin",
            "turn off",
            "stop service",
        )
    }
}
