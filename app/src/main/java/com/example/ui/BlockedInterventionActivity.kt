package com.example.ui

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Air
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.ripple
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.MainActivity
import com.example.data.ProtectionPreferences
import com.example.ui.components.BrandGEmblem
import com.example.ui.components.LiquidGlassBackdrop
import com.example.ui.components.LiquidGlassCard
import com.example.ui.theme.AnchorTheme
import com.example.ui.theme.LocalLiquidColors
import kotlinx.coroutines.delay

class BlockedInterventionActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val target = intent.getStringExtra(EXTRA_TARGET) ?: "Gambling site"
        val source = intent.getStringExtra(EXTRA_SOURCE) ?: "GambleAware Shield"
        val category = intent.getStringExtra(EXTRA_CATEGORY) ?: "Protected"
        val isAntiTamper = intent.getBooleanExtra(EXTRA_IS_ANTI_TAMPER, false)
        val autoStartBreathing = intent.getBooleanExtra(EXTRA_START_BREATHING, false)

        val prefs = ProtectionPreferences.getInstance(this).currentSnapshot()
        val days = if (prefs.protectionStartedAtMs > 0L) {
            ((System.currentTimeMillis() - prefs.protectionStartedAtMs).coerceAtLeast(0L) /
                (24L * 60 * 60 * 1000)).toInt()
        } else {
            0
        }

        setContent {
            AnchorTheme(themeMode = prefs.themeMode) {
                InterventionScreen(
                    target = target,
                    source = source,
                    category = category,
                    isAntiTamper = isAntiTamper,
                    autoStartBreathing = autoStartBreathing,
                    cleanDays = days,
                    onGoHome = {
                        val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                            addCategory(Intent.CATEGORY_HOME)
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        }
                        startActivity(homeIntent)
                        finish()
                    },
                    onOpenGambleAware = {
                        startActivity(Intent(this, MainActivity::class.java))
                        finish()
                    },
                )
            }
        }
    }

    companion object {
        const val EXTRA_TARGET = "extra_target"
        const val EXTRA_SOURCE = "extra_source"
        const val EXTRA_CATEGORY = "extra_category"
        const val EXTRA_IS_ANTI_TAMPER = "extra_is_anti_tamper"
        const val EXTRA_START_BREATHING = "extra_start_breathing"
    }
}

