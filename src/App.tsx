import { useEffect, useMemo, useState } from 'react';
import {
  Anchor,
  CheckCircle2,
  Heart,
  LockKeyhole,
  Moon,
  NotebookPen,
  PhoneCall,
  Server,
  ShieldAlert,
  SlidersHorizontal,
  Smartphone,
  Sun,
  TrendingUp,
  Wind,
  X,
} from 'lucide-react';
import { AppHeader } from './components/AppHeader';
import { BlockedInterventionModal } from './components/BlockedInterventionModal';
import { FirstRunSetupModal } from './components/FirstRunSetupModal';
import { GoalModal } from './components/GoalCardModal';
import {
  LiquidFloatingNavBar,
  LiquidGlassBackdrop,
  NavItemConfig,
} from './components/LiquidGlass';
import { SpotlightTourOverlay } from './components/SpotlightTourOverlay';
import {
  AnchorRoute,
  InterventionPayload,
  RecoveryGoalCategory,
  ThemeMode,
} from './data/types';
import { useGambleAwareState } from './hooks/useGambleAwareState';
import { ActivityScreen } from './screens/ActivityScreen';
import { BlocklistScreen } from './screens/BlocklistScreen';
import { DownloadScreen } from './screens/DownloadScreen';
import { LockSettingsScreen } from './screens/LockSettingsScreen';
import { ShieldScreen } from './screens/ShieldScreen';
import { AppViewMode, resolveInitialViewMode } from './utils/platformCompatibility';

const NAV_ITEMS: NavItemConfig[] = [
  { route: 'shield', label: 'Shield', icon: <Anchor className="h-4 w-4" /> },
  { route: 'blocklist', label: 'Blocklist', icon: <SlidersHorizontal className="h-4 w-4" /> },
  { route: 'activity', label: 'Progress', icon: <TrendingUp className="h-4 w-4" /> },
  { route: 'lock', label: 'Lock', icon: <LockKeyhole className="h-4 w-4" /> },
];

const URGE_TRIGGER_TAGS = [
  'Matchday / Live Odds',
  'Late Night',
  'Payday / Extra Cash',
  'Stress or Boredom',
  'Promo SMS / Ads',
  'Trying to Chase Losses',
];

