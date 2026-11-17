package com.example.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateRectAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Air
import androidx.compose.material.icons.rounded.Insights
import androidx.compose.material.icons.rounded.Language
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.LocalLiquidColors
import kotlin.math.roundToInt

object TourTargetKeys {
    const val SHIELD_ORB = "shield_orb"
    const val SOS_CALM_BAR = "sos_calm_bar"
    const val FILTER_TESTER = "filter_tester"
    const val BLOCKLIST_GUARDS = "blocklist_guards"
    const val PROGRESS_DASHBOARD = "progress_dashboard"
    const val LOCK_TIMER = "lock_timer"
}

/**
 * Registry holding live root-space bounds of interactive elements across screens
 * so the Spotlight In-App Tour can automatically select & highlight them.
 */
class TourTargetRegistry {
    val boundsByKey = mutableStateMapOf<String, Rect>()

    fun update(key: String, rect: Rect) {
        if (!rect.isEmpty) {
            boundsByKey[key] = rect
        }
    }
}

val LocalTourTargets = staticCompositionLocalOf<TourTargetRegistry?> { null }

@Composable
fun Modifier.tourTarget(key: String): Modifier {
    val registry = LocalTourTargets.current ?: return this
    return this.onGloballyPositioned { coords ->
        if (coords.isAttached) {
            registry.update(key, coords.boundsInRoot())
        }
    }
}

data class SpotlightTourStep(
    val id: String,
    val route: String,
    val targetKey: String,
    val badge: String,
    val title: String,
    val body: String,
    val icon: ImageVector,
    val highlights: List<String>,
)

val SPOTLIGHT_TOUR_STEPS = listOf(
    SpotlightTourStep(
        id = "shield_orb",
        route = "shield",
        targetKey = TourTargetKeys.SHIELD_ORB,
        badge = "1 OF 6 • LIVE SHIELD",
        title = "One-Tap Monochrome Shield",
        body = "Tap this chronograph orb anytime to inspect or arm GambleAware's zero-VPN Web, Search & App Shield.",
        icon = Icons.Rounded.Shield,
        highlights = listOf("Zero VPN", "Instant Blocking"),
    ),
    SpotlightTourStep(
        id = "sos_calm_bar",
        route = "shield",
        targetKey = TourTargetKeys.SOS_CALM_BAR,
        badge = "2 OF 6 • URGE SUPPORT",
        title = "SOS 60s Calm Reset & Urge Log",
        body = "Feeling tempted? Start a guided 60-second breathing reset or log a resisted urge to track triggers.",
        icon = Icons.Rounded.Air,
        highlights = listOf("60s Breathing", "Trigger Journal"),
    ),
    SpotlightTourStep(
        id = "filter_tester",
        route = "shield",
        targetKey = TourTargetKeys.FILTER_TESTER,
        badge = "3 OF 6 • DEFAULT BLOCKING",
        title = "SportyBet & 350+ Sites Blocked Live",
        body = "We auto-selected \"sportybet.com\" here to show instant blocking. SportyBet, Bet9ja, BetKing, 1xBet, Bet365 & Stake are blocked by default.",
        icon = Icons.Rounded.Search,
        highlights = listOf("SportyBet", "Bet9ja", "1xBet", "Bet365"),
    ),
    SpotlightTourStep(
        id = "blocklist_guards",
        route = "blocklist",
        targetKey = TourTargetKeys.BLOCKLIST_GUARDS,
        badge = "4 OF 6 • REAL-TIME GUARDS",
        title = "WebView, Search & APK Install Guard",
        body = "Blocks Chrome, Custom Tabs, social WebViews, betting searches & newly installed betting APKs. All 5 gambling categories start ON by default.",
        icon = Icons.Rounded.Language,
        highlights = listOf("Search Guard", "WebView Guard", "Install Guard"),
    ),
    SpotlightTourStep(
        id = "progress_dashboard",
        route = "activity",
        targetKey = TourTargetKeys.PROGRESS_DASHBOARD,
        badge = "5 OF 6 • VISUAL PROGRESS",
        title = "Betting-Free Days Chart",
        body = "Scrub across the interactive monochrome chart to inspect your betting-free days, money saved, and milestone badges.",
        icon = Icons.Rounded.Insights,
        highlights = listOf("Days Clean", "Milestones", "Est. Saved"),
    ),
    SpotlightTourStep(
        id = "lock_timer",
        route = "lock",
        targetKey = TourTargetKeys.LOCK_TIMER,
        badge = "6 OF 6 • ANTI-UNINSTALL LOCK",
        title = "Lock Uninstalls Until Timer Ends",
        body = "Choose 1 to 90 days and enable Device Admin. GambleAware prevents uninstalls or tampering until the countdown reaches zero.",
        icon = Icons.Rounded.Lock,
        highlights = listOf("Anti-Uninstall", "4-Digit PIN"),
    ),
)

