package com.example

import android.Manifest
import android.app.admin.DevicePolicyManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.outlined.Block
import androidx.compose.material.icons.outlined.Insights
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.rounded.AdminPanelSettings
import androidx.compose.material.icons.rounded.Block
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.FavoriteBorder
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Insights
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.RadioButtonUnchecked
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.Timer
import androidx.compose.material.icons.rounded.VerifiedUser
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.service.GambleAwareAccessibilityService
import com.example.service.GambleAwareDeviceAdminReceiver
import com.example.service.GambleAwareNotifications
import com.example.ui.BlockedInterventionActivity
import com.example.ui.MainUiState
import com.example.ui.MainViewModel
import com.example.ui.buildCleanStreakShareText
import com.example.ui.components.BrandGEmblem
import com.example.ui.components.LiquidFloatingNavBar
import com.example.ui.components.LiquidGlassBackdrop
import com.example.ui.components.LiquidGlassCard
import com.example.ui.components.LiquidNavItem
import com.example.ui.components.LocalTourTargets
import com.example.ui.components.SPOTLIGHT_TOUR_STEPS
import com.example.ui.components.SpotlightTourOverlay
import com.example.ui.components.SpotlightTourStep
import com.example.ui.components.TourTargetKeys
import com.example.ui.components.TourTargetRegistry
import com.example.ui.screens.ActivityScreen
import com.example.ui.screens.BlocklistScreen
import com.example.ui.screens.LockSettingsScreen
import com.example.ui.screens.ShieldScreen
import com.example.ui.theme.AnchorTheme
import com.example.ui.theme.LiquidDialogContent
import com.example.ui.theme.LocalLiquidColors
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

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun AnchorApp(viewModel: MainViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route ?: AnchorRoutes.SHIELD

    val tourRegistry = remember { TourTargetRegistry() }
    var tourSessionId by remember { mutableIntStateOf(0) }
    var activeTourStep by remember { mutableStateOf<SpotlightTourStep?>(SPOTLIGHT_TOUR_STEPS.first()) }

    var showShieldDisclosure by remember { mutableStateOf(false) }
    var showTimeLockedNotice by remember { mutableStateOf(false) }
    var pendingPinAction by remember { mutableStateOf<((String) -> Unit)?>(null) }
    var showUrgeJournalSheet by remember { mutableStateOf(false) }
    var showSafeSupportSheet by remember { mutableStateOf(false) }
    var showPreloader by rememberSaveable { mutableStateOf(true) }
    var hasNotificationPermission by remember {
        mutableStateOf(GambleAwareNotifications.hasNotificationPermission(context))
    }

    LaunchedEffect(showPreloader) {
        if (showPreloader) {
            delay(620)
            showPreloader = false
        }
    }

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
    ) { granted ->
        hasNotificationPermission = granted || GambleAwareNotifications.hasNotificationPermission(context)
        if (granted) {
            viewModel.setNotificationsEnabled(true)
        }
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                viewModel.refreshSystemServiceStatus()
                hasNotificationPermission = GambleAwareNotifications.hasNotificationPermission(context)
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

    val activeTourKey = if (state.settings.hasCompletedInitialSetup && !state.settings.hasCompletedTour) {
        activeTourStep?.targetKey
    } else {
        null
    }

    LaunchedEffect(activeTourStep, state.settings.hasCompletedInitialSetup, state.settings.hasCompletedTour) {
        if (state.settings.hasCompletedInitialSetup && !state.settings.hasCompletedTour) {
            val step = activeTourStep ?: return@LaunchedEffect
            if (currentRoute != step.route) {
                navController.navigate(step.route) {
                    popUpTo(AnchorRoutes.SHIELD) { saveState = true }
                    launchSingleTop = true
                    restoreState = true
                }
            }
            if (step.targetKey == TourTargetKeys.FILTER_TESTER && state.testQueryInput.isBlank()) {
                viewModel.updateTestQuery("sportybet")
            }
        }
    }

    val deviceAdminLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult(),
    ) {
        viewModel.refreshSystemServiceStatus()
    }

    fun handleDeviceAdminLockToggle() {
        if (state.isDeviceAdminEnabled) {
            viewModel.deactivateDeviceAdmin()
        } else {
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                putExtra(
                    DevicePolicyManager.EXTRA_DEVICE_ADMIN,
                    GambleAwareDeviceAdminReceiver.componentName(context),
                )
                putExtra(
                    DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                    "Prevents impulsive uninstallation of GambleAware while your recovery Commitment Lock is active.",
                )
            }
            deviceAdminLauncher.launch(intent)
        }
    }

    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        if (intent.resolveActivity(context.packageManager) != null) {
            context.startActivity(intent)
        } else {
            context.startActivity(Intent(Settings.ACTION_SETTINGS))
        }
    }

    fun guardRestrictedAction(action: () -> Unit) {
        when {
            state.isTimeLockedNow -> showTimeLockedNotice = true
            state.settings.hasPin -> pendingPinAction = { _ -> action() }
            else -> action()
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

    fun launchSosCalmReset() {
        val intent = Intent(context, BlockedInterventionActivity::class.java).apply {
            putExtra(BlockedInterventionActivity.EXTRA_TARGET, "60s SOS Calm Reset")
            putExtra(BlockedInterventionActivity.EXTRA_SOURCE, "Urge Reset Toolkit")
            putExtra(BlockedInterventionActivity.EXTRA_CATEGORY, "Urge Reset")
            putExtra(BlockedInterventionActivity.EXTRA_START_BREATHING, true)
        }
        context.startActivity(intent)
    }

    fun handleToggleNotifications(enabled: Boolean) {
        if (enabled && !hasNotificationPermission && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            viewModel.setNotificationsEnabled(enabled)
        }
    }

    fun handleSendTestNotification() {
        if (!hasNotificationPermission && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            viewModel.sendTestNotification()
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
                label = "Progress",
                activeIcon = Icons.Rounded.Insights,
                inactiveIcon = Icons.Outlined.Insights,
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
        val liquid = LocalLiquidColors.current
        CompositionLocalProvider(LocalTourTargets provides tourRegistry) {
            LiquidGlassBackdrop(isProtected = state.isFullyArmed) {
                if (!state.settings.hasCompletedInitialSetup) {
                    MandatoryThreeStepSetupScreen(
                        state = state,
                        hasNotificationPermission = hasNotificationPermission,
                        onEnableAccessibilityShield = { showShieldDisclosure = true },
                        onEnableDeviceAdmin = { handleDeviceAdminLockToggle() },
                        onRequestNotifications = { handleToggleNotifications(true) },
                        onCompleteSetup = { name, days ->
                            viewModel.completeInitialSetup(name, days, enableProtection = state.isAccessibilityEnabled)
                        },
                        onSkipSetup = { viewModel.skipInitialSetup() },
                    )
                } else {
                    Box(modifier = Modifier.fillMaxSize()) {
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
                                                !state.isAccessibilityEnabled -> showShieldDisclosure = true
                                                state.settings.isProtectionEnabled -> guardRestrictedAction {
                                                    viewModel.disableProtection()
                                                }
                                                else -> viewModel.enableProtection()
                                            }
                                        },
                                        onEnableAccessibilityShield = { showShieldDisclosure = true },
                                        onEnableDeviceAdmin = { handleDeviceAdminLockToggle() },
                                        onOpenPrivateDnsSettings = { openNetworkDnsSettings() },
                                        onTestQueryChanged = { viewModel.updateTestQuery(it) },
                                        onNavigateToBlocklist = {
                                            navController.navigate(AnchorRoutes.BLOCKLIST) {
                                                popUpTo(AnchorRoutes.SHIELD) { saveState = true }
                                                launchSingleTop = true
                                                restoreState = true
                                            }
                                        },
                                        onNavigateToActivity = {
                                            navController.navigate(AnchorRoutes.ACTIVITY) {
                                                popUpTo(AnchorRoutes.SHIELD) { saveState = true }
                                                launchSingleTop = true
                                                restoreState = true
                                            }
                                        },
                                        onNavigateToLock = {
                                            navController.navigate(AnchorRoutes.LOCK) {
                                                popUpTo(AnchorRoutes.SHIELD) { saveState = true }
                                                launchSingleTop = true
                                                restoreState = true
                                            }
                                        },
                                        onLaunchCalmReset = { launchSosCalmReset() },
                                        onOpenUrgeJournal = { showUrgeJournalSheet = true },
                                        onOpenSafeSupport = { showSafeSupportSheet = true },
                                        onBankUrgeStake = { stakeNgn -> viewModel.bankUrgeStake(stakeNgn) },
                                        activeTourKey = activeTourKey,
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
                                    onToggleAdBlocker = { enabled ->
                                        if (enabled) {
                                            viewModel.setAdBlockerEnabled(true)
                                        } else {
                                            guardRestrictedAction { viewModel.setAdBlockerEnabled(false) }
                                        }
                                    },
                                    onToggleDepositGuard = { enabled ->
                                        if (enabled) {
                                            viewModel.setDepositGuardEnabled(true)
                                        } else {
                                            guardRestrictedAction { viewModel.setDepositGuardEnabled(false) }
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
                                    activeTourKey = activeTourKey,
                                    bottomContentPadding = navBarReserve,
                                )
                            }

                            composable(AnchorRoutes.ACTIVITY) {
                                ActivityScreen(
                                    state = state,
                                    onClearHistory = {
                                        guardRestrictedAction { viewModel.clearEventHistory() }
                                    },
                                    onShareStreak = {
                                        val shareText = buildCleanStreakShareText(state)
                                        val dayWord = if (state.cleanDays == 1) "day" else "days"
                                        val sendIntent = Intent(Intent.ACTION_SEND).apply {
                                            type = "text/plain"
                                            putExtra(
                                                Intent.EXTRA_SUBJECT,
                                                "GambleAware Clean Streak: ${state.cleanDays} $dayWord betting-free",
                                            )
                                            putExtra(Intent.EXTRA_TEXT, shareText)
                                        }
                                        context.startActivity(
                                            Intent.createChooser(sendIntent, "Share clean streak"),
                                        )
                                    },
                                    onLaunchCalmReset = { launchSosCalmReset() },
                                    onOpenUrgeJournal = { showUrgeJournalSheet = true },
                                    activeTourKey = activeTourKey,
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
                                    onOpenPrivateDnsSettings = { openNetworkDnsSettings() },
                                    onOpenAccessibilitySettings = { openAccessibilitySettings() },
                                    onSetDailySpend = { spend -> viewModel.setDailySpendEstimate(spend) },
                                    onSelectTheme = { mode -> viewModel.setThemeMode(mode) },
                                    onResetStreak = { viewModel.resetStreak() },
                                    onReplayTour = {
                                        tourSessionId += 1
                                        activeTourStep = SPOTLIGHT_TOUR_STEPS.first()
                                        viewModel.replayTour()
                                    },
                                    hasNotificationPermission = hasNotificationPermission,
                                    onToggleNotifications = { enabled -> handleToggleNotifications(enabled) },
                                    onSendTestNotification = { handleSendTestNotification() },
                                    onToggleDeviceAdminLock = { handleDeviceAdminLockToggle() },
                                    onConfigureBuddyCoLock = { partnerName -> viewModel.configureBuddyCoLock(partnerName) },
                                    onClearBuddyCoLock = {
                                        guardRestrictedAction { viewModel.clearBuddyCoLock() }
                                    },
                                    onVerifyBuddyUnlock = { salt, token -> viewModel.verifyBuddyUnlock(salt, token) },
                                    activeTourKey = activeTourKey,
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
                                        tint = liquid.accentInk,
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
                    }

                    // Automatic Auto-Selecting Spotlight In-App Tour (placed in full root coordinate space)
                    AnimatedVisibility(
                        visible = state.settings.hasCompletedInitialSetup && !state.settings.hasCompletedTour,
                        enter = fadeIn(),
                        exit = fadeOut(),
                    ) {
                        key(tourSessionId) {
                            SpotlightTourOverlay(
                                tourRegistry = tourRegistry,
                                onSelectStep = { step -> activeTourStep = step },
                                onDismissTour = { viewModel.completeTour() },
                                onFinishAndEnableShield = {
                                    viewModel.completeTour()
                                    if (!state.isAccessibilityEnabled || !state.isShieldServiceRunning) {
                                        showShieldDisclosure = true
                                    }
                                },
                            )
                        }
                    }
                }

                AnimatedVisibility(
                    visible = showPreloader,
                    enter = fadeIn(),
                    exit = fadeOut(animationSpec = tween(320)),
                ) {
                    AppPreloaderOverlay(onDismiss = { showPreloader = false })
                }
            }

            if (showUrgeJournalSheet) {
                val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
                val triggerOptions = listOf("Matchday", "Boredom", "Stress", "Promo Ad", "Late Night", "Payday")
                var selectedTrigger by remember { mutableStateOf(triggerOptions.first()) }
                var urgeNote by remember { mutableStateOf("") }

                ModalBottomSheet(
                    onDismissRequest = { showUrgeJournalSheet = false },
                    sheetState = sheetState,
                    containerColor = MaterialTheme.colorScheme.surface,
                    contentColor = MaterialTheme.colorScheme.onSurface,
                    tonalElevation = 0.dp,
                ) {
                    LiquidDialogContent(themeMode = state.settings.themeMode) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp)
                            .padding(bottom = 28.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Rounded.CheckCircle,
                                contentDescription = null,
                                tint = liquid.accentInk,
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Log a Resisted Urge",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface,
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Every craving you notice and let pass strengthens your recovery.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "What triggered the urge?",
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            triggerOptions.forEach { trigger ->
                                val selected = selectedTrigger == trigger
                                LiquidGlassCard(
                                    cornerRadius = 50.dp,
                                    fillColor = if (selected) liquid.activeFill else liquid.mutedFill,
                                    borderColor = if (selected) liquid.activeFill else liquid.subtleBorder,
                                    contentPadding = 0.dp,
                                    onClick = { selectedTrigger = trigger },
                                    modifier = Modifier.testTag("urge_trigger_$trigger"),
                                ) {
                                    Text(
                                        text = trigger,
                                        style = MaterialTheme.typography.labelMedium,
                                        color = if (selected) liquid.activeContent else liquid.mutedContent,
                                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp),
                                    )
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(14.dp))
                        OutlinedTextField(
                            value = urgeNote,
                            onValueChange = { urgeNote = it },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("urge_note_input"),
                            placeholder = { Text("Optional note (e.g. walked away during halftime)") },
                            singleLine = true,
                            shape = RoundedCornerShape(16.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = liquid.activeFill,
                                unfocusedBorderColor = liquid.subtleBorder,
                                focusedLabelColor = liquid.accentInk,
                                cursorColor = liquid.activeFill,
                                focusedTextColor = MaterialTheme.colorScheme.onSurface,
                                unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                                focusedPlaceholderColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                unfocusedPlaceholderColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            ),
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = {
                                viewModel.logUrgeResisted(selectedTrigger, urgeNote)
                                showUrgeJournalSheet = false
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .testTag("save_urge_victory_button"),
                            shape = RoundedCornerShape(50),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = liquid.activeFill,
                                contentColor = liquid.activeContent,
                            ),
                            elevation = ButtonDefaults.buttonElevation(0.dp, 0.dp),
                        ) {
                            Text("Save Resisted Victory")
                        }
                    }
                    }
                }
            }

            if (showSafeSupportSheet) {
                val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
                val supportLinks = listOf(
                    Triple("Mentally Aware Nigeria (MANI)", "Confidential Nigerian support & counselling", "https://mentallyaware.org"),
                    Triple("NLRC Responsible Gaming", "National Lottery Regulatory Commission Nigeria", "https://nlrc-gov.ng"),
                    Triple("LSLGA Responsible Gaming", "Lagos State Lotteries & Gaming Authority", "https://lslga.lg.gov.ng"),
                    Triple("GambleAware Support", "Confidential guidance to stay betting-free", "https://www.begambleaware.org"),
                    Triple("Gamblers Anonymous", "Peer support groups & meetings worldwide", "https://www.gamblersanonymous.org"),
                )

                ModalBottomSheet(
                    onDismissRequest = { showSafeSupportSheet = false },
                    sheetState = sheetState,
                    containerColor = MaterialTheme.colorScheme.surface,
                    contentColor = MaterialTheme.colorScheme.onSurface,
                    tonalElevation = 0.dp,
                ) {
                    LiquidDialogContent(themeMode = state.settings.themeMode) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp)
                            .padding(bottom = 28.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Rounded.FavoriteBorder,
                                contentDescription = null,
                                tint = liquid.accentInk,
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Confidential Recovery Support",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface,
                            )
                        }
                        Text(
                            text = "These trusted recovery websites are always allowlisted by GambleAware's safe-support guard.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        supportLinks.forEach { (title, subtitle, url) ->
                            LiquidGlassCard(
                                cornerRadius = 18.dp,
                                fillColor = liquid.mutedFill,
                                borderColor = liquid.subtleBorder,
                                contentPadding = 14.dp,
                                onClick = {
                                    runCatching {
                                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                                    }
                                },
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = title,
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.SemiBold,
                                            color = liquid.mutedContent,
                                        )
                                        Text(
                                            text = subtitle,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Rounded.OpenInNew,
                                        contentDescription = "Open $title",
                                        modifier = Modifier.size(18.dp),
                                        tint = liquid.accentInk,
                                    )
                                }
                            }
                        }
                    }
                    }
                }
            }

            if (showShieldDisclosure) {
                AlertDialog(
                    onDismissRequest = { showShieldDisclosure = false },
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    textContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    shape = RoundedCornerShape(26.dp),
                    title = {
                        LiquidDialogContent(themeMode = state.settings.themeMode) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                BrandGEmblem(modifier = Modifier.size(32.dp))
                                Text(
                                    text = "Activate All-Browser & Ad Shield",
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface,
                                )
                            }
                        }
                    },
                    text = {
                        LiquidDialogContent(themeMode = state.settings.themeMode) {
                            Text(
                                text = "GambleAware uses Android AccessibilityService (with zero VPN required, so ProtonVPN, Mullvad, NordVPN & WARP still work normally) to:\n\n" +
                                    "1. Detect SportyBet, Bet9ja, Bet365, 1xBet, Stake & 820+ gambling brands while typing across 20+ browsers & social WebViews.\n" +
                                    "2. Block gambling apps, popunder ads & affiliate redirect links in real time.\n" +
                                    "3. Block Uninstall, Force Stop & Device Admin deactivation screens while your Commitment Lock is active.\n\n" +
                                    "All inspection stays strictly on-device — never logging messages, passwords, or banking apps.",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    },
                    confirmButton = {
                        Button(
                            onClick = {
                                showShieldDisclosure = false
                                openAccessibilitySettings()
                            },
                            shape = RoundedCornerShape(50),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = liquid.activeFill,
                                contentColor = liquid.activeContent,
                            ),
                            elevation = ButtonDefaults.buttonElevation(0.dp, 0.dp),
                            modifier = Modifier.testTag("confirm_enable_accessibility_shield"),
                        ) {
                            Text("Open Accessibility Settings")
                        }
                    },
                    dismissButton = {
                        TextButton(
                            onClick = { showShieldDisclosure = false },
                            colors = ButtonDefaults.textButtonColors(contentColor = liquid.accentInk),
                        ) {
                            Text("Later")
                        }
                    },
                )
            }

            if (showTimeLockedNotice) {
                AlertDialog(
                    onDismissRequest = { showTimeLockedNotice = false },
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    textContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    shape = RoundedCornerShape(26.dp),
                    title = {
                        LiquidDialogContent(themeMode = state.settings.themeMode) {
                            Text(
                                text = "Commitment Lock Active",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface,
                            )
                        }
                    },
                    text = {
                        LiquidDialogContent(themeMode = state.settings.themeMode) {
                            Text(
                                text = "This control is protected by your GambleAware Commitment Lock (${state.lockCountdownFormatted} remaining). Uninstalling, pausing protection, or weakening blocklists stays locked until the timer completes.",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    },
                    confirmButton = {
                        Button(
                            onClick = { showTimeLockedNotice = false },
                            shape = RoundedCornerShape(50),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = liquid.activeFill,
                                contentColor = liquid.activeContent,
                            ),
                            elevation = ButtonDefaults.buttonElevation(0.dp, 0.dp),
                        ) {
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
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    textContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    shape = RoundedCornerShape(26.dp),
                    title = {
                        LiquidDialogContent(themeMode = state.settings.themeMode) {
                            Text(
                                text = "Enter Accountability PIN",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface,
                            )
                        }
                    },
                    text = {
                        LiquidDialogContent(themeMode = state.settings.themeMode) {
                            Column {
                                Text(
                                    text = "Enter your 4-digit Accountability PIN to authorize this change.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                                OutlinedTextField(
                                    value = pinAttempt,
                                    onValueChange = {
                                        if (it.length <= 4 && it.all(Char::isDigit)) {
                                            pinAttempt = it
                                            pinError = null
                                        }
                                    },
                                    label = { Text("4-Digit PIN") },
                                    singleLine = true,
                                    visualTransformation = PasswordVisualTransformation(),
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = liquid.activeFill,
                                        unfocusedBorderColor = liquid.subtleBorder,
                                        focusedLabelColor = liquid.accentInk,
                                        unfocusedLabelColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                        cursorColor = liquid.activeFill,
                                        focusedTextColor = MaterialTheme.colorScheme.onSurface,
                                        unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                                    ),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(top = 12.dp)
                                        .testTag("verify_pin_input"),
                                )
                                if (pinError != null) {
                                    Text(
                                        text = pinError!!,
                                        color = liquid.accentInk,
                                        style = MaterialTheme.typography.bodySmall,
                                        fontWeight = FontWeight.Medium,
                                        modifier = Modifier.padding(top = 6.dp),
                                    )
                                }
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
                            shape = RoundedCornerShape(50),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = liquid.activeFill,
                                contentColor = liquid.activeContent,
                            ),
                            elevation = ButtonDefaults.buttonElevation(0.dp, 0.dp),
                            modifier = Modifier.testTag("confirm_pin_action"),
                        ) {
                            Text("Unlock")
                        }
                    },
                    dismissButton = {
                        TextButton(
                            onClick = { pendingPinAction = null },
                            colors = ButtonDefaults.textButtonColors(contentColor = liquid.accentInk),
                        ) {
                            Text("Cancel")
                        }
                    },
                )
            }
            }
        }
    }
}

