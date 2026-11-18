package com.example.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.ui.theme.LocalLiquidColors
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * Strictly Black & White monochrome liquid glass backdrop with organic spheres
 * and ultra-fine concentric architectural hairline rings.
 * Zero colors, zero shadows, zero gradients.
 */
@Composable
fun LiquidGlassBackdrop(
    isProtected: Boolean,
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit,
) {
    val liquid = LocalLiquidColors.current
    val inkColor = MaterialTheme.colorScheme.onBackground
    val infiniteTransition = rememberInfiniteTransition(label = "liquid_backdrop")
    val drift by infiniteTransition.animateFloat(
        initialValue = -1f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 10500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "backdrop_drift",
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height

            val orb1Center = Offset(
                x = w * 0.84f + (drift * w * 0.032f),
                y = h * 0.13f - (drift * h * 0.018f),
            )
            drawCircle(
                color = liquid.blobOne,
                radius = w * 0.44f,
                center = orb1Center,
            )

            val orb2Center = Offset(
                x = w * 0.11f - (drift * w * 0.028f),
                y = h * 0.35f + (drift * h * 0.022f),
            )
            drawCircle(
                color = liquid.blobTwo,
                radius = w * 0.35f,
                center = orb2Center,
            )

            val orb3Center = Offset(
                x = w * 0.68f + (drift * w * 0.024f),
                y = h * 0.78f - (drift * h * 0.018f),
            )
            drawCircle(
                color = liquid.blobThree,
                radius = w * 0.47f,
                center = orb3Center,
            )

            // Crisp Black & Pink concentric orbital hairline rings
            val ringCenter = Offset(w * 0.5f, h * 0.24f)
            val ringAlpha = if (isProtected) 0.14f else 0.06f
            val ringColor = liquid.activeFill
            val strokePx = 0.75.dp.toPx()
            drawCircle(
                color = ringColor.copy(alpha = ringAlpha),
                radius = w * 0.42f,
                center = ringCenter,
                style = Stroke(width = strokePx),
            )
            drawCircle(
                color = ringColor.copy(alpha = ringAlpha * 0.75f),
                radius = w * 0.62f,
                center = ringCenter,
                style = Stroke(width = strokePx),
            )
            drawCircle(
                color = inkColor.copy(alpha = ringAlpha * 0.4f),
                radius = w * 0.84f,
                center = ringCenter,
                style = Stroke(width = strokePx),
            )
        }
        content()
    }
}

@Composable
fun LiquidGlassCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 26.dp,
    fillColor: Color = LocalLiquidColors.current.glassFill,
    borderColor: Color = LocalLiquidColors.current.glassBorder,
    contentPadding: Dp = 18.dp,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val shape = RoundedCornerShape(cornerRadius)
    val baseModifier = modifier
        .clip(shape)
        .background(fillColor)
        .border(BorderStroke(1.dp, borderColor), shape)

    val interactiveModifier = if (onClick != null) {
        baseModifier.clickable(
            interactionSource = remember { MutableInteractionSource() },
            indication = ripple(),
            onClick = onClick,
        )
    } else {
        baseModifier
    }

    Column(
        modifier = interactiveModifier.padding(contentPadding),
        content = content,
    )
}

/**
 * Monochrome Apple-inspired liquid glass Shield & Anchor orb with a 60-tick
 * precision chronograph bezel ring.
 * Strictly black & white, zero shadows, zero gradients, zero sparkles/zaps.
 */
