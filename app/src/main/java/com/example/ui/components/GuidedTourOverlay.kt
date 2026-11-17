package com.example.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Air
import androidx.compose.material.icons.rounded.Language
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.LocalLiquidColors

private data class TourStep(
    val stepNumber: Int,
    val badge: String,
    val title: String,
    val body: String,
    val icon: ImageVector,
    val highlights: List<String>,
)

private val TOUR_STEPS = listOf(
    TourStep(
        stepNumber = 1,
        badge = "STEP 1 OF 4",
        title = "Welcome to GambleAware",
        body = "Real-time gambling protection across Chrome, Firefox, Edge, Custom Tabs, and in-app WebViews—without a VPN or battery drain.",
        icon = Icons.Rounded.Shield,
        highlights = listOf("Zero VPN", "Works on Wi-Fi & Data", "100% On-Device"),
    ),
    TourStep(
        stepNumber = 2,
        badge = "STEP 2 OF 4",
        title = "Blocked Automatically by Default",
        body = "SportyBet, Bet9ja, BetKing, MSport, 1xBet, Bet365, Stake, DraftKings, and 350+ betting platforms, search queries, and betting apps are blocked immediately.",
        icon = Icons.Rounded.Language,
        highlights = listOf("SportyBet", "Bet9ja", "BetKing", "1xBet", "Bet365", "Stake"),
    ),
    TourStep(
        stepNumber = 3,
        badge = "STEP 3 OF 4",
        title = "Uninstall Lock Until Timer Ends",
        body = "Enable Web & App Shield, turn on Device Admin Uninstall Lock, and set a Commitment Lock duration. Uninstalling or weakening rules stays locked until your timer hits zero.",
        icon = Icons.Rounded.Lock,
        highlights = listOf("1–90 Day Lock", "Settings Guard", "Play Store Guard"),
    ),
    TourStep(
        stepNumber = 4,
        badge = "STEP 4 OF 4",
        title = "Calm Reset & Accountability",
        body = "Every blocked attempt launches an urge-surfing 60s Calm Reset breathing guide, while your Accountability PIN and Clean Streak keep you on track.",
        icon = Icons.Rounded.Air,
        highlights = listOf("60s Calm Reset", "4-Digit PIN", "Clean Streak"),
    ),
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun GuidedTourOverlay(
    onDismissTour: () -> Unit,
    onFinishAndEnableShield: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val liquid = LocalLiquidColors.current
    var stepIndex by remember { mutableIntStateOf(0) }
    val step = TOUR_STEPS[stepIndex]
    val isLastStep = stepIndex == TOUR_STEPS.lastIndex

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background.copy(alpha = 0.92f))
            .safeDrawingPadding()
            .padding(horizontal = 22.dp, vertical = 18.dp)
            .testTag("guided_tour_overlay"),
    ) {
        // Top Skip Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.TopCenter),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "GambleAware",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onBackground,
            )
            TextButton(
                onClick = onDismissTour,
                modifier = Modifier.testTag("tour_skip_button"),
            ) {
                Text(
                    text = "Skip",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        // Center Liquid Glass Card
        LiquidGlassCard(
            modifier = Modifier
                .widthIn(max = 460.dp)
                .align(Alignment.Center),
            cornerRadius = 30.dp,
            contentPadding = 24.dp,
        ) {
            AnimatedContent(
                targetState = step,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "tour_step_transition",
            ) { current ->
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                            .background(liquid.activeFill),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            imageVector = current.icon,
                            contentDescription = null,
                            tint = liquid.activeContent,
                            modifier = Modifier.size(34.dp),
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = current.badge,
                        style = MaterialTheme.typography.labelSmall,
                        letterSpacing = 1.4.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = current.title,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground,
                        textAlign = TextAlign.Center,
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = current.body,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        current.highlights.forEach { chip ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(50))
                                    .background(liquid.mutedFill)
                                    .border(1.dp, liquid.subtleBorder, RoundedCornerShape(50))
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                            ) {
                                Text(
                                    text = chip,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onBackground,
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(22.dp))

            // Monochrome Capsule Step Indicators
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                TOUR_STEPS.indices.forEach { idx ->
                    val active = idx == stepIndex
                    Box(
                        modifier = Modifier
                            .padding(horizontal = 4.dp)
                            .height(6.dp)
                            .width(if (active) 24.dp else 8.dp)
                            .clip(RoundedCornerShape(50))
                            .background(
                                if (active) liquid.activeFill else liquid.subtleBorder,
                            ),
                    )
                }
            }

            Spacer(modifier = Modifier.height(22.dp))

            if (isLastStep) {
                Button(
                    onClick = onFinishAndEnableShield,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .testTag("tour_enable_shield_button"),
                    shape = RoundedCornerShape(50),
                    elevation = ButtonDefaults.buttonElevation(
                        defaultElevation = 0.dp,
                        pressedElevation = 0.dp,
                    ),
                ) {
                    Text("Enable Web & App Shield")
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
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
                    OutlinedButton(
                        onClick = onDismissTour,
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("tour_finish_button"),
                        shape = RoundedCornerShape(50),
                        border = BorderStroke(1.dp, liquid.subtleBorder),
                    ) {
                        Text("Explore App")
                    }
                }
            } else {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    if (stepIndex > 0) {
                        OutlinedButton(
                            onClick = { stepIndex -= 1 },
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp)
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
                            .height(50.dp)
                            .testTag("tour_next_button"),
                        shape = RoundedCornerShape(50),
                        elevation = ButtonDefaults.buttonElevation(
                            defaultElevation = 0.dp,
                            pressedElevation = 0.dp,
                        ),
                    ) {
                        Text("Next")
                    }
                }
            }
        }

        // Clean Footer Attribution
        Text(
            text = "A product of Imoogle Technology",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 4.dp),
        )
    }
}
