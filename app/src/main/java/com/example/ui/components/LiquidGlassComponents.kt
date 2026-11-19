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
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
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

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height

            // Subtle architectural concentric radar rings centered behind the hero shield
            val ringCenter = Offset(w * 0.5f, h * 0.22f)
            val ringAlpha = if (isProtected) 0.11f else 0.05f
            val ringColor = liquid.activeFill
            val strokePx = 0.75.dp.toPx()

            drawCircle(
                color = ringColor.copy(alpha = ringAlpha),
                radius = w * 0.40f,
                center = ringCenter,
                style = Stroke(width = strokePx),
            )
            drawCircle(
                color = ringColor.copy(alpha = ringAlpha * 0.65f),
                radius = w * 0.62f,
                center = ringCenter,
                style = Stroke(width = strokePx),
            )
            drawCircle(
                color = inkColor.copy(alpha = ringAlpha * 0.35f),
                radius = w * 0.86f,
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
    contentColor: Color? = null,
    contentPadding: Dp = 18.dp,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val liquid = LocalLiquidColors.current
    val resolvedContentColor = contentColor ?: when (fillColor) {
        liquid.activeFill -> liquid.activeContent
        liquid.mutedFill -> liquid.mutedContent
        liquid.controlFill -> liquid.controlContent
        liquid.softAccentFill -> liquid.accentInk
        else -> MaterialTheme.colorScheme.onSurface
    }
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

    CompositionLocalProvider(LocalContentColor provides resolvedContentColor) {
        Column(
            modifier = interactiveModifier.padding(contentPadding),
            content = content,
        )
    }
}

/**
 * Crisp GambleAware geometric G + North-Star emblem matching ic_launcher_foreground.xml.
 */
@Composable
fun BrandGEmblem(
    modifier: Modifier = Modifier,
    containerColor: Color = Color(0xFF0A070B),
    letterColor: Color = Color.White,
    accentColor: Color = Color(0xFFFF3D9A),
) {
    Canvas(modifier = modifier) {
        val side = size.minDimension
        val scale = side / 108f
        drawRoundRect(
            color = containerColor,
            topLeft = Offset.Zero,
            size = Size(size.width, size.height),
            cornerRadius = CornerRadius(24f * scale, 24f * scale),
        )
        // Outer G arc
        val gPath = Path().apply {
            moveTo(68f * scale, 36f * scale)
            lineTo(63.5f * scale, 41f * scale)
            lineTo(45f * scale, 41f * scale)
            lineTo(41f * scale, 45f * scale)
            lineTo(41f * scale, 63f * scale)
            lineTo(45f * scale, 67f * scale)
            lineTo(63f * scale, 67f * scale)
            lineTo(67.5f * scale, 71.8f * scale)
            lineTo(63.8f * scale, 74.5f * scale)
            lineTo(42f * scale, 74.5f * scale)
            lineTo(33.5f * scale, 66f * scale)
            lineTo(33.5f * scale, 42f * scale)
            lineTo(42f * scale, 33.5f * scale)
            lineTo(64.2f * scale, 33.5f * scale)
            close()
        }
        drawPath(path = gPath, color = letterColor)

        // Vault Keystone Bolt
        val boltPath = Path().apply {
            moveTo(52f * scale, 50.5f * scale)
            lineTo(74.5f * scale, 50.5f * scale)
            lineTo(74.5f * scale, 65.5f * scale)
            lineTo(67.2f * scale, 72.5f * scale)
            lineTo(67.2f * scale, 57.5f * scale)
            lineTo(48.5f * scale, 57.5f * scale)
            close()
        }
        drawPath(path = boltPath, color = accentColor)

        // North-Star Beacon
        val starPath = Path().apply {
            moveTo(70.5f * scale, 34.5f * scale)
            quadraticTo(70.5f * scale, 39.8f * scale, 75.8f * scale, 39.8f * scale)
            quadraticTo(70.5f * scale, 39.8f * scale, 70.5f * scale, 45.1f * scale)
            quadraticTo(70.5f * scale, 39.8f * scale, 65.2f * scale, 39.8f * scale)
            quadraticTo(70.5f * scale, 39.8f * scale, 70.5f * scale, 34.5f * scale)
            close()
        }
        drawPath(path = starPath, color = accentColor.copy(alpha = 0.92f))
        drawCircle(
            color = letterColor,
            radius = 1.45f * scale,
            center = Offset(70.5f * scale, 39.8f * scale),
        )
    }
}

/**
 * Monochrome Apple-inspired liquid glass GambleAware G chronograph orb with a 60-tick bezel ring.
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

            // Precision Geometric GambleAware G + North-Star emblem
            val gScale = (maxR * 0.52f) / 21f
            fun gx(coord: Float): Float = center.x + (coord - 54f) * gScale
            fun gy(coord: Float): Float = center.y + (coord - 54f) * gScale

            val gPath = Path().apply {
                moveTo(gx(68f), gy(36f))
                lineTo(gx(63.5f), gy(41f))
                lineTo(gx(45f), gy(41f))
                lineTo(gx(41f), gy(45f))
                lineTo(gx(41f), gy(63f))
                lineTo(gx(45f), gy(67f))
                lineTo(gx(63f), gy(67f))
                lineTo(gx(67.5f), gy(71.8f))
                lineTo(gx(63.8f), gy(74.5f))
                lineTo(gx(42f), gy(74.5f))
                lineTo(gx(33.5f), gy(66f))
                lineTo(gx(33.5f), gy(42f))
                lineTo(gx(42f), gy(33.5f))
                lineTo(gx(64.2f), gy(33.5f))
                close()
            }
            drawPath(path = gPath, color = emblemColor)

            val keystonePath = Path().apply {
                moveTo(gx(52f), gy(50.5f))
                lineTo(gx(74.5f), gy(50.5f))
                lineTo(gx(74.5f), gy(65.5f))
                lineTo(gx(67.2f), gy(72.5f))
                lineTo(gx(67.2f), gy(57.5f))
                lineTo(gx(48.5f), gy(57.5f))
                close()
            }
            drawPath(
                path = keystonePath,
                color = if (isProtected) emblemColor.copy(alpha = 0.88f) else liquid.activeFill,
            )

            val starPath = Path().apply {
                moveTo(gx(70.5f), gy(34.5f))
                quadraticTo(gx(70.5f), gy(39.8f), gx(75.8f), gy(39.8f))
                quadraticTo(gx(70.5f), gy(39.8f), gx(70.5f), gy(45.1f))
                quadraticTo(gx(70.5f), gy(39.8f), gx(65.2f), gy(39.8f))
                quadraticTo(gx(70.5f), gy(39.8f), gx(70.5f), gy(34.5f))
                close()
            }
            drawPath(
                path = starPath,
                color = if (isProtected) emblemColor else liquid.activeFill,
            )
            drawCircle(
                color = emblemColor,
                radius = 1.45f * gScale,
                center = Offset(gx(70.5f), gy(39.8f)),
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
