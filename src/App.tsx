import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { AppHeader } from './components/AppHeader';
import { LiquidGlassBackdrop } from './components/LiquidGlass';
import { DownloadScreen } from './screens/DownloadScreen';

const THEME_KEY = 'gambleaware_landing_theme';

export function App() {
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = window.localStorage.getItem(THEME_KEY);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkTheme);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', isDarkTheme ? '#060608' : '#FFFFFF');
    }
    try {
      window.localStorage.setItem(THEME_KEY, isDarkTheme ? 'dark' : 'light');
    } catch {
      // ignore storage failure
    }
  }, [isDarkTheme]);

  return (
    <LiquidGlassBackdrop isProtected>
      <AppHeader
        isDarkTheme={isDarkTheme}
        onToggleTheme={() => setIsDarkTheme((prev) => !prev)}
      />

      <main className="min-h-[calc(100vh-8rem)]">
        <DownloadScreen />
      </main>

      <footer className="border-t border-[var(--subtle-border)] px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row md:px-2">
          <div className="text-center sm:text-left">
            <p className="font-display text-sm font-bold text-[var(--ink)]">GambleAware</p>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              By Imoogle Technology · Free Android Gambling Blocker
            </p>
          </div>

          <div
            role="group"
            aria-label="Theme preference"
            className="inline-flex items-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] p-1"
          >
            <button
              type="button"
              onClick={() => setIsDarkTheme(false)}
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
              onClick={() => setIsDarkTheme(true)}
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
