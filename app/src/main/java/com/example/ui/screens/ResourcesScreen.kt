package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Air
import androidx.compose.material.icons.rounded.Call
import androidx.compose.material.icons.rounded.CheckBox
import androidx.compose.material.icons.rounded.CheckBoxOutlineBlank
import androidx.compose.material.icons.rounded.OpenInNew
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.SupportAgent
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.data.RecoveryResourceCategory
import com.example.data.RecoveryResourceItem
import com.example.data.RecoveryResourcesCatalog
import com.example.ui.MainUiState
import com.example.ui.components.LiquidGlassCard
import com.example.ui.components.LiquidSectionHeader
import com.example.ui.theme.LocalLiquidColors

@Composable
fun ResourcesScreen(
    uiState: MainUiState,
    onToggleBankFreezeCheck: (String) -> Unit,
    onStartCalmReset: () -> Unit,
) {
    val context = LocalContext.current
    val liquid = LocalLiquidColors.current
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf<RecoveryResourceCategory?>(null) }

    val filteredResources = remember(searchQuery, selectedCategory) {
        val q = searchQuery.trim().lowercase()
        RecoveryResourcesCatalog.resources.filter { item ->
            val matchesCat = selectedCategory == null || item.category == selectedCategory
            val matchesQuery = q.isEmpty() ||
                item.title.lowercase().contains(q) ||
                item.subtitle.lowercase().contains(q) ||
                item.region.lowercase().contains(q)
            matchesCat && matchesQuery
        }
    }

    val completedCount = uiState.settings.completedBankChecks.size
    val totalChecklistCount = RecoveryResourcesCatalog.bankFreezeChecklist.size

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .testTag("resources_screen"),
        contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 16.dp, bottom = 126.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item {
            Column {
                Text(
                    text = "RECOVERY RESOURCES",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = liquid.accentInk,
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Helplines, Bank Blocks & Self-Exclusion",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground,
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Free, confidential support directories, bank gambling blocks, and immediate relapse reset tools — always available offline.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        // Immediate Calm Reset CTA card
        item {
            LiquidGlassCard(
                fillColor = liquid.softAccentFill,
                borderColor = liquid.activeFill.copy(alpha = 0.35f),
                cornerRadius = 22.dp,
                contentPadding = 16.dp,
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Having a strong urge right now?",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground,
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Start a guided 60-second Calm Reset before acting.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Button(
                        onClick = onStartCalmReset,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = liquid.activeFill,
                            contentColor = liquid.activeContent,
                        ),
                        shape = RoundedCornerShape(14.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Air,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("60s Reset", fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }

        // Search & Category filter row
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("Search helplines, GAMSTOP, Nigerian banks, CBT...") },
                    leadingIcon = {
                        Icon(
                            imageVector = Icons.Rounded.Search,
                            contentDescription = null,
                        )
                    },
                    shape = RoundedCornerShape(16.dp),
                )

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    CategoryFilterButton(
                        label = "All (${RecoveryResourcesCatalog.resources.size})",
                        selected = selectedCategory == null,
                        onClick = { selectedCategory = null },
                    )
                    RecoveryResourceCategory.entries.forEach { cat ->
                        val count = RecoveryResourcesCatalog.resources.count { it.category == cat }
                        CategoryFilterButton(
                            label = "${cat.label} ($count)",
                            selected = selectedCategory == cat,
                            onClick = { selectedCategory = cat },
                        )
                    }
                }
            }
        }

        // Filtered Resource Cards
        items(filteredResources, key = { it.id }) { resource ->
            ResourceCard(
                item = resource,
                onOpenUrl = { url ->
                    runCatching {
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    }
                },
                onCallPhone = { phone ->
                    runCatching {
                        context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone")))
                    }
                },
            )
        }

        // Interactive Bank & Card Freeze Checklist
        item {
            Spacer(modifier = Modifier.height(6.dp))
            LiquidSectionHeader(
                title = "Bank & Card Freeze Checklist ($completedCount/$totalChecklistCount)",
                subtitle = "Lock down payment channels so an impulse cannot become a deposit.",
            )
        }

        item {
            LiquidGlassCard(cornerRadius = 22.dp, contentPadding = 16.dp) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    RecoveryResourcesCatalog.bankFreezeChecklist.forEach { item ->
                        val checked = uiState.settings.completedBankChecks.contains(item.id)
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(
                                    if (checked) liquid.softAccentFill else liquid.mutedFill,
                                )
                                .border(
                                    width = 1.dp,
                                    color = if (checked) liquid.activeFill.copy(alpha = 0.45f) else liquid.subtleBorder,
                                    shape = RoundedCornerShape(14.dp),
                                )
                                .clickable { onToggleBankFreezeCheck(item.id) }
                                .padding(12.dp),
                            verticalAlignment = Alignment.Top,
                        ) {
                            Icon(
                                imageVector = if (checked) Icons.Rounded.CheckBox else Icons.Rounded.CheckBoxOutlineBlank,
                                contentDescription = if (checked) "Completed" else "Not completed",
                                tint = if (checked) liquid.activeFill else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(20.dp),
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = item.title,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurface,
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = item.detail,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }
                }
            }
        }

        // 48-Hour Relapse Reset Toolkit
        item {
            Spacer(modifier = Modifier.height(6.dp))
            LiquidSectionHeader(
                title = "48-Hour Relapse Reset Plan",
                subtitle = "If you slipped, do not chase. Follow these 4 calm steps right now.",
            )
        }

        item {
            LiquidGlassCard(cornerRadius = 22.dp, contentPadding = 16.dp) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    RecoveryResourcesCatalog.relapseQuickActions.forEach { action ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(liquid.mutedFill)
                                .border(1.dp, liquid.subtleBorder, RoundedCornerShape(14.dp))
                                .padding(12.dp),
                        ) {
                            Text(
                                text = action.title,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface,
                            )
                            Spacer(modifier = Modifier.height(3.dp))
                            Text(
                                text = action.detail,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CategoryFilterButton(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val liquid = LocalLiquidColors.current
    val bg = if (selected) liquid.activeFill else liquid.glassFill
    val fg = if (selected) liquid.activeContent else MaterialTheme.colorScheme.onSurface
    val border = if (selected) liquid.activeFill else liquid.subtleBorder

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .border(1.dp, border, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 8.dp),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold,
            color = fg,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun ResourceCard(
    item: RecoveryResourceItem,
    onOpenUrl: (String) -> Unit,
    onCallPhone: (String) -> Unit,
) {
    val liquid = LocalLiquidColors.current
    LiquidGlassCard(cornerRadius = 22.dp, contentPadding = 16.dp) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                text = "${item.category.label.uppercase()} • ${item.region.uppercase()}",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = liquid.accentInk,
            )
            Icon(
                imageVector = Icons.Rounded.SupportAgent,
                contentDescription = null,
                tint = liquid.accentInk,
                modifier = Modifier.size(18.dp),
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = item.title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface,
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = item.subtitle,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        if (!item.hours.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = item.hours,
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Spacer(modifier = Modifier.height(12.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (!item.phoneNumber.isNullOrBlank()) {
                Button(
                    onClick = { onCallPhone(item.phoneNumber) },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = liquid.activeFill,
                        contentColor = liquid.activeContent,
                    ),
                    shape = RoundedCornerShape(14.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 10.dp),
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Call,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Call Now",
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }
            OutlinedButton(
                onClick = { onOpenUrl(item.url) },
                modifier = Modifier.weight(1f),
                border = BorderStroke(1.dp, liquid.subtleBorder),
                shape = RoundedCornerShape(14.dp),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 10.dp),
            ) {
                Icon(
                    imageVector = Icons.Rounded.OpenInNew,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.size(16.dp),
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = item.actionLabel,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
}
