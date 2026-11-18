package com.example.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import androidx.compose.ui.text.font.FontStyle
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
                .padding((size.value * 0.10f).dp),
        ) {
            val w = this.size.width
            val h = this.size.height
            val minDim = minOf(w, h)

            when (brandId) {
                "sportybet" -> {
                    // Authentic SportyBet crimson app mark: curved white 'S' ribbon + upper-right & lower-left ball dots
                    val sRibbon = Path().apply {
                        moveTo(w * 0.68f, h * 0.25f)
                        cubicTo(w * 0.36f, h * 0.14f, w * 0.26f, h * 0.43f, w * 0.50f, h * 0.49f)
                        cubicTo(w * 0.75f, h * 0.55f, w * 0.68f, h * 0.86f, w * 0.30f, h * 0.77f)
                    }
                    drawPath(
                        sRibbon,
                        color = fg,
                        style = Stroke(
                            width = (minDim * 0.19f).coerceAtLeast(2.4f),
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round,
                        ),
                    )
                    // Top-right & bottom-left signature SportyBet ball dots
                    drawCircle(
                        color = fg,
                        radius = minDim * 0.135f,
                        center = Offset(w * 0.77f, h * 0.22f),
                    )
                    drawCircle(
                        color = fg,
                        radius = minDim * 0.135f,
                        center = Offset(w * 0.23f, h * 0.78f),
                    )
                }

                "bet9ja" -> {
                    // Red curved pitch swoosh beneath gold 9 + white ja
                    val arc = Path().apply {
                        moveTo(w * 0.14f, h * 0.78f)
                        quadraticTo(w * 0.50f, h * 0.90f, w * 0.86f, h * 0.75f)
                    }
                    drawPath(
                        arc,
                        color = Color(0xFFEF4444),
                        style = Stroke(
                            width = (minDim * 0.085f).coerceAtLeast(1.6f),
                            cap = StrokeCap.Round,
                        ),
                    )
                }

                "betking", "draftkings", "roobet" -> {
                    val crown = Path().apply {
                        moveTo(w * 0.16f, h * 0.46f)
                        lineTo(w * 0.20f, h * 0.18f)
                        lineTo(w * 0.37f, h * 0.33f)
                        lineTo(w * 0.50f, h * 0.12f)
                        lineTo(w * 0.63f, h * 0.33f)
                        lineTo(w * 0.80f, h * 0.18f)
                        lineTo(w * 0.84f, h * 0.46f)
                        close()
                    }
                    drawPath(crown, color = accent)
                }

                "1xbet" -> {
                    // Geometric white '1' on left + sky-blue tilted 'X' on right
                    val oneStroke = (minDim * 0.12f).coerceAtLeast(1.8f)
                    drawLine(
                        color = fg,
                        start = Offset(w * 0.25f, h * 0.22f),
                        end = Offset(w * 0.25f, h * 0.78f),
                        strokeWidth = oneStroke,
                        cap = StrokeCap.Round,
                    )
                    drawLine(
                        color = fg,
                        start = Offset(w * 0.14f, h * 0.34f),
                        end = Offset(w * 0.25f, h * 0.22f),
                        strokeWidth = oneStroke,
                        cap = StrokeCap.Round,
                    )
                    val xStroke = (minDim * 0.125f).coerceAtLeast(2f)
                    drawLine(
                        color = accent,
                        start = Offset(w * 0.44f, h * 0.22f),
                        end = Offset(w * 0.86f, h * 0.78f),
                        strokeWidth = xStroke,
                        cap = StrokeCap.Round,
                    )
                    drawLine(
                        color = accent,
                        start = Offset(w * 0.86f, h * 0.22f),
                        end = Offset(w * 0.44f, h * 0.78f),
                        strokeWidth = xStroke,
                        cap = StrokeCap.Round,
                    )
                }

                "bet365" -> {
                    // Authentic stacked forest green tile frame accent
                    drawRoundRect(
                        color = accent.copy(alpha = 0.20f),
                        topLeft = Offset(w * 0.06f, h * 0.08f),
                        size = Size(w * 0.88f, h * 0.84f),
                        cornerRadius = CornerRadius(minDim * 0.20f, minDim * 0.20f),
                        style = Stroke(width = (minDim * 0.055f).coerceAtLeast(1.2f)),
                    )
                }

                "betway" -> {
                    // Crisp white lowercase geometric 'b' + signature solid green dot
                    val stemW = (minDim * 0.13f).coerceAtLeast(2f)
                    drawLine(
                        color = fg,
                        start = Offset(w * 0.26f, h * 0.18f),
                        end = Offset(w * 0.26f, h * 0.76f),
                        strokeWidth = stemW,
                        cap = StrokeCap.Round,
                    )
                    drawCircle(
                        color = fg,
                        radius = minDim * 0.17f,
                        center = Offset(w * 0.39f, h * 0.59f),
                        style = Stroke(width = stemW),
                    )
                    drawCircle(
                        color = accent,
                        radius = minDim * 0.145f,
                        center = Offset(w * 0.74f, h * 0.64f),
                    )
                }

                "stake" -> {
                    // Signature white flowing cursive 'S' + neon green dot
                    val sCurve = Path().apply {
                        moveTo(w * 0.72f, h * 0.24f)
                        cubicTo(w * 0.32f, h * 0.12f, w * 0.25f, h * 0.45f, w * 0.52f, h * 0.50f)
                        cubicTo(w * 0.79f, h * 0.55f, w * 0.70f, h * 0.88f, w * 0.26f, h * 0.76f)
                    }
                    drawPath(
                        sCurve,
                        color = fg,
                        style = Stroke(
                            width = (minDim * 0.14f).coerceAtLeast(2.2f),
                            cap = StrokeCap.Round,
                        ),
                    )
                    drawCircle(
                        color = accent,
                        radius = minDim * 0.095f,
                        center = Offset(w * 0.76f, h * 0.76f),
                    )
                }

                "msport" -> {
                    // Aerodynamic yellow geometric wing 'M' + crimson speed underline
                    val mWing = Path().apply {
                        moveTo(w * 0.12f, h * 0.74f)
                        lineTo(w * 0.24f, h * 0.22f)
                        lineTo(w * 0.50f, h * 0.54f)
                        lineTo(w * 0.76f, h * 0.22f)
                        lineTo(w * 0.88f, h * 0.74f)
                    }
                    drawPath(
                        mWing,
                        color = accent,
                        style = Stroke(
                            width = (minDim * 0.135f).coerceAtLeast(2.2f),
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round,
                        ),
                    )
                    drawLine(
                        color = Color(0xFFEF4444),
                        start = Offset(w * 0.20f, h * 0.85f),
                        end = Offset(w * 0.80f, h * 0.85f),
                        strokeWidth = (minDim * 0.07f).coerceAtLeast(1.4f),
                        cap = StrokeCap.Round,
                    )
                }

                "betpawa" -> {
                    // Neon lime top-right paw toes
                    drawCircle(color = accent, radius = minDim * 0.07f, center = Offset(w * 0.68f, h * 0.22f))
                    drawCircle(color = accent, radius = minDim * 0.065f, center = Offset(w * 0.82f, h * 0.28f))
                    drawCircle(color = accent, radius = minDim * 0.065f, center = Offset(w * 0.56f, h * 0.28f))
                }

                "parimatch" -> {
                    // Yellow racing top bar
                    val bar = Path().apply {
                        moveTo(w * 0.10f, h * 0.16f)
                        lineTo(w * 0.90f, h * 0.16f)
                        lineTo(w * 0.82f, h * 0.32f)
                        lineTo(w * 0.10f, h * 0.32f)
                        close()
                    }
                    drawPath(bar, color = accent)
                }

                "22bet" -> {
                    // Crimson diagonal pitch stripe beneath '22'
                    val stripe = Path().apply {
                        moveTo(w * 0.10f, h * 0.76f)
                        lineTo(w * 0.90f, h * 0.68f)
                        lineTo(w * 0.90f, h * 0.80f)
                        lineTo(w * 0.10f, h * 0.86f)
                        close()
                    }
                    drawPath(stripe, color = accent)
                }

                "paripesa" -> {
                    val diag = Path().apply {
                        moveTo(0f, h * 0.75f)
                        lineTo(w, h * 0.25f)
                        lineTo(w, h)
                        lineTo(0f, h)
                        close()
                    }
                    drawPath(diag, color = accent.copy(alpha = 0.42f))
                }

                "ladbrokes" -> {
                    // Clean geometric white 'L' ticket badge
                    val lPath = Path().apply {
                        moveTo(w * 0.28f, h * 0.20f)
                        lineTo(w * 0.44f, h * 0.20f)
                        lineTo(w * 0.44f, h * 0.64f)
                        lineTo(w * 0.76f, h * 0.64f)
                        lineTo(w * 0.76f, h * 0.80f)
                        lineTo(w * 0.28f, h * 0.80f)
                        close()
                    }
                    drawPath(lPath, color = fg)
                }

                "betfair" -> {
                    // Opposing exchange arrows in crisp black
                    val sw = (minDim * 0.12f).coerceAtLeast(2f)
                    drawLine(
                        color = fg,
                        start = Offset(w * 0.32f, h * 0.20f),
                        end = Offset(w * 0.32f, h * 0.76f),
                        strokeWidth = sw,
                        cap = StrokeCap.Round,
                    )
                    drawLine(
                        color = fg,
                        start = Offset(w * 0.68f, h * 0.80f),
                        end = Offset(w * 0.68f, h * 0.24f),
                        strokeWidth = sw,
                        cap = StrokeCap.Round,
                    )
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

                "bangbet", "hollywoodbets" -> {
                    val star = Path()
                    val cx = w * 0.50f
                    val cy = if (brandId == "hollywoodbets") h * 0.30f else h * 0.26f
                    val outerR = minDim * 0.20f
                    val innerR = minDim * 0.085f
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

                "rollbit", "bcgame" -> {
                    val hex = Path()
                    val cx = w * 0.50f
                    val cy = h * 0.50f
                    val r = minDim * 0.43f
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
                        style = Stroke(width = (minDim * 0.085f).coerceAtLeast(1.6f), join = StrokeJoin.Round),
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
                    drawPath(diamond, color = accent.copy(alpha = 0.24f))
                    drawPath(
                        diamond,
                        color = accent,
                        style = Stroke(width = (minDim * 0.075f).coerceAtLeast(1.5f)),
                    )
                }

                else -> {
                    drawCircle(
                        color = accent.copy(alpha = 0.30f),
                        radius = minDim * 0.40f,
                        center = Offset(w * 0.50f, h * 0.50f),
                        style = Stroke(width = (minDim * 0.065f).coerceAtLeast(1.4f)),
                    )
                }
            }
        }

        // Authentic brand typography overlays matched per real platform identity
        when (brandId) {
            "sportybet", "1xbet", "betway", "stake", "msport", "ladbrokes", "betfair", "pokerstars" -> {
                // Pure custom vector icon drawn cleanly above — zero redundant letter overlay
            }

            "bet9ja" -> {
                val baseSp = when {
                    size <= 26.dp -> 8.sp
                    size <= 34.dp -> 10.sp
                    size <= 46.dp -> 12.sp
                    else -> 16.sp
                }
                Row(
                    verticalAlignment = Alignment.Bottom,
                    horizontalArrangement = Arrangement.Center,
                ) {
                    Text(
                        text = "9",
                        fontSize = (baseSp.value * 1.25f).sp,
                        fontWeight = FontWeight.Black,
                        fontStyle = FontStyle.Italic,
                        color = accent,
                    )
                    Text(
                        text = "ja",
                        fontSize = baseSp,
                        fontWeight = FontWeight.ExtraBold,
                        fontStyle = FontStyle.Italic,
                        color = fg,
                    )
                }
            }

            "bet365" -> {
                val topSp = if (size <= 34.dp) 7.sp else 9.sp
                val numSp = if (size <= 34.dp) 8.sp else 11.sp
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "bet",
                        fontSize = topSp,
                        lineHeight = topSp,
                        fontWeight = FontWeight.Bold,
                        color = fg,
                    )
                    Text(
                        text = "365",
                        fontSize = numSp,
                        lineHeight = numSp,
                        fontWeight = FontWeight.Black,
                        color = accent,
                    )
                }
            }

            "betking", "draftkings", "roobet", "hollywoodbets", "bangbet", "parimatch" -> {
                val fontSize = when {
                    size <= 26.dp -> 7.sp
                    size <= 34.dp -> 9.sp
                    size <= 46.dp -> 10.sp
                    else -> 14.sp
                }
                Text(
                    text = identity.monogram,
                    fontSize = fontSize,
                    fontWeight = FontWeight.ExtraBold,
                    color = if (brandId == "parimatch") accent else fg,
                    maxLines = 1,
                    modifier = Modifier.padding(top = (size.value * 0.20f).dp),
                )
            }

            else -> {
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
                    color = if (brandId == "betpawa" || brandId == "bcgame") accent else fg,
                    maxLines = 1,
                )
            }
        }
    }
}
