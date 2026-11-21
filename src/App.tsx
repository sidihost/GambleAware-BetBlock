import { useCallback, useEffect, useMemo, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { AppHeader, BrandGMark } from './components/AppHeader';
import { AppPreloader } from './components/AppPreloader';
import { LiquidGlassBackdrop } from './components/LiquidGlass';
import { loadStore, saveStore } from './data/storage';
import { ThemeMode } from './data/types';
import './firebase';
import { DownloadScreen } from './screens/DownloadScreen';
import { MainAppScreen } from './screens/MainAppScreen';
import { shouldSkipPreloader } from './utils/platformCompatibility';

type SurfaceView = 'app' | 'download';

function resolveInitialView(): SurfaceView {
  if (typeof window === 'undefined') return 'app';
  const params = new URLSearchParams(window.location.search);
  return params.get('view') === 'download' ? 'download' : 'app';
}

export function App() {
  const [surfaceView, setSurfaceView] = useState<SurfaceView>(resolveInitialView);

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
      themeMeta.setAttribute('content', isDarkTheme ? '#090B10' : '#F8F9FB');
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

  const switchSurface = useCallback((nextView: SurfaceView) => {
    setSurfaceView(nextView);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (nextView === 'download') {
        url.searchParams.set('view', 'download');
      } else {
        url.searchParams.delete('view');
      }
      window.history.replaceState({}, '', url.toString());
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  const dismissPreloader = useCallback(() => {
    setShowPreloader(false);
  }, []);

  if (surfaceView === 'app') {
    return (
      <LiquidGlassBackdrop isProtected>
        <AppPreloader visible={showPreloader} onDismiss={dismissPreloader} />
        <MainAppScreen
          isDarkTheme={isDarkTheme}
          onUpdateTheme={updateTheme}
          onOpenDownloadPage={() => switchSurface('download')}
        />
      </LiquidGlassBackdrop>
    );
  }

  return (
    <LiquidGlassBackdrop isProtected>
      <AppPreloader visible={showPreloader} onDismiss={dismissPreloader} />
      <AppHeader onOpenMainApp={() => switchSurface('app')} />

      <main className="min-h-[calc(100vh-8rem)]">
        <DownloadScreen />
      </main>

      <footer className="border-t border-[var(--subtle-border)] bg-[var(--surface)] px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <BrandGMark className="h-8 w-8 shrink-0" />
            <div className="text-left">
              <p className="font-display text-sm font-bold text-[var(--ink)]">GambleAware</p>
              <p className="text-xs text-[var(--ink-muted)]">
                Free Gambling Site &amp; App Blocker · 100% Private
              </p>
            </div>
          </div>

          <nav aria-label="Footer sections" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-[var(--ink-muted)]">
            <button
              type="button"
              onClick={() => switchSurface('app')}
              className="cursor-pointer font-semibold text-[var(--accent-ink)] hover:underline"
            >
              Open Web App
            </button>
            <a href="#live-filter" className="hover:text-[var(--ink)]">
              Live Filter
            </a>
            <a href="#coverage" className="hover:text-[var(--ink)]">
              Coverage
            </a>
            <a href="#architecture" className="hover:text-[var(--ink)]">
              Features
            </a>
            <a href="#compare" className="hover:text-[var(--ink)]">
              Compare
            </a>
            <a href="#install" className="hover:text-[var(--ink)]">
              Install
            </a>
          </nav>

          <div
            role="group"
            aria-label="Theme preference"
            className="inline-flex items-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] p-1"
          >
            <button
              type="button"
              data-testid="theme-light-btn"
              onClick={() => updateTheme(ThemeMode.LIGHT)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
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
              data-testid="theme-dark-btn"
              onClick={() => updateTheme(ThemeMode.DARK)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                isDarkTheme
                  ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Obsidian</span>
            </button>
          </div>
        </div>
      </footer>
    </LiquidGlassBackdrop>
  );
}

export default App;
