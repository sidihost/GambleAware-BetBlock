package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Apps
import androidx.compose.material.icons.rounded.Block
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Language
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.blocker.GamblingCategory
import com.example.blocker.GamblingRegistry
import com.example.data.InstalledAppInfo
import com.example.ui.MainUiState
import com.example.ui.components.LiquidGlassCard
import com.example.ui.components.LiquidSectionHeader
import com.example.ui.components.TourTargetKeys
import com.example.ui.components.tourTarget
import com.example.ui.theme.LocalLiquidColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BlocklistScreen(
    state: MainUiState,
    onToggleCategory: (GamblingCategory, Boolean) -> Unit,
    onToggleStrictKeywords: (Boolean) -> Unit,
    onToggleBrowserShield: (Boolean) -> Unit,
    onToggleAppShield: (Boolean) -> Unit,
    onToggleSearchGuard: (Boolean) -> Unit,
    onAddCustomDomain: (String, Boolean) -> Unit,
    onRemoveCustomDomain: (String, Boolean) -> Unit,
    onOpenAppPicker: () -> Unit,
    onAddBlockedApp: (InstalledAppInfo) -> Unit,
    onRemoveBlockedApp: (String) -> Unit,
    activeTourKey: String? = null,
    bottomContentPadding: androidx.compose.ui.unit.Dp,
    modifier: Modifier = Modifier,
) {
    val liquid = LocalLiquidColors.current
    var newDomainText by remember { mutableStateOf("") }
    var isAddingAllowlist by remember { mutableStateOf(false) }
    var registrySearch by remember { mutableStateOf("") }
    var showAppPickerSheet by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()

    LaunchedEffect(activeTourKey) {
        if (activeTourKey == TourTargetKeys.BLOCKLIST_GUARDS) {
            listState.animateScrollToItem(2)
        }
    }

    val matchingRegistryDomains = remember(registrySearch) {
        val q = registrySearch.trim().lowercase()
        if (q.isEmpty()) {
            GamblingRegistry.domainToCategory.entries.take(12).map { it.key to it.value }
        } else {
            GamblingRegistry.domainToCategory.entries
                .filter { it.key.contains(q) }
                .take(30)
                .map { it.key to it.value }
        }
    }

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.TopCenter,
    ) {
        LazyColumn(
            state = listState,
            modifier = Modifier
                .widthIn(max = 600.dp)
                .fillMaxSize(),
            contentPadding = PaddingValues(
                start = 18.dp,
                end = 18.dp,
                top = 12.dp,
                bottom = bottomContentPadding + 16.dp,
            ),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item {
                Column(modifier = Modifier.padding(horizontal = 4.dp)) {
                    Text(
                        text = "Blocklist & Rules",
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Text(
                        text = "Customize categories, mirror detection, domains, and apps",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            // Category Toggles
            item {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = 18.dp,
                ) {
                    LiquidSectionHeader(
                        title = "Gambling Categories",
                        subtitle = if (state.settings.isAnyLockActive()) {
                            "Turning categories off requires unlocking"
                        } else {
                            "All 5 categories active by default"
                        },
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    CategorySwitchRow(
                        title = GamblingCategory.SPORTSBOOK.displayName,
                        subtitle = GamblingCategory.SPORTSBOOK.description,
                        checked = state.settings.blockSportsbooks,
                        onCheckedChange = { onToggleCategory(GamblingCategory.SPORTSBOOK, it) },
                        testTag = "switch_sportsbooks",
                    )
                    CategorySwitchRow(
                        title = GamblingCategory.CASINO.displayName,
                        subtitle = GamblingCategory.CASINO.description,
                        checked = state.settings.blockCasinos,
                        onCheckedChange = { onToggleCategory(GamblingCategory.CASINO, it) },
                        testTag = "switch_casinos",
                    )
                    CategorySwitchRow(
                        title = GamblingCategory.POKER_BINGO.displayName,
                        subtitle = GamblingCategory.POKER_BINGO.description,
                        checked = state.settings.blockPokerAndBingo,
                        onCheckedChange = { onToggleCategory(GamblingCategory.POKER_BINGO, it) },
                        testTag = "switch_poker",
                    )
                    CategorySwitchRow(
                        title = GamblingCategory.CRYPTO_BETTING.displayName,
                        subtitle = GamblingCategory.CRYPTO_BETTING.description,
                        checked = state.settings.blockCryptoBetting,
                        onCheckedChange = { onToggleCategory(GamblingCategory.CRYPTO_BETTING, it) },
                        testTag = "switch_crypto",
                    )
                    CategorySwitchRow(
                        title = GamblingCategory.FANTASY_LOTTERY.displayName,
                        subtitle = GamblingCategory.FANTASY_LOTTERY.description,
                        checked = state.settings.blockFantasyAndLottery,
                        onCheckedChange = { onToggleCategory(GamblingCategory.FANTASY_LOTTERY, it) },
                        testTag = "switch_fantasy",
                    )
                    CategorySwitchRow(
                        title = "Smart Mirror & Keyword Filter",
                        subtitle = "Catches unindexed mirrors & gambling WebView interfaces",
                        checked = state.settings.strictKeywordFilter,
                        onCheckedChange = onToggleStrictKeywords,
                        testTag = "switch_keywords",
                    )
                }
            }

            // Shield Engines
            item {
                LiquidGlassCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .tourTarget(TourTargetKeys.BLOCKLIST_GUARDS),
                    contentPadding = 18.dp,
                ) {
                    LiquidSectionHeader(
                        title = "Real-Time Guards",
                        subtitle = "Active across browsers, in-app WebViews, and installed apps",
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    CategorySwitchRow(
                        title = "Universal Web & WebView Guard",
                        subtitle = "Stops Chrome, Firefox, Edge, Brave, Custom Tabs & social WebViews",
                        checked = state.settings.browserShieldEnabled,
                        onCheckedChange = onToggleBrowserShield,
                        testTag = "switch_browser_shield",
                    )
                    CategorySwitchRow(
                        title = "Betting App & Install Guard",
                        subtitle = "Blocks 120+ betting apps + newly downloaded gambling APKs",
                        checked = state.settings.appShieldEnabled,
                        onCheckedChange = onToggleAppShield,
                        testTag = "switch_app_shield",
                    )
                    CategorySwitchRow(
                        title = "Search Engine Gambling Guard",
                        subtitle = "Intercepts direct betting searches while keeping recovery & help safe",
                        checked = state.settings.searchGuardEnabled,
                        onCheckedChange = onToggleSearchGuard,
                        testTag = "switch_search_guard",
                    )
                }
            }

            // Custom Domain Rules
            item {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = 18.dp,
                ) {
                    LiquidSectionHeader(
                        title = "Custom Domain Rules",
                        subtitle = "Add specific websites to block or allowlist",
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        ModeChip(
                            label = "Block Domain",
                            selected = !isAddingAllowlist,
                            onClick = { isAddingAllowlist = false },
                            modifier = Modifier.weight(1f),
                            testTag = "mode_block_domain",
                        )
                        ModeChip(
                            label = "Allowlist Exception",
                            selected = isAddingAllowlist,
                            onClick = { isAddingAllowlist = true },
                            modifier = Modifier.weight(1f),
                            testTag = "mode_allowlist_domain",
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        OutlinedTextField(
                            value = newDomainText,
                            onValueChange = { newDomainText = it },
                            modifier = Modifier
                                .weight(1f)
                                .testTag("custom_domain_input"),
                            placeholder = { Text("e.g. mybookie.ag") },
                            singleLine = true,
                            shape = RoundedCornerShape(16.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = MaterialTheme.colorScheme.primary,
                                unfocusedBorderColor = liquid.subtleBorder,
                            ),
                        )
                        Button(
                            onClick = {
                                if (newDomainText.isNotBlank()) {
                                    onAddCustomDomain(newDomainText, isAddingAllowlist)
                                    newDomainText = ""
                                }
                            },
                            modifier = Modifier
                                .height(54.dp)
                                .testTag("add_custom_domain_button"),
                            shape = RoundedCornerShape(16.dp),
                            elevation = ButtonDefaults.buttonElevation(
                                defaultElevation = 0.dp,
                                pressedElevation = 0.dp,
                            ),
                        ) {
                            Icon(Icons.Rounded.Add, contentDescription = "Add domain")
                        }
                    }

                    if (state.customBlockedDomains.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "Custom Blocked (${state.customBlockedDomains.size})",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        state.customBlockedDomains.forEach { item ->
                            DomainRuleRow(
                                domain = item.domain,
                                isAllowlist = false,
                                onDelete = { onRemoveCustomDomain(item.domain, false) },
                            )
                        }
                    }

                    if (state.allowlistedDomains.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "Allowlisted (${state.allowlistedDomains.size})",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        state.allowlistedDomains.forEach { item ->
                            DomainRuleRow(
                                domain = item.domain,
                                isAllowlist = true,
                                onDelete = { onRemoveCustomDomain(item.domain, true) },
                            )
                        }
                    }
                }
            }

            // Custom Blocked Apps
            item {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = 18.dp,
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Extra Blocked Apps",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onBackground,
                            )
                            Text(
                                text = "Built-in list covers 120+ betting apps automatically",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        OutlinedButton(
                            onClick = {
                                onOpenAppPicker()
                                showAppPickerSheet = true
                            },
                            shape = RoundedCornerShape(50),
                            border = BorderStroke(1.dp, liquid.subtleBorder),
                            modifier = Modifier.testTag("open_app_picker_button"),
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Apps,
                                contentDescription = null,
                                modifier = Modifier.size(17.dp),
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Pick App")
                        }
                    }

                    if (state.customBlockedApps.isEmpty()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "No extra apps added yet. Tap Pick App to add any installed app to App Shield.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    } else {
                        Spacer(modifier = Modifier.height(10.dp))
                        state.customBlockedApps.forEach { app ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.6f))
                                    .border(1.dp, liquid.subtleBorder, RoundedCornerShape(14.dp))
                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Block,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onBackground,
                                    modifier = Modifier.size(18.dp),
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = app.appLabel,
                                        style = MaterialTheme.typography.titleSmall,
                                    )
                                    Text(
                                        text = app.packageName,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                }
                                IconButton(
                                    onClick = { onRemoveBlockedApp(app.packageName) },
                                ) {
                                    Icon(
                                        imageVector = Icons.Rounded.DeleteOutline,
                                        contentDescription = "Remove ${app.appLabel}",
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Built-in Registry Search
            item {
                LiquidGlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    contentPadding = 18.dp,
                ) {
                    LiquidSectionHeader(
                        title = "Protected Registry (${state.builtInDomainCount} Domains)",
                        subtitle = "Search built-in sportsbooks, casinos, poker, and crypto sites",
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = registrySearch,
                        onValueChange = { registrySearch = it },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("registry_search_input"),
                        placeholder = { Text("Search registry (e.g. draftkings, poker)") },
                        leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                        singleLine = true,
                        shape = RoundedCornerShape(16.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = MaterialTheme.colorScheme.primary,
                            unfocusedBorderColor = liquid.subtleBorder,
                        ),
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    matchingRegistryDomains.forEach { (domain, category) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 5.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f),
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Language,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onBackground,
                                    modifier = Modifier.size(16.dp),
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = domain,
                                    style = MaterialTheme.typography.bodyMedium,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                )
                            }
                            Text(
                                text = category.displayName.substringBefore(" "),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
            }
        }
    }

    if (showAppPickerSheet) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        var appFilter by remember { mutableStateOf("") }
        val filteredApps = remember(state.installedApps, appFilter) {
            val q = appFilter.trim().lowercase()
            if (q.isEmpty()) state.installedApps
            else state.installedApps.filter {
                it.label.lowercase().contains(q) || it.packageName.lowercase().contains(q)
            }
        }

        ModalBottomSheet(
            onDismissRequest = { showAppPickerSheet = false },
            sheetState = sheetState,
            containerColor = MaterialTheme.colorScheme.surface,
            tonalElevation = 0.dp,
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 18.dp)
                    .padding(bottom = 24.dp),
            ) {
                Text(
                    text = "Select App to Block",
                    style = MaterialTheme.typography.titleLarge,
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = appFilter,
                    onValueChange = { appFilter = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Filter installed apps") },
                    leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                    singleLine = true,
                    shape = RoundedCornerShape(16.dp),
                )
                Spacer(modifier = Modifier.height(12.dp))
                if (state.isLoadingApps) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        CircularProgressIndicator()
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(340.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        items(filteredApps, key = { it.packageName }) { app ->
                            val alreadyBlocked = state.customBlockedApps.any {
                                it.packageName == app.packageName.lowercase()
                            }
                            LiquidGlassCard(
                                cornerRadius = 16.dp,
                                fillColor = liquid.mutedFill,
                                borderColor = liquid.subtleBorder,
                                contentPadding = 12.dp,
                                onClick = {
                                    if (!alreadyBlocked) {
                                        onAddBlockedApp(app)
                                        showAppPickerSheet = false
                                    }
                                },
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = app.label,
                                            style = MaterialTheme.typography.titleSmall,
                                        )
                                        Text(
                                            text = app.packageName,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        )
                                    }
                                    Icon(
                                        imageVector = if (alreadyBlocked) Icons.Rounded.CheckCircle else Icons.Rounded.Add,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.onBackground,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CategorySwitchRow(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    testTag: String,
) {
    val liquid = LocalLiquidColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            modifier = Modifier.testTag(testTag),
            colors = SwitchDefaults.colors(
                checkedThumbColor = liquid.activeContent,
                checkedTrackColor = liquid.activeFill,
                uncheckedThumbColor = MaterialTheme.colorScheme.onSurfaceVariant,
                uncheckedTrackColor = liquid.mutedFill,
                uncheckedBorderColor = liquid.subtleBorder,
            ),
        )
    }
}

@Composable
private fun ModeChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    testTag: String,
) {
    val liquid = LocalLiquidColors.current
    LiquidGlassCard(
        modifier = modifier.testTag(testTag),
        cornerRadius = 50.dp,
        fillColor = if (selected) liquid.activeFill else MaterialTheme.colorScheme.surface.copy(alpha = 0.55f),
        borderColor = if (selected) liquid.activeFill else liquid.subtleBorder,
        contentPadding = 10.dp,
        onClick = onClick,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = if (selected) liquid.activeContent else MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.align(Alignment.CenterHorizontally),
        )
    }
}

@Composable
private fun DomainRuleRow(
    domain: String,
    isAllowlist: Boolean,
    onDelete: () -> Unit,
) {
    val liquid = LocalLiquidColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.6f))
            .border(1.dp, liquid.subtleBorder, RoundedCornerShape(14.dp))
            .padding(start = 12.dp, end = 4.dp, top = 4.dp, bottom = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = if (isAllowlist) Icons.Rounded.CheckCircle else Icons.Rounded.Block,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.size(18.dp),
        )
        Spacer(modifier = Modifier.width(10.dp))
        Text(
            text = domain,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.weight(1f),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        IconButton(onClick = onDelete) {
            Icon(
                imageVector = Icons.Rounded.DeleteOutline,
                contentDescription = "Delete $domain",
            )
        }
    }
}
