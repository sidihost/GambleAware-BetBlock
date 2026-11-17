package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import com.example.data.ThemeMode

data class LiquidColors(
    val isDark: Boolean,
    val glassFill: Color,
    val glassSecondaryFill: Color,
    val glassBorder: Color,
    val subtleBorder: Color,
    val activeFill: Color,
    val activeContent: Color,
    val mutedFill: Color,
    val mutedContent: Color,
    val blobOne: Color,
    val blobTwo: Color,
    val blobThree: Color,
)

private val LightLiquidColors = LiquidColors(
    isDark = false,
    glassFill = LightGlassFill,
    glassSecondaryFill = LightGlassSecondary,
    glassBorder = LightGlassBorder,
    subtleBorder = LightSubtleBorder,
    activeFill = ObsidianBlack,
    activeContent = PureWhite,
    mutedFill = LightPrimaryContainer,
    mutedContent = ObsidianBlack,
    blobOne = LightBlobPrimary,
    blobTwo = LightBlobSecondary,
    blobThree = LightBlobTertiary,
)

private val DarkLiquidColors = LiquidColors(
    isDark = true,
    glassFill = DarkGlassFill,
    glassSecondaryFill = DarkGlassSecondary,
    glassBorder = DarkGlassBorder,
    subtleBorder = DarkSubtleBorder,
    activeFill = PureWhite,
    activeContent = ObsidianBlack,
    mutedFill = DarkPrimaryContainer,
    mutedContent = PureWhite,
    blobOne = DarkBlobPrimary,
    blobTwo = DarkBlobSecondary,
    blobThree = DarkBlobTertiary,
)

val LocalLiquidColors = staticCompositionLocalOf { DarkLiquidColors }

private val LightColorScheme = lightColorScheme(
    primary = ObsidianBlack,
    onPrimary = PureWhite,
    primaryContainer = LightPrimaryContainer,
    onPrimaryContainer = ObsidianBlack,
    secondary = ObsidianBlack,
    onSecondary = PureWhite,
    secondaryContainer = LightPrimaryContainer,
    onSecondaryContainer = ObsidianBlack,
    error = ObsidianBlack,
    onError = PureWhite,
    errorContainer = LightPrimaryContainer,
    onErrorContainer = ObsidianBlack,
    background = LightCanvas,
    onBackground = ObsidianBlack,
    surface = LightSurface,
    onSurface = ObsidianBlack,
    surfaceVariant = LightGlassSecondary,
    onSurfaceVariant = LightSecondaryInk,
    outline = LightSubtleBorder,
)

private val DarkColorScheme = darkColorScheme(
    primary = PureWhite,
    onPrimary = ObsidianBlack,
    primaryContainer = DarkPrimaryContainer,
    onPrimaryContainer = PureWhite,
    secondary = PureWhite,
    onSecondary = ObsidianBlack,
    secondaryContainer = DarkPrimaryContainer,
    onSecondaryContainer = PureWhite,
    error = PureWhite,
    onError = ObsidianBlack,
    errorContainer = DarkPrimaryContainer,
    onErrorContainer = PureWhite,
    background = DarkCanvas,
    onBackground = PureWhite,
    surface = DarkSurface,
    onSurface = PureWhite,
    surfaceVariant = DarkGlassSecondary,
    onSurfaceVariant = DarkSecondaryInk,
    outline = DarkSubtleBorder,
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
