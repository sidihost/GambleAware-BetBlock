import React, { useEffect, useState } from 'react';
import {
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
  User,
  UserCheck,
} from 'lucide-react';
import { CloudAccountInfo } from '../data/types';
import { BrandAnchorMark } from './AppHeader';
import { GoogleLogoIcon } from './GoogleLogoIcon';

interface AuthScreenProps {
  initialMode?: 'signin' | 'signup';
  cloudUser: CloudAccountInfo | null;
  preferredName: string;
  cloudErrorMsg: string | null;
  pendingGoalNotice?: boolean;
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
  onSavePreferredName: (name: string) => void;
  onResendVerification: () => void;
  onSignOut: () => Promise<void>;
  onRedirectHome: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'signin',
  cloudUser,
  preferredName,
  cloudErrorMsg,
  pendingGoalNotice = false,
  onSignInGoogle,
  onSignUpEmail,
  onSignInEmail,
  onSendPasswordReset,
  onRefreshVerification,
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
      if (!res.ok && res.error) {
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-5 pb-28 sm:px-6 md:pt-9 md:pb-16">
      {/* Subtle Top Utility Strip */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onRedirectHome}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--muted-fill)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Guard</span>
        </button>
        <span className="text-[11px] font-medium tracking-wider text-[var(--ink-muted)] uppercase">
          Private Recovery Account
        </span>
      </div>

