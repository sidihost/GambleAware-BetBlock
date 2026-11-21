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
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Air
import androidx.compose.material.icons.rounded.Block
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Dns
import androidx.compose.material.icons.rounded.DownloadDone
import androidx.compose.material.icons.rounded.EditNote
import androidx.compose.material.icons.rounded.Language
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.PhonelinkLock
import androidx.compose.material.icons.rounded.PublicOff
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material.icons.rounded.Smartphone
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.clickable
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CheckBox
import androidx.compose.material.icons.rounded.CheckBoxOutlineBlank
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material.icons.rounded.StarOutline
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.ui.text.input.KeyboardType
import com.example.blocker.RateLimitSeverity
import com.example.blocker.RateLimiterEngine
import com.example.data.BlockedEventEntity
import com.example.data.GoalCategory
import com.example.data.RecoveryGoalItem
import com.example.ui.GroupedBlockedTarget
import com.example.ui.MainUiState
import com.example.ui.RECOVERY_MILESTONES
import com.example.ui.components.BettingBrandLogo
import com.example.ui.components.BettingFreeProgressChart
import com.example.ui.components.InteractiveBlockedBarChart
import com.example.ui.components.LiquidGlassCard
import com.example.ui.components.LiquidSectionHeader
import com.example.ui.components.TourTargetKeys
import com.example.ui.components.tourTarget
import com.example.ui.formatAttemptCountLabel
import com.example.ui.formatBlockedRelativeTime
import com.example.ui.formatBlockedTargetDisplay
import com.example.ui.theme.LocalLiquidColors
import com.example.ui.theme.MonoFontFamily
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ActivityScreen(
    state: MainUiState,
    onClearHistory: () -> Unit,
    onShareStreak: () -> Unit = {},
    onOpenUrgeJournal: () -> Unit,
    onLaunchCalmReset: () -> Unit,
    onToggleRateLimit: (Boolean) -> Unit = {},
    onUpdateRateLimitThresholds: (Int, Int, Int) -> Unit = { _, _, _ -> },
    onUpdateHighRiskSchedule: (Boolean, Boolean, Boolean) -> Unit = { _, _, _ -> },
    onClearCooldown: () -> Unit = {},
    onSimulateRateLimitAttempt: () -> Unit = {},
    onAddGoal: (String, GoalCategory, Int, Int, String) -> Unit = { _, _, _, _, _ -> },
    onSetPrimaryGoal: (String) -> Unit = {},
    onToggleGoalCompleted: (String) -> Unit = {},
    onDeleteGoal: (String) -> Unit = {},
    activeTourKey: String? = null,
    bottomContentPadding: androidx.compose.ui.unit.Dp,
    modifier: Modifier = Modifier,
) {
    val liquid = LocalLiquidColors.current
    var selectedChartMode by remember { mutableIntStateOf(0) } // 0 = Days & Savings, 1 = 7-Day Blocks
    var logViewMode by remember { mutableIntStateOf(0) } // 0 = By Site & App, 1 = Timeline
    var selectedSource by remember { mutableStateOf("All") }
    val sourceOptions = listOf(
        "All",
        "Browser Shield",
        "Typed URL Guard",
        "Web Shield",
        "Search Guard",
        "In-App WebView",
        "App Shield",
        "Install Guard",
    )
    val listState = rememberLazyListState()

    LaunchedEffect(activeTourKey) {
        if (activeTourKey == TourTargetKeys.PROGRESS_DASHBOARD) {
            listState.animateScrollToItem(1)
        }
    }

    val filteredEvents = remember(state.recentEvents, selectedSource) {
        if (selectedSource == "All") state.recentEvents
        else state.recentEvents.filter { it.source == selectedSource }
    }

    val filteredGroupedTargets = remember(state.groupedBlockedTargets, selectedSource) {
        if (selectedSource == "All") state.groupedBlockedTargets
        else state.groupedBlockedTargets.filter {
            it.sources.contains(selectedSource) || it.latestSource == selectedSource
        }
    }

    val savedFormatted = remember(state.estimatedSavedAmount) {
        "₦" + NumberFormat.getIntegerInstance(Locale("en", "NG")).format(state.estimatedSavedAmount)
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
            // Item 0: Progress Header & Betting-Free Hero Card
            item {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Goals & Rate Limits",
                                style = MaterialTheme.typography.headlineMedium,
                                color = MaterialTheme.colorScheme.onBackground,
                            )
                            Text(
                                text = "Burst cooldowns, recovery goals, streak & shield logs",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        if (state.recentEvents.isNotEmpty()) {
                            OutlinedButton(
                                onClick = onClearHistory,
                                shape = RoundedCornerShape(50),
                                border = BorderStroke(1.dp, liquid.subtleBorder),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    contentColor = MaterialTheme.colorScheme.onBackground,
                                ),
                                modifier = Modifier.testTag("clear_activity_button"),
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.DeleteOutline,
                                    contentDescription = "Clear log",
                                    modifier = Modifier.size(16.dp),
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Clear")
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    LiquidGlassCard(
                        modifier = Modifier.fillMaxWidth(),
                        contentPadding = 20.dp,
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column {
                                Text(
                                    text = "BETTING-FREE STREAK",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "${state.cleanDays} Day${if (state.cleanDays == 1) "" else "s"}",
                                    style = MaterialTheme.typography.displayMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onBackground,
                                    modifier = Modifier.testTag("progress_clean_days"),
                                )
                            }
                            Column(
                                horizontalAlignment = Alignment.End,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(liquid.mutedFill)
                                    .border(1.dp, liquid.subtleBorder, RoundedCornerShape(16.dp))
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                            ) {
                                Text(
                                    text = String.format(
                                        Locale.US,
                                        "%02dh : %02dm : %02ds",
                                        state.cleanHoursRemainder,
                                        state.cleanMinutesRemainder,
                                        state.cleanSecondsRemainder,
                                    ),
                                    fontFamily = MonoFontFamily,
                                    fontWeight = FontWeight.SemiBold,
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.onBackground,
                                )
                                Text(
                                    text = "Next: ${state.nextMilestone.title}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Monochrome Milestone Progress Bar
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(50))
                                .background(liquid.mutedFill)
                                .border(1.dp, liquid.subtleBorder, RoundedCornerShape(50)),
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth(state.milestoneProgressFraction.coerceAtLeast(0.03f))
                                    .fillMaxHeight()
                                    .clip(RoundedCornerShape(50))
                                    .background(liquid.activeFill),
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            ProgressMiniStat(
                                label = "Est. Saved",
                                value = savedFormatted,
                                modifier = Modifier.weight(1f),
                            )
                            ProgressMiniStat(
                                label = "Urges Resisted",
                                value = "${state.totalUrgeResistedCount}",
                                modifier = Modifier.weight(1f),
                            )
                            ProgressMiniStat(
                                label = "Blocked",
                                value = "${state.totalBlockedCount}",
                                modifier = Modifier.weight(1f),
                            )
                        }

                        if (state.settings.bankedUrgeSavingsNgn > 0) {
                            Spacer(modifier = Modifier.height(8.dp))
                            val bankedFormatted = remember(state.settings.bankedUrgeSavingsNgn) {
                                "₦" + NumberFormat.getIntegerInstance(Locale("en", "NG"))
                                    .format(state.settings.bankedUrgeSavingsNgn)
                            }
                            Text(
                                text = "Includes $bankedFormatted banked across ${state.settings.bankedUrgeCount} resisted urges",
                                style = MaterialTheme.typography.labelSmall,
                                color = liquid.accentInk,
                                fontWeight = FontWeight.Medium,
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedButton(
                            onClick = onShareStreak,
                            shape = RoundedCornerShape(50),
                            border = BorderStroke(1.dp, liquid.glassBorder),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = liquid.softAccentFill,
                                contentColor = liquid.accentInk,
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(42.dp)
                                .testTag("progress_share_streak_button"),
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Share,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Share Clean Streak",
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.SemiBold,
                            )
                        }
                    }
                }
            }

            // Item 0B: Sliding-Window Rate Limiter & Cooldown Control Center
            item {
                val rl = state.rateLimitStatus
                val burstPresets = listOf(2, 3, 5)
                val dailyPresets = listOf(5, 10, 20)
                val cooldownPresets = listOf(5, 15, 30, 60)

                LiquidGlassCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("rate_limiter_control_card"),
                    fillColor = if (rl.isInCooldown) liquid.softAccentFill else liquid.glassFill,
                    borderColor = if (rl.isInCooldown) liquid.activeFill.copy(alpha = 0.45f) else liquid.glassBorder,
                    contentPadding = 18.dp,
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "RATE LIMITING & COOLDOWN",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = liquid.accentInk,
                            )
                            Text(
                                text = if (rl.isInCooldown) {
                                    "Cooldown Active • ${RateLimiterEngine.formatCooldownMmSs(rl.cooldownRemainingMs)}"
                                } else {
                                    "Burst Attempt Limiter"
                                },
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onBackground,
                            )
                        }
                        Switch(
                            checked = state.settings.rateLimitEnabled,
                            onCheckedChange = onToggleRateLimit,
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = liquid.activeContent,
                                checkedTrackColor = liquid.activeFill,
                            ),
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        ProgressMiniStat(
                            label = "10m Burst",
                            value = "${rl.attemptsInWindow}/${rl.effectiveBurstLimit}",
                            modifier = Modifier.weight(1f),
                        )
                        ProgressMiniStat(
                            label = "Daily Cap",
                            value = "${rl.attemptsToday}/${rl.dailyAttemptCap}",
                            modifier = Modifier.weight(1f),
                        )
                        ProgressMiniStat(
                            label = "Cooldown",
                            value = if (rl.isInCooldown) RateLimiterEngine.formatCooldownMmSs(rl.cooldownRemainingMs) else "${state.settings.cooldownMinutes}m",
                            modifier = Modifier.weight(1f),
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Max attempts per 10 min",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        burstPresets.forEach { preset ->
                            val selected = state.settings.maxAttemptsPer10Min == preset
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (selected) liquid.activeFill else liquid.mutedFill)
                                    .border(1.dp, if (selected) liquid.activeFill else liquid.subtleBorder, RoundedCornerShape(12.dp))
                                    .clickable {
                                        onUpdateRateLimitThresholds(
                                            preset,
                                            state.settings.dailyAttemptCap,
                                            state.settings.cooldownMinutes,
                                        )
                                    }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = "$preset / 10m",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (selected) liquid.activeContent else MaterialTheme.colorScheme.onSurface,
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Daily attempt cap",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        dailyPresets.forEach { cap ->
                            val selected = state.settings.dailyAttemptCap == cap
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (selected) liquid.activeFill else liquid.mutedFill)
                                    .border(1.dp, if (selected) liquid.activeFill else liquid.subtleBorder, RoundedCornerShape(12.dp))
                                    .clickable {
                                        onUpdateRateLimitThresholds(
                                            state.settings.maxAttemptsPer10Min,
                                            cap,
                                            state.settings.cooldownMinutes,
                                        )
                                    }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = "$cap / day",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (selected) liquid.activeContent else MaterialTheme.colorScheme.onSurface,
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Cooldown lockout duration",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        cooldownPresets.forEach { mins ->
                            val selected = state.settings.cooldownMinutes == mins
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (selected) liquid.activeFill else liquid.mutedFill)
                                    .border(1.dp, if (selected) liquid.activeFill else liquid.subtleBorder, RoundedCornerShape(12.dp))
                                    .clickable {
                                        onUpdateRateLimitThresholds(
                                            state.settings.maxAttemptsPer10Min,
                                            state.settings.dailyAttemptCap,
                                            mins,
                                        )
                                    }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = "${mins}m",
                                    style = MaterialTheme.typography.labelMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (selected) liquid.activeContent else MaterialTheme.colorScheme.onSurface,
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "High-Risk Schedule Strictness (-1 burst limit when active)",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        listOf(
                            Triple("Late Night", state.settings.lateNightGuardEnabled) {
                                onUpdateHighRiskSchedule(
                                    !state.settings.lateNightGuardEnabled,
                                    state.settings.matchdayGuardEnabled,
                                    state.settings.paydayGuardEnabled,
                                )
                            },
                            Triple("Matchday", state.settings.matchdayGuardEnabled) {
                                onUpdateHighRiskSchedule(
                                    state.settings.lateNightGuardEnabled,
                                    !state.settings.matchdayGuardEnabled,
                                    state.settings.paydayGuardEnabled,
                                )
                            },
                            Triple("Payday", state.settings.paydayGuardEnabled) {
                                onUpdateHighRiskSchedule(
                                    state.settings.lateNightGuardEnabled,
                                    state.settings.matchdayGuardEnabled,
                                    !state.settings.paydayGuardEnabled,
                                )
                            },
                        ).forEach { (label, active, toggle) ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (active) liquid.softAccentFill else liquid.mutedFill)
                                    .border(1.dp, if (active) liquid.activeFill else liquid.subtleBorder, RoundedCornerShape(12.dp))
                                    .clickable(onClick = toggle)
                                    .padding(vertical = 8.dp, horizontal = 6.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = label,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (active) liquid.accentInk else MaterialTheme.colorScheme.onSurfaceVariant,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Button(
                            onClick = onSimulateRateLimitAttempt,
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = liquid.activeFill,
                                contentColor = liquid.activeContent,
                            ),
                            shape = RoundedCornerShape(14.dp),
                        ) {
                            Text("Test Burst Limit", maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        if (rl.isInCooldown) {
                            OutlinedButton(
                                onClick = onClearCooldown,
                                border = BorderStroke(1.dp, liquid.subtleBorder),
                                shape = RoundedCornerShape(14.dp),
                            ) {
                                Text("Reset")
                            }
                        }
                    }
                }
            }

            // Item 0C: Recovery Goals CRUD Card
            item {
                var showAddGoalForm by remember { mutableStateOf(false) }
                var goalTitle by remember { mutableStateOf("") }
                var goalCategory by remember { mutableStateOf(GoalCategory.STREAK) }
                var goalTargetDays by remember { mutableStateOf("30") }
                var goalTargetAmount by remember { mutableStateOf("150000") }
                var goalWhyNote by remember { mutableStateOf("") }
                val nairaFmt = remember { NumberFormat.getIntegerInstance(Locale("en", "NG")) }

                LiquidGlassCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("recovery_goals_card"),
                    contentPadding = 18.dp,
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "GOAL SETTING",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = liquid.accentInk,
                            )
                            Text(
                                text = "Recovery Goals (${state.settings.goals.size})",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onBackground,
                            )
                        }
                        OutlinedButton(
                            onClick = { showAddGoalForm = !showAddGoalForm },
                            border = BorderStroke(1.dp, liquid.subtleBorder),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Add,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp),
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(if (showAddGoalForm) "Close" else "New Goal")
                        }
                    }

                    if (showAddGoalForm) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(liquid.mutedFill)
                                .border(1.dp, liquid.subtleBorder, RoundedCornerShape(16.dp))
                                .padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                            ) {
                                GoalCategory.entries.forEach { cat ->
                                    val selected = goalCategory == cat
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(if (selected) liquid.activeFill else liquid.glassFill)
                                            .border(1.dp, if (selected) liquid.activeFill else liquid.subtleBorder, RoundedCornerShape(10.dp))
                                            .clickable { goalCategory = cat }
                                            .padding(vertical = 7.dp),
                                        contentAlignment = Alignment.Center,
                                    ) {
                                        Text(
                                            text = cat.label,
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.SemiBold,
                                            color = if (selected) liquid.activeContent else MaterialTheme.colorScheme.onSurface,
                                        )
                                    }
                                }
                            }

                            OutlinedTextField(
                                value = goalTitle,
                                onValueChange = { goalTitle = it },
                                label = { Text("Goal title (e.g. 30 Days Bet-Free)") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                            )

                            if (goalCategory == GoalCategory.SAVINGS) {
                                OutlinedTextField(
                                    value = goalTargetAmount,
                                    onValueChange = { goalTargetAmount = it.filter(Char::isDigit).take(9) },
                                    label = { Text("Savings target (₦)") },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                )
                            } else {
                                OutlinedTextField(
                                    value = goalTargetDays,
                                    onValueChange = { goalTargetDays = it.filter(Char::isDigit).take(3) },
                                    label = { Text("Target clean days") },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                )
                            }

                            OutlinedTextField(
                                value = goalWhyNote,
                                onValueChange = { goalWhyNote = it },
                                label = { Text("Personal Why (optional)") },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                            )

                            Button(
                                onClick = {
                                    val days = goalTargetDays.toIntOrNull()?.coerceIn(1, 730) ?: 30
                                    val amount = if (goalCategory == GoalCategory.SAVINGS) {
                                        goalTargetAmount.toIntOrNull()?.coerceIn(1000, 100_000_000) ?: 100_000
                                    } else {
                                        0
                                    }
                                    onAddGoal(goalTitle, goalCategory, days, amount, goalWhyNote)
                                    if (goalTitle.trim().length >= 3) {
                                        goalTitle = ""
                                        goalWhyNote = ""
                                        showAddGoalForm = false
                                    }
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = liquid.activeFill,
                                    contentColor = liquid.activeContent,
                                ),
                                shape = RoundedCornerShape(12.dp),
                            ) {
                                Text("Save Recovery Goal", fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    if (state.settings.goals.isEmpty()) {
                        Text(
                            text = "No personal goals yet. Tap a preset below or create your own target:",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            OutlinedButton(
                                onClick = {
                                    onAddGoal("30 Days Bet-Free", GoalCategory.STREAK, 30, 0, "Build lasting freedom")
                                },
                                modifier = Modifier.weight(1f),
                                border = BorderStroke(1.dp, liquid.subtleBorder),
                                shape = RoundedCornerShape(12.dp),
                            ) {
                                Text("30d Streak", maxLines = 1, overflow = TextOverflow.Ellipsis)
                            }
                            OutlinedButton(
                                onClick = {
                                    onAddGoal("Save ₦150,000", GoalCategory.SAVINGS, 30, 150_000, "Keep money in my pocket")
                                },
                                modifier = Modifier.weight(1f),
                                border = BorderStroke(1.dp, liquid.subtleBorder),
                                shape = RoundedCornerShape(12.dp),
                            ) {
                                Text("Save ₦150k", maxLines = 1, overflow = TextOverflow.Ellipsis)
                            }
                        }
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            state.settings.goals.forEach { goal ->
                                val progress = if (goal.category == GoalCategory.SAVINGS && goal.targetAmountNgn > 0) {
                                    (state.estimatedSavedAmount.toFloat() / goal.targetAmountNgn.toFloat()).coerceIn(0f, 1f)
                                } else {
                                    (state.cleanExactDays / goal.targetDays.coerceAtLeast(1).toFloat()).coerceIn(0f, 1f)
                                }
                                val pct = if (goal.isCompleted) 100 else (progress * 100f).toInt().coerceIn(0, 100)

                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(if (goal.isPrimary) liquid.softAccentFill else liquid.mutedFill)
                                        .border(
                                            1.dp,
                                            if (goal.isPrimary) liquid.activeFill.copy(alpha = 0.45f) else liquid.subtleBorder,
                                            RoundedCornerShape(16.dp),
                                        )
                                        .padding(12.dp),
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                    ) {
                                        Row(
                                            modifier = Modifier.weight(1f),
                                            verticalAlignment = Alignment.CenterVertically,
                                        ) {
                                            Icon(
                                                imageVector = if (goal.isCompleted) Icons.Rounded.CheckBox else Icons.Rounded.CheckBoxOutlineBlank,
                                                contentDescription = "Toggle complete",
                                                tint = if (goal.isCompleted) liquid.activeFill else MaterialTheme.colorScheme.onSurfaceVariant,
                                                modifier = Modifier
                                                    .size(20.dp)
                                                    .clickable { onToggleGoalCompleted(goal.id) },
                                            )
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = goal.title,
                                                    style = MaterialTheme.typography.bodyMedium,
                                                    fontWeight = FontWeight.Bold,
                                                    color = MaterialTheme.colorScheme.onSurface,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis,
                                                )
                                                Text(
                                                    text = if (goal.category == GoalCategory.SAVINGS && goal.targetAmountNgn > 0) {
                                                        "₦${nairaFmt.format(state.estimatedSavedAmount)} / ₦${nairaFmt.format(goal.targetAmountNgn)} • $pct%"
                                                    } else {
                                                        "Day ${state.cleanDays} / ${goal.targetDays}d • $pct%"
                                                    },
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                                )
                                            }
                                        }
                                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            Icon(
                                                imageVector = if (goal.isPrimary) Icons.Rounded.Star else Icons.Rounded.StarOutline,
                                                contentDescription = "Pin primary goal",
                                                tint = if (goal.isPrimary) liquid.activeFill else MaterialTheme.colorScheme.onSurfaceVariant,
                                                modifier = Modifier
                                                    .size(20.dp)
                                                    .clickable { onSetPrimaryGoal(goal.id) },
                                            )
                                            Icon(
                                                imageVector = Icons.Rounded.DeleteOutline,
                                                contentDescription = "Delete goal",
                                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                                modifier = Modifier
                                                    .size(20.dp)
                                                    .clickable { onDeleteGoal(goal.id) },
                                            )
                                        }
                                    }
                                    if (goal.whyNote.isNotBlank()) {
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = goal.whyNote,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(5.dp)
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(liquid.glassFill),
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth((if (goal.isCompleted) 1f else progress).coerceAtLeast(0.04f))
                                                .height(5.dp)
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(liquid.activeFill),
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Item 1: Interactive Visual Progress Chart (Tour Target)
            item {
                LiquidGlassCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .tourTarget(TourTargetKeys.PROGRESS_DASHBOARD),
                    contentPadding = 18.dp,
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (selectedChartMode == 0) "Betting-Free Trajectory" else "7-Day Intercepts",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onBackground,
                            )
                            Text(
                                text = if (selectedChartMode == 0) {
                                    "Touch & scrub across milestones"
                                } else {
                                    "${state.todayBlockedCount} today • ${state.totalBlockedCount} total"
                                },
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Monochrome Chart Switcher Pills
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        ChartModePill(
                            label = "Days & Savings",
                            selected = selectedChartMode == 0,
                            onClick = { selectedChartMode = 0 },
                            modifier = Modifier.weight(1f),
                            testTag = "chart_mode_days",
                        )
                        ChartModePill(
                            label = "7-Day Blocks",
                            selected = selectedChartMode == 1,
                            onClick = { selectedChartMode = 1 },
                            modifier = Modifier.weight(1f),
                            testTag = "chart_mode_blocks",
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    if (selectedChartMode == 0) {
                        BettingFreeProgressChart(
                            cleanDays = state.cleanDays,
                            cleanHoursRemainder = state.cleanHoursRemainder,
                            dailySpendEstimate = state.settings.dailyBetSpendEstimate,
                            nextMilestoneDay = state.nextMilestone.days,
                        )
                    } else {
                        InteractiveBlockedBarChart(
                            stats = state.sevenDayStats,
                        )
                    }
                }
            }

            // Item 2: Recovery Milestones (Clean Flat List — Zero Pill Badges)
            item {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = 18.dp,
                ) {
                    LiquidSectionHeader(
                        title = "Recovery Milestones",
                        subtitle = "Progress updates automatically as your betting-free days climb",
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        RECOVERY_MILESTONES.forEach { milestone ->
                            val unlocked = state.cleanDays >= milestone.days
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (unlocked) liquid.softAccentFill else liquid.controlFill)
                                    .border(
                                        1.dp,
                                        if (unlocked) liquid.glassBorder else liquid.subtleBorder,
                                        RoundedCornerShape(12.dp),
                                    )
                                    .padding(horizontal = 12.dp, vertical = 9.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = if (unlocked) Icons.Rounded.CheckCircle else Icons.Rounded.Lock,
                                        contentDescription = null,
                                        tint = if (unlocked) liquid.accentInk else MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.size(16.dp),
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = milestone.title,
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = if (unlocked) FontWeight.SemiBold else FontWeight.Medium,
                                        color = if (unlocked) MaterialTheme.colorScheme.onBackground else MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                                Text(
                                    text = milestone.label,
                                    fontFamily = MonoFontFamily,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = if (unlocked) liquid.accentInk else MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }
                }
            }

            // Item 3: Urge Resistance & Trigger Insights
            item {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = 18.dp,
                ) {
                    LiquidSectionHeader(
                        title = "Urge Journal & Triggers",
                        subtitle = "${state.totalUrgeResistedCount} urge victories recorded on-device",
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    if (state.triggerBreakdown.isNotEmpty()) {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                        ) {
                            state.triggerBreakdown.forEach { item ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(liquid.controlFill)
                                        .border(1.dp, liquid.subtleBorder, RoundedCornerShape(12.dp))
                                        .padding(horizontal = 12.dp, vertical = 8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Text(
                                        text = item.triggerTag,
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onBackground,
                                    )
                                    Text(
                                        text = "${item.count} logged",
                                        fontFamily = MonoFontFamily,
                                        fontWeight = FontWeight.Bold,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = liquid.accentInk,
                                    )
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                    } else {
                        Text(
                            text = "When you pass on a betting urge, log what triggered it to recognize patterns and protect peak times.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Button(
                            onClick = onOpenUrgeJournal,
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .testTag("progress_log_urge_button"),
                            shape = RoundedCornerShape(50),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = liquid.activeFill,
                                contentColor = liquid.activeContent,
                            ),
                            elevation = ButtonDefaults.buttonElevation(0.dp, 0.dp),
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.EditNote,
                                contentDescription = null,
                                modifier = Modifier.size(17.dp),
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Log Urge Victory", maxLines = 1)
                        }
                        OutlinedButton(
                            onClick = onLaunchCalmReset,
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp),
                            shape = RoundedCornerShape(50),
                            border = BorderStroke(1.dp, liquid.subtleBorder),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = MaterialTheme.colorScheme.onBackground,
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
                    }
                }
            }

            // Category Breakdown
            if (state.categoryBreakdown.isNotEmpty()) {
                item {
                    LiquidGlassCard(
                        modifier = Modifier.fillMaxWidth(),
                        contentPadding = 18.dp,
                    ) {
                        LiquidSectionHeader(
                            title = "Blocked by Category",
                            subtitle = "Recent distribution",
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                        ) {
                            state.categoryBreakdown.forEach { entry ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(liquid.controlFill)
                                        .border(1.dp, liquid.subtleBorder, RoundedCornerShape(12.dp))
                                        .padding(horizontal = 12.dp, vertical = 8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Text(
                                        text = entry.category.displayName,
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.onBackground,
                                    )
                                    Text(
                                        text = "${entry.count}",
                                        fontFamily = MonoFontFamily,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = liquid.accentInk,
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Blocked Sites & Apps Header + By Site & App / Timeline Mode Switcher
            item {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = 16.dp,
                ) {
                    val groupedCount = filteredGroupedTargets.size
                    val subtitleText = if (groupedCount > 0) {
                        "${state.totalBlockedCount} total attempts across $groupedCount unique site${if (groupedCount == 1) "" else "s"} & app${if (groupedCount == 1) "" else "s"}"
                    } else {
                        "Intercepted betting websites, in-app WebViews, ads & apps"
                    }
                    LiquidSectionHeader(
                        title = "Blocked Sites & Apps",
                        subtitle = subtitleText,
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        ChartModePill(
                            label = "By Site & App",
                            selected = logViewMode == 0,
                            onClick = { logViewMode = 0 },
                            modifier = Modifier.weight(1f),
                            testTag = "log_mode_grouped",
                        )
                        ChartModePill(
                            label = "Timeline",
                            selected = logViewMode == 1,
                            onClick = { logViewMode = 1 },
                            modifier = Modifier.weight(1f),
                            testTag = "log_mode_timeline",
                        )
                    }
                }
            }

            // Source Filter Pills
            item {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    sourceOptions.forEach { source ->
                        val selected = selectedSource == source
                        LiquidGlassCard(
                            cornerRadius = 50.dp,
                            fillColor = if (selected) liquid.activeFill else liquid.controlFill,
                            borderColor = if (selected) liquid.activeFill else liquid.glassBorder,
                            contentPadding = 0.dp,
                            onClick = { selectedSource = source },
                            modifier = Modifier.testTag("filter_source_${source.lowercase().replace(" ", "_")}"),
                        ) {
                            Text(
                                text = source,
                                style = MaterialTheme.typography.labelMedium,
                                color = if (selected) liquid.activeContent else MaterialTheme.colorScheme.onBackground,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp),
                            )
                        }
                    }
                }
            }

            // Event List or Empty State
            val isListEmpty = if (logViewMode == 0) filteredGroupedTargets.isEmpty() else filteredEvents.isEmpty()
            if (isListEmpty) {
                item {
                    LiquidGlassCard(
                        modifier = Modifier.fillMaxWidth(),
                        contentPadding = 28.dp,
                    ) {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(56.dp)
                                    .clip(RoundedCornerShape(18.dp))
                                    .background(liquid.mutedFill),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Shield,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onBackground,
                                    modifier = Modifier.size(28.dp),
                                )
                            }
                            Spacer(modifier = Modifier.height(14.dp))
                            Text(
                                text = "All Quiet Here",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onBackground,
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "When GambleAware intercepts a gambling site, in-app WebView, ad popunder, or betting app, it will appear here.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center,
                            )
                        }
                    }
                }
            } else if (logViewMode == 0) {
                items(filteredGroupedTargets, key = { it.key }) { site ->
                    GroupedBlockedTargetRow(
                        site = site,
                        nowMs = state.currentTimeMs,
                    )
                }
            } else {
                items(filteredEvents, key = { it.id }) { event ->
                    BlockedEventRow(event = event)
                }
            }

            // Footer
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
private fun ProgressMiniStat(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    val liquid = LocalLiquidColors.current
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(liquid.mutedFill)
            .border(1.dp, liquid.subtleBorder, RoundedCornerShape(16.dp))
            .padding(horizontal = 10.dp, vertical = 10.dp),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
        )
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = value,
            fontFamily = MonoFontFamily,
            fontWeight = FontWeight.Bold,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onBackground,
            maxLines = 1,
        )
    }
}

@Composable
private fun ChartModePill(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    testTag: String,
) {
    val liquid = LocalLiquidColors.current
    LiquidGlassCard(
        modifier = modifier.testTag(testTag),
        cornerRadius = 50.dp,
        fillColor = if (selected) liquid.activeFill else liquid.controlFill,
        borderColor = if (selected) liquid.activeFill else liquid.subtleBorder,
        contentPadding = 10.dp,
        onClick = onClick,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = if (selected) liquid.activeContent else MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.align(Alignment.CenterHorizontally),
        )
    }
}

@Composable
private fun GroupedBlockedTargetRow(
    site: GroupedBlockedTarget,
    nowMs: Long,
) {
    val liquid = LocalLiquidColors.current
    val timeText = formatBlockedRelativeTime(site.latestTimestamp, nowMs)
    val sourceSummary = site.sources.joinToString(", ")

    LiquidGlassCard(
        modifier = Modifier.fillMaxWidth(),
        cornerRadius = 20.dp,
        contentPadding = 14.dp,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BettingBrandLogo(
                target = site.target,
                size = 40.dp,
                cornerRadius = 12.dp,
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = formatBlockedTargetDisplay(site.target),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onBackground,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = "$sourceSummary • ${site.categoryName} • $timeText",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = formatAttemptCountLabel(site.attemptCount),
                fontFamily = MonoFontFamily,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = liquid.accentInk,
            )
        }
    }
}

@Composable
private fun BlockedEventRow(event: BlockedEventEntity) {
    val timeText = remember(event.timestamp) {
        SimpleDateFormat("MMM d, h:mm a", Locale.getDefault()).format(Date(event.timestamp))
    }

    LiquidGlassCard(
        modifier = Modifier.fillMaxWidth(),
        cornerRadius = 20.dp,
        contentPadding = 14.dp,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BettingBrandLogo(
                target = event.target,
                size = 40.dp,
                cornerRadius = 12.dp,
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = formatBlockedTargetDisplay(event.target),
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onBackground,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    text = "${event.source} • ${event.categoryName} • $timeText",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}
