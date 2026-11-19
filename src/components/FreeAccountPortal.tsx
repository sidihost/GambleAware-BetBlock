import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Lock,
  LogOut,
  Mail,
  MailCheck,
  RefreshCw,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import {
  auth,
  registerWithEmailAndPassword,
  resendVerificationEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutFirebase,
} from '../firebase';
import { BrandGMark } from './AppHeader';
import { syncFreeAccountAnchor } from '../services/firestoreSync';
import { getRegistryMetrics } from '../utils/interactiveDemo';
import {
  ANDROID_APK_DOWNLOAD_URL,
  APK_DOWNLOAD_FILENAME,
} from '../utils/platformCompatibility';
import {
  evaluatePasswordStrength,
  sanitizeFirstName,
  validateRegistrationInput,
} from '../utils/welcomePack';

interface WelcomeEmailRecord {
  deliveryMode: 'sent_via_resend' | 'instant_preview';
  deliveryNote: string;
  subject: string;
  from: string;
  to: string;
  firstName: string;
  sentAtIso: string;
  emailHtml: string;
  welcomePackUrl: string;
  apkDownloadUrl: string;
  verificationUrl: string;
  firebaseStatus?: 'synced_google' | 'verification_sent' | 'console_toggle_needed';
}

const STORAGE_WELCOME_KEY = 'gambleaware_welcome_record_v1';

interface SetupStepConfig {
  id: 'accessibility' | 'device_admin' | 'commitment_lock';
  number: string;
  shortTitle: string;
  title: string;
  subtitle: string;
  phoneHeader: string;
  phoneHighlight: string;
  instructions: string[];
  actionLabel: string;
}

const ZERO_VPN_SETUP_STEPS: SetupStepConfig[] = [
  {
    id: 'accessibility',
    number: '01',
    shortTitle: 'Accessibility Shield',
    title: 'Enable All-Browser Accessibility Shield',
    subtitle: 'Blocks 1,035+ domains, popunders & betting apps across Chrome, Brave, Opera & Firefox — zero VPN slot.',
    phoneHeader: 'Settings → Accessibility → Installed Apps',
    phoneHighlight: 'Use GambleAware Shield',
    instructions: [
      'Open Android Settings and tap Accessibility.',
      'Select Installed Apps (or Downloaded Services) and tap GambleAware.',
      'Switch on "Use GambleAware" and tap Allow to start Zero-VPN blocking.',
    ],
    actionLabel: 'Mark Step 1 Complete',
  },
  {
    id: 'device_admin',
    number: '02',
    shortTitle: 'Uninstall Lock',
    title: 'Arm Device Admin Uninstall Guard',
    subtitle: 'Stops impulsive deletion or force-stopping when urges spike at night.',
    phoneHeader: 'Settings → Security → Device Admin Apps',
    phoneHighlight: 'GambleAware Uninstall Lock',
    instructions: [
      'Inside GambleAware, open the Lock tab and tap Enable Uninstall Lock.',
      'Review the Android Device Admin prompt explaining uninstall protection.',
      'Tap Activate this device admin app to lock the shield in place.',
    ],
    actionLabel: 'Mark Step 2 Complete',
  },
  {
    id: 'commitment_lock',
    number: '03',
    shortTitle: 'Commitment Timer',
    title: 'Set Commitment Lock & Background Guard',
    subtitle: 'Pick 24h to 2 years offline + unrestricted background running (VPN step eliminated!).',
    phoneHeader: 'GambleAware → Lock Settings',
    phoneHighlight: '30-Day Commitment Lock · Active',
    instructions: [
      'Choose a lock duration (24 Hours, 7 Days, 30 Days, 90 Days, or up to 2 Years).',
      'Optional: Pair a Trusted Buddy with an offline 6-digit approval key.',
      'Zero VPN needed — your work VPN, ProtonVPN, WARP & banking apps run untouched.',
    ],
    actionLabel: 'Complete Guided Setup',
  },
];

