import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { loadStore } from './data/storage';
import { ThemeMode } from './data/types';
import { captureEarlyInstallPrompt } from './hooks/usePWAInstall';
import './index.css';

// Capture browser install prompt even if it fires before React mounts
captureEarlyInstallPrompt();

// Register Workbox service worker for offline cache & standalone installability
try {
  registerSW({ immediate: true });
} catch {
  // Ignored in unsupported browser contexts
}

// Synchronously apply stored theme before first React paint to prevent White/Black flash
try {
  const initialStore = loadStore();
  const mode = initialStore.settings.themeMode;
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = mode === ThemeMode.DARK || (mode === ThemeMode.SYSTEM && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', isDark ? '#060608' : '#FFFFFF');
  }
} catch {
  // Default light theme applies cleanly
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
