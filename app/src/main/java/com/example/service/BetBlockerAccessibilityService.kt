package com.example.service

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.provider.Settings
import android.text.TextUtils
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import androidx.core.content.ContextCompat
import com.example.blocker.BlocklistMatcher
import com.example.blocker.GamblingCategory
import com.example.data.AnchorRepository
import com.example.ui.BlockedInterventionActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.util.concurrent.ConcurrentHashMap

class BetBlockerAccessibilityService : AccessibilityService() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val repository by lazy { AnchorRepository.getInstance(applicationContext) }
    private val appLabelCache = ConcurrentHashMap<String, String>()
    private var packageInstallReceiver: PackageInstallReceiver? = null
    private var lastTriggerAtMs = 0L
    private var lastTriggeredTarget = ""
    private var lastScanAtMs = 0L

    override fun onServiceConnected() {
        super.onServiceConnected()
        repository.setAccessibilityRunning(true)
        registerDynamicInstallReceiver()
    }

    private fun registerDynamicInstallReceiver() {
        if (packageInstallReceiver != null) return
        val receiver = PackageInstallReceiver()
        val filter = IntentFilter(Intent.ACTION_PACKAGE_ADDED).apply {
            addDataScheme("package")
        }
        ContextCompat.registerReceiver(
            this,
            receiver,
            filter,
            ContextCompat.RECEIVER_NOT_EXPORTED,
        )
        packageInstallReceiver = receiver
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val pkg = event.packageName?.toString()?.lowercase() ?: return
        if (pkg == packageName.lowercase() || pkg == "com.android.systemui") return

        val settings = repository.prefs.currentSnapshot()
        if (!settings.isProtectionEnabled) return

        val config = repository.getCurrentFilterConfig()

        // 1. Instant Native Betting App Shield (package name + app label check)
        if (settings.appShieldEnabled && !isSystemSafePackage(pkg)) {
            val label = resolveAppLabel(pkg)
            val appMatch = BlocklistMatcher.matchAppPackage(pkg, config, label)
            if (appMatch.isBlocked) {
                triggerIntervention(
                    target = appMatch.matchedTarget,
                    source = "App Shield",
                    category = appMatch.category,
                    isAntiTamper = false,
                    useBackFirst = false,
                )
                return
            }
        }

        // 2. Hardened Anti-Uninstall & Anti-Tamper Guard
        // Covers Settings, Package Installer uninstall dialogs, Play Store uninstall, and OEM managers
        val isTamperLocked = settings.antiTamperLockEnabled &&
            (settings.isTimeLocked() || (settings.hasCompletedInitialSetup && AnchorDeviceAdminReceiver.isAdminActive(this)))
        if (isTamperLocked && pkg in TAMPER_SENSITIVE_PACKAGES) {
            val root = rootInActiveWindow
            if (root != null && containsAntiTamperSettingsScreen(root, pkg)) {
                val targetLabel = if (settings.isTimeLocked()) {
                    formatRemainingLock(settings.remainingLockMs())
                } else {
                    "Admin Lock Armed"
                }
                triggerIntervention(
                    target = targetLabel,
                    source = "Uninstall Lock",
                    category = GamblingCategory.CUSTOM,
                    isAntiTamper = true,
                    useBackFirst = true,
                )
                return
            }
        }

        // 3. Universal Browser, Search, Custom Tab & In-App WebView Shield
        if (!settings.browserShieldEnabled || isSkippedUtilityPackage(pkg)) return

        val now = System.currentTimeMillis()
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            now - lastTriggerAtMs < 900L
        ) {
            return
        }
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED && now - lastScanAtMs < 130L) {
            return
        }
        lastScanAtMs = now

        val root = rootInActiveWindow ?: return

        val isKnownBrowser = pkg in KNOWN_BROWSER_PACKAGES
        var knownBrowserUrl: String? = null
        if (isKnownBrowser) {
            knownBrowserUrl = extractKnownBrowserUrl(root, pkg)
            if (isInternalOrPlaceholderBrowserText(knownBrowserUrl)) {
                // Chrome New Tab Page, Settings, Bookmarks, Tab Switcher or omnibox placeholder:
                // Never close Chrome when on internal/NTP screens.
                return
            }
            if (!knownBrowserUrl.isNullOrBlank()) {
                val urlMatch = BlocklistMatcher.matchBrowserAddressText(knownBrowserUrl, config)
                if (urlMatch.isBlocked) {
                    triggerIntervention(
                        target = urlMatch.matchedTarget,
                        source = "Web Shield",
                        category = urlMatch.category,
                        isAntiTamper = false,
                        useBackFirst = true,
                    )
                    return
                }
            }
        }

        val inspection = inspectWindowForWebOrUrl(root)
        if (inspection.addressCandidates.isNotEmpty()) {
            for (candidate in inspection.addressCandidates) {
                if (isInternalOrPlaceholderBrowserText(candidate)) continue
                val match = BlocklistMatcher.matchBrowserAddressText(candidate, config)
                if (match.isBlocked) {
                    triggerIntervention(
                        target = match.matchedTarget,
                        source = if (isKnownBrowser) "Web Shield" else "In-App WebView",
                        category = match.category,
                        isAntiTamper = false,
                        useBackFirst = true,
                    )
                    return
                }
            }
        }

        // Only scan rendered page content when an actual WebView is present OR a known browser
        // has a settled non-internal external URL loaded (never scan Chrome NTP Discover cards).
        val hasLoadedBrowserPage = isKnownBrowser && !knownBrowserUrl.isNullOrBlank()
        if (inspection.hasWebView || hasLoadedBrowserPage) {
            val contentMatch = BlocklistMatcher.matchWebViewContent(
                visibleTexts = inspection.visibleTexts,
                hasWebView = inspection.hasWebView,
                config = config,
            )
            if (contentMatch.isBlocked) {
                triggerIntervention(
                    target = contentMatch.matchedTarget,
                    source = if (isKnownBrowser) "Web Shield" else "In-App WebView",
                    category = contentMatch.category,
                    isAntiTamper = false,
                    useBackFirst = true,
                )
            }
        }
    }

    private fun isInternalOrPlaceholderBrowserText(raw: String?): Boolean {
        val text = raw?.trim()?.lowercase() ?: return false
        if (text.isEmpty()) return false
        if (INTERNAL_BROWSER_PREFIXES.any { text.startsWith(it) }) return true
        return text in BROWSER_PLACEHOLDER_HINTS
    }

    private fun resolveAppLabel(pkg: String): String? {
        appLabelCache[pkg]?.let { return it.ifEmpty { null } }
        val resolved = try {
            val info = packageManager.getApplicationInfo(pkg, 0)
            packageManager.getApplicationLabel(info)?.toString()?.trim().orEmpty()
        } catch (_: Exception) {
            ""
        }
        appLabelCache[pkg] = resolved
        return resolved.ifEmpty { null }
    }

    private fun extractKnownBrowserUrl(root: AccessibilityNodeInfo, pkg: String): String? {
        val candidateIds = BROWSER_URL_BAR_IDS[pkg] ?: DEFAULT_URL_BAR_IDS
        for (viewId in candidateIds) {
            val nodes = root.findAccessibilityNodeInfosByViewId(viewId)
            if (!nodes.isNullOrEmpty()) {
                for (node in nodes) {
                    val text = node.text?.toString()?.trim()
                    if (text.isNullOrBlank()) continue
                    if (isInternalOrPlaceholderBrowserText(text)) return text
                    // Do not interrupt the user mid-keystroke while typing in a focused omnibox
                    // unless a clear domain/URL has already been formed.
                    if (node.isFocused && !text.contains('.')) continue
                    if (text.contains('.') || text.startsWith("http")) {
                        return text
                    }
                }
            }
        }
        return null
    }

    private data class WindowInspectionResult(
        val hasWebView: Boolean,
        val addressCandidates: List<String>,
        val visibleTexts: List<String>,
    )

    private fun inspectWindowForWebOrUrl(root: AccessibilityNodeInfo): WindowInspectionResult {
        var hasWebView = false
        val addressCandidates = ArrayList<String>(6)
        val visibleTexts = ArrayList<String>(48)

        val queue = ArrayDeque<Pair<AccessibilityNodeInfo, Int>>()
        queue.add(root to 0)
        var visited = 0

        while (queue.isNotEmpty() && visited < 180) {
            val (node, depth) = queue.removeFirst()
            visited++

            val className = node.className?.toString().orEmpty()
            if (className == "android.webkit.WebView" || className.endsWith(".WebView")) {
                hasWebView = true
            }

            val viewId = node.viewIdResourceName?.lowercase().orEmpty()
            val text = node.text?.toString()?.trim().orEmpty()
            val contentDesc = node.contentDescription?.toString()?.trim().orEmpty()

            if (text.isNotEmpty()) {
                if (visibleTexts.size < 48) {
                    visibleTexts.add(text)
                }
                val isSearchPlaceholder = viewId.contains("search_box_text") ||
                    isInternalOrPlaceholderBrowserText(text)
                val looksLikeUrlField = !isSearchPlaceholder && (
                    className.contains("EditText") ||
                        viewId.contains("url") ||
                        viewId.contains("address") ||
                        viewId.contains("omnibox") ||
                        viewId.contains("location_bar")
                    )
                if (looksLikeUrlField && text.contains('.') && addressCandidates.size < 8) {
                    addressCandidates.add(text)
                }
            } else if (contentDesc.isNotEmpty() && visibleTexts.size < 48) {
                visibleTexts.add(contentDesc)
            }

            if (depth < 12) {
                val childCount = node.childCount.coerceAtMost(24)
                for (i in 0 until childCount) {
                    val child = node.getChild(i) ?: continue
                    queue.add(child to (depth + 1))
                }
            }
        }

        return WindowInspectionResult(
            hasWebView = hasWebView,
            addressCandidates = addressCandidates,
            visibleTexts = visibleTexts,
        )
    }

    private fun containsAntiTamperSettingsScreen(root: AccessibilityNodeInfo, pkg: String): Boolean {
        val texts = ArrayList<String>(36)
        val queue = ArrayDeque<Pair<AccessibilityNodeInfo, Int>>()
        queue.add(root to 0)
        while (queue.isNotEmpty() && texts.size < 48) {
            val (node, depth) = queue.removeFirst()
            node.text?.toString()?.takeIf { it.isNotBlank() }?.let { texts.add(it) }
            node.contentDescription?.toString()?.takeIf { it.isNotBlank() }?.let { texts.add(it) }
            if (depth < 7) {
                for (i in 0 until node.childCount.coerceAtMost(24)) {
                    node.getChild(i)?.let { queue.add(it to (depth + 1)) }
                }
            }
        }
        val joined = texts.joinToString(" ").lowercase()

        // Package installer "Do you want to uninstall this app?" dialog
        if (pkg.contains("packageinstaller") && joined.contains("uninstall") &&
            (joined.contains("gambleaware") || joined.contains("imoogle"))
        ) {
            return true
        }

        val mentionsApp = joined.contains("gambleaware") || joined.contains("imoogle")
        val mentionsPrivateDns = joined.contains("private dns")
        if (!mentionsApp && !mentionsPrivateDns) return false

        return joined.contains("uninstall") ||
            joined.contains("force stop") ||
            joined.contains("use gambleaware") ||
            joined.contains("accessibility") ||
            joined.contains("device admin") ||
            joined.contains("deactivate") ||
            joined.contains("clear storage") ||
            joined.contains("clear data") ||
            joined.contains("disable") ||
            joined.contains("remove") ||
            mentionsPrivateDns
    }

    private fun formatRemainingLock(remainingMs: Long): String {
        val totalMinutes = (remainingMs / 60_000L).coerceAtLeast(1L)
        val days = totalMinutes / (24L * 60L)
        val hours = (totalMinutes % (24L * 60L)) / 60L
        val mins = totalMinutes % 60L
        return when {
            days > 0 -> "${days}d ${hours}h ${mins}m remaining"
            hours > 0 -> "${hours}h ${mins}m remaining"
            else -> "${mins}m remaining"
        }
    }

    private fun triggerIntervention(
        target: String,
        source: String,
        category: GamblingCategory,
        isAntiTamper: Boolean,
        useBackFirst: Boolean,
    ) {
        val now = System.currentTimeMillis()
        if (target == lastTriggeredTarget && now - lastTriggerAtMs < 1500L) return
        lastTriggerAtMs = now
        lastTriggeredTarget = target

        if (useBackFirst && !isAntiTamper) {
            // Back off the blocked tab cleanly without force-homing/killing Chrome's state
            performGlobalAction(GLOBAL_ACTION_BACK)
        } else {
            if (useBackFirst) {
                performGlobalAction(GLOBAL_ACTION_BACK)
            }
            performGlobalAction(GLOBAL_ACTION_HOME)
        }

        if (!isAntiTamper) {
            scope.launch {
                repository.logBlockedEvent(
                    target = target,
                    source = source,
                    category = category,
                )
            }
        }

        val intent = Intent(this, BlockedInterventionActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(BlockedInterventionActivity.EXTRA_TARGET, target)
            putExtra(BlockedInterventionActivity.EXTRA_SOURCE, source)
            putExtra(BlockedInterventionActivity.EXTRA_CATEGORY, category.displayName)
            putExtra(BlockedInterventionActivity.EXTRA_IS_ANTI_TAMPER, isAntiTamper)
        }
        startActivity(intent)
    }

    private fun isSystemSafePackage(pkg: String): Boolean {
        return pkg.startsWith("com.android.launcher") ||
            pkg.contains("inputmethod") ||
            pkg.contains("keyboard") ||
            pkg in TAMPER_SENSITIVE_PACKAGES
    }

    private fun isSkippedUtilityPackage(pkg: String): Boolean {
        return pkg.startsWith("com.android.launcher") ||
            pkg.contains("inputmethod") ||
            pkg.contains("keyboard") ||
            pkg in TAMPER_SENSITIVE_PACKAGES ||
            pkg == "com.google.android.apps.nexuslauncher"
    }

    override fun onInterrupt() {
        // Keep running
    }

    override fun onUnbind(intent: Intent?): Boolean {
        repository.setAccessibilityRunning(false)
        unregisterDynamicInstallReceiver()
        return super.onUnbind(intent)
    }

    override fun onDestroy() {
        repository.setAccessibilityRunning(false)
        unregisterDynamicInstallReceiver()
        scope.cancel()
        super.onDestroy()
    }

    private fun unregisterDynamicInstallReceiver() {
        packageInstallReceiver?.let {
            try {
                unregisterReceiver(it)
            } catch (_: Exception) {
            }
            packageInstallReceiver = null
        }
    }

    companion object {
        private val INTERNAL_BROWSER_PREFIXES = listOf(
            "chrome://",
            "chrome-native://",
            "about:",
            "edge://",
            "brave://",
            "opera://",
            "vivaldi://",
            "duckduckgo://",
            "firefox://",
            "file://",
            "content://",
            "data:",
            "blob:",
            "javascript:",
        )

        private val BROWSER_PLACEHOLDER_HINTS = setOf(
            "search or type web address",
            "search or type url",
            "search google or type a url",
            "type a url",
            "search the web",
            "new tab",
        )

        private val TAMPER_SENSITIVE_PACKAGES = setOf(
            "com.android.settings",
            "com.android.packageinstaller",
            "com.google.android.packageinstaller",
            "com.miui.securitycenter",
            "com.samsung.android.lool",
            "com.coloros.safecenter",
            "com.coloros.appmanager",
            "com.oplus.safecenter",
            "com.oneplus.security",
            "com.huawei.systemmanager",
            "com.transsion.phonemanager",
            "com.talpa.hios",
            "com.vivo.permissionmanager",
            "com.iqoo.secure",
        )

        private val KNOWN_BROWSER_PACKAGES = setOf(
            "com.android.chrome",
            "com.chrome.beta",
            "com.chrome.dev",
            "com.chrome.canary",
            "org.mozilla.firefox",
            "org.mozilla.firefox_beta",
            "org.mozilla.focus",
            "com.sec.android.app.sbrowser",
            "com.microsoft.emmx",
            "com.brave.browser",
            "com.opera.browser",
            "com.opera.mini.native",
            "com.duckduckgo.mobile.android",
            "com.vivaldi.browser",
            "com.kiwibrowser.browser",
            "org.chromium.webview_shell",
        )

        private val DEFAULT_URL_BAR_IDS = listOf(
            "com.android.chrome:id/url_bar",
            "com.brave.browser:id/url_bar",
            "com.microsoft.emmx:id/url_bar",
            "com.vivaldi.browser:id/url_bar",
            "com.kiwibrowser.browser:id/url_bar",
        )

        private val BROWSER_URL_BAR_IDS = mapOf(
            "com.android.chrome" to listOf("com.android.chrome:id/url_bar"),
            "com.chrome.beta" to listOf("com.chrome.beta:id/url_bar"),
            "com.chrome.dev" to listOf("com.chrome.dev:id/url_bar"),
            "org.mozilla.firefox" to listOf(
                "org.mozilla.firefox:id/mozac_browser_toolbar_url_view",
                "org.mozilla.firefox:id/url_bar_title",
            ),
            "com.sec.android.app.sbrowser" to listOf(
                "com.sec.android.app.sbrowser:id/location_bar_edit_text",
            ),
            "com.microsoft.emmx" to listOf("com.microsoft.emmx:id/url_bar"),
            "com.brave.browser" to listOf("com.brave.browser:id/url_bar"),
            "com.opera.browser" to listOf("com.opera.browser:id/url_field"),
            "com.duckduckgo.mobile.android" to listOf(
                "com.duckduckgo.mobile.android:id/omnibarTextInput",
            ),
            "com.vivaldi.browser" to listOf("com.vivaldi.browser:id/url_bar"),
            "com.kiwibrowser.browser" to listOf("com.kiwibrowser.browser:id/url_bar"),
        )

        fun isEnabledInSystem(context: Context): Boolean {
            val expected = ComponentName(context, BetBlockerAccessibilityService::class.java)
            val enabledServices = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
            ) ?: return false
            val splitter = TextUtils.SimpleStringSplitter(':')
            splitter.setString(enabledServices)
            while (splitter.hasNext()) {
                val component = ComponentName.unflattenFromString(splitter.next())
                if (component == expected) return true
            }
            return false
        }
    }
}