      {/* Balanced 12-Column Editorial Split — Form First on Mobile, Side-by-Side on Desktop */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12 lg:gap-7">
        {/* Form / Account Card */}
        <section
          aria-label="Account authentication"
          className="order-1 flex flex-col lg:order-2 lg:col-span-6"
        >
          <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border border-[var(--subtle-border)] bg-[var(--surface)] p-6 sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 right-0 left-0 h-[3px]"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, var(--active-fill) 50%, transparent 100%)',
              }}
            />

            {cloudUser ? (
              <div className="flex h-full flex-col justify-between gap-6">
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-4">
                    {cloudUser.photoUrl ? (
                      <img
                        src={cloudUser.photoUrl}
                        alt={cloudUser.displayName}
                        className="h-14 w-14 shrink-0 rounded-full border border-[var(--subtle-border)] object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--active-fill)] font-display text-xl font-bold text-[var(--active-content)]">
                        {(preferredName || cloudUser.displayName || 'G').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-xl font-bold text-[var(--ink)]">
                        {cloudUser.displayName}
                      </p>
                      <p className="truncate text-xs text-[var(--ink-muted)]">{cloudUser.email}</p>
                      <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-ink)]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>
                          {cloudUser.emailVerified ? 'Verified Account' : 'Pending Email Verification'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!cloudUser.emailVerified ? (
                    <div className="rounded-[20px] border-l-2 border-[var(--active-fill)] bg-[var(--muted-fill)] p-4">
                      <p className="font-display text-sm font-bold text-[var(--ink)]">
                        Verify your email to unlock cloud backup
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                        We sent a confirmation link to{' '}
                        <strong className="text-[var(--ink)]">{cloudUser.email}</strong>. Tap the
                        link in your inbox, then continue below.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
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
                          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${checkingVerify ? 'animate-spin' : ''}`}
                          />
                          <span>
                            {checkingVerify ? 'Checking…' : "I've Verified — Continue"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={onResendVerification}
                          className="h-10 cursor-pointer rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--muted-fill)]"
                        >
                          Resend Email
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="border-t border-[var(--subtle-border)] pt-5">
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
                        placeholder="First name for daily greetings"
                        className="h-11 min-w-0 flex-1 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] px-3.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-ink)] focus:ring-2 focus:ring-[var(--accent-ink)]/15 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onSavePreferredName(nameInput);
                          setInfoMsg('Greeting name updated');
                        }}
                        className="h-11 shrink-0 cursor-pointer rounded-full bg-[var(--active-fill)] px-5 text-xs font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90"
                      >
                        Save
                      </button>
                    </div>
                    {infoMsg ? (
                      <p className="mt-2 text-xs font-medium text-[var(--accent-ink)]">{infoMsg}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 border-t border-[var(--subtle-border)] pt-5 sm:flex-row">
                  <button
                    type="button"
                    onClick={onRedirectHome}
                    className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-5 text-sm font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void onSignOut()}
                    className="h-12 cursor-pointer rounded-full border border-[var(--subtle-border)] px-5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--muted-fill)]"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-between gap-6">
                <div>
                  {/* Pending Goal Auth Redirect Callout */}
                  {pendingGoalNotice ? (
                    <div className="mb-5 flex items-start gap-3 rounded-[16px] border border-[var(--glass-border)] border-l-[3px] border-l-[var(--active-fill)] bg-[var(--muted-fill)] px-4 py-3">
                      <Target className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                      <p className="text-xs leading-relaxed text-[var(--ink)]">
                        <strong className="font-semibold">Account required for goals.</strong> Sign
                        in or create a free account below and we will open your personal goal builder
                        right away.
                      </p>
                    </div>
                  ) : null}

                  {/* Segmented Mode Switcher */}
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
                      className={`h-10 cursor-pointer rounded-full text-sm font-semibold transition-all ${
                        mode === 'signin'
                          ? 'bg-[var(--active-fill)] text-[var(--active-content)] shadow-xs'
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
                      className={`h-10 cursor-pointer rounded-full text-sm font-semibold transition-all ${
                        mode === 'signup'
                          ? 'bg-[var(--active-fill)] text-[var(--active-content)] shadow-xs'
                          : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      Create Account
                    </button>
                  </div>

                  {/* Official Multi-Color Google Button */}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleGoogleClick()}
                    className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--ink)] shadow-2xs transition-all hover:border-[var(--ink-muted)]/35 hover:bg-[var(--muted-fill)] disabled:opacity-60"
                  >
                    <GoogleLogoIcon className="h-5 w-5 shrink-0" />
                    <span>
                      {submitting
                        ? 'Connecting…'
                        : mode === 'signup'
                          ? 'Continue with Google'
                          : 'Sign in with Google'}
                    </span>
                  </button>

                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[var(--subtle-border)]" />
                    <span className="text-[11px] font-medium tracking-wide text-[var(--ink-muted)] uppercase">
                      or use email
                    </span>
                    <div className="h-px flex-1 bg-[var(--subtle-border)]" />
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    {mode === 'signup' ? (
                      <div>
                        <label
                          htmlFor="auth-name"
                          className="mb-1.5 block text-xs font-semibold text-[var(--ink)]"
                        >
                          First Name
                        </label>
                        <div className="relative">
                          <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                          <input
                            id="auth-name"
                            type="text"
                            required
                            maxLength={60}
                            autoComplete="given-name"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            placeholder="Your first name"
                            className="h-12 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] pr-3.5 pl-10 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-ink)] focus:ring-2 focus:ring-[var(--accent-ink)]/15 focus:outline-none"
                          />
                        </div>
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
                          placeholder="Enter your email address"
                          className="h-12 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] pr-3.5 pl-10 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-ink)] focus:ring-2 focus:ring-[var(--accent-ink)]/15 focus:outline-none"
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
                            className="cursor-pointer text-xs font-semibold text-[var(--accent-ink)] hover:underline"
                          >
                            Forgot password?
                          </button>
                        ) : (
                          <span className="text-[11px] text-[var(--ink-muted)]">
                            Minimum 6 characters
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
                          className="h-12 w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] pr-12 pl-10 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-ink)] focus:ring-2 focus:ring-[var(--accent-ink)]/15 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--muted-fill)] hover:text-[var(--ink)]"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {resetSent ? (
                      <div className="rounded-[14px] border border-[var(--glass-border)] border-l-[3px] border-l-[var(--active-fill)] bg-[var(--muted-fill)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--ink)]">
                        Password reset instructions have been sent to{' '}
                        <strong>{emailInput.trim()}</strong>.
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
                      className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-5 text-sm font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90 disabled:opacity-60"
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
                </div>

                <div className="border-t border-[var(--subtle-border)] pt-5 text-center">
                  <button
                    type="button"
                    onClick={onRedirectHome}
                    className="cursor-pointer text-xs font-medium text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)] hover:underline"
                  >
                    Continue on-device without signing in
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Left Editorial Promise Panel */}
        <aside className="order-2 flex flex-col justify-between rounded-[28px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-6 sm:p-8 lg:order-1 lg:col-span-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <BrandAnchorMark className="h-11 w-11 shrink-0" />
              </div>
              <div>
                <p className="font-display text-base font-bold tracking-tight text-[var(--ink)]">
                  GambleAware
                </p>
                <p className="text-[11px] font-medium text-[var(--accent-ink)]">
                  Blocker &amp; Recovery Guard
                </p>
              </div>
            </div>

            <h1 className="mt-7 font-display text-3xl leading-[1.12] font-bold tracking-tight text-balance text-[var(--ink)] sm:text-[34px]">
              {cloudUser
                ? 'Your recovery stays locked in everywhere.'
                : mode === 'signup'
                  ? 'A calmer boundary around every payday and matchday.'
                  : 'Welcome back to your betting-free space.'}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
              {cloudUser
                ? 'Your streak, Naira savings, blocked sites, and personal recovery goals stay synced privately to your account.'
                : 'Sign in or create a free account to build personal Naira goals, keep your clean-day streak across devices, and stop betting logins automatically.'}
            </p>

            {/* Clean Hairline Pillars — Zero Nested Boxes */}
            <div className="mt-7 divide-y divide-[var(--subtle-border)]">
              <PromiseRow
                icon={<UserCheck className="h-4 w-4 text-[var(--accent-ink)]" />}
                title="Personalized Daily Greetings"
                body="Warm morning, afternoon, and evening check-ins built around your own recovery pace."
              />
              <PromiseRow
                icon={<Target className="h-4 w-4 text-[var(--accent-ink)]" />}
                title="Personal Naira &amp; Streak Goals"
                body="Create custom savings targets with optional lock timers that keep you focused when urges hit."
              />
              <PromiseRow
                icon={<ShieldCheck className="h-4 w-4 text-[var(--accent-ink)]" />}
                title="Private, Encrypted &amp; Under Your Control"
                body="Protected so your personal goals, email, and blocker history remain strictly yours."
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--subtle-border)] pt-5 text-[11px] font-medium text-[var(--ink-muted)]">
            <span>Free Forever · ₦0 Sync</span>
            <span>Imoogle Technology</span>
          </div>
        </aside>
      </div>
    </div>
  );
};

const PromiseRow: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({
  icon,
  title,
  body,
}) => (
  <div className="flex items-start gap-3.5 py-4 first:pt-0 last:pb-0">
    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] border border-[var(--subtle-border)] bg-[var(--surface)]">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-[var(--ink-muted)]">{body}</p>
    </div>
  </div>
);
