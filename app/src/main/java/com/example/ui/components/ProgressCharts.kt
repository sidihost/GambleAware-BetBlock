package com.example.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.ui.DailyBlockStat
import com.example.ui.theme.LocalLiquidColors
import com.example.ui.theme.MonoFontFamily
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.roundToInt

data class ProgressChartPoint(
    val dayNumber: Int,
    val label: String,
    val savedNaira: Int,
    val achieved: Boolean,
)

/**
 * Interactive Black & Pink Area + Line Progress Chart.
 * Displays betting-free days achieved vs next milestone horizon in Naira.
 */
@Composable
fun BettingFreeProgressChart(
    cleanDays: Int,
    cleanHoursRemainder: Int,
    dailySpendEstimate: Int,
    nextMilestoneDay: Int,
    modifier: Modifier = Modifier,
) {
    val liquid = LocalLiquidColors.current
    val ink = MaterialTheme.colorScheme.onBackground
    val mutedInk = MaterialTheme.colorScheme.onSurfaceVariant
    val accent = liquid.activeFill
    val nairaFormat = remember { NumberFormat.getIntegerInstance(Locale("en", "NG")) }

    val points = remember(cleanDays, cleanHoursRemainder, dailySpendEstimate, nextMilestoneDay) {
        val horizon = maxOf(nextMilestoneDay, maxOf(cleanDays + 1, 7))
        val step = when {
            horizon <= 10 -> 1
            horizon <= 30 -> 3
            horizon <= 90 -> 10
            else -> 30
        }
        val dayTicks = mutableListOf<Int>()
        var d = 0
        while (d < horizon) {
            dayTicks.add(d)
            d += step
        }
        if (cleanDays in 1 until horizon && cleanDays !in dayTicks) {
            dayTicks.add(cleanDays)
        }
        dayTicks.add(horizon)
        dayTicks.distinct().sorted().map { day ->
            val achieved = day <= cleanDays
            val saved = if (day == cleanDays && cleanDays == 0) {
                ((cleanHoursRemainder / 24.0) * dailySpendEstimate).toInt()
            } else {
                day * dailySpendEstimate
            }
            ProgressChartPoint(
                dayNumber = day,
                label = if (day == 0) "Start" else "D$day",
                savedNaira = saved,
                achieved = achieved,
            )
        }
    }

    var selectedIndex by remember(points) {
        mutableIntStateOf(
            points.indexOfLast { it.achieved }.coerceAtLeast(0),
        )
    }
    val activePoint = points.getOrElse(selectedIndex) { points.first() }
    val maxDay = (points.lastOrNull()?.dayNumber ?: 7).coerceAtLeast(1)

    Column(modifier = modifier.fillMaxWidth()) {
        // Recharts-style Live Interactive Tooltip Strip
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(liquid.mutedFill)
                .border(1.dp, liquid.subtleBorder, RoundedCornerShape(14.dp))
                .padding(horizontal = 12.dp, vertical = 9.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(
                    text = if (activePoint.achieved) "Achieved • Day ${activePoint.dayNumber}" else "Target • Day ${activePoint.dayNumber}",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = ink,
                )
                Text(
                    text = if (activePoint.achieved) {
                        "Betting-free milestone unlocked"
                    } else {
                        "${(activePoint.dayNumber - cleanDays).coerceAtLeast(1)} day(s) remaining"
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = mutedInk,
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "₦${nairaFormat.format(activePoint.savedNaira)}",
                    fontFamily = MonoFontFamily,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.titleMedium,
                    color = liquid.accentInk,
                )
                Text(
                    text = "Est. Saved",
                    style = MaterialTheme.typography.labelSmall,
                    color = mutedInk,
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            // Y-axis Labels
            Column(
                modifier = Modifier
                    .height(148.dp)
                    .padding(end = 8.dp),
                verticalArrangement = Arrangement.SpaceBetween,
                horizontalAlignment = Alignment.End,
            ) {
                Text(
                    text = "${maxDay}d",
                    style = MaterialTheme.typography.labelSmall,
                    color = mutedInk,
                )
                Text(
                    text = "${maxDay / 2}d",
                    style = MaterialTheme.typography.labelSmall,
                    color = mutedInk,
                )
                Text(
                    text = "0d",
                    style = MaterialTheme.typography.labelSmall,
                    color = mutedInk,
                )
            }

            // Cartesian Canvas with Touch Scrubbing
            Box(modifier = Modifier.weight(1f)) {
                val achievedFloatDay = cleanDays + (cleanHoursRemainder / 24f)

                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(148.dp)
                        .pointerInput(points) {
                            detectTapGestures { offset ->
                                val idx = ((offset.x / size.width.coerceAtLeast(1)) * (points.size - 1))
                                    .roundToInt()
                                    .coerceIn(0, points.lastIndex)
                                selectedIndex = idx
                            }
                        }
                        .pointerInput(points) {
                            detectDragGestures { change, _ ->
                                change.consume()
                                val idx = ((change.position.x / size.width.coerceAtLeast(1)) * (points.size - 1))
                                    .roundToInt()
                                    .coerceIn(0, points.lastIndex)
                                selectedIndex = idx
                            }
                        },
                ) {
                    val w = size.width
                    val h = size.height
                    val topPad = 10.dp.toPx()
                    val bottomPad = 10.dp.toPx()
                    val chartH = (h - topPad - bottomPad).coerceAtLeast(1f)
                    val dashEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 8f), 0f)

                    // Horizontal Cartesian Gridlines
                    listOf(0f, 0.5f, 1f).forEach { frac ->
                        val y = topPad + chartH * frac
                        drawLine(
                            color = ink.copy(alpha = 0.14f),
                            start = Offset(0f, y),
                            end = Offset(w, y),
                            strokeWidth = 1.dp.toPx(),
                            pathEffect = dashEffect,
                        )
                    }

                    val stepX = if (points.size > 1) w / (points.size - 1) else w

                    // Build Projected Path (dashed trajectory to milestone)
                    val projectedPath = Path()
                    points.forEachIndexed { idx, pt ->
                        val x = idx * stepX
                        val y = topPad + chartH * (1f - (pt.dayNumber.toFloat() / maxDay.toFloat()).coerceIn(0f, 1f))
                        if (idx == 0) projectedPath.moveTo(x, y) else projectedPath.lineTo(x, y)
                    }
                    drawPath(
                        path = projectedPath,
                        color = ink.copy(alpha = 0.28f),
                        style = Stroke(
                            width = 1.6.dp.toPx(),
                            pathEffect = dashEffect,
                            cap = StrokeCap.Round,
                        ),
                    )

                    // Build Achieved Solid Path + Translucent Area Fill (Zero gradients!)
                    val achievedPoints = mutableListOf<Offset>()
                    points.forEachIndexed { idx, pt ->
                        if (pt.dayNumber <= achievedFloatDay) {
                            val x = idx * stepX
                            val y = topPad + chartH * (1f - (pt.dayNumber.toFloat() / maxDay.toFloat()).coerceIn(0f, 1f))
                            achievedPoints.add(Offset(x, y))
                        }
                    }
                    // Interpolate exact current fractional position if cleanDays > 0 or hours > 0
                    if (achievedPoints.isNotEmpty() && achievedFloatDay < maxDay) {
                        val exactFraction = (achievedFloatDay / maxDay.toFloat()).coerceIn(0f, 1f)
                        val exactY = topPad + chartH * (1f - exactFraction)
                        val baseIdx = points.indexOfLast { it.dayNumber <= achievedFloatDay }.coerceAtLeast(0)
                        val nextIdx = (baseIdx + 1).coerceAtMost(points.lastIndex)
                        if (nextIdx > baseIdx) {
                            val d0 = points[baseIdx].dayNumber.toFloat()
                            val d1 = points[nextIdx].dayNumber.toFloat()
                            val localT = ((achievedFloatDay - d0) / (d1 - d0).coerceAtLeast(1f)).coerceIn(0f, 1f)
                            val exactX = (baseIdx + localT) * stepX
                            achievedPoints.add(Offset(exactX, exactY))
                        }
                    }

                    if (achievedPoints.size >= 2) {
                        val areaPath = Path().apply {
                            moveTo(achievedPoints.first().x, topPad + chartH)
                            achievedPoints.forEach { lineTo(it.x, it.y) }
                            lineTo(achievedPoints.last().x, topPad + chartH)
                            close()
                        }
                        drawPath(
                            path = areaPath,
                            color = accent.copy(alpha = 0.16f),
                        )
                        val linePath = Path().apply {
                            moveTo(achievedPoints.first().x, achievedPoints.first().y)
                            for (i in 1 until achievedPoints.size) {
                                lineTo(achievedPoints[i].x, achievedPoints[i].y)
                            }
                        }
                        drawPath(
                            path = linePath,
                            color = accent,
                            style = Stroke(
                                width = 2.6.dp.toPx(),
                                cap = StrokeCap.Round,
                                join = StrokeJoin.Round,
                            ),
                        )
                    }

                    // Active Crosshair & Selected Node
                    val selPt = points[selectedIndex]
                    val selX = selectedIndex * stepX
                    drawLine(
                        color = accent.copy(alpha = 0.55f),
                        start = Offset(selX, topPad),
                        end = Offset(selX, topPad + chartH),
                        strokeWidth = 1.dp.toPx(),
                        pathEffect = dashEffect,
                    )

                    // Draw all data point nodes
                    points.forEachIndexed { idx, pt ->
                        val cx = idx * stepX
                        val cy = topPad + chartH * (1f - (pt.dayNumber.toFloat() / maxDay.toFloat()).coerceIn(0f, 1f))
                        val isSelected = idx == selectedIndex
                        val radius = if (isSelected) 6.dp.toPx() else 3.5.dp.toPx()
                        if (isSelected) {
                            drawCircle(
                                color = liquid.activeContent,
                                radius = radius + 2.dp.toPx(),
                                center = Offset(cx, cy),
                            )
                            drawCircle(
                                color = accent,
                                radius = radius + 2.dp.toPx(),
                                center = Offset(cx, cy),
                                style = Stroke(width = 1.75.dp.toPx()),
                            )
                        }
                        drawCircle(
                            color = if (pt.achieved) accent else liquid.mutedFill,
                            radius = radius,
                            center = Offset(cx, cy),
                        )
                        if (!pt.achieved) {
                            drawCircle(
                                color = ink.copy(alpha = 0.45f),
                                radius = radius,
                                center = Offset(cx, cy),
                                style = Stroke(width = 1.25.dp.toPx()),
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        // X-Axis Labels
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 30.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            val labelPoints = if (points.size <= 6) {
                points
            } else {
                listOf(points.first(), points[points.size / 2], points.last())
            }
            labelPoints.forEach { pt ->
                Text(
                    text = pt.label,
                    style = MaterialTheme.typography.labelSmall,
                    color = if (pt.dayNumber == activePoint.dayNumber) ink else mutedInk,
                )
            }
        }
    }
}

/**
 * Interactive 7-day Recharts-style monochrome Bar Chart with touch selection
 * and dashed reference gridlines.
 */
@Composable
fun InteractiveBlockedBarChart(
    stats: List<DailyBlockStat>,
    modifier: Modifier = Modifier,
) {
    if (stats.isEmpty()) return
    val liquid = LocalLiquidColors.current
    val ink = MaterialTheme.colorScheme.onBackground
    val mutedInk = MaterialTheme.colorScheme.onSurfaceVariant
    var selectedIdx by remember(stats) { mutableIntStateOf(stats.lastIndex) }
    val maxCount = remember(stats) { (stats.maxOfOrNull { it.count } ?: 0).coerceAtLeast(1) }
    val selectedStat = stats.getOrElse(selectedIdx) { stats.last() }

    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(liquid.mutedFill)
                .border(1.dp, liquid.subtleBorder, RoundedCornerShape(14.dp))
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "${selectedStat.dayLabel} Intercepts",
                style = MaterialTheme.typography.labelMedium,
                color = ink,
            )
            Text(
                text = "${selectedStat.count} blocked",
                fontFamily = MonoFontFamily,
                fontWeight = FontWeight.Bold,
                style = MaterialTheme.typography.labelLarge,
                color = ink,
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp)
                .pointerInput(stats) {
                    detectTapGestures { offset ->
                        val idx = ((offset.x / size.width.coerceAtLeast(1)) * stats.size)
                            .toInt()
                            .coerceIn(0, stats.lastIndex)
                        selectedIdx = idx
                    }
                }
                .pointerInput(stats) {
                    detectDragGestures { change, _ ->
                        change.consume()
                        val idx = ((change.position.x / size.width.coerceAtLeast(1)) * stats.size)
                            .toInt()
                            .coerceIn(0, stats.lastIndex)
                        selectedIdx = idx
                    }
                },
        ) {
            val w = size.width
            val h = size.height
            val dashEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 8f), 0f)

            listOf(0.05f, 0.5f, 0.98f).forEach { frac ->
                drawLine(
                    color = ink.copy(alpha = 0.14f),
                    start = Offset(0f, h * frac),
                    end = Offset(w, h * frac),
                    strokeWidth = 1.dp.toPx(),
                    pathEffect = dashEffect,
                )
            }

            val slotW = w / stats.size
            val barW = (slotW * 0.46f).coerceAtMost(26.dp.toPx())
            val corner = CornerRadius(8.dp.toPx(), 8.dp.toPx())

            stats.forEachIndexed { idx, stat ->
                val left = idx * slotW + (slotW - barW) / 2f
                // Background track capsule
                drawRoundRect(
                    color = liquid.mutedFill,
                    topLeft = Offset(left, h * 0.06f),
                    size = Size(barW, h * 0.92f),
                    cornerRadius = corner,
                )
                if (stat.count > 0) {
                    val frac = (stat.count.toFloat() / maxCount.toFloat()).coerceIn(0.14f, 1f)
                    val barH = h * 0.92f * frac
                    val top = h * 0.98f - barH
                    val isSelected = idx == selectedIdx
                    drawRoundRect(
                        color = if (isSelected) liquid.activeFill else liquid.activeFill.copy(alpha = 0.6f),
                        topLeft = Offset(left, top),
                        size = Size(barW, barH),
                        cornerRadius = corner,
                    )
                }
                if (idx == selectedIdx) {
                    drawRoundRect(
                        color = liquid.activeFill,
                        topLeft = Offset(left - 2.dp.toPx(), h * 0.04f),
                        size = Size(barW + 4.dp.toPx(), h * 0.94f),
                        cornerRadius = corner,
                        style = Stroke(width = 1.25.dp.toPx()),
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            stats.forEachIndexed { idx, stat ->
                Box(
                    modifier = Modifier.weight(1f),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text = stat.dayLabel,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = if (idx == selectedIdx) FontWeight.Bold else FontWeight.Normal,
                        color = if (idx == selectedIdx) ink else mutedInk,
                    )
                }
            }
        }
    }
}