function getStrengthBarColor(score: number, barIndex: number): string {
  if (barIndex >= score) return 'bg-[var(--muted-fill)]';
  if (score <= 1) return 'bg-rose-400';
  if (score === 2) return 'bg-rose-500';
  if (score === 3) return 'bg-[#E11D74]/70';
  if (score === 4) return 'bg-[#D81B78]/85';
  return 'bg-[var(--active-fill)]';
}

export const FreeAccountPortal: React.FC = () => {
  const [authTab, setAuthTab] = useState<'register' | 'signin'>('register');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordTips, setShowPasswordTips] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formBannerError, setFormBannerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [resendingVerify, setResendingVerify] = useState(false);
  const [resendConfirmMsg, setResendConfirmMsg] = useState<string | null>(null);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [welcomeRecord, setWelcomeRecord] = useState<WelcomeEmailRecord | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = window.localStorage.getItem(STORAGE_WELCOME_KEY);
      return saved ? (JSON.parse(saved) as WelcomeEmailRecord) : null;
    } catch {
      return null;
    }
  });
  const [showFullEmailPreview, setShowFullEmailPreview] = useState(true);

  // Interactive 3-Step Zero-VPN Setup Wizard state
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const metrics = useMemo(() => getRegistryMetrics(), []);
  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsub();
  }, []);

  const persistWelcomeRecord = (record: WelcomeEmailRecord | null) => {
    setWelcomeRecord(record);
    try {
      if (record) {
        window.localStorage.setItem(STORAGE_WELCOME_KEY, JSON.stringify(record));
      } else {
        window.localStorage.removeItem(STORAGE_WELCOME_KEY);
      }
    } catch {
      // Ignore storage quota errors in private windows
    }
  };

  const requestWelcomeEmail = async (
    nameValue: string,
    emailValue: string,
    firebaseStatus?: WelcomeEmailRecord['firebaseStatus'],
  ): Promise<WelcomeEmailRecord> => {
    const res = await fetch('/api/welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: nameValue,
        email: emailValue,
        dailyStakeNgn: 5000,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Could not generate welcome email right now.');
    }
    const record: WelcomeEmailRecord = {
      deliveryMode: data.deliveryMode,
      deliveryNote: data.deliveryNote,
      subject: data.subject,
      from: data.from,
      to: data.to,
      firstName: data.firstName,
      sentAtIso: data.sentAtIso,
      emailHtml: data.emailHtml,
      welcomePackUrl: data.welcomePackUrl,
      apkDownloadUrl: data.apkDownloadUrl,
      verificationUrl: data.verificationUrl,
      firebaseStatus,
    };
    persistWelcomeRecord(record);
    return record;
  };

  const handleGoogleContinue = async () => {
    setFormBannerError(null);
    setGoogleBusy(true);
    try {
      const user = await signInWithGoogle();
      const derivedName = sanitizeFirstName(
        user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Friend',
      );
      await syncFreeAccountAnchor(user, derivedName).catch(() => {});
      if (user.email) {
        await requestWelcomeEmail(derivedName, user.email, 'synced_google');
      }
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setFormBannerError('Google sign-in popup was closed before completing.');
      } else {
        setFormBannerError(
          'Google sign-in popup could not complete in this preview window. You can still register free with your email below.',
        );
      }
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormBannerError(null);

    const validation = validateRegistrationInput({
      firstName,
      email,
      password,
      confirmPassword,
      acceptedTerms,
    });
    if (!validation.valid) {
      setFieldErrors(validation.errors as Record<string, string>);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      let firebaseStatus: WelcomeEmailRecord['firebaseStatus'] = 'verification_sent';
      try {
        const regResult = await registerWithEmailAndPassword(firstName, email, password);
        if (regResult.user.emailVerified) {
          await syncFreeAccountAnchor(regResult.user, sanitizeFirstName(firstName)).catch(() => {});
        }
      } catch (fbErr) {
        const code = (fbErr as { code?: string })?.code ?? '';
        if (code === 'auth/email-already-in-use') {
          setFormBannerError(
            'That email already has a free GambleAware account. Switch to Sign In above to access it.',
          );
          setSubmitting(false);
          return;
        }
        if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found') {
          firebaseStatus = 'console_toggle_needed';
        } else {
          // Non-fatal Firebase auth error in restricted sandbox: still deliver the Welcome Email + Pack cleanly
          firebaseStatus = 'console_toggle_needed';
        }
      }

      await requestWelcomeEmail(firstName, email, firebaseStatus);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setFormBannerError(
        err instanceof Error ? err.message : 'Unable to complete registration. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormBannerError(null);
    if (!email.trim() || !password) {
      setFormBannerError('Enter your registered email and password to sign in.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await signInWithEmail(email, password);
      const derivedName = sanitizeFirstName(
        user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Friend',
      );
      if (user.emailVerified) {
        await syncFreeAccountAnchor(user, derivedName).catch(() => {});
      }
      await requestWelcomeEmail(
        derivedName,
        user.email || email.trim(),
        user.emailVerified ? 'synced_google' : 'verification_sent',
      );
      setPassword('');
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/operation-not-allowed') {
        setFormBannerError(
          'Email/Password sign-in is not yet enabled in Firebase Console. Use "Continue with Google" or register for your instant free Welcome Pack.',
        );
      } else {
        setFormBannerError('Invalid email or password. Check your details or create a free account.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOutFirebase().catch(() => {});
    persistWelcomeRecord(null);
    setResendConfirmMsg(null);
  };

  const handleResendFirebaseVerification = async () => {
    setResendingVerify(true);
    setResendConfirmMsg(null);
    try {
      const sent = await resendVerificationEmail();
      setResendConfirmMsg(
        sent
          ? 'Verification link re-sent via Firebase Authentication.'
          : 'Sign in with your account to re-send a verification link.',
      );
    } catch {
      setResendConfirmMsg('Please wait a moment before requesting another verification email.');
    } finally {
      setResendingVerify(false);
    }
  };

  const completedStepCount = Object.values(completedSteps).filter(Boolean).length;
  const allStepsComplete = completedStepCount === ZERO_VPN_SETUP_STEPS.length;
  const currentStep = ZERO_VPN_SETUP_STEPS[activeStepIdx];

  const handleCompleteCurrentStep = () => {
    setCompletedSteps((prev) => ({ ...prev, [currentStep.id]: true }));
    if (activeStepIdx < ZERO_VPN_SETUP_STEPS.length - 1) {
      setActiveStepIdx((idx) => idx + 1);
    }
  };

  return (
    <section
      id="register"
      aria-labelledby="free-account-heading"
      className="border-b border-[var(--subtle-border)] bg-[var(--surface)]/45 py-14 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
              01 · 100% Free Account, Welcome Email &amp; Zero-VPN Setup
            </p>
            <h2
              id="free-account-heading"
              className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl"
            >
              Start free in 30 seconds — get your Welcome Pack immediately.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
              Unlike paid subscription blockers, GambleAware is 100% free forever. Register once to receive your personalized Welcome Email, printable Recovery &amp; Bank-Freeze Welcome Pack, and interactive 3-step Zero-VPN device guide.
            </p>
          </div>

          <div className="shrink-0 font-mono text-xs text-[var(--ink-muted)]">
            ₦0 / $0 Forever · No Credit Card · No VPN Slot
          </div>
        </div>

        {/* Main 12-Column Split: Left = Free Registration OR Welcome Email Hub, Right = 3-Step Zero-VPN Visual Setup Guide */}
        <div className="grid items-start gap-6 lg:grid-cols-12">
          {/* LEFT 7 COLS: Registration / Welcome Email Hub */}
          <div className="min-w-0 overflow-hidden rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-4 sm:p-7 lg:col-span-7">
            {welcomeRecord ? (
              <div data-testid="welcome-hub-panel" className="min-w-0">
                {/* Welcome Header Bar */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--subtle-border)] pb-5">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--safe-bg)] text-[var(--safe-ink)]">
                      <MailCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] font-semibold tracking-wider text-[var(--safe-ink)] uppercase">
                        Free Account Active · ₦0 Forever
                      </p>
                      <h3 className="mt-0.5 break-words font-display text-lg font-bold tracking-tight text-[var(--ink)] sm:text-xl">
                        Welcome to GambleAware, {welcomeRecord.firstName}.
                      </h3>
                      <p className="mt-0.5 truncate font-mono text-xs text-[var(--ink-muted)]">
                        {welcomeRecord.to}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    data-testid="welcome-signout-btn"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Switch Account</span>
                  </button>
                </div>

                {/* Delivery Transparency Notice + Quick Actions */}
                <div className="mt-5 rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                      {welcomeRecord.deliveryMode === 'sent_via_resend'
                        ? 'Welcome Email Dispatched'
                        : 'Personalized Welcome Email & Welcome Pack Ready'}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                      {new Date(welcomeRecord.sentAtIso).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
                    {welcomeRecord.deliveryNote}
                  </p>

                  {firebaseUser && !firebaseUser.emailVerified ? (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--subtle-border)] pt-3">
                      <span className="text-xs text-[var(--ink-muted)]">
                        Check your inbox for your Firebase email verification link to enable cloud profile sync.
                      </span>
                      <button
                        type="button"
                        disabled={resendingVerify}
                        onClick={handleResendFirebaseVerification}
                        className="inline-flex cursor-pointer items-center gap-1 font-mono text-[11px] font-semibold text-[var(--accent-ink)] hover:underline disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3 w-3 ${resendingVerify ? 'animate-spin' : ''}`} />
                        <span>Resend Link</span>
                      </button>
                    </div>
                  ) : null}
                  {resendConfirmMsg ? (
                    <p className="mt-2 text-xs font-medium text-[var(--safe-ink)]">
                      {resendConfirmMsg}
                    </p>
                  ) : null}
                </div>

                {/* Primary Download CTAs: Welcome Pack + Android APK */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <a
                    href={welcomeRecord.welcomePackUrl}
                    download="GambleAware-Welcome-Pack.html"
                    data-testid="download-welcome-pack-btn"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--active-fill)] px-5 text-xs font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span>Download Welcome Pack</span>
                  </a>

                  <a
                    href={`${welcomeRecord.welcomePackUrl}&preview=1`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--ink)] transition-colors hover:border-[var(--glass-border)]"
                  >
                    <span>Open Printable Guide</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <a
                    href={ANDROID_APK_DOWNLOAD_URL}
                    download={APK_DOWNLOAD_FILENAME}
                    className="inline-flex h-11 items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--ink)] transition-colors hover:border-[var(--glass-border)]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download APK</span>
                  </a>
                </div>

                {/* Interactive Branded Welcome Email Preview Card */}
                <div className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-[var(--subtle-border)] bg-[var(--canvas)]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--subtle-border)] bg-[var(--control-bg)] px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-[var(--ink)]">
                        {welcomeRecord.subject}
                      </p>
                      <p className="truncate font-mono text-[11px] text-[var(--ink-muted)]">
                        From: {welcomeRecord.from} · To: {welcomeRecord.to}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFullEmailPreview((prev) => !prev)}
                      aria-expanded={showFullEmailPreview}
                      className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-3 py-1 text-[11px] font-semibold text-[var(--ink)]"
                    >
                      <span>{showFullEmailPreview ? 'Collapse' : 'Expand'}</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${showFullEmailPreview ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>

                  {showFullEmailPreview ? (
                    <div
                      data-testid="welcome-email-preview"
                      className="p-4 sm:p-5"
                    >
                      {/* Rendered Branded Email Card (Direct React rendering for crisp theming & zero iframe scroll issues) */}
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
                        <div className="border-b-[3px] border-[#D81B78] bg-[#0A0B10] px-5 py-5 text-white">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <BrandGMark className="h-8 w-8 shrink-0" />
                              <span className="font-display text-base font-bold tracking-tight">
                                GambleAware
                              </span>
                            </div>
                            <span className="font-mono text-[10px] font-bold tracking-wider text-[#FF72B8] uppercase">
                              100% Free · No VPN
                            </span>
                          </div>
                          <h4 className="mt-4 font-display text-xl font-bold text-white">
                            Welcome to GambleAware, {welcomeRecord.firstName}.
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-slate-300">
                            You just took a decisive, confidential step to protect your device and finances — completely free forever.
                          </p>
                        </div>

                        <div className="space-y-4 p-5 text-xs leading-relaxed text-slate-700">
                          <p>
                            Your free protection account for{' '}
                            <strong className="text-slate-950">{welcomeRecord.to}</strong> is ready.
                            GambleAware blocks{' '}
                            <strong>{metrics.domainCount.toLocaleString()}+ betting websites</strong>{' '}
                            and <strong>{metrics.appCount}+ gambling apps</strong> without slowing down your phone or requiring a VPN.
                          </p>

                          <div className="flex flex-wrap gap-2.5 pt-1">
                            <a
                              href="#setup-wizard"
                              className="inline-flex items-center gap-1.5 rounded-full bg-[#D81B78] px-4 py-2.5 text-xs font-bold text-white no-underline hover:opacity-90"
                            >
                              <span>Start 3-Step Setup</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                            <a
                              href={welcomeRecord.welcomePackUrl}
                              download="GambleAware-Welcome-Pack.html"
                              className="inline-flex items-center gap-1.5 rounded-full bg-[#0A0B10] px-4 py-2.5 text-xs font-bold text-white no-underline hover:opacity-90"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>Download Welcome Pack</span>
                            </a>
                          </div>

                          <div className="rounded-xl border border-pink-100 bg-[#FDF2F7]/65 p-3.5">
                            <p className="font-mono text-[10px] font-bold tracking-wider text-[#D81B78] uppercase">
                              Included in Your Free Welcome Pack
                            </p>
                            <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
                              <li className="flex items-start gap-2">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D81B78]" />
                                <span>3-Step Android Protection &amp; Uninstall Lock checklist</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D81B78]" />
                                <span>Bank Card Gambling Freeze setup guide for major banks</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D81B78]" />
                                <span>22-Site iPhone Screen Time blocklist &amp; 24/7 confidential helplines</span>
                              </li>
                            </ul>
                          </div>

                          <p className="border-t border-slate-200 pt-3 text-[11px] text-slate-500">
                            Stay protected — The GambleAware Team · 100% Free Forever
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div>
                {/* Auth Mode Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--subtle-border)] pb-4">
                  <div
                    role="tablist"
                    aria-label="Free account access mode"
                    className="inline-flex rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] p-1"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authTab === 'register'}
                      onClick={() => {
                        setAuthTab('register');
                        setFormBannerError(null);
                      }}
                      className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                        authTab === 'register'
                          ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                          : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      Create Free Account
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authTab === 'signin'}
                      onClick={() => {
                        setAuthTab('signin');
                        setFormBannerError(null);
                      }}
                      className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                        authTab === 'signin'
                          ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                          : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      Sign In
                    </button>
                  </div>

                  <span className="font-mono text-[11px] font-semibold text-[var(--safe-ink)]">
                    100% Free · Instant Welcome Pack
                  </span>
                </div>

                {/* Instant 1-Tap Google Sign-In */}
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleGoogleContinue}
                    disabled={googleBusy}
                    data-testid="google-signin-btn"
                    className="flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] px-4 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--glass-border)] hover:bg-[var(--muted-fill)] disabled:opacity-60"
                  >
                    <ShieldCheck className="h-4 w-4 text-[var(--accent-ink)]" />
                    <span>
                      {googleBusy
                        ? 'Connecting to Google...'
                        : 'Continue with Google (Instant Verified)'}
                    </span>
                  </button>
                </div>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[var(--subtle-border)]" />
                  <span className="font-mono text-[11px] text-[var(--ink-muted)] uppercase">
                    or continue with email
                  </span>
                  <div className="h-px flex-1 bg-[var(--subtle-border)]" />
                </div>

                {formBannerError ? (
                  <div
                    role="alert"
                    data-testid="registration-banner-error"
                    className="mb-4 flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-[var(--danger-bg)] p-3.5 text-xs leading-relaxed text-[var(--danger-ink)]"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{formBannerError}</span>
                  </div>
                ) : null}

                {authTab === 'register' ? (
                  <form
                    onSubmit={handleEmailRegister}
                    noValidate
                    data-testid="free-registration-form"
                    className="space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="reg-first-name"
                          className="block text-xs font-semibold text-[var(--ink)]"
                        >
                          First Name <span className="text-[var(--accent-ink)]">*</span>
                        </label>
                        <input
                          id="reg-first-name"
                          data-testid="reg-first-name"
                          type="text"
                          autoComplete="given-name"
                          placeholder="e.g. Jared"
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            if (fieldErrors.firstName) {
                              setFieldErrors((prev) => ({ ...prev, firstName: '' }));
                            }
                          }}
                          className="mt-1.5 h-11 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 focus:border-[var(--active-fill)] focus:outline-none"
                        />
                        {fieldErrors.firstName ? (
                          <p className="mt-1 text-xs font-medium text-[var(--danger-ink)]">
                            {fieldErrors.firstName}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <label
                          htmlFor="reg-email"
                          className="block text-xs font-semibold text-[var(--ink)]"
                        >
                          Email Address <span className="text-[var(--accent-ink)]">*</span>
                        </label>
                        <input
                          id="reg-email"
                          data-testid="reg-email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (fieldErrors.email) {
                              setFieldErrors((prev) => ({ ...prev, email: '' }));
                            }
                          }}
                          className="mt-1.5 h-11 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 focus:border-[var(--active-fill)] focus:outline-none"
                        />
                        {fieldErrors.email ? (
                          <p className="mt-1 text-xs font-medium text-[var(--danger-ink)]">
                            {fieldErrors.email}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Password + 5-Segment Live Strength Meter */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="reg-password"
                          className="block text-xs font-semibold text-[var(--ink)]"
                        >
                          Password (min. 8 characters){' '}
                          <span className="text-[var(--accent-ink)]">*</span>
                        </label>
                        <span
                          data-testid="password-strength-label"
                          className="font-mono text-[11px] font-semibold text-[var(--ink-muted)]"
                        >
                          {passwordStrength.score > 0
                            ? `${passwordStrength.label} (${passwordStrength.score}/5)`
                            : 'Strength meter'}
                        </span>
                      </div>
                      <div className="relative mt-1.5">
                        <input
                          id="reg-password"
                          data-testid="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Create a strong recovery password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) {
                              setFieldErrors((prev) => ({ ...prev, password: '' }));
                            }
                          }}
                          className="h-11 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] pr-11 pl-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 focus:border-[var(--active-fill)] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute top-1/2 right-2.5 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)]"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* 5-Segment Bar (Cleaner, higher contrast than Gamban's screenshot) */}
                      <div
                        aria-hidden="true"
                        className="mt-2 grid grid-cols-5 gap-1.5"
                      >
                        {[0, 1, 2, 3, 4].map((barIdx) => (
                          <div
                            key={barIdx}
                            className={`h-1.5 rounded-full transition-colors ${getStrengthBarColor(passwordStrength.score, barIdx)}`}
                          />
                        ))}
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowPasswordTips((prev) => !prev)}
                          aria-expanded={showPasswordTips}
                          className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[var(--accent-ink)] hover:underline"
                        >
                          <span>{showPasswordTips ? 'Hide password tips' : 'Show password tips'}</span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${showPasswordTips ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </div>

                      {showPasswordTips ? (
                        <ul className="mt-2 grid grid-cols-2 gap-1.5 rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3 text-[11px] text-[var(--ink-muted)]">
                          <li className={passwordStrength.checks.minLength ? 'font-semibold text-[var(--safe-ink)]' : ''}>
                            • At least 8 characters
                          </li>
                          <li className={passwordStrength.checks.hasUppercase ? 'font-semibold text-[var(--safe-ink)]' : ''}>
                            • Uppercase letter (A–Z)
                          </li>
                          <li className={passwordStrength.checks.hasNumber ? 'font-semibold text-[var(--safe-ink)]' : ''}>
                            • At least one number (0–9)
                          </li>
                          <li className={passwordStrength.checks.hasSymbol ? 'font-semibold text-[var(--safe-ink)]' : ''}>
                            • Special character (!@#$)
                          </li>
                        </ul>
                      ) : null}

                      {fieldErrors.password ? (
                        <p className="mt-1 text-xs font-medium text-[var(--danger-ink)]">
                          {fieldErrors.password}
                        </p>
                      ) : null}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label
                        htmlFor="reg-confirm-password"
                        className="block text-xs font-semibold text-[var(--ink)]"
                      >
                        Confirm Password <span className="text-[var(--accent-ink)]">*</span>
                      </label>
                      <div className="relative mt-1.5">
                        <input
                          id="reg-confirm-password"
                          data-testid="reg-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Re-enter your password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (fieldErrors.confirmPassword) {
                              setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                            }
                          }}
                          className="h-11 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] pr-11 pl-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60 focus:border-[var(--active-fill)] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          aria-label={
                            showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                          }
                          className="absolute top-1/2 right-2.5 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)]"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {fieldErrors.confirmPassword ? (
                        <p
                          data-testid="reg-confirm-error"
                          className="mt-1 text-xs font-medium text-[var(--danger-ink)]"
                        >
                          {fieldErrors.confirmPassword}
                        </p>
                      ) : null}
                    </div>

                    {/* Single Ethical Privacy Checkbox (NO forced marketing consent like Gamban!) */}
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3.5">
                      <input
                        type="checkbox"
                        data-testid="reg-terms-checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => {
                          setAcceptedTerms(e.target.checked);
                          if (fieldErrors.acceptedTerms) {
                            setFieldErrors((prev) => ({ ...prev, acceptedTerms: '' }));
                          }
                        }}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--active-fill)]"
                      />
                      <span className="text-xs leading-relaxed text-[var(--ink-muted)]">
                        I accept the free GambleAware License &amp; Privacy Commitment.{' '}
                        <strong className="text-[var(--ink)]">
                          Zero marketing spam, zero cloud browsing logs, and 100% free forever.
                        </strong>
                      </span>
                    </label>
                    {fieldErrors.acceptedTerms ? (
                      <p className="text-xs font-medium text-[var(--danger-ink)]">
                        {fieldErrors.acceptedTerms}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={submitting}
                      data-testid="reg-submit-btn"
                      className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-6 text-sm font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      <span>
                        {submitting
                          ? 'Preparing Your Welcome Email & Pack...'
                          : 'Create Free Account & Send Welcome Pack'}
                      </span>
                    </button>
                  </form>
                ) : (
                  <form
                    onSubmit={handleEmailSignIn}
                    noValidate
                    data-testid="signin-form"
                    className="space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="signin-email"
                        className="block text-xs font-semibold text-[var(--ink)]"
                      >
                        Email Address
                      </label>
                      <input
                        id="signin-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 text-sm text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="signin-password"
                        className="block text-xs font-semibold text-[var(--ink)]"
                      >
                        Password
                      </label>
                      <input
                        id="signin-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Your account password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3.5 text-sm text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-6 text-sm font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      <Lock className="h-4 w-4 shrink-0" />
                      <span>{submitting ? 'Signing In...' : 'Sign In & Open Welcome Pack'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* RIGHT 5 COLS: Interactive 3-Step Zero-VPN Device Setup Wizard (Beats Gamban's 4-Step VPN Wizard) */}
          <div
            id="setup-wizard"
            className="min-w-0 overflow-hidden rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-4 sm:p-6 lg:col-span-5"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-mono text-[11px] font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
                  Guided Android Setup
                </p>
                <h3 className="mt-1 font-display text-lg font-bold tracking-tight text-[var(--ink)]">
                  3 Steps. Zero VPN Slot.
                </h3>
              </div>
              <span
                data-testid="setup-progress-count"
                className="font-mono text-xs font-bold text-[var(--ink)] tabular-nums"
              >
                {completedStepCount}/3 Ready
              </span>
            </div>

            <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
              Preview the exact Android onboarding before installing. Unlike Gamban’s 4-step VPN flow, GambleAware eliminates the VPN step completely.
            </p>

            {/* Step Selector List */}
            <div className="mt-4 space-y-2">
              {ZERO_VPN_SETUP_STEPS.map((step, idx) => {
                const isDone = Boolean(completedSteps[step.id]);
                const isActive = idx === activeStepIdx;
                return (
                  <button
                    key={step.id}
                    type="button"
                    data-testid={`setup-step-btn-${step.id}`}
                    onClick={() => setActiveStepIdx(idx)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                      isActive
                        ? 'border-[var(--active-fill)] bg-[var(--muted-fill)]'
                        : 'border-[var(--subtle-border)] bg-[var(--control-bg)] hover:border-[var(--glass-border)]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                          isDone
                            ? 'bg-[var(--safe-bg)] text-[var(--safe-ink)]'
                            : isActive
                              ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                              : 'border border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink-muted)]'
                        }`}
                      >
                        {isDone ? <Check className="h-3.5 w-3.5" /> : step.number}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[var(--ink)]">
                          Step {step.number}: {step.shortTitle}
                        </p>
                        <p className="truncate text-[11px] text-[var(--ink-muted)]">
                          {isDone ? 'Verified & ready' : step.phoneHighlight}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-[var(--accent-ink)]' : 'text-[var(--ink-muted)]'
                      }`}
                    />
                  </button>
                );
              })}

              {/* Explicit Zero-VPN Contrast Row */}
              <div className="flex items-center justify-between rounded-2xl border border-dashed border-[var(--subtle-border)] bg-[var(--canvas)] px-3.5 py-2.5 opacity-80">
                <div className="flex items-center gap-2.5">
                  <Shield className="h-4 w-4 shrink-0 text-[var(--safe-ink)]" />
                  <span className="text-xs font-medium text-[var(--ink-muted)] line-through">
                    Step 4: Enable Battery-Draining VPN
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold tracking-wider text-[var(--safe-ink)] uppercase">
                  Eliminated
                </span>
              </div>
            </div>

            {/* Interactive Visual Phone Walkthrough Card (Crushes Gamban's Screenshot #3) */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--subtle-border)] bg-[#0A0B10] p-4 text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                  <Smartphone className="h-3.5 w-3.5 text-[#FF3D9A]" />
                  <span>{currentStep.phoneHeader}</span>
                </div>
                <span className="font-mono text-[10px] font-semibold text-[#FF72B8]">
                  STEP {currentStep.number}
                </span>
              </div>

              {/* Simulated Android Toggle Preview */}
              <div className="mt-3 flex items-center justify-between rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <BrandGMark className="h-7 w-7 shrink-0" />
                  <span className="text-xs font-semibold text-white">
                    {currentStep.phoneHighlight}
                  </span>
                </div>
                <div
                  className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${
                    completedSteps[currentStep.id]
                      ? 'justify-end bg-[#FF3D9A]'
                      : 'justify-end bg-[#D81B78]'
                  }`}
                >
                  <span className="h-5 w-5 rounded-full bg-white shadow" />
                </div>
              </div>

              <ol className="mt-3.5 space-y-2 text-xs leading-relaxed text-slate-300">
                {currentStep.instructions.map((line, i) => (
                  <li key={line} className="flex items-start gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#FF72B8]">
                      {i + 1}.
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-4">
                {allStepsComplete ? (
                  <a
                    href={ANDROID_APK_DOWNLOAD_URL}
                    download={APK_DOWNLOAD_FILENAME}
                    data-testid="setup-complete-download-btn"
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#FF3D9A] px-4 text-xs font-bold text-[#090B10] transition-opacity hover:opacity-90"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Setup Walkthrough Complete — Download APK</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    data-testid="setup-step-action-btn"
                    onClick={handleCompleteCurrentStep}
                    className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#D81B78] px-4 text-xs font-bold text-white transition-opacity hover:opacity-90"
                  >
                    <span>{currentStep.actionLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
