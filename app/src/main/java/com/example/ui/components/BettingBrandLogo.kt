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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.blocker.BrandCatalog
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

private fun flatLogoTextStyle(
    fontSize: TextUnit,
    color: Color,
    fontWeight: FontWeight = FontWeight.Black,
    fontStyle: FontStyle = FontStyle.Normal,
    letterSpacing: TextUnit = 0.sp,
): TextStyle = TextStyle(
    fontSize = fontSize,
    lineHeight = fontSize,
    fontWeight = fontWeight,
    fontStyle = fontStyle,
    color = color,
    letterSpacing = letterSpacing,
    textAlign = TextAlign.Center,
    platformStyle = PlatformTextStyle(includeFontPadding = false),
)

/**
 * Crisp, flat (zero-gradient, zero-shadow) authentic betting platform logos.
 * Every brand mark is drawn on an exact 32x32 vector grid with font-padding-disabled typography
 * so icons render accurately and centered at all sizes (24.dp – 64.dp).
 */
@Composable
fun BettingBrandLogo(
    target: String,
    modifier: Modifier = Modifier,
    size: Dp = 40.dp,
    cornerRadius: Dp = 10.dp,
) {
    val identity = remember(target) { BrandCatalog.resolve(target) }
    val bg = Color(identity.bgHex)
    val accent = Color(identity.accentHex)
    val fg = Color(identity.fgHex)
    val brandId = identity.brand?.id
    val shape = RoundedCornerShape(cornerRadius)

    Box(
        modifier = modifier
            .size(size)
            .clip(shape)
            .background(bg)
            .border(1.dp, Color.Black.copy(alpha = 0.14f), shape),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val side = minOf(this.size.width, this.size.height)
            val s = side / 32f
            val ox = (this.size.width - 32f * s) / 2f
            val oy = (this.size.height - 32f * s) / 2f

            fun px(x: Float) = ox + x * s
            fun py(y: Float) = oy + y * s

            when (brandId) {
                "sportybet" -> {
                    // Authentic SportyBet crimson app tile: bold curved white 'S' ribbon + upper-right & lower-left ball dots
                    val ribbon = Path().apply {
                        moveTo(px(17.5f), py(10.6f))
                        cubicTo(px(14.0f), py(10.6f), px(12.8f), py(12.8f), px(15.6f), py(14.1f))
                        lineTo(px(18.0f), py(15.0f))
                        cubicTo(px(23.6f), py(16.9f), px(24.0f), py(23.8f), px(17.2f), py(25.2f))
                        cubicTo(px(15.8f), py(25.5f), px(14.6f), py(25.5f), px(13.8f), py(25.4f))
                        lineTo(px(12.8f), py(20.9f))
                        cubicTo(px(15.4f), py(21.0f), px(17.2f), py(19.6f), px(15.2f), py(18.2f))
                        lineTo(px(12.6f), py(17.2f))
                        cubicTo(px(7.4f), py(15.4f), px(7.6f), py(8.6f), px(14.2f), py(6.8f))
                        cubicTo(px(15.6f), py(6.4f), px(16.6f), py(6.6f), px(17.0f), py(7.2f))
                        close()
                    }
                    drawPath(ribbon, color = fg)
                    drawCircle(color = fg, radius = 2.75f * s, center = Offset(px(21.6f), py(8.2f)))
                    drawCircle(color = fg, radius = 2.75f * s, center = Offset(px(10.4f), py(23.8f)))
                }

                "bet9ja" -> {
                    // Red curved pitch swoosh beneath gold 9 + white ja
                    val arc = Path().apply {
                        moveTo(px(6f), py(24.4f))
                        quadraticTo(px(16f), py(27.2f), px(26f), py(23.8f))
                    }
                    drawPath(
                        arc,
                        color = Color(0xFFEF4444),
                        style = Stroke(width = 2.1f * s, cap = StrokeCap.Round),
                    )
                }

                "betking", "draftkings", "roobet" -> {
                    val crown = Path().apply {
                        moveTo(px(8.5f), py(13.2f))
                        lineTo(px(7.2f), py(7.8f))
                        lineTo(px(11.1f), py(10.6f))
                        lineTo(px(16f), py(6.0f))
                        lineTo(px(20.9f), py(10.6f))
                        lineTo(px(24.8f), py(7.8f))
                        lineTo(px(23.5f), py(13.2f))
                        close()
                    }
                    drawPath(crown, color = accent)
                    if (brandId == "betking") {
                        drawCircle(color = Color(0xFFFDE047), radius = 1.15f * s, center = Offset(px(16f), py(5.3f)))
                    }
                }

                "1xbet" -> {
                    // Crisp filled geometric white '1' + sky-blue athletic 'X'
                    val one = Path().apply {
                        moveTo(px(5.4f), py(10.8f))
                        lineTo(px(10.4f), py(7.8f))
                        lineTo(px(10.4f), py(24.2f))
                        lineTo(px(7.1f), py(24.2f))
                        lineTo(px(7.1f), py(12.4f))
                        lineTo(px(4.9f), py(13.7f))
                        close()
                    }
                    drawPath(one, color = fg)

                    val xMark = Path().apply {
                        moveTo(px(13.2f), py(8.4f))
                        lineTo(px(17.1f), py(8.4f))
                        lineTo(px(20.3f), py(13.5f))
                        lineTo(px(23.9f), py(8.4f))
                        lineTo(px(27.7f), py(8.4f))
                        lineTo(px(22.3f), py(15.8f))
                        lineTo(px(27.9f), py(24.2f))
                        lineTo(px(24.0f), py(24.2f))
                        lineTo(px(20.5f), py(18.7f))
                        lineTo(px(16.7f), py(24.2f))
                        lineTo(px(13.0f), py(24.2f))
                        lineTo(px(18.7f), py(16.1f))
                        close()
                    }
                    drawPath(xMark, color = accent)
                }

                "bet365" -> {
                    // Clean inner hairline frame
                    drawRoundRect(
                        color = accent.copy(alpha = 0.24f),
                        topLeft = Offset(px(3.2f), py(3.2f)),
                        size = Size(25.6f * s, 25.6f * s),
                        cornerRadius = CornerRadius(5.5f * s, 5.5f * s),
                        style = Stroke(width = 1.1f * s),
                    )
                }

                "betway" -> {
                    // Clean geometric white lowercase 'b' + signature emerald dot (no overlap)
                    val bStem = Path().apply {
                        moveTo(px(7.4f), py(6.8f))
                        lineTo(px(10.8f), py(6.8f))
                        lineTo(px(10.8f), py(24.0f))
                        lineTo(px(7.4f), py(24.0f))
                        close()
                    }
                    drawPath(bStem, color = fg)
                    drawCircle(
                        color = fg,
                        radius = 4.6f * s,
                        center = Offset(px(14.2f), py(18.1f)),
                        style = Stroke(width = 3.1f * s),
                    )
                    drawCircle(
                        color = accent,
                        radius = 3.5f * s,
                        center = Offset(px(24.2f), py(19.6f)),
                    )
                }

                "stake" -> {
                    // Crisp white flowing 'S' ribbon + neon green accent dot
                    val sCurve = Path().apply {
                        moveTo(px(22.4f), py(9.2f))
                        cubicTo(px(14.4f), py(6.2f), px(9.6f), py(12.2f), px(15.6f), py(15.4f))
                        cubicTo(px(22.2f), py(18.6f), px(20.6f), py(25.2f), px(10.2f), py(22.8f))
                    }
                    drawPath(
                        sCurve,
                        color = fg,
                        style = Stroke(width = 3.5f * s, cap = StrokeCap.Round, join = StrokeJoin.Round),
                    )
                    drawCircle(
                        color = accent,
                        radius = 2.3f * s,
                        center = Offset(px(23.6f), py(23.0f)),
                    )
                }

                "msport" -> {
                    // Bold golden yellow double-wing 'M' + crimson speed underline
                    val mPath = Path().apply {
                        moveTo(px(5.2f), py(22.6f))
                        lineTo(px(9.4f), py(8.4f))
                        lineTo(px(13.4f), py(8.4f))
                        lineTo(px(16.0f), py(15.4f))
                        lineTo(px(18.6f), py(8.4f))
                        lineTo(px(22.6f), py(8.4f))
                        lineTo(px(26.8f), py(22.6f))
                        lineTo(px(22.9f), py(22.6f))
                        lineTo(px(20.6f), py(14.5f))
                        lineTo(px(17.8f), py(21.6f))
                        lineTo(px(14.2f), py(21.6f))
                        lineTo(px(11.4f), py(14.5f))
                        lineTo(px(9.1f), py(22.6f))
                        close()
                    }
                    drawPath(mPath, color = accent)
                    drawLine(
                        color = Color(0xFFEF4444),
                        start = Offset(px(7.4f), py(25.6f)),
                        end = Offset(px(24.6f), py(25.6f)),
                        strokeWidth = 1.8f * s,
                        cap = StrokeCap.Round,
                    )
                }

                "betpawa" -> {
                    // Signature lime top-right paw dots
                    drawCircle(color = accent, radius = 1.45f * s, center = Offset(px(24.0f), py(8.0f)))
                    drawCircle(color = accent, radius = 1.25f * s, center = Offset(px(26.6f), py(10.3f)))
                    drawCircle(color = accent, radius = 1.25f * s, center = Offset(px(21.8f), py(10.3f)))
                }

                "parimatch" -> {
                    // Slanted iconic yellow top stripe
                    val bar = Path().apply {
                        moveTo(px(5.5f), py(6.2f))
                        lineTo(px(26.5f), py(6.2f))
                        lineTo(px(24.2f), py(11.2f))
                        lineTo(px(5.5f), py(11.2f))
                        close()
                    }
                    drawPath(bar, color = accent)
                }

                "22bet" -> {
                    // Diagonal crimson stripe under bold '22'
                    val stripe = Path().apply {
                        moveTo(px(5.5f), py(23.8f))
                        lineTo(px(26.5f), py(21.2f))
                        lineTo(px(26.5f), py(24.4f))
                        lineTo(px(5.5f), py(26.8f))
                        close()
                    }
                    drawPath(stripe, color = accent)
                }

                "paripesa" -> {
                    // Diagonal emerald lower-right corner split
                    val diag = Path().apply {
                        moveTo(px(0f), py(24.5f))
                        lineTo(px(32f), py(12.0f))
                        lineTo(px(32f), py(32f))
                        lineTo(px(0f), py(32f))
                        close()
                    }
                    drawPath(diag, color = accent.copy(alpha = 0.35f))
                }

                "melbet" -> {
                    // Clean amber top & bottom accent bars
                    drawRect(color = accent, topLeft = Offset(px(5.5f), py(6.2f)), size = Size(21f * s, 2.2f * s))
                    drawRect(color = accent, topLeft = Offset(px(5.5f), py(23.6f)), size = Size(21f * s, 2.2f * s))
                }

                "betwinner", "nairabet", "merrybet", "williamhill" -> {
                    // Clean framed crest border
                    drawRoundRect(
                        color = accent,
                        topLeft = Offset(px(4.2f), py(4.2f)),
                        size = Size(23.6f * s, 23.6f * s),
                        cornerRadius = CornerRadius(6f * s, 6f * s),
                        style = Stroke(width = 1.6f * s),
                    )
                }

                "fanduel" -> {
                    // Crisp white shield silhouette on FanDuel blue
                    val shield = Path().apply {
                        moveTo(px(16f), py(4.8f))
                        lineTo(px(25.8f), py(8.6f))
                        lineTo(px(25.8f), py(16.8f))
                        cubicTo(px(25.8f), py(22.4f), px(21.2f), py(25.8f), px(16f), py(27.6f))
                        cubicTo(px(10.8f), py(25.8f), px(6.2f), py(22.4f), px(6.2f), py(16.8f))
                        lineTo(px(6.2f), py(8.6f))
                        close()
                    }
                    drawPath(shield, color = Color.White)
                }

                "betmgm", "caesars" -> {
                    // Gold luxury double frame
                    drawRoundRect(
                        color = accent,
                        topLeft = Offset(px(3.8f), py(3.8f)),
                        size = Size(24.4f * s, 24.4f * s),
                        cornerRadius = CornerRadius(5f * s, 5f * s),
                        style = Stroke(width = 1.7f * s),
                    )
                }

                "paddypower" -> {
                    // Clean clover dot triad at top
                    drawCircle(color = accent, radius = 2.0f * s, center = Offset(px(16f), py(7.2f)))
                    drawCircle(color = accent, radius = 1.7f * s, center = Offset(px(13.6f), py(9.2f)))
                    drawCircle(color = accent, radius = 1.7f * s, center = Offset(px(18.4f), py(9.2f)))
                }

                "ladbrokes" -> {
                    // Geometric bold white 'L' mark
                    val lPath = Path().apply {
                        moveTo(px(9.2f), py(6.6f))
                        lineTo(px(14.4f), py(6.6f))
                        lineTo(px(14.4f), py(20.6f))
                        lineTo(px(23.8f), py(20.6f))
                        lineTo(px(23.8f), py(25.4f))
                        lineTo(px(9.2f), py(25.4f))
                        close()
                    }
                    drawPath(lPath, color = fg)
                }

                "betfair" -> {
                    // Opposing exchange arrows (up-arrow left, down-arrow right) with crisp heads
                    val upArrow = Path().apply {
                        moveTo(px(11.2f), py(6.6f))
                        lineTo(px(16.4f), py(13.2f))
                        lineTo(px(13.1f), py(13.2f))
                        lineTo(px(13.1f), py(24.6f))
                        lineTo(px(9.3f), py(24.6f))
                        lineTo(px(9.3f), py(13.2f))
                        lineTo(px(6.0f), py(13.2f))
                        close()
                    }
                    drawPath(upArrow, color = fg)

                    val downArrow = Path().apply {
                        moveTo(px(20.8f), py(25.4f))
                        lineTo(px(15.6f), py(18.8f))
                        lineTo(px(18.9f), py(18.8f))
                        lineTo(px(18.9f), py(7.4f))
                        lineTo(px(22.7f), py(7.4f))
                        lineTo(px(22.7f), py(18.8f))
                        lineTo(px(26.0f), py(18.8f))
                        close()
                    }
                    drawPath(downArrow, color = fg)
                }

                "pokerstars" -> {
                    // Iconic crimson spade with white 5-point center star
                    val spade = Path().apply {
                        moveTo(px(16f), py(5.0f))
                        cubicTo(px(24.8f), py(13.2f), px(25.2f), py(21.4f), px(18.4f), py(21.0f))
                        lineTo(px(20.0f), py(26.8f))
                        lineTo(px(12.0f), py(26.8f))
                        lineTo(px(13.6f), py(21.0f))
                        cubicTo(px(6.8f), py(21.4f), px(7.2f), py(13.2f), px(16f), py(5.0f))
                        close()
                    }
                    drawPath(spade, color = accent)

                    val star = Path()
                    val cx = px(16f)
                    val cy = py(15.8f)
                    val outerR = 3.8f * s
                    val innerR = 1.65f * s
                    for (i in 0 until 10) {
                        val angle = (-90.0 + i * 36.0) * (PI / 180.0)
                        val r = if (i % 2 == 0) outerR else innerR
                        val sx = cx + (cos(angle) * r).toFloat()
                        val sy = cy + (sin(angle) * r).toFloat()
                        if (i == 0) star.moveTo(sx, sy) else star.lineTo(sx, sy)
                    }
                    star.close()
                    drawPath(star, color = fg)
                }

                "bangbet", "hollywoodbets" -> {
                    val star = Path()
                    val cx = px(16f)
                    val cy = py(9.2f)
                    val outerR = 4.6f * s
                    val innerR = 2.0f * s
                    for (i in 0 until 10) {
                        val angle = (-90.0 + i * 36.0) * (PI / 180.0)
                        val r = if (i % 2 == 0) outerR else innerR
                        val sx = cx + (cos(angle) * r).toFloat()
                        val sy = cy + (sin(angle) * r).toFloat()
                        if (i == 0) star.moveTo(sx, sy) else star.lineTo(sx, sy)
                    }
                    star.close()
                    drawPath(star, color = accent)
                }

                "rollbit", "bcgame" -> {
                    val hex = Path()
                    val cx = px(16f)
                    val cy = py(16f)
                    val r = 12.0f * s
                    for (i in 0 until 6) {
                        val angle = (-30.0 + i * 60.0) * (PI / 180.0)
                        val hx = cx + (cos(angle) * r).toFloat()
                        val hy = cy + (sin(angle) * r).toFloat()
                        if (i == 0) hex.moveTo(hx, hy) else hex.lineTo(hx, hy)
                    }
                    hex.close()
                    drawPath(
                        hex,
                        color = accent,
                        style = Stroke(width = 2.1f * s, join = StrokeJoin.Round),
                    )
                }

                "prizepicks", "underdogfantasy" -> {
                    val shield = Path().apply {
                        moveTo(px(7.2f), py(6.8f))
                        lineTo(px(24.8f), py(6.8f))
                        lineTo(px(24.8f), py(16.8f))
                        cubicTo(px(24.8f), py(21.6f), px(21.0f), py(24.8f), px(16f), py(26.6f))
                        cubicTo(px(11.0f), py(24.8f), px(7.2f), py(21.6f), px(7.2f), py(16.8f))
                        close()
                    }
                    if (brandId == "underdogfantasy") {
                        drawPath(shield, color = accent)
                    } else {
                        drawPath(shield, color = accent.copy(alpha = 0.24f))
                        drawPath(shield, color = accent, style = Stroke(width = 1.9f * s))
                    }
                }

                else -> {
                    drawRoundRect(
                        color = accent.copy(alpha = 0.35f),
                        topLeft = Offset(px(4f), py(4f)),
                        size = Size(24f * s, 24f * s),
                        cornerRadius = CornerRadius(6f * s, 6f * s),
                        style = Stroke(width = 1.6f * s),
                    )
                }
            }
        }

        // Authentic centered brand typography overlays (includeFontPadding = false prevents Android vertical clipping)
        when (brandId) {
            "sportybet", "1xbet", "betway", "stake", "msport", "ladbrokes", "betfair", "pokerstars" -> {
                // Complete vector brand emblem rendered above
            }

            "bet9ja" -> {
                val mainSp = (size.value * 0.30f).coerceIn(8f, 18f)
                Row(
                    modifier = Modifier.padding(bottom = (size.value * 0.08f).dp),
                    verticalAlignment = Alignment.Bottom,
                    horizontalArrangement = Arrangement.Center,
                ) {
                    Text(
                        text = "9",
                        style = flatLogoTextStyle(
                            fontSize = (mainSp * 1.25f).sp,
                            color = accent,
                            fontWeight = FontWeight.Black,
                            fontStyle = FontStyle.Italic,
                        ),
                        maxLines = 1,
                        softWrap = false,
                    )
                    Text(
                        text = "ja",
                        style = flatLogoTextStyle(
                            fontSize = mainSp.sp,
                            color = fg,
                            fontWeight = FontWeight.ExtraBold,
                            fontStyle = FontStyle.Italic,
                        ),
                        maxLines = 1,
                        softWrap = false,
                    )
                }
            }

            "bet365" -> {
                val topSp = (size.value * 0.23f).coerceIn(7f, 13f).sp
                val numSp = (size.value * 0.29f).coerceIn(8f, 16f).sp
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Text(
                        text = "bet",
                        style = flatLogoTextStyle(
                            fontSize = topSp,
                            color = fg,
                            fontWeight = FontWeight.ExtraBold,
                        ),
                        maxLines = 1,
                        softWrap = false,
                    )
                    Text(
                        text = "365",
                        style = flatLogoTextStyle(
                            fontSize = numSp,
                            color = accent,
                            fontWeight = FontWeight.Black,
                        ),
                        maxLines = 1,
                        softWrap = false,
                    )
                }
            }

            "betking", "draftkings", "roobet", "hollywoodbets", "bangbet", "parimatch", "paddypower" -> {
                val fontSize = (size.value * 0.28f).coerceIn(8f, 16f).sp
                Text(
                    text = identity.monogram,
                    style = flatLogoTextStyle(
                        fontSize = fontSize,
                        color = if (brandId == "parimatch") accent else fg,
                        fontWeight = FontWeight.Black,
                    ),
                    maxLines = 1,
                    softWrap = false,
                    modifier = Modifier.padding(top = (size.value * 0.22f).dp),
                )
            }

            "fanduel" -> {
                val fontSize = (size.value * 0.28f).coerceIn(8f, 16f).sp
                Text(
                    text = "FD",
                    style = flatLogoTextStyle(
                        fontSize = fontSize,
                        color = Color(0xFF1493FF),
                        fontWeight = FontWeight.Black,
                    ),
                    maxLines = 1,
                    softWrap = false,
                )
            }

            "underdogfantasy" -> {
                val fontSize = (size.value * 0.28f).coerceIn(8f, 16f).sp
                Text(
                    text = "UD",
                    style = flatLogoTextStyle(
                        fontSize = fontSize,
                        color = Color(0xFF18181B),
                        fontWeight = FontWeight.Black,
                    ),
                    maxLines = 1,
                    softWrap = false,
                )
            }

            "22bet" -> {
                val fontSize = (size.value * 0.34f).coerceIn(9f, 19f).sp
                Text(
                    text = "22",
                    style = flatLogoTextStyle(
                        fontSize = fontSize,
                        color = fg,
                        fontWeight = FontWeight.Black,
                    ),
                    maxLines = 1,
                    softWrap = false,
                    modifier = Modifier.padding(bottom = (size.value * 0.14f).dp),
                )
            }

            else -> {
                val factor = when {
                    identity.monogram.length >= 3 -> 0.24f
                    else -> 0.32f
                }
                val fontSize = (size.value * factor).coerceIn(7.5f, 18f).sp
                val textColor = when (brandId) {
                    "betpawa", "bcgame", "betmgm", "caesars" -> accent
                    else -> fg
                }
                Text(
                    text = identity.monogram,
                    style = flatLogoTextStyle(
                        fontSize = fontSize,
                        color = textColor,
                        fontWeight = FontWeight.Black,
                    ),
                    maxLines = 1,
                    softWrap = false,
                )
            }
        }
    }
}