/**
 * Interactive Spotlight Coachmark Overlay that auto-navigates tabs, auto-scrolls,
 * highlights live elements with a clear cutout spotlight, and floats the teaching card beside them.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SpotlightTourOverlay(
    tourRegistry: TourTargetRegistry,
    onSelectStep: (SpotlightTourStep) -> Unit,
    onDismissTour: () -> Unit,
    onFinishAndEnableShield: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val liquid = LocalLiquidColors.current
    val density = LocalDensity.current
    var stepIndex by remember { mutableIntStateOf(0) }
    val step = SPOTLIGHT_TOUR_STEPS[stepIndex]
    val isLastStep = stepIndex == SPOTLIGHT_TOUR_STEPS.lastIndex

    LaunchedEffect(stepIndex) {
        onSelectStep(step)
    }

    val rawTargetRect = tourRegistry.boundsByKey[step.targetKey]

    BoxWithConstraints(
        modifier = modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectTapGestures { /* Consume background taps during tour */ }
            }
            .testTag("guided_tour_overlay"),
    ) {
        val rootWidthPx = with(density) { maxWidth.toPx() }
        val rootHeightPx = with(density) { maxHeight.toPx() }
        val padPx = with(density) { 8.dp.toPx() }

        val targetRect = remember(rawTargetRect, rootWidthPx, rootHeightPx) {
            if (rawTargetRect != null && !rawTargetRect.isEmpty) {
                Rect(
                    left = (rawTargetRect.left - padPx).coerceIn(0f, rootWidthPx),
                    top = (rawTargetRect.top - padPx).coerceIn(0f, rootHeightPx),
                    right = (rawTargetRect.right + padPx).coerceIn(0f, rootWidthPx),
                    bottom = (rawTargetRect.bottom + padPx).coerceIn(0f, rootHeightPx),
                )
            } else {
                Rect(
                    left = rootWidthPx * 0.5f,
                    top = rootHeightPx * 0.25f,
                    right = rootWidthPx * 0.5f,
                    bottom = rootHeightPx * 0.25f,
                )
            }
        }

        val animatedRect by animateRectAsState(
            targetValue = targetRect,
            animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
            label = "spotlight_rect",
        )

        val hasSpotlight = rawTargetRect != null && !rawTargetRect.isEmpty &&
            animatedRect.width > 12f && animatedRect.height > 12f

        val ink = MaterialTheme.colorScheme.onBackground
        val scrimColor = if (liquid.isDark) {
            Color(0xD8000000)
        } else {
            Color(0xC4000000)
        }

        // Translucent Dark Scrim with Live Cutout Spotlight Hole
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen },
        ) {
            drawRect(color = scrimColor)
            if (hasSpotlight) {
                val radius = CornerRadius(24.dp.toPx(), 24.dp.toPx())
                drawRoundRect(
                    color = Color.Transparent,
                    topLeft = Offset(animatedRect.left, animatedRect.top),
                    size = Size(animatedRect.width, animatedRect.height),
                    cornerRadius = radius,
                    blendMode = BlendMode.Clear,
                )
                drawRoundRect(
                    color = Color.White,
                    topLeft = Offset(animatedRect.left, animatedRect.top),
                    size = Size(animatedRect.width, animatedRect.height),
                    cornerRadius = radius,
                    style = Stroke(width = 2.dp.toPx()),
                )
            }
        }

        // Top Skip Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .safeDrawingPadding()
                .padding(horizontal = 18.dp, vertical = 8.dp)
                .align(Alignment.TopCenter),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .background(liquid.glassFill)
                    .border(1.dp, liquid.glassBorder, RoundedCornerShape(50))
                    .padding(horizontal = 14.dp, vertical = 7.dp),
            ) {
                Text(
                    text = "GambleAware Tour",
                    style = MaterialTheme.typography.labelLarge,
                    color = ink,
                )
            }
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .background(liquid.glassFill)
                    .border(1.dp, liquid.glassBorder, RoundedCornerShape(50)),
            ) {
                TextButton(
                    onClick = onDismissTour,
                    modifier = Modifier.testTag("tour_skip_button"),
                ) {
                    Text(
                        text = "Skip",
                        style = MaterialTheme.typography.labelLarge,
                        color = ink,
                    )
                }
            }
        }

        // Place Coachmark Card smartly below or above the spotlighted element
        val placeBelow = if (hasSpotlight) {
            val spaceBelow = rootHeightPx - animatedRect.bottom
            val spaceAbove = animatedRect.top
            spaceBelow >= spaceAbove || spaceBelow > with(density) { 270.dp.toPx() }
        } else {
            true
        }

        val cardAlignment = if (!hasSpotlight) {
            Alignment.Center
        } else if (placeBelow) {
            Alignment.TopCenter
        } else {
            Alignment.BottomCenter
        }

        val verticalOffsetPx = if (!hasSpotlight) {
            0
        } else if (placeBelow) {
            (animatedRect.bottom + with(density) { 12.dp.toPx() })
                .coerceAtMost(rootHeightPx - with(density) { 320.dp.toPx() })
                .coerceAtLeast(with(density) { 76.dp.toPx() })
                .roundToInt()
        } else {
            val distFromBottom = rootHeightPx - animatedRect.top + with(density) { 12.dp.toPx() }
            (-distFromBottom)
                .coerceAtLeast(-(rootHeightPx - with(density) { 360.dp.toPx() }))
                .coerceAtMost(-with(density) { 64.dp.toPx() })
                .roundToInt()
        }

        LiquidGlassCard(
            modifier = Modifier
                .align(cardAlignment)
                .offset { IntOffset(0, verticalOffsetPx) }
                .padding(horizontal = 18.dp)
                .widthIn(max = 460.dp),
            cornerRadius = 28.dp,
            fillColor = MaterialTheme.colorScheme.surface,
            borderColor = liquid.subtleBorder,
            contentPadding = 20.dp,
        ) {
            AnimatedContent(
                targetState = step,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "spotlight_step_content",
            ) { current ->
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(liquid.activeFill),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                imageVector = current.icon,
                                contentDescription = null,
                                tint = liquid.activeContent,
                                modifier = Modifier.size(22.dp),
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = current.badge,
                                style = MaterialTheme.typography.labelSmall,
                                letterSpacing = 1.1.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Text(
                                text = current.title,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onBackground,
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = current.body,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        current.highlights.forEach { tag ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(50))
                                    .background(liquid.mutedFill)
                                    .border(1.dp, liquid.subtleBorder, RoundedCornerShape(50))
                                    .padding(horizontal = 10.dp, vertical = 5.dp),
                            ) {
                                Text(
                                    text = tag,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onBackground,
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Step Progress Indicators
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                SPOTLIGHT_TOUR_STEPS.indices.forEach { idx ->
                    val active = idx == stepIndex
                    Box(
                        modifier = Modifier
                            .padding(horizontal = 3.dp)
                            .height(5.dp)
                            .width(if (active) 22.dp else 7.dp)
                            .clip(RoundedCornerShape(50))
                            .background(if (active) liquid.activeFill else liquid.subtleBorder),
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            if (isLastStep) {
                Button(
                    onClick = onFinishAndEnableShield,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("tour_enable_shield_button"),
                    shape = RoundedCornerShape(50),
                    elevation = ButtonDefaults.buttonElevation(0.dp, 0.dp),
                ) {
                    Text("Enable Web & App Shield")
                }
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    OutlinedButton(
                        onClick = { stepIndex -= 1 },
                        modifier = Modifier
                            .weight(1f)
                            .height(46.dp)
                            .testTag("tour_back_button"),
                        shape = RoundedCornerShape(50),
                        border = BorderStroke(1.dp, liquid.subtleBorder),
                    ) {
                        Text("Back")
                    }
                    OutlinedButton(
                        onClick = onDismissTour,
                        modifier = Modifier
                            .weight(1f)
                            .height(46.dp)
                            .testTag("tour_finish_button"),
                        shape = RoundedCornerShape(50),
                        border = BorderStroke(1.dp, liquid.subtleBorder),
                    ) {
                        Text("Finish")
                    }
                }
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    if (stepIndex > 0) {
                        OutlinedButton(
                            onClick = { stepIndex -= 1 },
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .testTag("tour_back_button"),
                            shape = RoundedCornerShape(50),
                            border = BorderStroke(1.dp, liquid.subtleBorder),
                        ) {
                            Text("Back")
                        }
                    }
                    Button(
                        onClick = { stepIndex += 1 },
                        modifier = Modifier
                            .weight(1.4f)
                            .height(48.dp)
                            .testTag("tour_next_button"),
                        shape = RoundedCornerShape(50),
                        elevation = ButtonDefaults.buttonElevation(0.dp, 0.dp),
                    ) {
                        Text("Next")
                    }
                }
            }
        }
    }
}
