package com.example.ui.theme

import android.os.Build
import android.view.View
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import com.example.data.ThemeMode

data class LiquidColors(
    val isDark: Boolean,
    val glassFill: Color,
    val glassSecondaryFill: Color,
    val controlFill: Color,
    val controlContent: Color,
    val glassBorder: Color,
    val subtleBorder: Color,
    val activeFill: Color,
    val activeContent: Color,
    val mutedFill: Color,
    val mutedContent: Color,
    val softAccentFill: Color,
    val accentInk: Color,
    val blobOne: Color,
    val blobTwo: Color,
    val blobThree: Color,
)

private val LightLiquidColors = LiquidColors(
    isDark = false,
    glassFill = LightGlassFill,
    glassSecondaryFill = LightGlassSecondary,
    controlFill = LightControlFill,
    controlContent = ObsidianBlack,
    glassBorder = LightGlassBorder,
    subtleBorder = LightSubtleBorder,
    activeFill = GamblePinkDeep,
    activeContent = PureWhite,
    mutedFill = LightPrimaryContainer,
    mutedContent = ObsidianBlack,
    softAccentFill = LightSoftAccentFill,
    accentInk = GamblePinkDeep,
    blobOne = LightBlobPrimary,
    blobTwo = LightBlobSecondary,
    blobThree = LightBlobTertiary,
)

private val DarkLiquidColors = LiquidColors(
    isDark = true,
    glassFill = DarkGlassFill,
    glassSecondaryFill = DarkGlassSecondary,
    controlFill = DarkControlFill,
    controlContent = PureWhite,
    glassBorder = DarkGlassBorder,
    subtleBorder = DarkSubtleBorder,
    activeFill = GamblePink,
    activeContent = ObsidianBlack,
    mutedFill = DarkPrimaryContainer,
    mutedContent = PureWhite,
    softAccentFill = DarkSoftAccentFill,
    accentInk = GamblePinkSoft,
    blobOne = DarkBlobPrimary,
    blobTwo = DarkBlobSecondary,
    blobThree = DarkBlobTertiary,
)

val LocalLiquidColors = staticCompositionLocalOf { LightLiquidColors }

private val LightColorScheme = lightColorScheme(
    primary = GamblePinkDeep,
    onPrimary = PureWhite,
    primaryContainer = LightPrimaryContainer,
    onPrimaryContainer = ObsidianBlack,
    secondary = ObsidianBlack,
    onSecondary = PureWhite,
    secondaryContainer = LightPrimaryContainer,
    onSecondaryContainer = ObsidianBlack,
    error = GamblePinkDeep,
    onError = PureWhite,
    errorContainer = LightPrimaryContainer,
    onErrorContainer = ObsidianBlack,
    background = LightCanvas,
    onBackground = ObsidianBlack,
    surface = LightSurface,
    onSurface = ObsidianBlack,
    surfaceVariant = LightGlassSecondary,
    onSurfaceVariant = LightSecondaryInk,
    surfaceDim = LightPrimaryContainer,
    surfaceBright = LightSurface,
    surfaceContainerLowest = LightSurface,
    surfaceContainerLow = LightSurface,
    surfaceContainer = LightSurface,
    surfaceContainerHigh = LightSurface,
    surfaceContainerHighest = LightPrimaryContainer,
    outline = LightSubtleBorder,
    outlineVariant = LightSubtleBorder,
)

private val DarkColorScheme = darkColorScheme(
    primary = GamblePink,
    onPrimary = ObsidianBlack,
    primaryContainer = DarkPrimaryContainer,
    onPrimaryContainer = PureWhite,
    secondary = GamblePinkSoft,
    onSecondary = ObsidianBlack,
    secondaryContainer = DarkPrimaryContainer,
    onSecondaryContainer = PureWhite,
    error = GamblePink,
    onError = ObsidianBlack,
    errorContainer = DarkPrimaryContainer,
    onErrorContainer = PureWhite,
    background = DarkCanvas,
    onBackground = PureWhite,
    surface = DarkSurface,
    onSurface = PureWhite,
    surfaceVariant = DarkGlassSecondary,
    onSurfaceVariant = DarkSecondaryInk,
    surfaceDim = DarkCanvas,
    surfaceBright = DarkSurface,
    surfaceContainerLowest = DarkCanvas,
    surfaceContainerLow = DarkSurface,
    surfaceContainer = DarkSurface,
    surfaceContainerHigh = DarkSurface,
    surfaceContainerHighest = DarkPrimaryContainer,
    outline = DarkSubtleBorder,
    outlineVariant = DarkSubtleBorder,
)

@Composable
fun AnchorTheme(
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    content: @Composable () -> Unit,
) {
    val darkTheme = when (themeMode) {
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }

    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val liquidColors = if (darkTheme) DarkLiquidColors else LightLiquidColors

    CompositionLocalProvider(LocalLiquidColors provides liquidColors) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            content = content,
        )
    }
}

/**
 * Ensures Material 3 Dialog and ModalBottomSheet windows disable OEM force-dark inversion
 * (which otherwise inverts inner card surfaces on some Android skins while keeping sheet white).
 */
@Composable
fun LiquidDialogContent(
    themeMode: ThemeMode,
    content: @Composable () -> Unit,
) {
    val view = LocalView.current
    SideEffect {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            view.isForceDarkAllowed = false
            (view.parent as? View)?.let { parent ->
                parent.isForceDarkAllowed = false
            }
        }
    }
    AnchorTheme(themeMode = themeMode, content = content)
}
