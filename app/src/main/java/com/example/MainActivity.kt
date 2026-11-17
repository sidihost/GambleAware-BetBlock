package com.example

import android.Manifest
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
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.outlined.Block
import androidx.compose.material.icons.outlined.Insights
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.rounded.Block
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.FavoriteBorder
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Insights
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
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
import com.example.service.GambleAwareNotifications
import com.example.ui.BlockedInterventionActivity
import com.example.ui.MainViewModel
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

    var showAccessibilityDisclosure by remember { mutableStateOf(false) }
    var showTimeLockedNotice by remember { mutableStateOf(false) }
    var pendingPinAction by remember { mutableStateOf<((String) -> Unit)?>(null) }
    var showUrgeJournalSheet by remember { mutableStateOf(false) }
    var showSafeSupportSheet by remember { mutableStateOf(false) }
    var hasNotificationPermission by remember {
        mutableStateOf(GambleAwareNotifications.hasNotificationPermission(context))
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

    val activeTourKey = if (!state.settings.hasCompletedTour) activeTourStep?.targetKey else null

    LaunchedEffect(activeTourStep, state.settings.hasCompletedTour) {
        if (!state.settings.hasCompletedTour) {
            val step = activeTourStep ?: return@LaunchedEffect
            if (currentRoute != step.route) {
                navController.navigate(step.route) {
                    popUpTo(AnchorRoutes.SHIELD) { saveState = true }
                    launchSingleTop = true
                    restoreState = true
                }
            }
            if (step.targetKey == TourTargetKeys.FILTER_TESTER && state.testQueryInput.isBlank()) {
                viewModel.updateTestQuery("sportybet.com")
            }
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
        CompositionLocalProvider(LocalTourTargets provides tourRegistry) {
            LiquidGlassBackdrop(isProtected = state.isFullyArmed) {
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
                                    onLaunchCalmReset = { launchSosCalmReset() },
                                    onOpenUrgeJournal = { showUrgeJournalSheet = true },
                                    onOpenSafeSupport = { showSafeSupportSheet = true },
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
                                    onToggleDeviceAdmin = { requestDeviceAdminToggle() },
                                    onOpenPrivateDnsSettings = { openNetworkDnsSettings() },
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
                    }

                    // Automatic Auto-Selecting Spotlight In-App Tour (placed in full root coordinate space)
                    AnimatedVisibility(
                        visible = !state.settings.hasCompletedTour,
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
                                    if (!state.isAccessibilityEnabled) {
                                        showAccessibilityDisclosure = true
                                    }
                                },
                            )
                        }
                    }
                }
            }
        }
    }

    if (showUrgeJournalSheet) {
        val liquid = LocalLiquidColors.current
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        val triggerOptions = listOf("Matchday", "Boredom", "Stress", "Promo Ad", "Late Night", "Payday")
        var selectedTrigger by remember { mutableStateOf(triggerOptions.first()) }
        var urgeNote by remember { mutableStateOf("") }

        ModalBottomSheet(
            onDismissRequest = { showUrgeJournalSheet = false },
            sheetState = sheetState,
            containerColor = MaterialTheme.colorScheme.surface,
            tonalElevation = 0.dp,
        ) {
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
                        tint = MaterialTheme.colorScheme.onBackground,
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Log a Resisted Urge",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
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
                    color = MaterialTheme.colorScheme.onBackground,
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
                                color = if (selected) liquid.activeContent else MaterialTheme.colorScheme.onBackground,
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
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = liquid.subtleBorder,
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
                    elevation = ButtonDefaults.buttonElevation(0.dp, 0.dp),
                ) {
                    Text("Save Resisted Victory")
                }
            }
        }
    }

    if (showSafeSupportSheet) {
        val liquid = LocalLiquidColors.current
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
            tonalElevation = 0.dp,
        ) {
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
                        tint = MaterialTheme.colorScheme.onBackground,
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Confidential Recovery Support",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
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
                                    color = MaterialTheme.colorScheme.onBackground,
                                )
                                Text(
                                    text = subtitle,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                            Icon(
                                imageVector = Icons.AutoMirrored.Rounded.OpenInNew,
                                contentDescription = "Open $title",
                                modifier = Modifier.size(18.dp),
                                tint = MaterialTheme.colorScheme.onBackground,
                            )
                        }
                    }
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
