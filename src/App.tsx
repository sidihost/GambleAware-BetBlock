import { useCallback, useEffect, useState } from 'react';
import {
  Anchor,
  CheckCircle2,
  Download,
  ExternalLink,
  Heart,
  Info,
  LockKeyhole,
  SlidersHorizontal,
  TrendingUp,
  X,
} from 'lucide-react';
import { AppHeader } from './components/AppHeader';
import { AuthScreen } from './components/AuthScreen';
import { BlockedInterventionModal } from './components/BlockedInterventionModal';
import { GoalModal } from './components/GoalCardModal';
import {
  LiquidFloatingNavBar,
  LiquidGlassBackdrop,
  LiquidGlassCard,
  NavItemConfig,
} from './components/LiquidGlass';
import { SpotlightTourOverlay, SpotlightTourStep } from './components/SpotlightTourOverlay';
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
import { shouldRemindToCreateGoal } from './utils/personalization';

interface GoalPrefill {
  title: string;
  category: RecoveryGoalCategory;
  targetDays: number;
  targetAmountNgn: number;
  whyNote: string;
}

const TRIGGER_OPTIONS = ['Matchday', 'Boredom', 'Stress', 'Promo Ad', 'Late Night', 'Payday'];

const SUPPORT_LINKS = [
  {
    title: 'Mentally Aware Nigeria (MANI)',
    subtitle: 'Confidential mental health & recovery support in Nigeria',
    url: 'https://mentallyaware.org',
  },
  {
    title: 'NLRC Responsible Gaming',
    subtitle: 'Nigeria National Lottery Regulatory Commission guidance',
    url: 'https://nlrc-gov.ng',
  },
  {
    title: 'Lagos State Lotteries (LSLGA)',
    subtitle: 'Lagos responsible gaming & player protection portal',
    url: 'https://lslga.lg.gov.ng',
  },
  {
    title: 'GambleAware Support',
    subtitle: 'Confidential guidance to stay betting-free',
    url: 'https://www.begambleaware.org',
  },
  {
    title: 'Gamblers Anonymous',
    subtitle: 'Peer support groups & meetings worldwide',
    url: 'https://www.gamblersanonymous.org',
  },
];

