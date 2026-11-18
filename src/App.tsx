import { useCallback, useEffect, useMemo, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { AppHeader } from './components/AppHeader';
import { AppPreloader } from './components/AppPreloader';
import { LiquidGlassBackdrop } from './components/LiquidGlass';
import { loadStore, saveStore } from './data/storage';
import { ThemeMode } from './data/types';
import './firebase';
import { DownloadScreen } from './screens/DownloadScreen';
import { shouldSkipPreloader } from './utils/platformCompatibility';

export function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      return loadStore().settings.themeMode;
    } catch {
      return ThemeMode.LIGHT;
    }
  });

  const [showPreloader, setShowPreloader] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !shouldSkipPreloader(window.location.search);
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const isDarkTheme = useMemo(() => {
    if (themeMode === ThemeMode.DARK) return true;
    if (themeMode === ThemeMode.LIGHT) return false;
    return systemPrefersDark;
  }, [themeMode, systemPrefersDark]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkTheme);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', isDarkTheme ? '#060608' : '#FFFFFF');
    }
  }, [isDarkTheme]);

  const updateTheme = useCallback((nextMode: ThemeMode) => {
    setThemeMode(nextMode);
    try {
      const store = loadStore();
      saveStore({
        ...store,
        settings: {
          ...store.settings,
          themeMode: nextMode,
        },
      });
    } catch {
      // Theme still updates visually in memory
    }
  }, []);

  const toggleQuickTheme = useCallback(() => {
    updateTheme(isDarkTheme ? ThemeMode.LIGHT : ThemeMode.DARK);
  }, [isDarkTheme, updateTheme]);

  const dismissPreloader = useCallback(() => {
    setShowPreloader(false);
  }, []);

  return (
    <LiquidGlassBackdrop isProtected>
      <AppPreloader visible={showPreloader} onDismiss={dismissPreloader} />
      <AppHeader isDarkTheme={isDarkTheme} onToggleTheme={toggleQuickTheme} />

      <main className="min-h-[calc(100vh-7rem)]">
        <DownloadScreen />
      </main>

      <footer className="border-t border-[var(--subtle-border)] px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row md:px-2">
          <div className="text-center sm:text-left">
            <p className="font-display text-sm font-bold text-[var(--ink)]">GambleAware</p>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              By Imoogle Technology · Android App (APK)
            </p>
          </div>

          <div
            role="group"
            aria-label="Theme preference"
            className="inline-flex items-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] p-1"
          >
            <button
              type="button"
              onClick={() => updateTheme(ThemeMode.LIGHT)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !isDarkTheme
                  ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              <span>White</span>
            </button>
            <button
              type="button"
              onClick={() => updateTheme(ThemeMode.DARK)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isDarkTheme
                  ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Black &amp; Pink</span>
            </button>
          </div>
        </div>
      </footer>
    </LiquidGlassBackdrop>
  );
}

export default App;
