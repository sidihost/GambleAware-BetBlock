import React, { useEffect, useState } from 'react';
import {
  Anchor,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  Target,
  UserCheck,
} from 'lucide-react';
import { CloudAccountInfo, RecoveryGoalCategory } from '../data/types';
import { LiquidGlassCard } from './LiquidGlass';

interface AuthScreenProps {
  initialMode?: 'signin' | 'signup';
  cloudUser: CloudAccountInfo | null;
  preferredName: string;
  goalsCount: number;
  cloudErrorMsg: string | null;
  onSignInGoogle: () => Promise<{ ok: boolean; error?: string }>;
  onSignUpEmail: (params: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string; verificationSent?: boolean }>;
  onSignInEmail: (params: {
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  onSendPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  onRefreshVerification: () => Promise<{ verified: boolean }>;
  onCreateStarterGoal: (input: {
    title: string;
    category: RecoveryGoalCategory;
    targetDays: number;
    targetAmountNgn: number;
    whyNote: string;
    lockDurationDays: number;
  }) => void;
  onSavePreferredName: (name: string) => void;
  onResendVerification: () => void;
  onSignOut: () => Promise<void>;
  onRedirectHome: () => void;
}

const STARTER_GOALS: Array<{
  id: string;
  label: string;
  title: string;
  category: RecoveryGoalCategory;
  targetDays: number;
  targetAmountNgn: number;
  whyNote: string;
  lockDurationDays: number;
}> = [
  {
    id: 'streak_30',
    label: '30 Days Clean',
    title: '30 Days Betting-Free Streak',
    category: 'streak',
    targetDays: 30,
    targetAmountNgn: 150000,
    whyNote: 'Reclaim focus, sleep better, and keep my hard-earned Naira.',
    lockDurationDays: 7,
  },
  {
    id: 'save_150k',
    label: 'Save ₦150,000',
    title: 'Save ₦150,000 Towards Real Goals',
    category: 'savings',
    targetDays: 30,
    targetAmountNgn: 150000,
    whyNote: 'Turn daily betting stakes into real family & career savings.',
    lockDurationDays: 0,
  },
  {
    id: 'none',
    label: 'Decide later',
    title: '',
    category: 'streak',
    targetDays: 7,
    targetAmountNgn: 0,
    whyNote: '',
    lockDurationDays: 0,
  },
];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'signin',
  cloudUser,
  preferredName,
  goalsCount,
  cloudErrorMsg,
  onSignInGoogle,
  onSignUpEmail,
  onSignInEmail,
  onSendPasswordReset,
  onRefreshVerification,
  onCreateStarterGoal,
  onSavePreferredName,
  onResendVerification,
  onSignOut,
  onRedirectHome,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [nameInput, setNameInput] = useState(preferredName);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [starterGoalId, setStarterGoalId] = useState<string>('streak_30');
  const [submitting, setSubmitting] = useState(false);
  const [checkingVerify, setCheckingVerify] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setLocalError(null);
    setResetSent(false);
  }, [initialMode]);

  useEffect(() => {
    if (preferredName && !nameInput) {
      setNameInput(preferredName);
    }
  }, [preferredName, nameInput]);

  const applyStarterGoalIfChosen = () => {
    if (goalsCount > 0) return;
    const starter = STARTER_GOALS.find((g) => g.id === starterGoalId);
    if (starter && starter.id !== 'none') {
      onCreateStarterGoal({
        title: starter.title,
        category: starter.category,
        targetDays: starter.targetDays,
        targetAmountNgn: starter.targetAmountNgn,
        whyNote: starter.whyNote,
        lockDurationDays: starter.lockDurationDays,
      });
    }
  };

  const handleGoogleClick = async () => {
    setLocalError(null);
    setInfoMsg(null);
    setResetSent(false);
    setSubmitting(true);
    if (nameInput.trim()) {
      onSavePreferredName(nameInput.trim());
    }
    const res = await onSignInGoogle();
    setSubmitting(false);
    if (res.ok) {
      if (mode === 'signup') {
        applyStarterGoalIfChosen();
      }
      onRedirectHome();
    } else if (res.error) {
      setLocalError(res.error);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setInfoMsg(null);
    setResetSent(false);
    setSubmitting(true);

    if (mode === 'signup') {
      const res = await onSignUpEmail({
        name: nameInput,
        email: emailInput,
        password: passwordInput,
      });
      setSubmitting(false);
      if (res.ok) {
        applyStarterGoalIfChosen();
        // Keep new unverified user cleanly on the verification step right here
        // instead of kicking to Home where cloud backup waits on verification.
      } else if (res.error) {
        setLocalError(res.error);
      }
    } else {
      const res = await onSignInEmail({
        email: emailInput,
        password: passwordInput,
      });
      setSubmitting(false);
      if (res.ok) {
        onRedirectHome();
      } else if (res.error) {
        setLocalError(res.error);
      }
    }
  };

  const handleForgotPassword = async () => {
    setLocalError(null);
    setResetSent(false);
    setSubmitting(true);
    const res = await onSendPasswordReset(emailInput);
    setSubmitting(false);
    if (res.ok) {
      setResetSent(true);
    } else if (res.error) {
      setLocalError(res.error);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 pt-4 pb-28 md:px-6 md:pt-8 md:pb-14">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onRedirectHome}
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Guard</span>
        </button>
        <span className="font-mono text-[11px] font-semibold tracking-wider text-[var(--ink-muted)] uppercase">
          Account &amp; Sync
        </span>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Right Auth Form appears FIRST on mobile so Sign In / Sign Up is immediately visible */}
        <div className="order-1 lg:order-2 lg:col-span-7">
          <LiquidGlassCard className="p-5 sm:p-7">
            {cloudUser ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3.5">
                  {cloudUser.photoUrl ? (
                    <img
                      src={cloudUser.photoUrl}
                      alt={cloudUser.displayName}
                      className="h-12 w-12 shrink-0 rounded-full border border-[var(--subtle-border)] object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--active-fill)] font-display text-lg font-bold text-[var(--active-content)]">
                      {(preferredName || cloudUser.displayName || 'G').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-bold text-[var(--ink)]">
                      {cloudUser.displayName}
                    </p>
                    <p className="truncate text-xs text-[var(--ink-muted)]">{cloudUser.email}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-ink)]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{cloudUser.emailVerified ? 'Verified Account' : 'Pending Verification'}</span>
                  </span>
                </div>

                {!cloudUser.emailVerified ? (
                  <div className="rounded-[18px] border border-[var(--glass-border)] bg-[var(--muted-fill)] p-4">
                    <p className="font-display text-sm font-bold text-[var(--ink)]">
                      Check your inbox to verify your email
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                      We sent a verification link to{' '}
                      <strong className="text-[var(--ink)]">{cloudUser.email}</strong>. Click it to
                      turn on encrypted backup across your devices. Your blocker &amp; goals are
                      already working on this device.
                    </p>
                    <div className="mt-3.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={checkingVerify}
                        onClick={async () => {
                          setCheckingVerify(true);
                          const { verified } = await onRefreshVerification();
                          setCheckingVerify(false);
                          if (verified) {
                            onRedirectHome();
                          }
                        }}
                        className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] hover:opacity-90 disabled:opacity-60"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${checkingVerify ? 'animate-spin' : ''}`} />
                        <span>{checkingVerify ? 'Checking…' : "I've Verified — Continue"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={onResendVerification}
                        className="h-10 cursor-pointer rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--ink)] hover:opacity-90"
                      >
                        Resend Email
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[20px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-4">
                  <label
                    htmlFor="preferred-name-signedin"
                    className="block text-xs font-semibold text-[var(--ink)]"
                  >
                    Preferred Greeting Name
                  </label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      id="preferred-name-signedin"
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      maxLength={60}
                      placeholder="First name for greetings"
                      className="h-11 min-w-0 flex-1 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--surface)] px-3.5 text-sm text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onSavePreferredName(nameInput);
                        setInfoMsg('Greeting name updated');
                      }}
                      className="h-11 shrink-0 cursor-pointer rounded-full bg-[var(--active-fill)] px-5 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
                    >
                      Save
                    </button>
                  </div>
                  {infoMsg ? (
                    <p className="mt-2 text-xs font-medium text-[var(--accent-ink)]">{infoMsg}</p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
                  <button
                    type="button"
                    onClick={onRedirectHome}
                    className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-5 text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void onSignOut()}
                    className="h-11 cursor-pointer rounded-full border border-[var(--subtle-border)] px-5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--muted-fill)]"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Auth Mode Switcher */}
                <div
                  role="tablist"
                  aria-label="Account mode"
                  className="grid grid-cols-2 gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'signin'}
                    onClick={() => {
                      setMode('signin');
                      setLocalError(null);
                      setResetSent(false);
                    }}
                    className={`h-10 cursor-pointer rounded-full text-sm font-semibold transition-colors ${
                      mode === 'signin'
                        ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                        : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'signup'}
                    onClick={() => {
                      setMode('signup');
                      setLocalError(null);
                      setResetSent(false);
                    }}
                    className={`h-10 cursor-pointer rounded-full text-sm font-semibold transition-colors ${
                      mode === 'signup'
                        ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                        : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Primary Google Sign-In / Sign-Up CTA */}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleGoogleClick()}
                  className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--muted-fill)] disabled:opacity-60"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--active-fill)] text-[11px] font-bold text-[var(--active-content)]">
                    G
                  </span>
                  <span>
                    {submitting
                      ? 'Connecting…'
                      : mode === 'signup'
                        ? 'Continue with Google'
                        : 'Sign In with Google'}
                  </span>
                </button>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[var(--subtle-border)]" />
                  <span className="text-xs font-medium text-[var(--ink-muted)]">or with email</span>
                  <div className="h-px flex-1 bg-[var(--subtle-border)]" />
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                  {mode === 'signup' ? (
                    <div>
                      <label
                        htmlFor="auth-name"
                        className="mb-1.5 block text-xs font-semibold text-[var(--ink)]"
                      >
                        First Name
                      </label>
                      <input
                        id="auth-name"
                        type="text"
                        required
                        maxLength={60}
                        autoComplete="given-name"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="e.g. Tunde"
                        className="h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--surface)] px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
                      />
                    </div>
                  ) : null}

                  <div>
                    <label
                      htmlFor="auth-email"
                      className="mb-1.5 block text-xs font-semibold text-[var(--ink)]"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                      <input
                        id="auth-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="you@example.com"
                        className="h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--surface)] pr-3.5 pl-10 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label
                        htmlFor="auth-password"
                        className="block text-xs font-semibold text-[var(--ink)]"
                      >
                        Password
                      </label>
                      {mode === 'signin' ? (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void handleForgotPassword()}
                          className="cursor-pointer text-xs font-medium text-[var(--accent-ink)] hover:underline"
                        >
                          Forgot password?
                        </button>
                      ) : (
                        <span className="text-[11px] text-[var(--ink-muted)]">
                          At least 6 characters
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                        className="h-11 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--surface)] pr-11 pl-10 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--ink)] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {mode === 'signup' && goalsCount === 0 ? (
                    <div className="pt-1">
                      <p className="mb-2 text-xs font-semibold text-[var(--ink)]">
                        Start with a goal (you can change this anytime)
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {STARTER_GOALS.map((g) => {
                          const selected = starterGoalId === g.id;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => setStarterGoalId(g.id)}
                              className={`cursor-pointer rounded-[12px] border px-3 py-2.5 text-center text-xs font-medium transition-colors ${
                                selected
                                  ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                                  : 'border-[var(--subtle-border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--muted-fill)]'
                              }`}
                            >
                              {g.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {resetSent ? (
                    <div className="rounded-[14px] border border-[var(--glass-border)] bg-[var(--muted-fill)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--accent-ink)]">
                      Password reset link sent to {emailInput.trim()}. Check your inbox.
                    </div>
                  ) : null}

                  {localError || cloudErrorMsg ? (
                    <div className="rounded-[14px] border border-[var(--glass-border)] bg-[var(--muted-fill)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--ink)]">
                      {localError || cloudErrorMsg}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-5 text-sm font-semibold text-[var(--active-content)] hover:opacity-90 disabled:opacity-60"
                  >
                    <span>
                      {submitting
                        ? 'Please wait…'
                        : mode === 'signup'
                          ? 'Create Free Account'
                          : 'Sign In'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="mt-4 flex items-center justify-center border-t border-[var(--subtle-border)]/70 pt-4">
                  <button
                    type="button"
                    onClick={onRedirectHome}
                    className="cursor-pointer text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] hover:underline"
                  >
                    Continue using on-device protection without signing in
                  </button>
                </div>
              </div>
            )}
          </LiquidGlassCard>
        </div>

        {/* Left Column: Brand Value & Security Promise */}
        <div className="order-2 flex flex-col gap-4 lg:order-1 lg:col-span-5">
          <LiquidGlassCard className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--active-fill)] text-[var(--active-content)]">
              <Anchor className="h-6 w-6" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
              {cloudUser
                ? 'Your Recovery Account'
                : mode === 'signup'
                  ? 'Protect Every Day Forward'
                  : 'Welcome Back'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
              {cloudUser
                ? 'Your account keeps your clean streak, Naira savings, and personal goals backed up privately.'
                : 'Sign in or create a free account to back up your streak, keep your Naira savings across phones, and lock out betting logins.'}
            </p>

            <div className="mt-5 space-y-3.5">
              <FeatureItem
                icon={<UserCheck className="h-4 w-4 text-[var(--accent-ink)]" />}
                title="Personalized Daily Check-Ins"
                body="Start every morning, afternoon, and evening with your own clean-day counter and savings pace."
              />
              <FeatureItem
                icon={<Target className="h-4 w-4 text-[var(--accent-ink)]" />}
                title="Goal-Driven Commitment"
                body="Pair Naira savings targets with optional lock timers so impulses stay blocked."
              />
              <FeatureItem
                icon={<ShieldCheck className="h-4 w-4 text-[var(--accent-ink)]" />}
                title="Private & Under Your Control"
                body="Your name, email, and personal goals stay private and encrypted — visible only to you."
              />
            </div>
          </LiquidGlassCard>
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({
  icon,
  title,
  body,
}) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--muted-fill)]">
      {icon}
    </div>
    <div>
      <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
      <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{body}</p>
    </div>
  </div>
);