export function App() {
  const {
    uiState,
    cloudUser,
    cloudSyncStatus,
    lastSyncedAtMs,
    cloudErrorMsg,
    signInWithGoogleCloud,
    signUpWithEmailCloud,
    signInWithEmailCloud,
    resendVerificationEmail,
    refreshEmailVerification,
    sendPasswordReset,
    signOutGoogleCloud,
    setPreferredName,
    forceSyncNow,
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
    setThemeMode,
    setDailySpendEstimate,
    setNotificationsEnabled,
    setAiAutoBlockEnabled,
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
    logBlockedEvent,
    clearEventHistory,
  } = useGambleAwareState();

  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
      if (path === '/signup') return 'signup';
    }
    return 'signin';
  });

  const [currentRoute, setCurrentRoute] = useState<AnchorRoute>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
      if (path === '/download') return 'download';
      if (path === '/rules') return 'blocklist';
      if (path === '/progress') return 'activity';
      if (path === '/lock') return 'lock';
      if (path === '/login' || path === '/signin' || path === '/signup') return 'auth';
      const routeParam = new URLSearchParams(window.location.search).get('page');
      if (routeParam === 'download') return 'download';
      if (routeParam === 'login' || routeParam === 'signup') return 'auth';
    }
    return 'shield';
  });

  const [showAccessibilityDisclosure, setShowAccessibilityDisclosure] = useState(false);
  const [showPrivateDnsModal, setShowPrivateDnsModal] = useState(false);
  const [privateDnsInput, setPrivateDnsInput] = useState(
    uiState.privateDnsStatus.serverHost ?? '',
  );
  const [showTimeLockedNotice, setShowTimeLockedNotice] = useState(false);
  const [pendingPinAction, setPendingPinAction] = useState<((pin: string) => void) | null>(null);
  const [pinAttempt, setPinAttempt] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [showUrgeJournalSheet, setShowUrgeJournalSheet] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState(TRIGGER_OPTIONS[0]);
  const [urgeNote, setUrgeNote] = useState('');

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalModalPrefill, setGoalModalPrefill] = useState<GoalPrefill | null>(null);
  const [pendingGoalAfterAuth, setPendingGoalAfterAuth] = useState(false);
  const [pendingGoalPrefill, setPendingGoalPrefill] = useState<GoalPrefill | null>(null);
  const [goalReminderDismissed, setGoalReminderDismissed] = useState(false);

  const [showSafeSupportSheet, setShowSafeSupportSheet] = useState(false);
  const [intervention, setIntervention] = useState<InterventionPayload | null>(null);

  const autostartSkipped =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const navigateTo = useCallback((route: AnchorRoute) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openAuthRoute = useCallback(
    (mode: 'signin' | 'signup' = 'signin') => {
      setAuthInitialMode(mode);
      navigateTo('auth');
    },
    [navigateTo],
  );

  const requestOpenGoalModal = useCallback(
    (prefill?: GoalPrefill) => {
      if (!cloudUser) {
        setPendingGoalAfterAuth(true);
        setPendingGoalPrefill(prefill ?? null);
        setIntervention(null);
        openAuthRoute('signup');
        return;
      }
      setGoalModalPrefill(prefill ?? null);
      setShowGoalModal(true);
    },
    [cloudUser, openAuthRoute],
  );

  useEffect(() => {
    if (cloudUser && pendingGoalAfterAuth) {
      setPendingGoalAfterAuth(false);
      setCurrentRoute('shield');
      setGoalModalPrefill(pendingGoalPrefill);
      setPendingGoalPrefill(null);
      setShowGoalModal(true);
    }
  }, [cloudUser, pendingGoalAfterAuth, pendingGoalPrefill]);

  // Apply White (Light default) / Black & Pink Dark theme class & browser theme-color
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const isDark =
        uiState.settings.themeMode === ThemeMode.DARK ||
        (uiState.settings.themeMode === ThemeMode.SYSTEM && media.matches);
      document.documentElement.classList.toggle('dark', isDark);
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) {
        themeMeta.setAttribute('content', isDark ? '#060608' : '#FFFFFF');
      }
    };
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [uiState.settings.themeMode]);

  const guardRestrictedAction = useCallback(
    (action: () => void) => {
      if (uiState.isTimeLockedNow) {
        setShowTimeLockedNotice(true);
      } else if (uiState.hasPin) {
        setPinAttempt('');
        setPinError(null);
        setPendingPinAction(() => () => action());
      } else {
        action();
      }
    },
    [uiState.isTimeLockedNow, uiState.hasPin],
  );

  const handleRequestDeviceAdminToggle = () => {
    if (uiState.isDeviceAdminEnabled) {
      guardRestrictedAction(() => deactivateDeviceAdmin());
    } else {
      enableDeviceAdmin();
    }
  };

  const launchSosCalmReset = () => {
    setIntervention({
      target: '60s SOS Calm Reset',
      source: 'Urge Reset Toolkit',
      category: 'Urge Reset',
      isAntiTamper: false,
      autoStartBreathing: true,
    });
  };

  const handleTestOrRedirectUrl = useCallback(
    (rawInput: string) => {
      const check = checkGamblingLoginAttempt(rawInput);
      if (check.intercepted) {
        updateDomainLookupQuery('');
        setIntervention({
          target: check.target,
          source: 'Web Shield',
          category: check.category,
          isAntiTamper: false,
          autoStartBreathing: false,
          isLoginRedirect: check.isGamblingLogin,
        });
      }
    },
    [checkGamblingLoginAttempt, updateDomainLookupQuery],
  );

  const handleAutoBlockFromAgent = useCallback(
    (params: {
      target: string;
      category: string;
      isLoginAttempt: boolean;
      coachNote: string;
    }) => {
      if (params.target.includes('.')) {
        addCustomDomain(params.target, false);
      }
      logBlockedEvent(params.target, 'AI Agent', params.category);
      setIntervention({
        target: params.target,
        source: 'AI Agent',
        category: params.category,
        isAntiTamper: false,
        autoStartBreathing: false,
        isLoginRedirect: params.isLoginAttempt,
        coachNote: params.coachNote,
      });
    },
    [addCustomDomain, logBlockedEvent],
  );

  const handleTourSelectStep = useCallback((step: SpotlightTourStep) => {
    setCurrentRoute(step.route);
  }, []);

  const showGoalReminder = shouldRemindToCreateGoal({
    goalsCount: uiState.goals.length,
    goalReminderEnabled: uiState.settings.goalReminderEnabled,
    reminderDismissedSession: goalReminderDismissed,
  });

  const navItems: NavItemConfig[] = [
    { route: 'shield', label: 'Home', icon: <Anchor className="h-4 w-4" /> },
    { route: 'blocklist', label: 'Blocked', icon: <SlidersHorizontal className="h-4 w-4" /> },
    { route: 'activity', label: 'Progress', icon: <TrendingUp className="h-4 w-4" /> },
    { route: 'lock', label: 'Lock', icon: <LockKeyhole className="h-4 w-4" /> },
    { route: 'download', label: 'Get App', icon: <Download className="h-4 w-4" /> },
  ];

  return (
    <LiquidGlassBackdrop isProtected={uiState.isFullyArmed}>
      {/* Responsive Top App Bar across Desktop & Mobile */}
      <AppHeader
        currentRoute={currentRoute}
        onSelectRoute={navigateTo}
        cloudUser={cloudUser}
        firstName={uiState.firstName}
        cloudSyncStatus={cloudSyncStatus}
        onAuthClick={() => openAuthRoute('signin')}
      />

      {/* Floating Status Toast */}
      {uiState.statusBannerMessage ? (
        <div className="pointer-events-none fixed top-16 left-0 right-0 z-40 flex justify-center px-4 md:top-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] px-4 py-2 text-xs font-semibold text-[var(--ink)] backdrop-blur-xl">
            <Info className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
            <span>{uiState.statusBannerMessage}</span>
          </div>
        </div>
      ) : null}

      {/* Main Route View */}
      <main className="min-h-[calc(100vh-4rem)]">
        {currentRoute === 'auth' ? (
          <AuthScreen
            initialMode={authInitialMode}
            cloudUser={cloudUser}
            preferredName={uiState.preferredName}
            cloudErrorMsg={cloudErrorMsg}
            pendingGoalNotice={pendingGoalAfterAuth}
            onSignInGoogle={signInWithGoogleCloud}
            onSignUpEmail={signUpWithEmailCloud}
            onSignInEmail={signInWithEmailCloud}
            onSendPasswordReset={sendPasswordReset}
            onRefreshVerification={refreshEmailVerification}
            onSavePreferredName={setPreferredName}
            onResendVerification={() => void resendVerificationEmail()}
            onSignOut={signOutGoogleCloud}
            onRedirectHome={() => {
              if (!cloudUser) {
                setPendingGoalAfterAuth(false);
                setPendingGoalPrefill(null);
              }
              navigateTo('shield');
            }}
          />
        ) : null}

        {currentRoute === 'shield' ? (
          <ShieldScreen
            state={uiState}
            cloudUser={cloudUser}
            cloudSyncStatus={cloudSyncStatus}
            lastSyncedAtMs={lastSyncedAtMs}
            cloudErrorMsg={cloudErrorMsg}
            onSignInGoogle={() => void signInWithGoogleCloud()}
            onOpenAuth={openAuthRoute}
            onSignOut={() => void signOutGoogleCloud()}
            onForceSync={() => void forceSyncNow()}
            onPrimaryShieldClick={() => {
              if (!uiState.isAccessibilityEnabled) {
                setShowAccessibilityDisclosure(true);
              } else if (uiState.settings.isProtectionEnabled) {
                guardRestrictedAction(() => disableProtection());
              } else {
                enableProtection();
              }
            }}
            onEnableAccessibility={() => setShowAccessibilityDisclosure(true)}
            onRequestDeviceAdmin={handleRequestDeviceAdminToggle}
            onDomainLookupChanged={updateDomainLookupQuery}
            onQuickBlockDomain={(domain) => addCustomDomain(domain, false)}
            onTestOrRedirectUrl={handleTestOrRedirectUrl}
            showGoalReminder={showGoalReminder}
            onDismissGoalReminder={() => setGoalReminderDismissed(true)}
            onOpenGoalModal={() => requestOpenGoalModal()}
            onSetPrimaryGoal={setPrimaryGoal}
            onToggleGoalComplete={toggleGoalCompleted}
            onDeleteGoal={deleteGoal}
            onToggleAiAutoBlock={setAiAutoBlockEnabled}
            onAutoBlockFromAgent={handleAutoBlockFromAgent}
            onCreateSuggestedGoal={(g) => {
              if (!cloudUser) {
                requestOpenGoalModal({
                  title: g.title,
                  category: g.category,
                  targetDays: g.targetDays,
                  targetAmountNgn: g.targetAmountNgn,
                  whyNote: g.whyNote,
                });
              } else {
                createGoal(g);
              }
            }}
            onNavigateToRules={() => navigateTo('blocklist')}
            onNavigateToProgress={() => navigateTo('activity')}
            onNavigateToLock={() => navigateTo('lock')}
            onLaunchCalmReset={launchSosCalmReset}
            onOpenUrgeJournal={() => setShowUrgeJournalSheet(true)}
            onOpenSafeSupport={() => setShowSafeSupportSheet(true)}
            onOpenDownloadPage={() => navigateTo('download')}
          />
        ) : null}

        {currentRoute === 'blocklist' ? (
          <BlocklistScreen
            state={uiState}
            onToggleCategory={(cat, enabled) => {
              if (enabled) updateCategory(cat, true);
              else guardRestrictedAction(() => updateCategory(cat, false));
            }}
            onToggleStrictKeywords={(enabled) => {
              if (enabled) setStrictKeywordFilter(true);
              else guardRestrictedAction(() => setStrictKeywordFilter(false));
            }}
            onToggleBrowserShield={(enabled) => {
              if (enabled) setBrowserShieldEnabled(true);
              else guardRestrictedAction(() => setBrowserShieldEnabled(false));
            }}
            onToggleAppShield={(enabled) => {
              if (enabled) setAppShieldEnabled(true);
              else guardRestrictedAction(() => setAppShieldEnabled(false));
            }}
            onToggleSearchGuard={(enabled) => {
              if (enabled) setSearchGuardEnabled(true);
              else guardRestrictedAction(() => setSearchGuardEnabled(false));
            }}
            onAddCustomDomain={(domain, isAllowlist) => {
              if (isAllowlist) {
                guardRestrictedAction(() => addCustomDomain(domain, true));
              } else {
                addCustomDomain(domain, false);
              }
            }}
            onRemoveCustomDomain={(domain, isAllowlist) => {
              if (isAllowlist) {
                removeCustomDomain(domain);
              } else {
                guardRestrictedAction(() => removeCustomDomain(domain));
              }
            }}
            onAddBlockedApp={addBlockedApp}
            onRemoveBlockedApp={(pkg) => guardRestrictedAction(() => removeBlockedApp(pkg))}
          />
        ) : null}

        {currentRoute === 'activity' ? (
          <ActivityScreen
            state={uiState}
            isSignedIn={Boolean(cloudUser)}
            onClearHistory={() => guardRestrictedAction(() => clearEventHistory())}
            onOpenUrgeJournal={() => setShowUrgeJournalSheet(true)}
            onLaunchCalmReset={launchSosCalmReset}
            onOpenGoalModal={() => requestOpenGoalModal()}
            onSetPrimaryGoal={setPrimaryGoal}
            onToggleGoalComplete={toggleGoalCompleted}
            onDeleteGoal={deleteGoal}
          />
        ) : null}

        {currentRoute === 'lock' ? (
          <LockSettingsScreen
            state={uiState}
            cloudUser={cloudUser}
            cloudSyncStatus={cloudSyncStatus}
            lastSyncedAtMs={lastSyncedAtMs}
            cloudErrorMsg={cloudErrorMsg}
            onSignInGoogle={() => void signInWithGoogleCloud()}
            onSignOut={() => void signOutGoogleCloud()}
            onForceSync={() => void forceSyncNow()}
            onActivateTimeLock={activateTimeLock}
            onToggleAntiTamper={(enabled) => {
              if (enabled) setAntiTamperEnabled(true);
              else guardRestrictedAction(() => setAntiTamperEnabled(false));
            }}
            onSetPin={setPin}
            onRemovePin={() => {
              if (uiState.isTimeLockedNow) {
                setShowTimeLockedNotice(true);
              } else {
                setPinAttempt('');
                setPinError(null);
                setPendingPinAction(() => (verifiedPin: string) => clearPin(verifiedPin));
              }
            }}
            onToggleDeviceAdmin={handleRequestDeviceAdminToggle}
            onOpenPrivateDnsSettings={() => {
              setPrivateDnsInput(uiState.privateDnsStatus.serverHost ?? '');
              setShowPrivateDnsModal(true);
            }}
            onSetDailySpend={setDailySpendEstimate}
            onSelectTheme={setThemeMode}
            onResetStreak={resetStreak}
            onReplayTour={() => {
              navigateTo('shield');
              replayTour();
            }}
            onToggleNotifications={setNotificationsEnabled}
            onOpenDownloadPage={() => navigateTo('download')}
          />
        ) : null}

        {currentRoute === 'download' ? (
          <DownloadScreen
            state={uiState}
            onOpenBlocker={() => navigateTo('shield')}
            onSignInGoogle={() => openAuthRoute('signup')}
            isSignedIn={Boolean(cloudUser)}
          />
        ) : null}
      </main>

      {/* Mobile Floating Liquid Glass Bottom Nav Bar */}
      <LiquidFloatingNavBar
        items={navItems}
        selectedRoute={currentRoute === 'auth' ? 'shield' : currentRoute}
        onSelect={navigateTo}
      />

      {/* Interactive Guided Spotlight Tour */}
      {!uiState.settings.hasCompletedTour &&
      !autostartSkipped &&
      currentRoute !== 'download' &&
      currentRoute !== 'auth' ? (
        <SpotlightTourOverlay
          onSelectStep={handleTourSelectStep}
          onDismissTour={() => {
            completeTour();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onFinishAndEnableShield={() => {
            completeTour();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (!uiState.isAccessibilityEnabled) {
              setShowAccessibilityDisclosure(true);
            }
          }}
        />
      ) : null}

      {/* Full-Screen Intervention / Gambling Login Redirect / 60s Calm Reset */}
      {intervention ? (
        <BlockedInterventionModal
          payload={intervention}
          cleanDays={uiState.cleanDays}
          cleanExactDays={uiState.cleanExactDays}
          estimatedSavedAmount={uiState.estimatedSavedAmount}
          primaryGoal={uiState.primaryGoal}
          isSignedIn={Boolean(cloudUser)}
          onCreateGoal={() => requestOpenGoalModal()}
          onClose={() => setIntervention(null)}
        />
      ) : null}

      {/* Personalized Goal Modal (Logged-In Users Only) */}
      {showGoalModal && cloudUser ? (
        <GoalModal
          initialTitle={goalModalPrefill?.title}
          initialCategory={goalModalPrefill?.category}
          initialDays={goalModalPrefill?.targetDays}
          initialAmountNgn={goalModalPrefill?.targetAmountNgn}
          initialWhy={goalModalPrefill?.whyNote}
          onSave={(input) => createGoal(input)}
          onClose={() => {
            setShowGoalModal(false);
            setGoalModalPrefill(null);
          }}
        />
      ) : null}

      {/* Urge Journal Modal Sheet */}
      {showUrgeJournalSheet ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Log a Resisted Urge"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div className="max-h-[90dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[28px] border border-[var(--subtle-border)] bg-[var(--surface)] p-5 text-[var(--ink)] sm:rounded-[28px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <h2 className="font-display text-lg font-bold">Log a Resisted Urge</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowUrgeJournalSheet(false)}
                aria-label="Close urge journal"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-[var(--muted-fill)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[var(--ink-muted)]">
              Every craving you notice and let pass strengthens your recovery.
            </p>
            <p className="mt-3.5 text-xs font-semibold text-[var(--ink)]">
              What triggered the urge?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TRIGGER_OPTIONS.map((trigger) => {
                const selected = selectedTrigger === trigger;
                return (
                  <button
                    key={trigger}
                    type="button"
                    onClick={() => setSelectedTrigger(trigger)}
                    className={`cursor-pointer rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                      selected
                        ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                        : 'border-[var(--subtle-border)] bg-[var(--muted-fill)] text-[var(--ink)]'
                    }`}
                  >
                    {trigger}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={urgeNote}
              onChange={(e) => setUrgeNote(e.target.value)}
              placeholder="Optional note on how you stayed clean"
              className="mt-3.5 h-12 w-full rounded-[16px] border border-[var(--subtle-border)] bg-[var(--canvas)] px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                logUrgeResisted(selectedTrigger, urgeNote);
                setUrgeNote('');
                setShowUrgeJournalSheet(false);
              }}
              className="mt-4 h-12 w-full cursor-pointer rounded-full bg-[var(--active-fill)] text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
            >
              Save Resisted Victory
            </button>
          </div>
        </div>
      ) : null}

      {/* Confidential Safe Support Sheet */}
      {showSafeSupportSheet ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confidential Recovery Support"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div className="max-h-[90dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[28px] border border-[var(--subtle-border)] bg-[var(--surface)] p-5 text-[var(--ink)] sm:rounded-[28px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                <h2 className="font-display text-lg font-bold">Confidential Recovery Support</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSafeSupportSheet(false)}
                aria-label="Close support sheet"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-[var(--muted-fill)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[var(--ink-muted)]">
              These trusted recovery websites are always allowlisted by GambleAware&apos;s
              safe-support guard.
            </p>
            <div className="mt-3.5 flex flex-col gap-2.5">
              {SUPPORT_LINKS.map((item) => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-[18px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-3.5 transition-opacity hover:opacity-90"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-sm font-semibold text-[var(--ink)]">{item.title}</p>
                    <p className="text-xs text-[var(--ink-muted)]">{item.subtitle}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-[var(--ink)]" />
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Accessibility Disclosure Dialog */}
      {showAccessibilityDisclosure ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enable GambleAware Guard"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <LiquidGlassCard className="max-h-[90dvh] w-full max-w-[420px] overflow-y-auto bg-[var(--surface)] p-5">
            <h2 className="font-display text-lg font-bold text-[var(--ink)]">
              Enable GambleAware Guard
            </h2>
            <div className="mt-2.5 space-y-2 text-xs leading-relaxed text-[var(--ink-muted)]">
              <p>GambleAware works privately on your phone to:</p>
              <p>1. Block betting websites, searches, and links across your browsers.</p>
              <p>2. Close installed betting apps before you can open them.</p>
              <p>3. Keep your blocker locked until your chosen timer ends.</p>
              <p>Your personal browsing stays completely private on your device.</p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAccessibilityDisclosure(false)}
                className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-muted)] hover:bg-[var(--muted-fill)]"
              >
                Later
              </button>
              <button
                type="button"
                onClick={() => {
                  activateAccessibilityShield();
                  setShowAccessibilityDisclosure(false);
                }}
                className="cursor-pointer rounded-full bg-[var(--active-fill)] px-5 py-2 text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                Activate Guard
              </button>
            </div>
          </LiquidGlassCard>
        </div>
      ) : null}

      {/* Private DNS Configuration Dialog */}
      {showPrivateDnsModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="System Private DNS"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPrivateDnsHost(privateDnsInput);
              setShowPrivateDnsModal(false);
            }}
            className="max-h-[90dvh] w-full max-w-[420px] overflow-y-auto rounded-[26px] border border-[var(--subtle-border)] bg-[var(--surface)] p-5 text-[var(--ink)]"
          >
            <h2 className="font-display text-lg font-bold">System Private DNS</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
              Optional network-level filter hostname for extra protection.
            </p>
            <input
              type="text"
              value={privateDnsInput}
              onChange={(e) => setPrivateDnsInput(e.target.value)}
              placeholder="Enter DNS hostname"
              className="mt-3.5 h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] px-3.5 font-mono text-sm text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrivateDnsHost(null);
                  setShowPrivateDnsModal(false);
                }}
                className="cursor-pointer rounded-full px-4 py-2 text-xs font-medium text-[var(--ink-muted)] hover:bg-[var(--muted-fill)]"
              >
                Set Automatic
              </button>
              <button
                type="button"
                onClick={() => setShowPrivateDnsModal(false)}
                className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-muted)] hover:bg-[var(--muted-fill)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cursor-pointer rounded-full bg-[var(--active-fill)] px-5 py-2 text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                Save DNS
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Time Locked Notice Dialog */}
      {showTimeLockedNotice ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Commitment Lock Active"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[90dvh] w-full max-w-[400px] overflow-y-auto rounded-[26px] border border-[var(--subtle-border)] bg-[var(--surface)] p-5 text-[var(--ink)]">
            <h2 className="font-display text-lg font-bold">Commitment Lock Active</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
              This control is protected by your GambleAware Commitment Lock (
              <span className="font-mono font-semibold text-[var(--ink)]">
                {uiState.lockCountdownFormatted}
              </span>{' '}
              remaining). Uninstalling, pausing protection, or weakening blocklists stays locked
              until the timer completes.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTimeLockedNotice(false)}
                className="cursor-pointer rounded-full bg-[var(--active-fill)] px-5 py-2 text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Verify PIN Dialog */}
      {pendingPinAction ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enter Accountability PIN"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = attemptPin(pinAttempt);
              if (res.ok) {
                const action = pendingPinAction;
                setPendingPinAction(null);
                action(pinAttempt);
              } else {
                setPinError(res.error ?? 'Incorrect PIN');
              }
            }}
            className="max-h-[90dvh] w-full max-w-[380px] overflow-y-auto rounded-[26px] border border-[var(--subtle-border)] bg-[var(--surface)] p-5 text-[var(--ink)]"
          >
            <h2 className="font-display text-lg font-bold">Enter Accountability PIN</h2>
            <p className="mt-1.5 text-xs text-[var(--ink-muted)]">
              Enter your 4-digit Accountability PIN to authorize this change.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinAttempt}
              onChange={(e) => setPinAttempt(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4-Digit PIN"
              autoFocus
              className="mt-3.5 h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] px-3.5 text-sm text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
            />
            {pinError ? <p className="mt-2 text-xs font-medium text-[var(--ink)]">{pinError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingPinAction(null)}
                className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-muted)] hover:bg-[var(--muted-fill)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cursor-pointer rounded-full bg-[var(--active-fill)] px-5 py-2 text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </LiquidGlassBackdrop>
  );
}

export default App;
