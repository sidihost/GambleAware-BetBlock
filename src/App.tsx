import { useEffect, useState } from 'react';
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
      <AppHeader />

      <main className="min-h-[calc(100vh-8rem)]">
        <DownloadScreen
          isDarkTheme={isDarkTheme}
          onToggleTheme={() => setIsDarkTheme((prev) => !prev)}
        />
      </main>

      <footer className="border-t border-[var(--subtle-border)] px-4 py-8 text-center">
        <p className="font-display text-sm font-bold text-[var(--ink)]">GambleAware</p>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          A product of Imoogle Technology · Free Android Gambling Blocker
        </p>
      </footer>
    </LiquidGlassBackdrop>
  );
}

export default App;
