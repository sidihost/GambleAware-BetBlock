package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowRight
import androidx.compose.material.icons.rounded.AdminPanelSettings
import androidx.compose.material.icons.rounded.Air
import androidx.compose.material.icons.rounded.Block
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Dns
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.FavoriteBorder
import androidx.compose.material.icons.rounded.Language
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.PhonelinkLock
import androidx.compose.material.icons.rounded.RadioButtonUnchecked
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.Timer
import androidx.compose.material.icons.rounded.VerifiedUser
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.ui.MainUiState
import com.example.ui.components.LiquidGlassCard
import com.example.ui.components.LiquidSectionHeader
import com.example.ui.components.LiquidShieldOrb
import com.example.ui.components.LiquidStatusPill
import com.example.ui.components.TourTargetKeys
import com.example.ui.components.tourTarget
import com.example.ui.theme.LocalLiquidColors
import com.example.ui.theme.MonoFontFamily
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ShieldScreen(
    state: MainUiState,
    onPrimaryShieldClick: () -> Unit,
    onEnableAccessibility: () -> Unit,
    onRequestDeviceAdmin: () -> Unit,
    onOpenPrivateDnsSettings: () -> Unit,
    onTestQueryChanged: (String) -> Unit,
    onNavigateToLock: () -> Unit,
    onLaunchCalmReset: () -> Unit,
    onOpenUrgeJournal: () -> Unit,
    onOpenSafeSupport: () -> Unit,
    activeTourKey: String?,
    bottomContentPadding: androidx.compose.ui.unit.Dp,
    modifier: Modifier = Modifier,
) {
    val liquid = LocalLiquidColors.current
    val isArmed = state.isFullyArmed
    val isLocked = state.isTimeLockedNow
    val keyboard = LocalSoftwareKeyboardController.current
    val showQuickOnboarding = !state.isAccessibilityEnabled || !state.isDeviceAdminEnabled || !isLocked
    val listState = rememberLazyListState()

    LaunchedEffect(activeTourKey, showQuickOnboarding) {
        when (activeTourKey) {
            TourTargetKeys.SHIELD_ORB -> listState.animateScrollToItem(0)
            TourTargetKeys.SOS_CALM_BAR -> {
                val sosIdx = if (showQuickOnboarding) 3 else 2
                listState.animateScrollToItem(sosIdx)
            }
            TourTargetKeys.FILTER_TESTER -> {
                val testerIdx = if (showQuickOnboarding) 5 else 4
                listState.animateScrollToItem(testerIdx)
            }
        }
    }

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.TopCenter,
    ) {
        LazyColumn(
            state = listState,
            modifier = Modifier
                .widthIn(max = 600.dp)
                .fillMaxSize(),
            contentPadding = PaddingValues(
                start = 18.dp,
                end = 18.dp,
                top = 12.dp,
                bottom = bottomContentPadding + 16.dp,
            ),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            // Item 0: Hero Monochrome Liquid Glass Shield Card
            item {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = 22.dp,
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                val firstName = state.settings.preferredName.trim()
                                    .split(Regex("\\s+"))
                                    .firstOrNull()
                                    .orEmpty()
                                Text(
                                    text = if (firstName.isNotEmpty()) "GambleAware • $firstName" else "GambleAware",
                                    style = MaterialTheme.typography.headlineMedium,
                                    color = MaterialTheme.colorScheme.onBackground,
                                )
                                Text(
                                    text = "Zero-VPN • Browser, WebView & App Shield",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            if (isLocked) {
                                LiquidStatusPill(
                                    label = "Locked",
                                    isActive = true,
                                    icon = Icons.Rounded.Lock,
                                    onClick = onNavigateToLock,
                                )
                            } else {
                                LiquidStatusPill(
                                    label = if (isArmed) "Armed" else "Setup",
                                    isActive = isArmed,
                                    icon = if (isArmed) Icons.Rounded.VerifiedUser else Icons.Rounded.Shield,
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Box(modifier = Modifier.tourTarget(TourTargetKeys.SHIELD_ORB)) {
                            LiquidShieldOrb(
                                isProtected = isArmed,
                                isLocked = isLocked,
                                onClick = onPrimaryShieldClick,
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Text(
                            text = when {
                                isArmed && state.isDeviceAdminEnabled && isLocked -> "Maximum Lock & Shield Active"
                                isArmed && state.isDeviceAdminEnabled -> "Full Shield + Uninstall Guard"
                                isArmed -> "Web & App Shield Active"
                                !state.isAccessibilityEnabled -> "Activate GambleAware Shield"
                                else -> "Protection Paused"
                            },
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.onBackground,
                            textAlign = TextAlign.Center,
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = when {
                                isArmed ->
                                    "Blocking SportyBet, Bet9ja, Bet365, 1xBet, Stake, search queries, WebViews & betting apps in real time."
                                !state.isAccessibilityEnabled ->
                                    "Enable GambleAware in Android Accessibility to block browsers, WebViews, betting apps, and impulsive uninstalls."
                                else ->
                                    "Tap below to resume real-time gambling site and app interception."
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center,
                        )

                        if (isLocked) {
                            Spacer(modifier = Modifier.height(14.dp))
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(18.dp))
                                    .background(liquid.mutedFill)
                                    .border(1.dp, liquid.subtleBorder, RoundedCornerShape(18.dp))
                                    .padding(horizontal = 14.dp, vertical = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Rounded.Lock,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.onBackground,
                                        modifier = Modifier.size(16.dp),
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Uninstall Lock Timer",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onBackground,
                                    )
                                }
                                Text(
                                    text = state.lockCountdownFormatted,
                                    fontFamily = MonoFontFamily,
                                    fontWeight = FontWeight.SemiBold,
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.onBackground,
                                    modifier = Modifier.testTag("shield_lock_countdown"),
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = onPrimaryShieldClick,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp)
                                .testTag("primary_shield_button"),
                            shape = RoundedCornerShape(50),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isArmed) liquid.mutedFill else liquid.activeFill,
                                contentColor = if (isArmed) liquid.mutedContent else liquid.activeContent,
                            ),
                            border = BorderStroke(1.dp, liquid.subtleBorder),
                            elevation = ButtonDefaults.buttonElevation(
                                defaultElevation = 0.dp,
                                pressedElevation = 0.dp,
                            ),
                        ) {
                            Icon(
                                imageVector = if (isArmed) Icons.Rounded.VerifiedUser else Icons.Rounded.Shield,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp),
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = when {
                                    isArmed && isLocked -> "Protected (Locked Until Timer Ends)"
                                    isArmed -> "Pause Shield"
                                    !state.isAccessibilityEnabled -> "Enable Web & App Shield"
                                    else -> "Resume Shield"
                                },
                                style = MaterialTheme.typography.labelLarge,
                            )
                        }
                    }
                }
            }

            // Item 1 (conditional): Quick 3-Step Protection & Anti-Uninstall Setup Banner
            if (showQuickOnboarding) {
                item {
                    LiquidGlassCard(
                        modifier = Modifier.fillMaxWidth(),
                        contentPadding = 18.dp,
                    ) {
                        LiquidSectionHeader(
                            title = "Complete Lock & Shield Setup",
                            subtitle = "Enable all 3 layers to prevent uninstalling until your timer ends",
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        SetupStepRow(
                            step = "1",
                            title = "Enable Web & App Shield",
                            subtitle = if (state.isAccessibilityEnabled) "Active" else "Required to block sites, WebViews & apps",
                            done = state.isAccessibilityEnabled,
                            onClick = onEnableAccessibility,
                            testTag = "onboarding_step_shield",
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        SetupStepRow(
                            step = "2",
                            title = "Enable Uninstall Lock (Device Admin)",
                            subtitle = if (state.isDeviceAdminEnabled) "Active" else "Prevents direct uninstall of GambleAware",
                            done = state.isDeviceAdminEnabled,
                            onClick = onRequestDeviceAdmin,
                            testTag = "onboarding_step_admin",
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        SetupStepRow(
                            step = "3",
                            title = "Set Commitment Lock Duration",
                            subtitle = if (isLocked) "Active (${state.lockCountdownFormatted})" else "Locks uninstall & tamper controls until timer reaches 0",
                            done = isLocked,
                            onClick = onNavigateToLock,
                            testTag = "onboarding_step_timer",
                        )
                    }
                }
            }

            // Item 1/2: Metrics Trio Card
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    MetricGlassTile(
                        title = "Clean Streak",
                        value = if (state.cleanDays > 0) "${state.cleanDays}d ${state.cleanHoursRemainder}h" else "${state.cleanHoursRemainder}h ${state.cleanMinutesRemainder}m",
                        subtitle = "Goal: ${state.nextMilestone.label}",
                        modifier = Modifier.weight(1f),
                    )
                    MetricGlassTile(
                        title = "Blocked",
                        value = "${state.todayBlockedCount}",
                        subtitle = "${state.totalBlockedCount} total",
                        modifier = Modifier.weight(1f),
                    )
                    MetricGlassTile(
                        title = "Est. Saved",
                        value = "₦" + NumberFormat.getIntegerInstance(Locale("en", "NG"))
                            .format(state.estimatedSavedAmount),
                        subtitle = "${state.totalUrgeResistedCount} resisted",
                        modifier = Modifier.weight(1f),
                    )
                }
            }

            // Item 2/3: SOS Recovery Toolkit (60s Calm Reset, Log Urge, Safe Support)
            item {
                LiquidGlassCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .tourTarget(TourTargetKeys.SOS_CALM_BAR),
                    contentPadding = 18.dp,
                ) {
                    LiquidSectionHeader(
                        title = "Urge & Recovery Toolkit",
                        subtitle = "Immediate tools when an urge hits",
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Button(
                            onClick = onLaunchCalmReset,
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .testTag("sos_calm_reset_button"),
                            shape = RoundedCornerShape(50),
                            elevation = ButtonDefaults.buttonElevation(
                                defaultElevation = 0.dp,
                                pressedElevation = 0.dp,
                            ),
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Air,
                                contentDescription = null,
                                modifier = Modifier.size(17.dp),
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("60s SOS Calm", maxLines = 1)
                        }
                        OutlinedButton(
                            onClick = onOpenUrgeJournal,
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .testTag("log_urge_button"),
                            shape = RoundedCornerShape(50),
                            border = BorderStroke(1.dp, liquid.subtleBorder),
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.EditNote,
                                contentDescription = null,
                                modifier = Modifier.size(17.dp),
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Log Victory", maxLines = 1)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedButton(
                        onClick = onOpenSafeSupport,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .testTag("safe_support_button"),
                        shape = RoundedCornerShape(50),
                        border = BorderStroke(1.dp, liquid.subtleBorder),
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.FavoriteBorder,
                            contentDescription = null,
                            modifier = Modifier.size(17.dp),
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Confidential Support & Helplines")
                    }
                }
            }

            // Item 3/4: 3-Layer Non-VPN Protection Stack
            item {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = 18.dp,
                ) {
                    LiquidSectionHeader(
                        title = "Protection Stack",
                        subtitle = "No VPN required • Zero battery drain • Works on Wi-Fi & mobile data",
                    )
                    Spacer(modifier = Modifier.height(14.dp))

                    EngineStatusRow(
                        icon = Icons.Rounded.PhonelinkLock,
                        title = "Web, Search & App Shield",
                        subtitle = if (state.isAccessibilityEnabled) {
                            "Active • Browsers, Search Guard, WebViews & 130+ betting apps"
                        } else {
                            "Tap to enable in Android Accessibility Settings"
                        },
                        isReady = state.isAccessibilityEnabled,
                        onClick = onEnableAccessibility,
                        testTag = "layer_accessibility_row",
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    EngineStatusRow(
                        icon = Icons.Rounded.AdminPanelSettings,
                        title = "Uninstall Lock (Device Admin)",
                        subtitle = if (state.isDeviceAdminEnabled) {
                            "Active • Android blocks impulsive removal of GambleAware"
                        } else {
                            "Tap to lock app removal during urges"
                        },
                        isReady = state.isDeviceAdminEnabled,
                        onClick = onRequestDeviceAdmin,
                        testTag = "layer_device_admin_row",
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    EngineStatusRow(
                        icon = Icons.Rounded.Dns,
                        title = "System Private DNS (DoT)",
                        subtitle = if (state.privateDnsStatus.isActive) {
                            "Active • ${state.privateDnsStatus.serverHost ?: "System Automatic"}"
                        } else {
                            "Optional • Configure native DNS-over-TLS without a VPN"
                        },
                        isReady = state.privateDnsStatus.isActive,
                        onClick = onOpenPrivateDnsSettings,
                        testTag = "layer_private_dns_row",
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        LiquidStatusPill(
                            label = "${state.builtInDomainCount}+ Domains",
                            isActive = isArmed,
                            icon = Icons.Rounded.Language,
                        )
                        LiquidStatusPill(
                            label = "Search Guard",
                            isActive = isArmed && state.settings.searchGuardEnabled,
                            icon = Icons.Rounded.Search,
                        )
                        LiquidStatusPill(
                            label = if (isLocked) "Tamper Locked" else "Timer Lock",
                            isActive = isLocked && state.settings.antiTamperLockEnabled && state.isAccessibilityEnabled,
                            icon = if (isLocked) Icons.Rounded.Lock else Icons.Rounded.Timer,
                            onClick = onNavigateToLock,
                        )
                    }
                }
            }

            // Item 4/5: Live Domain & URL Filter Tester (Spotlight Tour Step 2 Target)
            item {
                LiquidGlassCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .tourTarget(TourTargetKeys.FILTER_TESTER),
                    contentPadding = 18.dp,
                ) {
                    LiquidSectionHeader(
                        title = "Verify Filter Live",
                        subtitle = "Test SportyBet, Bet9ja, Stake, or any URL against active rules",
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = state.testQueryInput,
                        onValueChange = onTestQueryChanged,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("live_domain_test_input"),
                        placeholder = { Text("Try sportybet.com, bet9ja.com, or stake.com") },
                        leadingIcon = {
                            Icon(Icons.Rounded.Search, contentDescription = null)
                        },
                        trailingIcon = {
                            if (state.testQueryInput.isNotEmpty()) {
                                IconButton(
                                    onClick = { onTestQueryChanged("") },
                                    modifier = Modifier.testTag("clear_test_input"),
                                ) {
                                    Icon(Icons.Rounded.Close, contentDescription = "Clear")
                                }
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(18.dp),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = { keyboard?.hide() }),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = MaterialTheme.colorScheme.primary,
                            unfocusedBorderColor = liquid.subtleBorder,
                            focusedContainerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.65f),
                            unfocusedContainerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.45f),
                        ),
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        QuickSampleChip(
                            label = "sportybet.com",
                            onClick = { onTestQueryChanged("sportybet.com") },
                            testTag = "sample_chip_sportybet",
                        )
                        QuickSampleChip(
                            label = "bet365.com",
                            onClick = { onTestQueryChanged("bet365.com") },
                            testTag = "sample_chip_bet365",
                        )
                        QuickSampleChip(
                            label = "betterhelp.com",
                            onClick = { onTestQueryChanged("betterhelp.com") },
                            testTag = "sample_chip_safe",
                        )
                    }

                    AnimatedVisibility(visible = state.testMatchResult != null) {
                        state.testMatchResult?.let { result ->
                            Spacer(modifier = Modifier.height(12.dp))
                            val bg = if (result.isBlocked) liquid.activeFill else liquid.mutedFill
                            val fg = if (result.isBlocked) liquid.activeContent else liquid.mutedContent

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(bg)
                                    .border(1.dp, liquid.subtleBorder, RoundedCornerShape(16.dp))
                                    .padding(14.dp)
                                    .testTag("domain_test_result_card"),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(
                                    imageVector = if (result.isBlocked) Icons.Rounded.Block else Icons.Rounded.CheckCircle,
                                    contentDescription = null,
                                    tint = fg,
                                    modifier = Modifier.size(22.dp),
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = if (result.isBlocked) {
                                            "Blocked (${result.category.displayName})"
                                        } else {
                                            "Allowed (Safe / Non-Gambling)"
                                        },
                                        style = MaterialTheme.typography.titleSmall,
                                        color = fg,
                                    )
                                    if (result.isBlocked) {
                                        Text(
                                            text = "${result.matchedTarget} • ${result.reason}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = fg.copy(alpha = 0.85f),
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // App Footer
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp, bottom = 8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        text = "GambleAware",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onBackground,
                        textAlign = TextAlign.Center,
                    )
                    Text(
                        text = "A product of Imoogle Technology",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )
                }
            }
        }
    }
}