@Composable
fun LiquidShieldOrb(
    isProtected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isLocked: Boolean = false,
) {
    val liquid = LocalLiquidColors.current
    val inkColor = MaterialTheme.colorScheme.onBackground
    val coreFill by animateColorAsState(
        targetValue = if (isProtected) liquid.activeFill else liquid.mutedFill,
        animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
        label = "orb_core_fill",
    )
    val emblemColor by animateColorAsState(
        targetValue = if (isProtected) liquid.activeContent else liquid.mutedContent,
        animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
        label = "orb_emblem_color",
    )

    val infiniteTransition = rememberInfiniteTransition(label = "shield_pulse")
    val pulse by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "orb_pulse_value",
    )

    Box(
        modifier = modifier
            .size(180.dp)
            .clip(CircleShape)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = ripple(bounded = true),
                onClick = onClick,
            )
            .testTag("shield_orb_toggle"),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val center = Offset(size.width / 2f, size.height / 2f)
            val maxR = size.minDimension / 2f

            // Outer translucent pink glass aura
            val outerScale = if (isProtected) 0.92f + (pulse * 0.06f) else 0.90f
            drawCircle(
                color = liquid.activeFill.copy(alpha = if (isProtected) 0.12f else 0.04f),
                radius = maxR * outerScale,
                center = center,
            )

            // 60-tick precision Black & Pink watch-bezel ring
            val tickOuterR = maxR * 0.86f
            for (i in 0 until 60) {
                val isMajor = i % 5 == 0
                val tickInnerR = if (isMajor) maxR * 0.77f else maxR * 0.815f
                val angleRad = (i * 6.0 - 90.0) * PI / 180.0
                val cosA = cos(angleRad).toFloat()
                val sinA = sin(angleRad).toFloat()
                val tickColor = if (isProtected && isMajor) liquid.activeFill else inkColor
                val tickAlpha = when {
                    isProtected && isMajor -> 0.88f
                    isProtected -> 0.30f
                    isMajor -> 0.30f
                    else -> 0.12f
                }
                drawLine(
                    color = tickColor.copy(alpha = tickAlpha),
                    start = Offset(center.x + tickInnerR * cosA, center.y + tickInnerR * sinA),
                    end = Offset(center.x + tickOuterR * cosA, center.y + tickOuterR * sinA),
                    strokeWidth = if (isMajor) 1.5.dp.toPx() else 0.85.dp.toPx(),
                    cap = StrokeCap.Round,
                )
            }

            // Inner frosted halo ring
            val midScale = if (isProtected) 0.69f + (pulse * 0.03f) else 0.69f
            drawCircle(
                color = liquid.activeFill.copy(alpha = if (isProtected) 0.18f else 0.06f),
                radius = maxR * midScale,
                center = center,
            )

            // Hardened lock bezel circle when Commitment Lock is active
            if (isLocked) {
                drawCircle(
                    color = liquid.activeFill.copy(alpha = 0.90f),
                    radius = maxR * 0.92f,
                    center = center,
                    style = Stroke(width = 1.5.dp.toPx()),
                )
            }

            // Core solid Black & Pink orb
            drawCircle(
                color = coreFill,
                radius = maxR * 0.56f,
                center = center,
            )
            drawCircle(
                color = liquid.activeFill.copy(alpha = 0.45f),
                radius = maxR * 0.56f,
                center = center,
                style = Stroke(width = 1.25.dp.toPx()),
            )

            // Precision geometric shield & keyhole lock silhouette
            val s = maxR * 0.25f
            val shieldPath = Path().apply {
                moveTo(center.x, center.y - s * 1.04f)
                lineTo(center.x + s * 0.86f, center.y - s * 0.72f)
                lineTo(center.x + s * 0.86f, center.y - s * 0.04f)
                cubicTo(
                    center.x + s * 0.86f,
                    center.y + s * 0.56f,
                    center.x + s * 0.44f,
                    center.y + s * 0.94f,
                    center.x,
                    center.y + s * 1.12f,
                )
                cubicTo(
                    center.x - s * 0.44f,
                    center.y + s * 0.94f,
                    center.x - s * 0.86f,
                    center.y + s * 0.56f,
                    center.x - s * 0.86f,
                    center.y - s * 0.04f,
                )
                lineTo(center.x - s * 0.86f, center.y - s * 0.72f)
                close()
            }
            drawPath(
                path = shieldPath,
                color = emblemColor,
                style = Stroke(
                    width = 2.75.dp.toPx(),
                    cap = StrokeCap.Round,
                    join = StrokeJoin.Round,
                ),
            )

            drawCircle(
                color = emblemColor,
                radius = s * 0.16f,
                center = Offset(center.x, center.y - s * 0.14f),
            )
            val keyholeTail = Path().apply {
                moveTo(center.x - s * 0.09f, center.y - s * 0.02f)
                lineTo(center.x + s * 0.09f, center.y - s * 0.02f)
                lineTo(center.x + s * 0.13f, center.y + s * 0.36f)
                lineTo(center.x - s * 0.13f, center.y + s * 0.36f)
                close()
            }
            drawPath(
                path = keyholeTail,
                color = emblemColor,
            )
        }
    }
}

data class LiquidNavItem(
    val route: String,
    val label: String,
    val activeIcon: ImageVector,
    val inactiveIcon: ImageVector,
    val testTag: String,
)

@Composable
fun LiquidFloatingNavBar(
    items: List<LiquidNavItem>,
    selectedRoute: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val liquid = LocalLiquidColors.current
    Box(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            color = liquid.glassFill,
            shape = RoundedCornerShape(32.dp),
            border = BorderStroke(1.dp, liquid.glassBorder),
            tonalElevation = 0.dp,
            shadowElevation = 0.dp,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                items.forEach { item ->
                    val selected = item.route == selectedRoute
                    val pillColor by animateColorAsState(
                        targetValue = if (selected) liquid.activeFill else Color.Transparent,
                        animationSpec = tween(220),
                        label = "nav_pill_color",
                    )
                    val contentColor by animateColorAsState(
                        targetValue = if (selected) {
                            liquid.activeContent
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant
                        },
                        animationSpec = tween(220),
                        label = "nav_content_color",
                    )

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .minimumInteractiveComponentSize()
                            .clip(RoundedCornerShape(26.dp))
                            .background(pillColor)
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = ripple(),
                                onClick = { onSelect(item.route) },
                            )
                            .padding(vertical = 8.dp, horizontal = 6.dp)
                            .testTag(item.testTag),
                        contentAlignment = Alignment.Center,
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                        ) {
                            Icon(
                                imageVector = if (selected) item.activeIcon else item.inactiveIcon,
                                contentDescription = item.label,
                                tint = contentColor,
                                modifier = Modifier.size(22.dp),
                            )
                            Spacer(modifier = Modifier.height(3.dp))
                            Text(
                                text = item.label,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
                                color = contentColor,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun LiquidStatusPill(
    label: String,
    isActive: Boolean,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
) {
    val liquid = LocalLiquidColors.current
    val bgColor = if (isActive) liquid.activeFill else liquid.mutedFill
    val fgColor = if (isActive) liquid.activeContent else MaterialTheme.colorScheme.onSurfaceVariant
    val borderColor = if (isActive) liquid.activeFill else liquid.subtleBorder

    val base = modifier
        .clip(RoundedCornerShape(50))
        .background(bgColor)
        .border(1.dp, borderColor, RoundedCornerShape(50))

    val clickableModifier = if (onClick != null) {
        base.clickable(
            interactionSource = remember { MutableInteractionSource() },
            indication = ripple(),
            onClick = onClick,
        )
    } else {
        base
    }

    Row(
        modifier = clickableModifier.padding(horizontal = 12.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = fgColor,
            modifier = Modifier.size(15.dp),
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = fgColor,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
fun LiquidSectionHeader(
    title: String,
    subtitle: String? = null,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onBackground,
        )
        if (!subtitle.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
