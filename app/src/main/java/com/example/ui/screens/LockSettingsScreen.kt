package com.example.ui.screens

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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowRight
import androidx.compose.material.icons.rounded.AdminPanelSettings
import androidx.compose.material.icons.rounded.Dns
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.LockOpen
import androidx.compose.material.icons.rounded.Notifications
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Timer
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.ThemeMode
import com.example.ui.MainUiState
import com.example.ui.components.LiquidGlassCard
import com.example.ui.components.LiquidSectionHeader
import com.example.ui.components.TourTargetKeys
import com.example.ui.components.tourTarget
import com.example.ui.theme.LocalLiquidColors
import com.example.ui.theme.MonoFontFamily
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun LockSettingsScreen(
    state: MainUiState,
    onActivateTimeLock: (days: Int, antiTamper: Boolean) -> Unit,
    onToggleAntiTamper: (Boolean) -> Unit,
    onSetPin: (String) -> Unit,
    onRemovePin: () -> Unit,
    onToggleDeviceAdmin: () -> Unit,
    onOpenPrivateDnsSettings: () -> Unit,
    onSetDailySpend: (Int) -> Unit,
    onSelectTheme: (ThemeMode) -> Unit,
    onResetStreak: () -> Unit,
    onReplayTour: () -> Unit,
    hasNotificationPermission: Boolean,
    onToggleNotifications: (Boolean) -> Unit,
    onSendTestNotification: () -> Unit,
    activeTourKey: String? = null,
    bottomContentPadding: androidx.compose.ui.unit.Dp,
    modifier: Modifier = Modifier,
) {
    val liquid = LocalLiquidColors.current
    val isTimeLocked = state.isTimeLockedNow
    var showConfirmLockDialog by remember { mutableStateOf(false) }
    var pendingLockDays by remember { mutableIntStateOf(7) }
    var includeAntiTamper by remember { mutableStateOf(true) }
    var showSetPinDialog by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()

    LaunchedEffect(activeTourKey) {
        if (activeTourKey == TourTargetKeys.LOCK_TIMER) {
            listState.animateScrollToItem(1)
        }
    }

    val lockExpiryFormatted = remember(state.settings.lockUntilEpochMs, state.currentTimeMs) {
        if (state.settings.lockUntilEpochMs <= state.currentTimeMs) ""
        else SimpleDateFormat("MMM d, yyyy 'at' h:mm a", Locale.getDefault())
            .format(Date(state.settings.lockUntilEpochMs))
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
            item {
                Column(modifier = Modifier.padding(horizontal = 4.dp)) {
                    Text(
                        text = "Commitment Lock",
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Text(
                        text = "Prevent uninstalling, tampering, or pausing your shield",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            // Timed Commitment Lock Card
            item {
                LiquidGlassCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .tourTarget(TourTargetKeys.LOCK_TIMER),
                    contentPadding = 18.dp,
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .background(if (isTimeLocked) liquid.activeFill else liquid.mutedFill),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                imageVector = if (isTimeLocked) Icons.Rounded.Lock else Icons.Rounded.Timer,
                                contentDescription = null,
                                tint = if (isTimeLocked) liquid.activeContent else liquid.mutedContent,
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (isTimeLocked) "Commitment Lock Active" else "Timed Commitment Lock",
                                style = MaterialTheme.typography.titleMedium,
                            )
                            Text(
                                text = if (isTimeLocked) {
                                    "Uninstall & tamper blocked until $lockExpiryFormatted"
                                } else {
                                    "Lock protection, uninstalls, and blocklists for a chosen recovery period"
                                },
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }

                    if (isTimeLocked) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("lock_countdown_quad"),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            state.lockClockQuad.forEach { (digits, unit) ->
                                Column(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(liquid.mutedFill)
                                        .border(1.dp, liquid.subtleBorder, RoundedCornerShape(16.dp))
                                        .padding(vertical = 10.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                ) {
                                    Text(
                                        text = digits,
                                        fontFamily = MonoFontFamily,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 20.sp,
                                        color = MaterialTheme.colorScheme.onBackground,
                                    )
                                    Text(
                                        text = unit,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    val durations = listOf(1 to "24 Hours", 7 to "7 Days", 30 to "30 Days", 90 to "90 Days")
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        durations.forEach { (days, label) ->
                            val selected = pendingLockDays == days
                            LiquidGlassCard(
                                cornerRadius = 50.dp,
                                fillColor = if (selected) liquid.activeFill else MaterialTheme.colorScheme.surface.copy(alpha = 0.6f),
                                borderColor = if (selected) liquid.activeFill else liquid.subtleBorder,
                                contentPadding = 0.dp,
                                onClick = { pendingLockDays = days },
                                modifier = Modifier.testTag("lock_duration_${days}d"),
                            ) {
                                Text(
                                    text = label,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = if (selected) liquid.activeContent else MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp),
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
                            Text(
                                text = "Anti-Uninstall & Tamper Guard",
                                style = MaterialTheme.typography.titleSmall,
                            )
                            Text(
                                text = "Blocks Settings App Info, Package Installer, Play Store uninstall, Accessibility & Device Admin removal while locked",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        Switch(
                            checked = if (isTimeLocked) state.settings.antiTamperLockEnabled else includeAntiTamper,
                            onCheckedChange = { checked ->
                                if (isTimeLocked) {
                                    onToggleAntiTamper(checked)
                                } else {
                                    includeAntiTamper = checked
                                }
                            },
                            modifier = Modifier.testTag("switch_anti_tamper"),
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = liquid.activeContent,
                                checkedTrackColor = liquid.activeFill,
                                uncheckedThumbColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                uncheckedTrackColor = liquid.mutedFill,
                                uncheckedBorderColor = liquid.subtleBorder,
                            ),
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = { showConfirmLockDialog = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .testTag("activate_time_lock_button"),
                        shape = RoundedCornerShape(50),
                        elevation = ButtonDefaults.buttonElevation(
                            defaultElevation = 0.dp,
                            pressedElevation = 0.dp,
                        ),
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Lock,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            if (isTimeLocked) "Extend Lock by $pendingLockDays Day(s)"
                            else "Activate $pendingLockDays-Day Lock",
                        )
                    }
                }
            }

            // Device Admin Uninstall Lock
            item {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = 18.dp,
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f),
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.AdminPanelSettings,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onBackground,
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "Uninstall Lock",
                                    style = MaterialTheme.typography.titleMedium,
                                )
                                Text(
                                    text = if (state.isDeviceAdminEnabled) {
                                        "Active • Android prevents uninstalling GambleAware"
                                    } else {
                                        "Enable Device Admin to block impulsive app removal"
                                    },
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        OutlinedButton(
                            onClick = onToggleDeviceAdmin,
                            shape = RoundedCornerShape(50),
                            border = BorderStroke(1.dp, liquid.subtleBorder),
                            modifier = Modifier.testTag("toggle_device_admin_button"),
                        ) {
                            Text(if (state.isDeviceAdminEnabled) "Disable" else "Enable")
                        }
                    }
                }
            }

            // Accountability PIN Card
            item {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = 18.dp,
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f),
                        ) {
                            Icon(
                                imageVector = if (state.settings.hasPin) Icons.Rounded.Lock else Icons.Rounded.LockOpen,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onBackground,
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "Accountability PIN",
                                    style = MaterialTheme.typography.titleMedium,
                                )
                                Text(
                                    text = if (state.settings.hasPin) {
                                        "4-digit PIN required before disabling protection"
                                    } else {
                                        "Set a 4-digit PIN (or ask a trusted partner to set it)"
                                    },
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        if (state.settings.hasPin) {
                            OutlinedButton(
                                onClick = onRemovePin,
                                shape = RoundedCornerShape(50),
                                border = BorderStroke(1.dp, liquid.subtleBorder),
                                modifier = Modifier.testTag("remove_pin_button"),
                            ) {
                                Text("Remove")
                            }
                        } else {
                            OutlinedButton(
                                onClick = { showSetPinDialog = true },
                                shape = RoundedCornerShape(50),
                                border = BorderStroke(1.dp, liquid.subtleBorder),
                                modifier = Modifier.testTag("set_pin_button"),
                            ) {
                                Text("Set PIN")
                            }
                        }
                    }
                }
            }

            // On-Device Recovery & Lock Alerts
            item {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = 18.dp,
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f),
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Notifications,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onBackground,
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "Recovery & Lock Alerts",
                                    style = MaterialTheme.typography.titleMedium,
                                )
                                Text(
                                    text = if (!hasNotificationPermission && state.settings.notificationsEnabled) {
                                        "Permission needed on Android 13+ for milestone & lock alerts"
                                    } else {
                                        "On-device alerts for streak milestones, Lock activation & Install Guard"
                                    },
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                        Switch(
                            checked = state.settings.notificationsEnabled,
                            onCheckedChange = onToggleNotifications,
                            modifier = Modifier.testTag("switch_notifications"),
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = liquid.activeContent,
                                checkedTrackColor = liquid.activeFill,
                                uncheckedThumbColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                uncheckedTrackColor = liquid.mutedFill,
                                uncheckedBorderColor = liquid.subtleBorder,
                            ),
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedButton(
                        onClick = onSendTestNotification,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("send_test_notification_button"),
                        shape = RoundedCornerShape(50),
                        border = BorderStroke(1.dp, liquid.subtleBorder),
                    ) {
                        Text("Send Test Alert")
                    }
                }
            }

            // Native System Private DNS Guide (Zero VPN)
            item {
                LiquidGlassCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("private_dns_settings_card"),
                    contentPadding = 18.dp,
                    onClick = onOpenPrivateDnsSettings,
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(liquid.mutedFill),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Dns,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onBackground,
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "System Private DNS (Zero-VPN)",
                                style = MaterialTheme.typography.titleSmall,
                            )
                            Text(
                                text = if (state.privateDnsStatus.isActive) {
                                    "Active: ${state.privateDnsStatus.serverHost ?: "Automatic"}. Tap to adjust in Network Settings."
                                } else {
                                    "Optional: Set Private DNS in Network Settings (e.g. family.adguard-dns.com) for OS-level DNS blocking with zero VPN."
                                },
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.KeyboardArrowRight,
                            contentDescription = "Open Network settings",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }

            // Daily Spend Baseline & Appearance
            item {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = 18.dp,
                ) {
                    LiquidSectionHeader(
                        title = "Daily Spend Baseline",
                        subtitle = "Used to estimate savings during your clean streak",
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        val nairaFormat = remember { NumberFormat.getIntegerInstance(Locale("en", "NG")) }
                        listOf(1000, 2500, 5000, 10000, 25000).forEach { amount ->
                            val selected = state.settings.dailyBetSpendEstimate == amount
                            LiquidGlassCard(
                                cornerRadius = 50.dp,
                                fillColor = if (selected) liquid.activeFill else MaterialTheme.colorScheme.surface.copy(alpha = 0.55f),
                                borderColor = if (selected) liquid.activeFill else liquid.subtleBorder,
                                contentPadding = 0.dp,
                                onClick = { onSetDailySpend(amount) },
                            ) {
                                Text(
                                    text = "₦${nairaFormat.format(amount)}/day",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = if (selected) liquid.activeContent else MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    LiquidSectionHeader(
                        title = "Black & Pink Theme",
                        subtitle = "Obsidian black & GambleAware pink finish",
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        ThemeMode.entries.forEach { mode ->
                            val selected = state.settings.themeMode == mode
                            LiquidGlassCard(
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("theme_mode_${mode.name.lowercase()}"),
                                cornerRadius = 16.dp,
                                fillColor = if (selected) liquid.activeFill else MaterialTheme.colorScheme.surface.copy(alpha = 0.55f),
                                borderColor = if (selected) liquid.activeFill else liquid.subtleBorder,
                                contentPadding = 12.dp,
                                onClick = { onSelectTheme(mode) },
                            ) {
                                Text(
                                    text = mode.label,
                                    style = MaterialTheme.typography.labelLarge,
                                    fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
                                    color = if (selected) liquid.activeContent else MaterialTheme.colorScheme.onBackground,
                                    modifier = Modifier.align(Alignment.CenterHorizontally),
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedButton(
                        onClick = onResetStreak,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("reset_streak_button"),
                        shape = RoundedCornerShape(50),
                        border = BorderStroke(1.dp, liquid.subtleBorder),
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Refresh,
                            contentDescription = null,
                            modifier = Modifier.size(17.dp),
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Restart Clean Streak Timer")
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedButton(
                        onClick = onReplayTour,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("replay_tour_button"),
                        shape = RoundedCornerShape(50),
                        border = BorderStroke(1.dp, liquid.subtleBorder),
                    ) {
                        Text("Replay Guided Tour")
                    }
                }
            }

            // Product Attribution Footer
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        text = "GambleAware",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onBackground,
                        textAlign = TextAlign.Center,
                    )
                    Spacer(modifier = Modifier.height(2.dp))
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

    if (showConfirmLockDialog) {
        AlertDialog(
            onDismissRequest = { showConfirmLockDialog = false },
            title = { Text("Activate $pendingLockDays-Day Lock?") },
            text = {
                Text(
                    "While Commitment Lock is active, GambleAware will not allow uninstalling the app, pausing protection, turning off categories, or deleting blocked rules until the timer completes.",
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        onActivateTimeLock(pendingLockDays, includeAntiTamper)
                        showConfirmLockDialog = false
                    },
                    modifier = Modifier.testTag("confirm_activate_time_lock"),
                ) {
                    Text("Lock Now")
                }
            },
            dismissButton = {
                TextButton(onClick = { showConfirmLockDialog = false }) {
                    Text("Cancel")
                }
            },
        )
    }

    if (showSetPinDialog) {
        var pinInput by remember { mutableStateOf("") }
        var confirmPinInput by remember { mutableStateOf("") }
        var pinError by remember { mutableStateOf<String?>(null) }

        AlertDialog(
            onDismissRequest = { showSetPinDialog = false },
            title = { Text("Set 4-Digit Accountability PIN") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Enter a 4-digit PIN required to pause protection or weaken blocklist rules.",
                        style = MaterialTheme.typography.bodySmall,
                    )
                    OutlinedTextField(
                        value = pinInput,
                        onValueChange = { if (it.length <= 4 && it.all(Char::isDigit)) pinInput = it },
                        label = { Text("4-Digit PIN") },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        modifier = Modifier.testTag("new_pin_input"),
                    )
                    OutlinedTextField(
                        value = confirmPinInput,
                        onValueChange = { if (it.length <= 4 && it.all(Char::isDigit)) confirmPinInput = it },
                        label = { Text("Confirm PIN") },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        modifier = Modifier.testTag("confirm_pin_input"),
                    )
                    if (pinError != null) {
                        Text(
                            text = pinError!!,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        when {
                            pinInput.length != 4 -> pinError = "PIN must be exactly 4 digits"
                            pinInput != confirmPinInput -> pinError = "PINs do not match"
                            else -> {
                                onSetPin(pinInput)
                                showSetPinDialog = false
                            }
                        }
                    },
                    modifier = Modifier.testTag("save_pin_button"),
                ) {
                    Text("Save PIN")
                }
            },
            dismissButton = {
                TextButton(onClick = { showSetPinDialog = false }) {
                    Text("Cancel")
                }
            },
        )
    }
}
