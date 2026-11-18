import React, { useState } from 'react';
import {
  CheckCircle2,
  CircleAlert,
  Handshake,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { ShieldLeakAudit } from '../utils/leakDiagnostics';
import { computeExpectedBuddyResponse } from '../utils/tiltRadar';
import { LiquidGlassCard, LiquidSectionHeader } from './LiquidGlass';

interface ShieldDiagnosticsCardProps {
  audit: ShieldLeakAudit;
  buddyPartnerName: string;
  buddyChallengeCode: string;
  isLockedNow: boolean;
  onConfigureBuddyCoLock: (partnerName: string) => string;
  onRefreshBuddyChallenge: () => string;
  onClearBuddyCoLock: () => void;
  onVerifyBuddyUnlock: (partnerSalt: string, candidateResponse: string) => boolean;
}

export const ShieldDiagnosticsCard: React.FC<ShieldDiagnosticsCardProps> = ({
  audit,
  buddyPartnerName,
  buddyChallengeCode,
  isLockedNow,
  onConfigureBuddyCoLock,
  onRefreshBuddyChallenge,
  onClearBuddyCoLock,
  onVerifyBuddyUnlock,
}) => {
  const [partnerDraft, setPartnerDraft] = useState(buddyPartnerName || '');
  const [buddySalt, setBuddySalt] = useState('');
  const [candidateToken, setCandidateToken] = useState('');
  const [unlockFeedback, setUnlockFeedback] = useState<string | null>(null);
  const [showBuddyHelper, setShowBuddyHelper] = useState(false);
  const [helperChallenge, setHelperChallenge] = useState(buddyChallengeCode || '');
  const [helperSalt, setHelperSalt] = useState('');

  const handleArmBuddy = (e: React.FormEvent) => {
    e.preventDefault();
    onConfigureBuddyCoLock(partnerDraft);
    setUnlockFeedback(null);
  };

  const handleVerifyUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onVerifyBuddyUnlock(buddySalt, candidateToken);
    if (ok) {
      setUnlockFeedback('Buddy approval verified — Commitment & Uninstall Lock unlocked.');
      setCandidateToken('');
      setBuddySalt('');
    } else {
      setUnlockFeedback('Invalid Buddy Token or Secret Salt. Ask your partner to verify.');
    }
  };

  const helperCode =
    helperChallenge.trim().length >= 3
      ? computeExpectedBuddyResponse(helperChallenge, helperSalt)
      : '------';

  return (
    <div className="flex flex-col gap-3.5">
      {/* 5-Layer Leak-Check Diagnostics */}
      <LiquidGlassCard className="p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2.5">
          <LiquidSectionHeader
            title="5-Layer Shield Leak Check"
            subtitle={`${audit.healthyCount} of ${audit.totalCount} anti-bypass layers armed`}
          />
          <div className="shrink-0 text-right">
            <p className="font-mono text-xl font-bold tabular-nums text-[var(--accent-ink)]">
              {audit.score}%
            </p>
            <p className="font-mono text-[10px] font-semibold tracking-wider text-[var(--ink-muted)] uppercase">
              {audit.gradeLabel}
            </p>
          </div>
        </div>

        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)]">
          <div
            className="h-full rounded-full bg-[var(--active-fill)] transition-all duration-300"
            style={{ width: `${Math.max(6, audit.score)}%` }}
          />
        </div>

        <div className="mt-3 divide-y divide-[var(--subtle-border)]/50">
          {audit.layers.map((layer) => (
            <div key={layer.id} className="flex items-start gap-2.5 py-2 first:pt-0 last:pb-0">
              {layer.isHealthy ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
              ) : (
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-muted)]" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-[var(--ink)]">{layer.label}</p>
                  <span className="font-mono text-[10px] font-bold text-[var(--ink-muted)] uppercase">
                    {layer.isHealthy ? 'ARMED' : `+${layer.weight}%`}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-[var(--ink-muted)]">
                  {layer.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </LiquidGlassCard>

      {/* Trusted Buddy Co-Lock (Zero-Server Offline Challenge/Response) */}
      <LiquidGlassCard className="p-3.5 sm:p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--soft-accent-bg)] text-[var(--accent-ink)]">
            <Handshake className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[15px] font-semibold text-[var(--ink)]">
              Trusted Buddy Co-Lock
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Require an offline 6-digit approval code from a friend or sponsor to unlock early
            </p>
          </div>
        </div>

        {buddyChallengeCode ? (
          <div className="mt-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-[var(--glass-border)] bg-[var(--muted-fill)] p-3.5">
              <div>
                <p className="text-[11px] font-semibold text-[var(--ink-muted)]">
                  Co-Lock Partner · <span className="text-[var(--ink)]">{buddyPartnerName}</span>
                </p>
                <p className="mt-0.5 font-mono text-lg font-bold tracking-wider text-[var(--accent-ink)] tabular-nums">
                  Challenge: {buddyChallengeCode}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onRefreshBuddyChallenge()}
                  aria-label="Rotate challenge code"
                  className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--control-bg)]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>New Key</span>
                </button>
                {!isLockedNow ? (
                  <button
                    type="button"
                    onClick={onClearBuddyCoLock}
                    aria-label="Clear buddy co-lock"
                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--subtle-border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            <form onSubmit={handleVerifyUnlock} className="space-y-2">
              <p className="text-xs font-medium text-[var(--ink-muted)]">
                Need an emergency early unlock? Ask{' '}
                <span className="font-semibold text-[var(--ink)]">{buddyPartnerName}</span> for
                their Secret Salt + 6-digit Approval Token:
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={buddySalt}
                  onChange={(e) => setBuddySalt(e.target.value)}
                  placeholder="Partner secret word"
                  className="h-10 rounded-[12px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={candidateToken}
                  onChange={(e) => setCandidateToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit token"
                  className="h-10 rounded-[12px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 font-mono text-xs tracking-widest text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={candidateToken.length !== 6}
                className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] text-xs font-semibold text-[var(--active-content)] hover:opacity-90 disabled:opacity-50"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Verify Buddy Unlock Token</span>
              </button>
              {unlockFeedback ? (
                <p className="text-xs font-medium text-[var(--accent-ink)]">{unlockFeedback}</p>
              ) : null}
            </form>
          </div>
        ) : (
          <form onSubmit={handleArmBuddy} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              maxLength={40}
              value={partnerDraft}
              onChange={(e) => setPartnerDraft(e.target.value)}
              placeholder="Trusted friend, spouse, or sponsor name"
              className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
            />
            <button
              type="submit"
              data-testid="arm-buddy-colock-button"
              className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
            >
              <LockKeyhole className="h-3.5 w-3.5" />
              <span>Arm Co-Lock</span>
            </button>
          </form>
        )}

        {/* Offline Buddy Keygen Helper (zero servers needed) */}
        <div className="mt-3 border-t border-[var(--subtle-border)]/60 pt-2.5">
          <button
            type="button"
            onClick={() => {
              setHelperChallenge(buddyChallengeCode || '');
              setShowBuddyHelper((v) => !v);
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
            <span>
              {showBuddyHelper
                ? 'Hide Partner Key Generator'
                : 'Partner Mode: Generate 6-digit Approval Code Offline'}
            </span>
          </button>

          {showBuddyHelper ? (
            <div className="mt-2.5 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-3 text-xs">
              <p className="text-[11px] text-[var(--ink-muted)]">
                For your accountability buddy on their own phone: enter the Challenge Key &amp; agreed
                Secret Word to derive the matching 6-digit approval token completely offline.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={helperChallenge}
                  onChange={(e) => setHelperChallenge(e.target.value)}
                  placeholder="Challenge (e.g. 521-840)"
                  className="h-9 rounded-[10px] border border-[var(--subtle-border)] bg-[var(--surface)] px-2.5 font-mono text-xs text-[var(--ink)] focus:outline-none"
                />
                <input
                  type="text"
                  value={helperSalt}
                  onChange={(e) => setHelperSalt(e.target.value)}
                  placeholder="Secret word"
                  className="h-9 rounded-[10px] border border-[var(--subtle-border)] bg-[var(--surface)] px-2.5 text-xs text-[var(--ink)] focus:outline-none"
                />
              </div>
              <p className="mt-2 font-mono text-xs font-bold text-[var(--ink)]">
                Approval Token:{' '}
                <span className="text-[var(--accent-ink)] tabular-nums">{helperCode}</span>
              </p>
            </div>
          ) : null}
        </div>
      </LiquidGlassCard>
    </div>
  );
};