export function App() {
  const {
    store,
    uiState,
    setPreferredName,
    updateDomainLookupQuery,
    checkGamblingLoginAttempt,
    enableProtection,
    disableProtection,
    activateAccessibilityShield,
    enableDeviceAdmin,
    deactivateDeviceAdmin,
    setPrivateDnsHost,
    updateCategory,
    setStrictKeywordFilter,
    setBrowserShieldEnabled,
    setAppShieldEnabled,
    setSearchGuardEnabled,
    setAntiTamperEnabled,
    setHighRiskScheduleFlag,
    setThemeMode,
    toggleQuickTheme,
    setDailySpendEstimate,
    setNotificationsEnabled,
    completeInitialSetup,
    createGoal,
    setPrimaryGoal,
    toggleGoalCompleted,
    deleteGoal,
    addCustomDomain,
    removeCustomDomain,
    addBlockedApp,
    removeBlockedApp,
    activateTimeLock,
    setPin,
    attemptPin,
    clearPin,
    resetStreak,
    completeTour,
    replayTour,
    logUrgeResisted,
    clearEventHistory,
    restoreFromVaultBackup,
    forceBackupSync,
    clearBanner,
  } = useGambleAwareState();

  const [viewMode, setViewMode] = useState<AppViewMode>(() => {
    if (typeof window === 'undefined') return 'landing';
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    return resolveInitialViewMode({
      isStandalone,
      search: window.location.search,
      hash: window.location.hash,
    });
  });

  const [route, setRoute] = useState<Exclude<AnchorRoute, 'download'>>('shield');
  const [showGoalReminder, setShowGoalReminder] = useState(true);
  const [goalModalPrefill, setGoalModalPrefill] = useState<{
    open: boolean;
    title?: string;
    category?: RecoveryGoalCategory;
    targetDays?: number;
    targetAmountNgn?: number;
    whyNote?: string;
  }>({ open: false });
  const [interventionPayload, setInterventionPayload] = useState<InterventionPayload | null>(null);
  const [urgeModalOpen, setUrgeModalOpen] = useState(false);
  const [urgeTag, setUrgeTag] = useState(URGE_TRIGGER_TAGS[0]);
  const [urgeNote, setUrgeNote] = useState('');
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [dnsModalOpen, setDnsModalOpen] = useState(false);
  const [dnsDraft, setDnsDraft] = useState(uiState.privateDnsStatus.serverHost ?? '');
  const [pinPrompt, setPinPrompt] = useState<{
    title: string;
    subtitle: string;
    onVerified: (pin: string) => void;
  } | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
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
    if (uiState.settings.themeMode === ThemeMode.DARK) return true;
    if (uiState.settings.themeMode === ThemeMode.LIGHT) return false;
    return systemPrefersDark;
  }, [uiState.settings.themeMode, systemPrefersDark]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkTheme);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', isDarkTheme ? '#060608' : '#FFFFFF');
    }
  }, [isDarkTheme]);

  const switchToApp = () => {
    setViewMode('app');
    window.scrollTo({ top: 0 });
  };

  const switchToLanding = () => {
    setViewMode('landing');
    window.scrollTo({ top: 0 });
  };

  const runProtectedAction = (label: string, action: () => void, allowWithPinOnly = true) => {
    if (uiState.isTimeLockedNow) {
      setInterventionPayload({
        target: label,
        source: 'Anti-Tamper Lock',
        category: 'Commitment Lock',
        isAntiTamper: true,
        autoStartBreathing: false,
      });
      return;
    }
    if (allowWithPinOnly && uiState.hasPin) {
      setPinInput('');
      setPinError(null);
      setPinPrompt({
        title: 'Enter 4-Digit PIN',
        subtitle: `Confirm your Accountability PIN to ${label.toLowerCase()}.`,
        onVerified: () => {
          setPinPrompt(null);
          action();
        },
      });
      return;
    }
    action();
  };

  const handlePrimaryShieldClick = () => {
    if (!uiState.isAccessibilityEnabled || !uiState.settings.isProtectionEnabled) {
      activateAccessibilityShield();
      return;
    }
    runProtectedAction('pause GambleAware Shield', () => {
      disableProtection();
    });
  };

  const handleTestOrRedirectUrl = (rawInput: string) => {
    const res = checkGamblingLoginAttempt(rawInput);
    if (res.intercepted) {
      setInterventionPayload({
        target: res.target,
        source: 'Web Shield',
        category: res.category,
        isAntiTamper: false,
        autoStartBreathing: true,
        isLoginRedirect: res.isGamblingLogin,
      });
    } else if (!uiState.settings.isProtectionEnabled) {
      enableProtection();
    }
  };

  const handleSelectRoute = (next: AnchorRoute) => {
    if (next === 'download') {
      switchToLanding();
      return;
    }
    setRoute(next);
    window.scrollTo({ top: 0 });
  };

  const showTour =
    viewMode === 'app' &&
    uiState.settings.hasCompletedInitialSetup &&
    !uiState.settings.hasCompletedTour;

  return (
    <LiquidGlassBackdrop isProtected={viewMode === 'landing' || uiState.isFullyArmed}>
      <AppHeader
        mode={viewMode}
        activeRoute={route}
        onSelectRoute={handleSelectRoute}
        onOpenWebApp={switchToApp}
        onOpenDownloadPage={switchToLanding}
        isDarkTheme={isDarkTheme}
        onToggleTheme={toggleQuickTheme}
      />

      {uiState.statusBannerMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 bottom-24 left-4 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-full border border-[var(--glass-border)] bg-[var(--surface)]/95 px-4 py-2.5 shadow-lg backdrop-blur-xl md:bottom-6"
        >
          <div className="flex min-w-0 items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
            <span className="truncate text-xs font-semibold text-[var(--ink)]">
              {uiState.statusBannerMessage}
            </span>
          </div>
          <button
            type="button"
            onClick={clearBanner}
            aria-label="Dismiss notification"
            className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--muted-fill)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <main className={viewMode === 'app' ? 'min-h-[calc(100vh-8rem)] pb-24 md:pb-12' : 'min-h-[calc(100vh-8rem)]'}>
        {viewMode === 'landing' ? (
          <DownloadScreen onOpenWebApp={switchToApp} />
        ) : (
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-8">
            {route === 'shield' ? (
              <ShieldScreen
                store={store}
                state={uiState}
                onSetPreferredName={setPreferredName}
                onForceSaveVault={() => void forceBackupSync()}
                onRestoreVault={restoreFromVaultBackup}
                onToggleHighRiskWindow={setHighRiskScheduleFlag}
                onPrimaryShieldClick={handlePrimaryShieldClick}
                onEnableAccessibility={activateAccessibilityShield}
                onRequestDeviceAdmin={enableDeviceAdmin}
                onDomainLookupChanged={updateDomainLookupQuery}
                onQuickBlockDomain={(domain) => addCustomDomain(domain, false)}
                onTestOrRedirectUrl={handleTestOrRedirectUrl}
                showGoalReminder={showGoalReminder}
                onDismissGoalReminder={() => setShowGoalReminder(false)}
                onOpenGoalModal={(prefill) => setGoalModalPrefill({ open: true, ...prefill })}
                onSetPrimaryGoal={setPrimaryGoal}
                onToggleGoalComplete={toggleGoalCompleted}
                onDeleteGoal={deleteGoal}
                onNavigateToRules={() => handleSelectRoute('blocklist')}
                onNavigateToProgress={() => handleSelectRoute('activity')}
                onNavigateToLock={() => handleSelectRoute('lock')}
                onLaunchCalmReset={() =>
                  setInterventionPayload({
                    target: '60s Guided Urge Reset',
                    source: 'Calm Reset',
                    category: 'Recovery Tool',
                    isAntiTamper: false,
                    autoStartBreathing: true,
                  })
                }
                onOpenUrgeJournal={() => setUrgeModalOpen(true)}
                onOpenSafeSupport={() => setSupportModalOpen(true)}
                onOpenDownloadPage={switchToLanding}
              />
            ) : null}

            {route === 'blocklist' ? (
              <BlocklistScreen
                state={uiState}
                onToggleCategory={(cat, enabled) => {
                  if (!enabled) {
                    runProtectedAction(`turn off ${cat} blocking`, () => updateCategory(cat, false));
                  } else {
                    updateCategory(cat, true);
                  }
                }}
                onToggleStrictKeywords={(enabled) => {
                  if (!enabled) {
                    runProtectedAction('disable strict keyword filter', () =>
                      setStrictKeywordFilter(false),
                    );
                  } else {
                    setStrictKeywordFilter(true);
                  }
                }}
                onToggleBrowserShield={(enabled) => {
                  if (!enabled) {
                    runProtectedAction('disable Website Shield', () => setBrowserShieldEnabled(false));
                  } else {
                    setBrowserShieldEnabled(true);
                  }
                }}
                onToggleAppShield={(enabled) => {
                  if (!enabled) {
                    runProtectedAction('disable App Shield', () => setAppShieldEnabled(false));
                  } else {
                    setAppShieldEnabled(true);
                  }
                }}
                onToggleSearchGuard={(enabled) => {
                  if (!enabled) {
                    runProtectedAction('disable Search Guard', () => setSearchGuardEnabled(false));
                  } else {
                    setSearchGuardEnabled(true);
                  }
                }}
                onAddCustomDomain={addCustomDomain}
                onRemoveCustomDomain={(domain, isAllowlist) => {
                  if (!isAllowlist) {
                    runProtectedAction(`remove ${domain} from blocklist`, () =>
                      removeCustomDomain(domain),
                    );
                  } else {
                    removeCustomDomain(domain);
                  }
                }}
                onAddBlockedApp={addBlockedApp}
                onRemoveBlockedApp={(pkg) =>
                  runProtectedAction('remove blocked app rule', () => removeBlockedApp(pkg))
                }
              />
            ) : null}

            {route === 'activity' ? (
              <ActivityScreen
                state={uiState}
                onClearHistory={() =>
                  runProtectedAction('clear blocked attempt log', clearEventHistory)
                }
                onOpenUrgeJournal={() => setUrgeModalOpen(true)}
                onLaunchCalmReset={() =>
                  setInterventionPayload({
                    target: '60s Guided Urge Reset',
                    source: 'Calm Reset',
                    category: 'Recovery Tool',
                    isAntiTamper: false,
                    autoStartBreathing: true,
                  })
                }
                onOpenGoalModal={(prefill) => setGoalModalPrefill({ open: true, ...prefill })}
                onSetPrimaryGoal={setPrimaryGoal}
                onToggleGoalComplete={toggleGoalCompleted}
                onDeleteGoal={deleteGoal}
              />
            ) : null}

            {route === 'lock' ? (
              <LockSettingsScreen
                store={store}
                state={uiState}
                onSetPreferredName={setPreferredName}
                onForceSaveVault={() => void forceBackupSync()}
                onRestoreVault={restoreFromVaultBackup}
                onActivateTimeLock={activateTimeLock}
                onToggleAntiTamper={(enabled) => {
                  if (!enabled) {
                    runProtectedAction('disable Anti-Tamper lock', () =>
                      setAntiTamperEnabled(false),
                    );
                  } else {
                    setAntiTamperEnabled(true);
                  }
                }}
                onSetPin={setPin}
                onRemovePin={() => {
                  if (uiState.isTimeLockedNow) {
                    setInterventionPayload({
                      target: 'Remove Accountability PIN',
                      source: 'Anti-Tamper Lock',
                      category: 'Commitment Lock',
                      isAntiTamper: true,
                      autoStartBreathing: false,
                    });
                    return;
                  }
                  setPinInput('');
                  setPinError(null);
                  setPinPrompt({
                    title: 'Remove Accountability PIN',
                    subtitle: 'Enter your current 4-digit PIN to remove PIN protection.',
                    onVerified: (verifiedPin) => {
                      clearPin(verifiedPin);
                      setPinPrompt(null);
                    },
                  });
                }}
                onToggleDeviceAdmin={() => {
                  if (uiState.isDeviceAdminEnabled) {
                    runProtectedAction('deactivate Uninstall Lock', deactivateDeviceAdmin);
                  } else {
                    enableDeviceAdmin();
                  }
                }}
                onOpenPrivateDnsSettings={() => {
                  setDnsDraft(uiState.privateDnsStatus.serverHost ?? '');
                  setDnsModalOpen(true);
                }}
                onSetDailySpend={setDailySpendEstimate}
                onSelectTheme={setThemeMode}
                onResetStreak={() => runProtectedAction('reset clean streak', resetStreak)}
                onReplayTour={() => {
                  setRoute('shield');
                  replayTour();
                }}
                onToggleNotifications={setNotificationsEnabled}
                onOpenDownloadPage={switchToLanding}
              />
            ) : null}
          </div>
        )}
      </main>

      {viewMode === 'app' ? (
        <LiquidFloatingNavBar
          items={NAV_ITEMS}
          selectedRoute={route}
          onSelect={handleSelectRoute}
        />
      ) : null}

      <footer className="border-t border-[var(--subtle-border)] px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row md:px-2">
          <div className="text-center sm:text-left">
            <p className="font-display text-sm font-bold text-[var(--ink)]">GambleAware</p>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              By Imoogle Technology · Android APK, iPhone &amp; Desktop Web App
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {viewMode === 'landing' ? (
              <button
                type="button"
                onClick={switchToApp}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
              >
                <Smartphone className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                <span>Open Web App</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={switchToLanding}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
              >
                <Anchor className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                <span>All Platforms &amp; APK</span>
              </button>
            )}

            <div
              role="group"
              aria-label="Theme preference"
              className="inline-flex items-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] p-1"
            >
              <button
                type="button"
                onClick={() => setThemeMode(ThemeMode.LIGHT)}
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
                onClick={() => setThemeMode(ThemeMode.DARK)}
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
        </div>
      </footer>

      {/* First-Run Setup Modal inside interactive Web App */}
      {viewMode === 'app' && !uiState.settings.hasCompletedInitialSetup ? (
        <FirstRunSetupModal
          initialName={uiState.preferredName}
          initialDailySpend={uiState.settings.dailyBetSpendEstimate}
          onActivateAdminAndShield={enableDeviceAdmin}
          onCompleteLockedSetup={completeInitialSetup}
        />
      ) : null}

      {/* Spotlight Walkthrough Tour */}
      {showTour ? (
        <SpotlightTourOverlay
          onSelectStep={(step) => {
            if (step.route !== 'download') {
              setRoute(step.route);
            }
          }}
          onDismissTour={completeTour}
          onFinishAndEnableShield={() => {
            completeTour();
            activateAccessibilityShield();
          }}
        />
      ) : null}

      {/* Goal Creation Modal */}
      {goalModalPrefill.open ? (
        <GoalModal
          initialTitle={goalModalPrefill.title}
          initialCategory={goalModalPrefill.category}
          initialDays={goalModalPrefill.targetDays}
          initialAmountNgn={goalModalPrefill.targetAmountNgn}
          initialWhy={goalModalPrefill.whyNote}
          onSave={createGoal}
          onClose={() => setGoalModalPrefill({ open: false })}
        />
      ) : null}

      {/* Blocked / Anti-Tamper / Calm Reset Modal */}
      {interventionPayload ? (
        <BlockedInterventionModal
          payload={interventionPayload}
          cleanDays={uiState.cleanDays}
          cleanExactDays={uiState.cleanExactDays}
          estimatedSavedAmount={uiState.estimatedSavedAmount}
          primaryGoal={uiState.primaryGoal}
          onCreateGoal={() => setGoalModalPrefill({ open: true })}
          onClose={() => setInterventionPayload(null)}
        />
      ) : null}

      {/* Urge Victory Journal Modal */}
      {urgeModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Log Resisted Urge Victory"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              logUrgeResisted(urgeTag, urgeNote);
              setUrgeNote('');
              setUrgeModalOpen(false);
            }}
            className="w-full max-w-[460px] rounded-t-[28px] border border-[var(--subtle-border)] bg-[var(--surface)] p-5 text-[var(--ink)] sm:rounded-[28px] sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--active-fill)] text-[var(--active-content)]">
                  <NotebookPen className="h-4 w-4" />
                </div>
                <h2 className="font-display text-lg font-bold">Log Resisted Urge</h2>
              </div>
              <button
                type="button"
                onClick={() => setUrgeModalOpen(false)}
                aria-label="Close urge journal modal"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-[var(--muted-fill)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-1.5 text-xs text-[var(--ink-muted)]">
              Recording what triggered an urge builds pattern awareness so you can outsmart it next
              time.
            </p>

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-[var(--ink)]">What triggered it?</p>
              <div className="flex flex-wrap gap-1.5">
                {URGE_TRIGGER_TAGS.map((tag) => {
                  const selected = urgeTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setUrgeTag(tag)}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                          : 'border-[var(--subtle-border)] bg-[var(--muted-fill)] text-[var(--ink)]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <label
              htmlFor="urge-victory-note"
              className="mt-4 mb-1.5 block text-xs font-semibold text-[var(--ink)]"
            >
              Short Note (Optional)
            </label>
            <textarea
              id="urge-victory-note"
              rows={3}
              maxLength={240}
              value={urgeNote}
              onChange={(e) => setUrgeNote(e.target.value)}
              placeholder="e.g. Closed browser, drank water, and remembered my savings goal."
              className="w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] p-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
            />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setUrgeModalOpen(false)}
                className="h-11 flex-1 cursor-pointer rounded-full border border-[var(--subtle-border)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-11 flex-[1.5] cursor-pointer rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                Save Victory
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Confidential Support Modal */}
      {supportModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confidential Support Resources"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div className="w-full max-w-[460px] rounded-t-[28px] border border-[var(--subtle-border)] bg-[var(--surface)] p-5 text-[var(--ink)] sm:rounded-[28px] sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--active-fill)] text-[var(--active-content)]">
                  <Heart className="h-4 w-4" />
                </div>
                <h2 className="font-display text-lg font-bold">Confidential Support</h2>
              </div>
              <button
                type="button"
                onClick={() => setSupportModalOpen(false)}
                aria-label="Close support modal"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-[var(--muted-fill)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
              You do not have to fight gambling urges alone. Reach free, confidential human support
              anytime — zero judgment, private, and available 24/7.
            </p>

            <div className="mt-4 space-y-2.5">
              {[
                {
                  title: 'GamCare / National Gambling Helpline (UK)',
                  detail: 'Free 24/7 helpline: 0808 8020 133 · gamcare.org.uk',
                },
                {
                  title: 'National Problem Gambling Helpline (US / Int.)',
                  detail: 'Call or Text 1-800-GAMBLER · ncpgambling.org',
                },
                {
                  title: 'Gamblers Anonymous (Global Peer Groups)',
                  detail: 'Free daily virtual & local meetings · gamblersanonymous.org',
                },
                {
                  title: 'Nigeria Mental Health & Recovery Support',
                  detail: 'Mentally Aware Nigeria (MANI): +234 809 111 6264',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-2.5 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-3"
                >
                  <PhoneCall className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                  <div>
                    <p className="text-xs font-semibold text-[var(--ink)]">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSupportModalOpen(false);
                  setInterventionPayload({
                    target: '60s Guided Urge Reset',
                    source: 'Calm Reset',
                    category: 'Recovery Tool',
                    isAntiTamper: false,
                    autoStartBreathing: true,
                  });
                }}
                className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                <Wind className="h-3.5 w-3.5" />
                <span>Start 60s Calm</span>
              </button>
              <button
                type="button"
                onClick={() => setSupportModalOpen(false)}
                className="h-11 flex-1 cursor-pointer rounded-full border border-[var(--subtle-border)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Private DNS Settings Modal */}
      {dnsModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Private DNS Configuration"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPrivateDnsHost(dnsDraft || null);
              setDnsModalOpen(false);
            }}
            className="w-full max-w-[440px] rounded-t-[28px] border border-[var(--subtle-border)] bg-[var(--surface)] p-5 text-[var(--ink)] sm:rounded-[28px] sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--active-fill)] text-[var(--active-content)]">
                  <Server className="h-4 w-4" />
                </div>
                <h2 className="font-display text-lg font-bold">Private DNS (Optional)</h2>
              </div>
              <button
                type="button"
                onClick={() => setDnsModalOpen(false)}
                aria-label="Close Private DNS modal"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-[var(--muted-fill)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
              On Android 9+, open Settings → Network &amp; internet → Private DNS to enforce a
              DNS-over-TLS hostname across all apps without consuming your VPN slot.
            </p>

            <input
              type="text"
              value={dnsDraft}
              onChange={(e) => setDnsDraft(e.target.value)}
              placeholder="e.g. family.dns.adguard.com (leave blank for Automatic)"
              className="mt-4 h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
            />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrivateDnsHost(null);
                  setDnsModalOpen(false);
                }}
                className="h-11 flex-1 cursor-pointer rounded-full border border-[var(--subtle-border)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
              >
                Reset Automatic
              </button>
              <button
                type="submit"
                className="h-11 flex-[1.4] cursor-pointer rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                Save DNS Note
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Accountability PIN Prompt Modal */}
      {pinPrompt ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={pinPrompt.title}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const check = attemptPin(pinInput);
              if (check.ok) {
                pinPrompt.onVerified(pinInput);
              } else {
                setPinError(check.error ?? 'Incorrect PIN');
              }
            }}
            className="w-full max-w-[380px] rounded-t-[28px] border border-[var(--subtle-border)] bg-[var(--surface)] p-5 text-[var(--ink)] sm:rounded-[28px] sm:p-6"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--active-fill)] text-[var(--active-content)]">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <h2 className="font-display text-base font-bold">{pinPrompt.title}</h2>
            </div>
            <p className="mt-1.5 text-xs text-[var(--ink-muted)]">{pinPrompt.subtitle}</p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                setPinError(null);
              }}
              placeholder="••••"
              autoFocus
              className="mt-4 h-12 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] px-4 text-center font-mono text-lg tracking-[0.5em] text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
            />
            {pinError ? (
              <p className="mt-2 text-center text-xs font-medium text-[var(--accent-ink)]">
                {pinError}
              </p>
            ) : null}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setPinPrompt(null)}
                className="h-11 flex-1 cursor-pointer rounded-full border border-[var(--subtle-border)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pinInput.length !== 4}
                className="h-11 flex-[1.4] cursor-pointer rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90 disabled:opacity-50"
              >
                Verify PIN
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </LiquidGlassBackdrop>
  );
}

export default App;
