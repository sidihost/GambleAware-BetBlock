package com.example.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.blocker.BrandCatalog
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun BettingBrandLogo(
    target: String,
    modifier: Modifier = Modifier,
    size: Dp = 40.dp,
    cornerRadius: Dp = 12.dp,
) {
    val identity = remember(target) { BrandCatalog.resolve(target) }
    val bg = Color(identity.bgHex)
    val accent = Color(identity.accentHex)
    val fg = Color(identity.fgHex)
    val brandId = identity.brand?.id

    Box(
        modifier = modifier
            .size(size)
            .clip(RoundedCornerShape(cornerRadius))
            .background(
                Brush.linearGradient(
                    colors = listOf(bg, bg.copy(alpha = 0.88f)),
                ),
            )
            .border(1.dp, accent.copy(alpha = 0.45f), RoundedCornerShape(cornerRadius)),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .padding((size.value * 0.12f).dp),
        ) {
            val w = this.size.width
            val h = this.size.height
            val minDim = minOf(w, h)

            // Subtle corner aura highlight
            drawCircle(
                color = accent.copy(alpha = 0.16f),
                radius = minDim * 0.46f,
                center = Offset(w * 0.78f, h * 0.22f),
            )

            when (brandId) {
                "sportybet" -> {
                    val bolt = Path().apply {
                        moveTo(w * 0.56f, h * 0.10f)
                        lineTo(w * 0.24f, h * 0.55f)
                        lineTo(w * 0.49f, h * 0.55f)
                        lineTo(w * 0.41f, h * 0.90f)
                        lineTo(w * 0.76f, h * 0.43f)
                        lineTo(w * 0.51f, h * 0.43f)
                        close()
                    }
                    drawPath(bolt, color = fg)
                }

                "bet9ja" -> {
                    drawCircle(
                        color = accent,
                        radius = minDim * 0.42f,
                        center = Offset(w * 0.50f, h * 0.50f),
                        style = Stroke(width = (minDim * 0.09f).coerceAtLeast(1.6f)),
                    )
                }

                "betking", "draftkings", "roobet" -> {
                    val crown = Path().apply {
                        moveTo(w * 0.14f, h * 0.74f)
                        lineTo(w * 0.18f, h * 0.30f)
                        lineTo(w * 0.36f, h * 0.52f)
                        lineTo(w * 0.50f, h * 0.22f)
                        lineTo(w * 0.64f, h * 0.52f)
                        lineTo(w * 0.82f, h * 0.30f)
                        lineTo(w * 0.86f, h * 0.74f)
                        close()
                    }
                    drawPath(crown, color = accent)
                    drawRoundRect(
                        color = fg.copy(alpha = 0.85f),
                        topLeft = Offset(w * 0.18f, h * 0.78f),
                        size = Size(w * 0.64f, h * 0.08f),
                        cornerRadius = CornerRadius(4f, 4f),
                    )
                }

                "1xbet" -> {
                    val strokeW = (minDim * 0.14f).coerceAtLeast(2.2f)
                    drawLine(
                        color = fg,
                        start = Offset(w * 0.20f, h * 0.20f),
                        end = Offset(w * 0.80f, h * 0.80f),
                        strokeWidth = strokeW,
                        cap = StrokeCap.Round,
                    )
                    drawLine(
                        color = accent,
                        start = Offset(w * 0.80f, h * 0.20f),
                        end = Offset(w * 0.20f, h * 0.80f),
                        strokeWidth = strokeW,
                        cap = StrokeCap.Round,
                    )
                }

                "bet365", "ladbrokes", "paddypower" -> {
                    drawRoundRect(
                        color = accent.copy(alpha = 0.24f),
                        topLeft = Offset(w * 0.08f, h * 0.14f),
                        size = Size(w * 0.84f, h * 0.72f),
                        cornerRadius = CornerRadius(minDim * 0.22f, minDim * 0.22f),
                        style = Stroke(width = (minDim * 0.07f).coerceAtLeast(1.4f)),
                    )
                }

                "betway", "parimatch", "fanduel" -> {
                    val strokeW = (minDim * 0.13f).coerceAtLeast(2f)
                    drawLine(
                        color = accent,
                        start = Offset(w * 0.18f, h * 0.78f),
                        end = Offset(w * 0.50f, h * 0.22f),
                        strokeWidth = strokeW,
                        cap = StrokeCap.Round,
                    )
                    drawLine(
                        color = fg,
                        start = Offset(w * 0.46f, h * 0.78f),
                        end = Offset(w * 0.78f, h * 0.22f),
                        strokeWidth = strokeW,
                        cap = StrokeCap.Round,
                    )
                }

                "stake", "nairabet" -> {
                    val sCurve = Path().apply {
                        moveTo(w * 0.74f, h * 0.24f)
                        cubicTo(w * 0.30f, h * 0.12f, w * 0.24f, h * 0.46f, w * 0.52f, h * 0.50f)
                        cubicTo(w * 0.80f, h * 0.54f, w * 0.72f, h * 0.88f, w * 0.24f, h * 0.76f)
                    }
                    drawPath(
                        sCurve,
                        color = accent,
                        style = Stroke(
                            width = (minDim * 0.14f).coerceAtLeast(2.2f),
                            cap = StrokeCap.Round,
                        ),
                    )
                }

                "msport", "merrybet", "williamhill" -> {
                    val mWing = Path().apply {
                        moveTo(w * 0.14f, h * 0.78f)
                        lineTo(w * 0.22f, h * 0.24f)
                        lineTo(w * 0.50f, h * 0.56f)
                        lineTo(w * 0.78f, h * 0.24f)
                        lineTo(w * 0.86f, h * 0.78f)
                    }
                    drawPath(
                        mWing,
                        color = accent,
                        style = Stroke(
                            width = (minDim * 0.12f).coerceAtLeast(2f),
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round,
                        ),
                    )
                }

                "betpawa" -> {
                    drawCircle(color = accent, radius = minDim * 0.09f, center = Offset(w * 0.28f, h * 0.32f))
                    drawCircle(color = accent, radius = minDim * 0.09f, center = Offset(w * 0.50f, h * 0.22f))
                    drawCircle(color = accent, radius = minDim * 0.09f, center = Offset(w * 0.72f, h * 0.32f))
                    drawCircle(color = fg, radius = minDim * 0.21f, center = Offset(w * 0.50f, h * 0.64f))
                }

                "bangbet", "hollywoodbets", "betfair" -> {
                    val star = Path()
                    val cx = w * 0.50f
                    val cy = h * 0.50f
                    val outerR = minDim * 0.42f
                    val innerR = minDim * 0.18f
                    for (i in 0 until 10) {
                        val angle = (-90.0 + i * 36.0) * (PI / 180.0)
                        val r = if (i % 2 == 0) outerR else innerR
                        val px = cx + (cos(angle) * r).toFloat()
                        val py = cy + (sin(angle) * r).toFloat()
                        if (i == 0) star.moveTo(px, py) else star.lineTo(px, py)
                    }
                    star.close()
                    drawPath(star, color = accent)
                }

                "pokerstars" -> {
                    val spade = Path().apply {
                        moveTo(w * 0.50f, h * 0.12f)
                        cubicTo(w * 0.84f, h * 0.42f, w * 0.82f, h * 0.72f, w * 0.58f, h * 0.70f)
                        lineTo(w * 0.64f, h * 0.88f)
                        lineTo(w * 0.36f, h * 0.88f)
                        lineTo(w * 0.42f, h * 0.70f)
                        cubicTo(w * 0.18f, h * 0.72f, w * 0.16f, h * 0.42f, w * 0.50f, h * 0.12f)
                        close()
                    }
                    drawPath(spade, color = accent)
                }

                "rollbit", "bcgame", "22bet", "paripesa" -> {
                    val hex = Path()
                    val cx = w * 0.50f
                    val cy = h * 0.50f
                    val r = minDim * 0.42f
                    for (i in 0 until 6) {
                        val angle = (-30.0 + i * 60.0) * (PI / 180.0)
                        val px = cx + (cos(angle) * r).toFloat()
                        val py = cy + (sin(angle) * r).toFloat()
                        if (i == 0) hex.moveTo(px, py) else hex.lineTo(px, py)
                    }
                    hex.close()
                    drawPath(
                        hex,
                        color = accent,
                        style = Stroke(width = (minDim * 0.09f).coerceAtLeast(1.8f), join = StrokeJoin.Round),
                    )
                }

                "prizepicks", "underdogfantasy" -> {
                    val diamond = Path().apply {
                        moveTo(w * 0.50f, h * 0.10f)
                        lineTo(w * 0.88f, h * 0.50f)
                        lineTo(w * 0.50f, h * 0.90f)
                        lineTo(w * 0.12f, h * 0.50f)
                        close()
                    }
                    drawPath(diamond, color = accent.copy(alpha = 0.25f))
                    drawPath(
                        diamond,
                        color = accent,
                        style = Stroke(width = (minDim * 0.08f).coerceAtLeast(1.6f)),
                    )
                }

                else -> {
                    // Clean geometric shield outline for non-emblem brands or fallback monograms
                    drawCircle(
                        color = accent.copy(alpha = 0.28f),
                        radius = minDim * 0.40f,
                        center = Offset(w * 0.50f, h * 0.50f),
                        style = Stroke(width = (minDim * 0.07f).coerceAtLeast(1.4f)),
                    )
                }
            }
        }

        val showCenterText = when (brandId) {
            "bet9ja", "bet365", "ladbrokes", "paddypower", "22bet", "paripesa",
            "melbet", "betwinner", "betmgm", "caesars", "rollbit", "bcgame", null -> true
            else -> size >= 44.dp
        }
        if (showCenterText) {
            val fontSize = when {
                size <= 26.dp -> if (identity.monogram.length >= 3) 7.sp else 9.sp
                size <= 34.dp -> if (identity.monogram.length >= 3) 9.sp else 11.sp
                size <= 46.dp -> if (identity.monogram.length >= 3) 10.sp else 13.sp
                else -> if (identity.monogram.length >= 3) 14.sp else 18.sp
            }
            Text(
                text = identity.monogram,
                fontSize = fontSize,
                fontWeight = FontWeight.ExtraBold,
                color = fg,
                maxLines = 1,
            )
        }
    }
}