@Composable
private fun SetupStepRow(
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
        cornerRadius = 16.dp,
        fillColor = if (done) liquid.mutedFill else MaterialTheme.colorScheme.surface.copy(alpha = 0.55f),
        borderColor = liquid.subtleBorder,
        contentPadding = 12.dp,
        onClick = onClick,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(50))
                    .background(if (done) liquid.activeFill else MaterialTheme.colorScheme.surface)
                    .border(1.dp, liquid.subtleBorder, RoundedCornerShape(50)),
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
                    color = MaterialTheme.colorScheme.onBackground,
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Icon(
                imageVector = if (done) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked,
                contentDescription = null,
                tint = if (done) MaterialTheme.colorScheme.onBackground else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(19.dp),
            )
        }
    }
}

@Composable
private fun MetricGlassTile(
    title: String,
    value: String,
    subtitle: String,
    modifier: Modifier = Modifier,
) {
    LiquidGlassCard(
        modifier = modifier,
        cornerRadius = 22.dp,
        contentPadding = 14.dp,
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground,
            maxLines = 1,
        )
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = subtitle,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
        )
    }
}

@Composable
private fun EngineStatusRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    isReady: Boolean,
    onClick: () -> Unit,
    testTag: String,
) {
    val liquid = LocalLiquidColors.current

    LiquidGlassCard(
        modifier = Modifier
            .fillMaxWidth()
            .testTag(testTag),
        cornerRadius = 18.dp,
        fillColor = if (isReady) liquid.mutedFill else MaterialTheme.colorScheme.surface.copy(alpha = 0.5f),
        borderColor = liquid.subtleBorder,
        contentPadding = 14.dp,
        onClick = onClick,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(if (isReady) liquid.activeFill else MaterialTheme.colorScheme.surface),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = if (isReady) liquid.activeContent else MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.size(22.dp),
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
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
                imageVector = if (isReady) {
                    Icons.Rounded.CheckCircle
                } else {
                    Icons.AutoMirrored.Rounded.KeyboardArrowRight
                },
                contentDescription = null,
                tint = if (isReady) MaterialTheme.colorScheme.onBackground else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(20.dp),
            )
        }
    }
}

@Composable
private fun QuickSampleChip(
    label: String,
    onClick: () -> Unit,
    testTag: String,
) {
    val liquid = LocalLiquidColors.current
    LiquidGlassCard(
        cornerRadius = 50.dp,
        fillColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.7f),
        borderColor = liquid.subtleBorder,
        contentPadding = 0.dp,
        onClick = onClick,
        modifier = Modifier.testTag(testTag),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
        )
    }
}