@Composable
private fun AppPreloaderOverlay(
    onDismiss: () -> Unit,
) {
    val liquid = LocalLiquidColors.current
    val infiniteTransition = rememberInfiniteTransition(label = "preloader_ring")
    val sweepAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "preloader_sweep_angle",
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .safeDrawingPadding(),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(24.dp),
        ) {
            Box(
                modifier = Modifier.size(124.dp),
                contentAlignment = Alignment.Center,
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val strokePx = 2.4.dp.toPx()
                    drawCircle(
                        color = liquid.subtleBorder.copy(alpha = 0.55f),
                        style = Stroke(width = 1.2.dp.toPx()),
                    )
                    drawArc(
                        color = liquid.activeFill,
                        startAngle = sweepAngle - 90f,
                        sweepAngle = 115f,
                        useCenter = false,
                        style = Stroke(width = strokePx, cap = StrokeCap.Round),
                    )
                }
                LiquidGlassCard(
                    cornerRadius = 24.dp,
                    contentPadding = 12.dp,
                ) {
                    BrandGEmblem(modifier = Modifier.size(58.dp))
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "GambleAware",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "On-device recovery & betting shield",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.height(14.dp))
            TextButton(
                onClick = onDismiss,
                colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.onSurfaceVariant),
            ) {
                Text("Continue")
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun MandatoryThreeStepSetupScreen(
    state: MainUiState,
    hasNotificationPermission: Boolean,
    onEnableAccessibilityShield: () -> Unit,
    onEnableDeviceAdmin: () -> Unit,
    onRequestNotifications: () -> Unit,
    onCompleteSetup: (name: String, lockDays: Int) -> Unit,
    onSkipSetup: () -> Unit,
) {
    val liquid = LocalLiquidColors.current
    var setupName by remember { mutableStateOf(state.settings.preferredName) }
    var setupLockDays by remember { mutableIntStateOf(0) }
    var showVisualGuide by remember { mutableStateOf(false) }
    val scrollState = rememberScrollState()

    val step1Done = state.isAccessibilityEnabled || state.isShieldServiceRunning
    val stepAdminDone = state.isDeviceAdminEnabled
    val step2Done = hasNotificationPermission
    val step3Ready = setupLockDays > 0

    val durationAdjective = when (setupLockDays) {
        0 -> ""
        1 -> "24-Hour"
        180 -> "6-Month"
        365 -> "1-Year"
        730 -> "2-Year"
        else -> "${setupLockDays}-Day"
    }

    val durationLabel = when (setupLockDays) {
        0 -> "No Lock (Decide Later)"
        1 -> "24 Hours"
        180 -> "6 Months"
        365 -> "1 Year"
        730 -> "2 Years"
        else -> "$setupLockDays Days"
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .safeDrawingPadding()
            .padding(horizontal = 18.dp, vertical = 14.dp),
        contentAlignment = Alignment.Center,
    ) {
        LiquidGlassCard(
            modifier = Modifier
                .widthIn(max = 520.dp)
                .fillMaxWidth()
                .verticalScroll(scrollState)
                .testTag("mandatory_setup_gate"),
            cornerRadius = 28.dp,
            contentPadding = 22.dp,
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                BrandGEmblem(modifier = Modifier.size(40.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "100% FREE • ZERO-VPN SETUP",
                        style = MaterialTheme.typography.labelSmall,
                        letterSpacing = 1.sp,
                        color = liquid.accentInk,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = "Set Up GambleAware Shield",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Blocks 1,035+ betting domains & apps across every browser without using your VPN slot. Complete these quick steps or skip to explore first.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(14.dp))

            OutlinedTextField(
                value = setupName,
                onValueChange = { setupName = it.take(40) },
                label = { Text("First Name (Optional)") },
                placeholder = { Text("Personalize your shield greeting") },
                singleLine = true,
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = liquid.activeFill,
                    unfocusedBorderColor = liquid.subtleBorder,
                    focusedLabelColor = liquid.accentInk,
                    unfocusedLabelColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    cursorColor = liquid.activeFill,
                    focusedTextColor = MaterialTheme.colorScheme.onSurface,
                    unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("initial_setup_name_input"),
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Step 1 (All-Browser & Ad Shield — Zero VPN)
            MandatorySetupStepCard(
                step = "1",
                title = "Enable All-Browser Accessibility Shield",
                subtitle = if (step1Done) {
                    "Active • Blocks sites, popunders & betting apps (VPN-free)"
                } else {
                    "Tap to grant Accessibility permission (no VPN slot required)"
                },
                done = step1Done,
                onClick = onEnableAccessibilityShield,
                testTag = "onboarding_step_shield",
            )

            Spacer(modifier = Modifier.height(6.dp))

            // Collapsible Visual Accessibility Walkthrough (Surpasses Gamban's visual helper)
            TextButton(
                onClick = { showVisualGuide = !showVisualGuide },
                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 2.dp),
            ) {
                Text(
                    text = if (showVisualGuide) "Hide Accessibility Step-by-Step Guide" else "How to enable Accessibility (3 quick taps)",
                    style = MaterialTheme.typography.labelMedium,
                    color = liquid.accentInk,
                    fontWeight = FontWeight.SemiBold,
                )
            }

            if (showVisualGuide) {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    cornerRadius = 16.dp,
                    fillColor = liquid.controlFill,
                    borderColor = liquid.subtleBorder,
                    contentPadding = 14.dp,
                ) {
                    Text(
                        text = "1. Open Android Accessibility Settings.\n2. Select Installed Apps → GambleAware.\n3. Switch ON \"Use GambleAware\" and tap Allow.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Device Admin Uninstall Guard
            MandatorySetupStepCard(
                step = "2",
                title = "Arm Device Admin Uninstall Lock",
                subtitle = if (stepAdminDone) {
                    "Armed • Impulsive uninstalls are blocked during lock periods"
                } else {
                    "Optional: tap to prevent impulsive deletion of GambleAware"
                },
                done = stepAdminDone,
                onClick = onEnableDeviceAdmin,
                testTag = "onboarding_step_device_admin",
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Alerts & Install Guard
            MandatorySetupStepCard(
                step = "3",
                title = "Recovery Alerts & Install Guard",
                subtitle = if (step2Done) {
                    "Enabled • Alerts on new betting APK installs & milestones"
                } else {
                    "Optional: tap to allow alert & install-guard notifications"
                },
                done = step2Done,
                onClick = onRequestNotifications,
                testTag = "onboarding_step_alerts",
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Step 3 (Optional Commitment Lock Duration)
            LiquidGlassCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("onboarding_step_timer"),
                cornerRadius = 18.dp,
                fillColor = if (step3Ready) liquid.mutedFill else liquid.controlFill,
                borderColor = if (step3Ready) liquid.activeFill else liquid.subtleBorder,
                contentPadding = 14.dp,
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(CircleShape)
                            .background(if (step3Ready) liquid.activeFill else liquid.controlFill)
                            .border(1.dp, if (step3Ready) liquid.activeFill else liquid.subtleBorder, CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = "4",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = if (step3Ready) liquid.activeContent else MaterialTheme.colorScheme.onBackground,
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Commitment Lock Timer (Optional)",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onBackground,
                        )
                        Text(
                            text = if (setupLockDays > 0) {
                                "Selected: $durationLabel • Locks weakening until timer hits 0"
                            } else {
                                "Selected: No Lock • Decide anytime in Lock settings"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Icon(
                        imageVector = if (step3Ready) Icons.Rounded.CheckCircle else Icons.Rounded.Timer,
                        contentDescription = null,
                        tint = if (step3Ready) liquid.activeFill else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp),
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    listOf(
                        0 to "No Lock (Decide Later)",
                        1 to "24 Hours",
                        7 to "7 Days",
                        30 to "30 Days",
                        90 to "90 Days",
                        180 to "6 Months",
                        365 to "1 Year",
                        730 to "2 Years",
                    ).forEach { (days, label) ->
                        val selected = setupLockDays == days
                        LiquidGlassCard(
                            cornerRadius = 50.dp,
                            fillColor = if (selected) liquid.activeFill else liquid.controlFill,
                            borderColor = if (selected) liquid.activeFill else liquid.subtleBorder,
                            contentPadding = 0.dp,
                            onClick = { setupLockDays = days },
                        ) {
                            Text(
                                text = label,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
                                color = if (selected) liquid.activeContent else MaterialTheme.colorScheme.onBackground,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = { onCompleteSetup(setupName, setupLockDays) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .testTag("initial_setup_confirm_button"),
                shape = RoundedCornerShape(50),
                colors = ButtonDefaults.buttonColors(
                    containerColor = liquid.activeFill,
                    contentColor = liquid.activeContent,
                ),
                elevation = ButtonDefaults.buttonElevation(0.dp, 0.dp),
            ) {
                Icon(
                    imageVector = if (setupLockDays > 0) Icons.Rounded.Lock else Icons.Rounded.Shield,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (setupLockDays > 0) {
                        "Save & Arm $durationAdjective Lock"
                    } else {
                        "Save Preferences & Enter App"
                    },
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                    textAlign = TextAlign.Center,
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedButton(
                onClick = onSkipSetup,
                shape = RoundedCornerShape(50),
                border = BorderStroke(1.dp, liquid.subtleBorder),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(44.dp)
                    .testTag("initial_setup_skip_button"),
            ) {
                Text(
                    text = "Skip for Now — Explore App First",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
}

@Composable
private fun MandatorySetupStepCard(
    step: String,
    title: String,
    subtitle: String,
    done: Boolean,
    onClick: () -> Unit,
    testTag: String,
) {
    val liquid = LocalLiquidColors.current
    LiquidGlassCard(
        modifier = Modifier
            .fillMaxWidth()
            .testTag(testTag),
        cornerRadius = 18.dp,
        fillColor = if (done) liquid.mutedFill else liquid.controlFill,
        borderColor = if (done) liquid.activeFill else liquid.subtleBorder,
        contentPadding = 14.dp,
        onClick = onClick,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(if (done) liquid.activeFill else liquid.controlFill)
                    .border(1.dp, if (done) liquid.activeFill else liquid.subtleBorder, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = step,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = if (done) liquid.activeContent else MaterialTheme.colorScheme.onBackground,
                )
            }
            Spacer(modifier = Modifier.width(10.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onBackground,
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Icon(
                imageVector = if (done) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked,
                contentDescription = if (done) "Completed" else "Pending",
                tint = if (done) liquid.activeFill else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(20.dp),
            )
        }
    }
}