@Composable
private fun InterventionScreen(
    target: String,
    source: String,
    category: String,
    isAntiTamper: Boolean,
    autoStartBreathing: Boolean,
    cleanDays: Int,
    onGoHome: () -> Unit,
    onOpenGambleAware: () -> Unit,
) {
    val liquid = LocalLiquidColors.current
    var isBreathingActive by remember { mutableStateOf(autoStartBreathing) }
    var calmSecondsLeft by remember { mutableIntStateOf(60) }

    LaunchedEffect(isBreathingActive) {
        if (isBreathingActive) {
            while (calmSecondsLeft > 0) {
                delay(1000L)
                calmSecondsLeft -= 1
            }
            isBreathingActive = false
        }
    }

    // 12-second breathing cycle: 0..3 Inhale (4s), 4..7 Hold (4s), 8..11 Exhale (4s)
    val cycleSecond = (60 - calmSecondsLeft) % 12
    val phaseLabel = when {
        !isBreathingActive && calmSecondsLeft == 0 -> "Reset Complete"
        !isBreathingActive -> "60s Calm Reset"
        cycleSecond < 4 -> "Inhale"
        cycleSecond < 8 -> "Hold"
        else -> "Exhale"
    }
    val targetRingScale = when {
        !isBreathingActive -> 0.56f
        cycleSecond < 4 -> 0.94f
        cycleSecond < 8 -> 0.94f
        else -> 0.52f
    }
    val ringScale by animateFloatAsState(
        targetValue = targetRingScale,
        animationSpec = tween(durationMillis = 1000, easing = FastOutSlowInEasing),
        label = "calm_reset_ring",
    )

    LiquidGlassBackdrop(isProtected = true) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .safeDrawingPadding()
                .padding(horizontal = 22.dp, vertical = 18.dp),
            contentAlignment = Alignment.Center,
        ) {
            LiquidGlassCard(
                modifier = Modifier
                    .widthIn(max = 460.dp)
                    .verticalScroll(rememberScrollState()),
                contentPadding = 24.dp,
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        text = "GambleAware",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    if (isAntiTamper) {
                        Box(
                            modifier = Modifier
                                .size(72.dp)
                                .clip(CircleShape)
                                .background(liquid.activeFill),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Lock,
                                contentDescription = "Locked by GambleAware",
                                tint = liquid.activeContent,
                                modifier = Modifier.size(34.dp),
                            )
                        }
                    } else {
                        BrandGEmblem(modifier = Modifier.size(72.dp))
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = if (isAntiTamper) {
                            "Uninstall & Tamper Locked"
                        } else {
                            "Pause & Breathe"
                        },
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onBackground,
                        textAlign = TextAlign.Center,
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = if (isAntiTamper) {
                            "Your GambleAware Commitment Lock prevents removing the app or weakening protection until the timer expires."
                        } else {
                            "GambleAware intercepted this attempt before it could pull you back in. Urges fade within a few minutes."
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )

                    Spacer(modifier = Modifier.height(18.dp))

                    val badgeLabel = when {
                        isAntiTamper -> "UNINSTALL BLOCKED"
                        source.contains("App", ignoreCase = true) ||
                            source.contains("Install", ignoreCase = true) -> "BETTING APP BLOCKED"
                        else -> "BETTING SITE BLOCKED"
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(18.dp))
                            .background(liquid.mutedFill)
                            .border(1.dp, liquid.subtleBorder, RoundedCornerShape(18.dp))
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(50))
                                    .background(liquid.activeFill)
                                    .padding(horizontal = 9.dp, vertical = 3.dp),
                            ) {
                                Text(
                                    text = badgeLabel,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = liquid.activeContent,
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = target,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onBackground,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Blocked by $source • $category",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = "$cleanDays d",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = liquid.accentInk,
                            )
                            Text(
                                text = "Streak",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Interactive Monochrome 60s Calm Reset Card
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(liquid.controlFill)
                            .border(1.dp, liquid.subtleBorder, RoundedCornerShape(20.dp))
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = ripple(),
                            ) {
                                if (calmSecondsLeft == 0) {
                                    calmSecondsLeft = 60
                                    isBreathingActive = true
                                } else {
                                    isBreathingActive = !isBreathingActive
                                }
                            }
                            .padding(14.dp)
                            .testTag("intervention_calm_reset"),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Rounded.Air,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onBackground,
                                    modifier = Modifier.size(18.dp),
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "60s Calm Reset",
                                    style = MaterialTheme.typography.titleSmall,
                                    color = MaterialTheme.colorScheme.onBackground,
                                )
                            }
                            Text(
                                text = if (isBreathingActive) "${calmSecondsLeft}s • Tap to pause" else if (calmSecondsLeft == 0) "Completed • Restart" else "Tap to begin",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }

                        AnimatedVisibility(visible = isBreathingActive || calmSecondsLeft < 60) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.padding(top = 12.dp, bottom = 4.dp),
                            ) {
                                val ringAccent = liquid.activeFill
                                Box(
                                    modifier = Modifier.size(104.dp),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Canvas(modifier = Modifier.fillMaxSize()) {
                                        val center = Offset(size.width / 2f, size.height / 2f)
                                        val maxR = size.minDimension / 2f
                                        drawCircle(
                                            color = ringAccent.copy(alpha = 0.22f),
                                            radius = maxR * 0.94f,
                                            center = center,
                                            style = Stroke(width = 1.dp.toPx()),
                                        )
                                        drawCircle(
                                            color = ringAccent.copy(alpha = 0.16f),
                                            radius = maxR * ringScale,
                                            center = center,
                                        )
                                        drawCircle(
                                            color = ringAccent,
                                            radius = maxR * ringScale,
                                            center = center,
                                            style = Stroke(width = 1.85.dp.toPx()),
                                        )
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(
                                            text = phaseLabel,
                                            style = MaterialTheme.typography.labelLarge,
                                            color = MaterialTheme.colorScheme.onBackground,
                                        )
                                        Text(
                                            text = "${calmSecondsLeft}s",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    Button(
                        onClick = onGoHome,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp)
                            .testTag("intervention_return_home"),
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
                        Text("Return Safely Home")
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedButton(
                        onClick = onOpenGambleAware,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .testTag("intervention_open_gambleaware"),
                        shape = RoundedCornerShape(50),
                        border = BorderStroke(1.dp, liquid.subtleBorder),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.onBackground,
                        ),
                    ) {
                        Text("Open GambleAware")
                    }

                    Spacer(modifier = Modifier.height(14.dp))

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
