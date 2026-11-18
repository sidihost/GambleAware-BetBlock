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
import androidx.compose.material.icons.rounded.Smartphone
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.ui.MainUiState
import com.example.ui.components.BrandGEmblem
import com.example.ui.components.LiquidGlassCard
import com.example.ui.components.LiquidSectionHeader
import com.example.ui.components.LiquidShieldOrb
import com.example.ui.components.LiquidStatusPill
import com.example.ui.components.TourTargetKeys
import com.example.ui.components.tourTarget
import com.example.ui.formatAttemptCountLabel
import com.example.ui.formatBlockedRelativeTime
import com.example.ui.theme.LocalLiquidColors
import com.example.ui.theme.MonoFontFamily
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ShieldScreen(
    state: MainUiState,
    onPrimaryShieldClick: () -> Unit,
    onEnableDnsShield: () -> Unit,
    onOpenVpnSettings: () -> Unit,
    onOpenPrivateDnsSettings: () -> Unit,
    onTestQueryChanged: (String) -> Unit,
    onNavigateToBlocklist: () -> Unit,
    onNavigateToActivity: () -> Unit,
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
    val showQuickOnboarding = !state.isVpnPrepared || !state.isShieldServiceRunning || !isLocked
    val listState = rememberLazyListState()

    LaunchedEffect(activeTourKey, showQuickOnboarding) {
        when (activeTourKey) {
            TourTargetKeys.SHIELD_ORB -> listState.animateScrollToItem(0)
            TourTargetKeys.SOS_CALM_BAR -> {
                val sosIdx = if (showQuickOnboarding) 4 else 3
                listState.animateScrollToItem(sosIdx)
            }
            TourTargetKeys.FILTER_TESTER -> {
                val testerIdx = if (showQuickOnboarding) 6 else 5
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
                            Row(
                                modifier = Modifier.weight(1f),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                            ) {
                                BrandGEmblem(modifier = Modifier.size(34.dp))
                                Column {
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
                                        text = "On-Device DNS Shield • Site & Betting App Guard",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
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
                                isArmed && isLocked -> "Maximum Lock & DNS Shield Active"
                                isArmed -> "On-Device DNS Shield Active"
                                !state.isVpnPrepared -> "Activate GambleAware DNS Shield"
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
                                    "Blocking SportyBet, Bet9ja, Bet365, 1xBet, Stake & 600+ gambling domains across browsers and betting apps."
                                !state.isVpnPrepared ->
                                    "Grant local DNS Shield permission to filter betting websites and gambling apps directly on your phone."
                                else ->
                                    "Tap below to resume real-time on-device gambling DNS interception."
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
                                    !state.isVpnPrepared -> "Enable DNS Shield"
                                    else -> "Resume Shield"
                                },
                                style = MaterialTheme.typography.labelLarge,
                            )
                        }
                    }
                }
            }

            // Item 1 (conditional): Quick 3-Step Protection Setup Banner
            if (showQuickOnboarding) {
                item {
                    LiquidGlassCard(
                        modifier = Modifier.fillMaxWidth(),
                        contentPadding = 18.dp,
                    ) {
                        LiquidSectionHeader(
                            title = "Complete Lock & Shield Setup",
                            subtitle = "Enable all layers so blocking stays active 24/7 on Wi-Fi & mobile data",
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        SetupStepRow(
                            step = "1",
                            title = "Enable On-Device DNS Shield",
                            subtitle = if (state.isVpnPrepared && state.isShieldServiceRunning) "Active" else "Required to block betting websites & app servers",
                            done = state.isVpnPrepared && state.isShieldServiceRunning,
                            onClick = onEnableDnsShield,
                            testTag = "onboarding_step_shield",
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        SetupStepRow(
                            step = "2",
                            title = "Always-On VPN (Android Settings)",
                            subtitle = "Optional: lock DNS Shield Always-On & Block connections without VPN",
                            done = state.isVpnPrepared,
                            onClick = onOpenVpnSettings,
                            testTag = "onboarding_step_admin",
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        SetupStepRow(
                            step = "3",
                            title = "Set Commitment Lock Duration",
                            subtitle = if (isLocked) "Active (${state.lockCountdownFormatted})" else "Locks rules, categories & pause controls until timer reaches 0",
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

            // Item 2/3: Blocked Betting Sites & Apps Summary Card
            item {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = 18.dp,
                ) {
                    val groupedSites = state.groupedBlockedTargets
                    val siteCount = groupedSites.size
                    LiquidSectionHeader(
                        title = "Blocked Betting Sites & Apps",
                        subtitle = if (groupedSites.isNotEmpty()) {
                            "${state.totalBlockedCount} blocked attempts across $siteCount site${if (siteCount == 1) "" else "s"} & app${if (siteCount == 1) "" else "s"}"
                        } else {
                            "${state.builtInDomainCount}+ betting websites & 130+ betting apps blocked automatically"
                        },
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    if (groupedSites.isNotEmpty()) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            groupedSites.take(6).forEach { site ->
                                val timeText = formatBlockedRelativeTime(site.latestTimestamp, state.currentTimeMs)
                                val monogram = site.target.firstOrNull()?.uppercaseChar()?.toString() ?: "G"
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(liquid.controlFill)
                                        .border(1.dp, liquid.subtleBorder, RoundedCornerShape(16.dp))
                                        .padding(horizontal = 12.dp, vertical = 10.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(liquid.softAccentFill)
                                            .border(1.dp, liquid.glassBorder, RoundedCornerShape(10.dp)),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        if (site.isApp) {
                                            Icon(
                                                imageVector = Icons.Rounded.Smartphone,
                                                contentDescription = null,
                                                tint = liquid.accentInk,
                                                modifier = Modifier.size(18.dp),
                                            )
                                        } else {
                                            Text(
                                                text = monogram,
                                                style = MaterialTheme.typography.titleSmall,
                                                fontWeight = FontWeight.Bold,
                                                color = liquid.accentInk,
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = site.target,
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.SemiBold,
                                            color = MaterialTheme.colorScheme.onBackground,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                        )
                                        Text(
                                            text = "${site.latestSource} • ${site.categoryName} • $timeText",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(50))
                                            .background(liquid.softAccentFill)
                                            .border(1.dp, liquid.glassBorder, RoundedCornerShape(50))
                                            .padding(horizontal = 9.dp, vertical = 4.dp),
                                    ) {
                                        Text(
                                            text = formatAttemptCountLabel(site.attemptCount),
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.SemiBold,
                                            color = liquid.accentInk,
                                        )
                                    }
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    Text(
                        text = "DEFAULT BLOCKED BETTING SITES (${state.builtInDomainCount}+)",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    val sampleBlockedSites = listOf(
                        "sportybet.com",
                        "bet9ja.com",
                        "betking.com",
                        "1xbet.com",
                        "bet365.com",
                        "stake.com",
                    )
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        sampleBlockedSites.forEach { domain ->
                            Row(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(50))
                                    .background(liquid.controlFill)
                                    .border(1.dp, liquid.subtleBorder, RoundedCornerShape(50))
                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Block,
                                    contentDescription = null,
                                    tint = liquid.accentInk,
                                    modifier = Modifier.size(13.dp),
                                )
                                Spacer(modifier = Modifier.width(5.dp))
                                Text(
                                    text = domain,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onBackground,
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        if (state.recentEvents.isNotEmpty()) {
                            OutlinedButton(
                                onClick = onNavigateToActivity,
                                modifier = Modifier
                                    .weight(1f)
                                    .height(44.dp)
                                    .testTag("view_blocked_log_button"),
                                shape = RoundedCornerShape(50),
                                border = BorderStroke(1.dp, liquid.subtleBorder),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    contentColor = MaterialTheme.colorScheme.onBackground,
                                ),
                            ) {
                                Text("View Log (${state.totalBlockedCount})", maxLines = 1)
                            }
                        }
                        OutlinedButton(
                            onClick = onNavigateToBlocklist,
                            modifier = Modifier
                                .weight(1f)
                                .height(44.dp)
                                .testTag("browse_blocklist_button"),
                            shape = RoundedCornerShape(50),
                            border = BorderStroke(1.dp, liquid.subtleBorder),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = MaterialTheme.colorScheme.onBackground,
                            ),
                        ) {
                            Text("Browse Blocklist", maxLines = 1)
                        }
                    }
                }
            }

            // Item 3/4: SOS Recovery Toolkit (60s Calm Reset, Log Urge, Safe Support)
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
                            colors = ButtonDefaults.buttonColors(
                                containerColor = liquid.activeFill,
                                contentColor = liquid.activeContent,
                            ),
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
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = MaterialTheme.colorScheme.onBackground,
                            ),
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
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.onBackground,
                        ),
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.FavoriteBorder,
                            contentDescription = null,
                            tint = liquid.accentInk,
                            modifier = Modifier.size(17.dp),
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Confidential Support & Helplines")
                    }
                }
            }

            // Item 3/4: On-Device Protection Stack
            item {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = 18.dp,
                ) {
                    LiquidSectionHeader(
                        title = "Protection Stack",
                        subtitle = "On-device DNS filtering • Zero remote logging • Wi-Fi & 4G/5G",
                    )
                    Spacer(modifier = Modifier.height(14.dp))

                    EngineStatusRow(
                        icon = Icons.Rounded.PhonelinkLock,
                        title = "On-Device DNS Shield",
                        subtitle = if (state.isShieldServiceRunning) {
                            "Active • Filtering betting domains across Chrome, WebViews & apps"
                        } else if (state.isVpnPrepared) {
                            "Prepared • Tap to start local DNS tunnel"
                        } else {
                            "Tap to grant local DNS filter permission"
                        },
                        isReady = state.isShieldServiceRunning || state.isVpnPrepared,
                        onClick = onEnableDnsShield,
                        testTag = "layer_accessibility_row",
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    EngineStatusRow(
                        icon = Icons.Rounded.AdminPanelSettings,
                        title = "Always-On Lock (Android VPN Settings)",
                        subtitle = "Tap to enable Always-on VPN & Block connections without VPN",
                        isReady = state.isVpnPrepared,
                        onClick = onOpenVpnSettings,
                        testTag = "layer_device_admin_row",
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    EngineStatusRow(
                        icon = Icons.Rounded.Dns,
                        title = "System Private DNS (DoT)",
                        subtitle = if (state.privateDnsStatus.isActive) {
                            "Active • ${state.privateDnsStatus.serverHost ?: "System Automatic"}"
                        } else {
                            "Optional • Secondary DNS-over-TLS backup in Network Settings"
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
                            label = "Install Guard",
                            isActive = isArmed && state.settings.appShieldEnabled,
                            icon = Icons.Rounded.Search,
                        )
                        LiquidStatusPill(
                            label = if (isLocked) "Timer Locked" else "Timer Lock",
                            isActive = isLocked && state.settings.antiTamperLockEnabled && isArmed,
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
                        subtitle = "Type a betting brand (e.g. sportybet) or URL — blocked immediately as you type",
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = state.testQueryInput,
                        onValueChange = onTestQueryChanged,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("live_domain_test_input"),
                        placeholder = { Text("Type sportybet, bet9ja, stake.c, or full URL") },
                        leadingIcon = {
                            Icon(
                                Icons.Rounded.Search,
                                contentDescription = null,
                                tint = liquid.accentInk,
                            )
                        },
                        trailingIcon = {
                            if (state.testQueryInput.isNotEmpty()) {
                                IconButton(
                                    onClick = { onTestQueryChanged("") },
                                    modifier = Modifier.testTag("clear_test_input"),
                                ) {
                                    Icon(
                                        Icons.Rounded.Close,
                                        contentDescription = "Clear",
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(18.dp),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = { keyboard?.hide() }),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = liquid.activeFill,
                            unfocusedBorderColor = liquid.subtleBorder,
                            cursorColor = liquid.activeFill,
                            focusedTextColor = MaterialTheme.colorScheme.onBackground,
                            unfocusedTextColor = MaterialTheme.colorScheme.onBackground,
                            focusedPlaceholderColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            unfocusedPlaceholderColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            focusedContainerColor = liquid.controlFill,
                            unfocusedContainerColor = liquid.controlFill,
                        ),
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        QuickSampleChip(
                            label = "sportybet",
                            onClick = { onTestQueryChanged("sportybet") },
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
        fillColor = if (done) liquid.mutedFill else liquid.controlFill,
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
                    .background(if (done) liquid.activeFill else liquid.controlFill)
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
                tint = if (done) liquid.activeFill else MaterialTheme.colorScheme.onSurfaceVariant,
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
        fillColor = if (isReady) liquid.mutedFill else liquid.controlFill,
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
                    .background(if (isReady) liquid.activeFill else liquid.controlFill),
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
                tint = if (isReady) liquid.activeFill else MaterialTheme.colorScheme.onSurfaceVariant,
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
        fillColor = liquid.controlFill,
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
