package com.example

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Block
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.rounded.Block
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.service.AnchorDeviceAdminReceiver
import com.example.ui.MainViewModel
import com.example.ui.components.GuidedTourOverlay
import com.example.ui.components.LiquidFloatingNavBar
import com.example.ui.components.LiquidGlassBackdrop
import com.example.ui.components.LiquidGlassCard
import com.example.ui.components.LiquidNavItem
import com.example.ui.screens.ActivityScreen
import com.example.ui.screens.BlocklistScreen
import com.example.ui.screens.LockSettingsScreen
import com.example.ui.screens.ShieldScreen
import com.example.ui.theme.AnchorTheme
import kotlinx.coroutines.delay

object AnchorRoutes {
    const val SHIELD = "shield"
    const val BLOCKLIST = "blocklist"
    const val ACTIVITY = "activity"
    const val LOCK = "lock"
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AnchorApp()
        }
    }
}

@Composable
fun AnchorApp(viewModel: MainViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route ?: AnchorRoutes.SHIELD

    var showAccessibilityDisclosure by remember { mutableStateOf(false) }
    var showTimeLockedNotice by remember { mutableStateOf(false) }
    var pendingPinAction by remember { mutableStateOf<((String) -> Unit)?>(null) }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                viewModel.refreshSystemServiceStatus()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    LaunchedEffect(state.statusBannerMessage) {
        if (state.statusBannerMessage != null) {
            delay(2800)
            viewModel.clearBanner()
        }
    }

    val deviceAdminLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult(),
    ) {
        viewModel.refreshSystemServiceStatus()
    }

    fun guardRestrictedAction(action: () -> Unit) {
        when {
            state.isTimeLockedNow -> showTimeLockedNotice = true
            state.settings.hasPin -> pendingPinAction = { _ -> action() }
            else -> action()
        }
    }

    fun requestDeviceAdminToggle() {
        if (state.isDeviceAdminEnabled) {
            guardRestrictedAction { viewModel.deactivateDeviceAdmin() }
        } else {
            deviceAdminLauncher.launch(AnchorDeviceAdminReceiver.buildEnableAdminIntent(context))
        }
    }

    fun openNetworkDnsSettings() {
        val intent = Intent(Settings.ACTION_WIRELESS_SETTINGS)
        if (intent.resolveActivity(context.packageManager) != null) {
            context.startActivity(intent)
        } else {
            context.startActivity(Intent(Settings.ACTION_SETTINGS))
        }
    }

    val navItems = remember {
        listOf(
            LiquidNavItem(
                route = AnchorRoutes.SHIELD,
                label = "Shield",
                activeIcon = Icons.Rounded.Shield,
                inactiveIcon = Icons.Outlined.Shield,
                testTag = "nav_shield",
            ),
            LiquidNavItem(
                route = AnchorRoutes.BLOCKLIST,
                label = "Blocklist",
                activeIcon = Icons.Rounded.Block,
                inactiveIcon = Icons.Outlined.Block,
                testTag = "nav_blocklist",
            ),
            LiquidNavItem(
                route = AnchorRoutes.ACTIVITY,
                label = "Activity",
                activeIcon = Icons.Rounded.History,
                inactiveIcon = Icons.Outlined.History,
                testTag = "nav_activity",
            ),
            LiquidNavItem(
                route = AnchorRoutes.LOCK,
                label = "Lock",
                activeIcon = Icons.Rounded.Lock,
                inactiveIcon = Icons.Outlined.Lock,
                testTag = "nav_lock",
            ),
        )
    }

    AnchorTheme(themeMode = state.settings.themeMode) {
        LiquidGlassBackdrop(isProtected = state.isFullyArmed) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding(),
            ) {
                val navBarReserve = 96.dp

                NavHost(
                    navController = navController,
                    startDestination = AnchorRoutes.SHIELD,
                    modifier = Modifier.fillMaxSize(),
                ) {
                    composable(AnchorRoutes.SHIELD) {
                        ShieldScreen(
                            state = state,
                            onPrimaryShieldClick = {
                                when {
                                    !state.isAccessibilityEnabled -> showAccessibilityDisclosure = true
                                    state.settings.isProtectionEnabled -> guardRestrictedAction {
                                        viewModel.disableProtection()
                                    }
                                    else -> viewModel.enableProtection()
                                }
                            },
                            onEnableAccessibility = { showAccessibilityDisclosure = true },
                            onRequestDeviceAdmin = { requestDeviceAdminToggle() },
                            onOpenPrivateDnsSettings = { openNetworkDnsSettings() },
                            onTestQueryChanged = { viewModel.updateTestQuery(it) },
                            onNavigateToLock = {
                                navController.navigate(AnchorRoutes.LOCK) {
                                    launchSingleTop = true
                                }
                            },
                            bottomContentPadding = navBarReserve,
                        )
                    }

                    composable(AnchorRoutes.BLOCKLIST) {
                        BlocklistScreen(
                            state = state,
                            onToggleCategory = { category, enabled ->
                                if (enabled) {
                                    viewModel.updateCategory(category, true)
                                } else {
                                    guardRestrictedAction { viewModel.updateCategory(category, false) }
                                }
                            },
                            onToggleStrictKeywords = { enabled ->
                                if (enabled) {
                                    viewModel.setStrictKeywordFilter(true)
                                } else {
                                    guardRestrictedAction { viewModel.setStrictKeywordFilter(false) }
                                }
                            },
                            onToggleBrowserShield = { enabled ->
                                if (enabled) {
                                    viewModel.setBrowserShieldEnabled(true)
                                } else {
                                    guardRestrictedAction { viewModel.setBrowserShieldEnabled(false) }
                                }
                            },
                            onToggleAppShield = { enabled ->
                                if (enabled) {
                                    viewModel.setAppShieldEnabled(true)
                                } else {
                                    guardRestrictedAction { viewModel.setAppShieldEnabled(false) }
                                }
                            },
                            onToggleSearchGuard = { enabled ->
                                if (enabled) {
                                    viewModel.setSearchGuardEnabled(true)
                                } else {
                                    guardRestrictedAction { viewModel.setSearchGuardEnabled(false) }
                                }
                            },
                            onAddCustomDomain = { domain, isAllowlist ->
                                if (isAllowlist) {
                                    guardRestrictedAction { viewModel.addCustomDomain(domain, true) }
                                } else {
                                    viewModel.addCustomDomain(domain, false)
                                }
                            },
                            onRemoveCustomDomain = { domain, isAllowlist ->
                                if (isAllowlist) {
                                    viewModel.removeCustomDomain(domain)
                                } else {
                                    guardRestrictedAction { viewModel.removeCustomDomain(domain) }
                                }
                            },
                            onOpenAppPicker = { viewModel.loadInstalledApps() },
                            onAddBlockedApp = { app -> viewModel.addBlockedApp(app) },
                            onRemoveBlockedApp = { pkg ->
                                guardRestrictedAction { viewModel.removeBlockedApp(pkg) }
                            },
                            bottomContentPadding = navBarReserve,
                        )
                    }

                    composable(AnchorRoutes.ACTIVITY) {
                        ActivityScreen(
                            state = state,
                            onClearHistory = {
                                guardRestrictedAction { viewModel.clearEventHistory() }
                            },
                            bottomContentPadding = navBarReserve,
                        )
                    }

                    composable(AnchorRoutes.LOCK) {
                        LockSettingsScreen(
                            state = state,
                            onActivateTimeLock = { days, antiTamper ->
                                viewModel.activateTimeLock(days, antiTamper)
                            },
                            onToggleAntiTamper = { enabled ->
                                if (enabled) {
                                    viewModel.setAntiTamperEnabled(true)
                                } else {
                                    guardRestrictedAction { viewModel.setAntiTamperEnabled(false) }
                                }
                            },
                            onSetPin = { pin -> viewModel.setPin(pin) },
                            onRemovePin = {
                                if (state.isTimeLockedNow) {
                                    showTimeLockedNotice = true
                                } else {
                                    pendingPinAction = { verifiedPin ->
                                        viewModel.clearPin(verifiedPin)
                                    }
                                }
                            },
                            onToggleDeviceAdmin = { requestDeviceAdminToggle() },
                            onOpenPrivateDnsSettings = { openNetworkDnsSettings() },
                            onSetDailySpend = { spend -> viewModel.setDailySpendEstimate(spend) },
                            onSelectTheme = { mode -> viewModel.setThemeMode(mode) },
                            onResetStreak = { viewModel.resetStreak() },
                            onReplayTour = { viewModel.replayTour() },
                            bottomContentPadding = navBarReserve,
                        )
                    }
                }

                // Floating Status Banner
                AnimatedVisibility(
                    visible = state.statusBannerMessage != null,
                    enter = fadeIn(),
                    exit = fadeOut(),
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .padding(horizontal = 20.dp, vertical = 8.dp),
                ) {
                    LiquidGlassCard(
                        cornerRadius = 50.dp,
                        contentPadding = 12.dp,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Rounded.Info,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onBackground,
                                modifier = Modifier.size(18.dp),
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = state.statusBannerMessage.orEmpty(),
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.onBackground,
                            )
                        }
                    }
                }

                // Floating Liquid Glass Navigation Bar
                LiquidFloatingNavBar(
                    items = navItems,
                    selectedRoute = currentRoute,
                    onSelect = { route ->
                        if (route != currentRoute) {
                            navController.navigate(route) {
                                popUpTo(AnchorRoutes.SHIELD) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    },
                    modifier = Modifier.align(Alignment.BottomCenter),
                )

                // Automatic First-Launch Guided Tour
                AnimatedVisibility(
                    visible = !state.settings.hasCompletedTour,
                    enter = fadeIn(),
                    exit = fadeOut(),
                ) {
                    GuidedTourOverlay(
                        onDismissTour = { viewModel.completeTour() },
                        onFinishAndEnableShield = {
                            viewModel.completeTour()
                            if (!state.isAccessibilityEnabled) {
                                showAccessibilityDisclosure = true
                            }
                        },
                    )
                }
            }
        }
    }

    if (showAccessibilityDisclosure) {
        AlertDialog(
            onDismissRequest = { showAccessibilityDisclosure = false },
            title = { Text("Enable GambleAware Shield") },
            text = {
                Text(
                    "GambleAware (by Imoogle Technology) uses Android Accessibility Service strictly on your device to:\n\n" +
                        "1. Block gambling websites, search queries, Custom Tabs, and in-app WebViews across browsers.\n" +
                        "2. Detect and close installed betting apps immediately.\n" +
                        "3. Enforce your Commitment Lock & prevent uninstalling GambleAware until your timer ends.\n\n" +
                        "No VPN is used, and zero personal data or browsing history leaves your phone.",
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showAccessibilityDisclosure = false
                        context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
                    },
                    modifier = Modifier.testTag("confirm_open_accessibility_settings"),
                ) {
                    Text("Open Settings")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAccessibilityDisclosure = false }) {
                    Text("Later")
                }
            },
        )
    }

    if (showTimeLockedNotice) {
        AlertDialog(
            onDismissRequest = { showTimeLockedNotice = false },
            title = { Text("Commitment Lock Active") },
            text = {
                Text(
                    "This control is protected by your GambleAware Commitment Lock (${state.lockCountdownFormatted} remaining). Uninstalling, pausing protection, or weakening blocklists stays locked until the timer completes.",
                )
            },
            confirmButton = {
                Button(onClick = { showTimeLockedNotice = false }) {
                    Text("Understood")
                }
            },
        )
    }

    if (pendingPinAction != null) {
        var pinAttempt by remember { mutableStateOf("") }
        var pinError by remember { mutableStateOf<String?>(null) }

        AlertDialog(
            onDismissRequest = { pendingPinAction = null },
            title = { Text("Enter Accountability PIN") },
            text = {
                Column {
                    Text(
                        text = "Enter your 4-digit Accountability PIN to authorize this change.",
                        style = MaterialTheme.typography.bodySmall,
                    )
                    OutlinedTextField(
                        value = pinAttempt,
                        onValueChange = { if (it.length <= 4 && it.all(Char::isDigit)) pinAttempt = it },
                        label = { Text("4-Digit PIN") },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 10.dp)
                            .testTag("verify_pin_input"),
                    )
                    if (pinError != null) {
                        Text(
                            text = pinError!!,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 6.dp),
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (viewModel.verifyPin(pinAttempt)) {
                            val action = pendingPinAction
                            pendingPinAction = null
                            action?.invoke(pinAttempt)
                        } else {
                            pinError = "Incorrect PIN"
                        }
                    },
                    modifier = Modifier.testTag("confirm_pin_action"),
                ) {
                    Text("Unlock")
                }
            },
            dismissButton = {
                TextButton(onClick = { pendingPinAction = null }) {
                    Text("Cancel")
                }
            },
        )
    }
}
