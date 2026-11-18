import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { LiquidGlassCard, LiquidSectionHeader } from '../components/LiquidGlass';
import { CloudRecoveryProfile, SupportTicketRecord } from '../data/types';
import { formatNaira } from '../utils/currency';

interface AdminDashboardScreenProps {
  adminEmail: string | null;
  isAuthorizedAdmin: boolean;
  profiles: CloudRecoveryProfile[];
  tickets: SupportTicketRecord[];
  cloudError: string | null;
  onReplyTicket: (
    ticketId: string,
    params: { status: SupportTicketRecord['status']; adminReply: string },
  ) => Promise<void>;
  onSignIn: () => void;
  onBackToShield: () => void;
}

type AdminViewTab = 'users' | 'tickets';

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  adminEmail,
  isAuthorizedAdmin,
  profiles,
  tickets,
  cloudError,
  onReplyTicket,
  onSignIn,
  onBackToShield,
}) => {
  const [tab, setTab] = useState<AdminViewTab>('users');
  const [userSearch, setUserSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [ticketFilter, setTicketFilter] = useState<'ALL' | SupportTicketRecord['status']>('ALL');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<SupportTicketRecord['status']>('IN_PROGRESS');
  const [savingReply, setSavingReply] = useState(false);

  const metrics = useMemo(() => {
    const activeShields = profiles.filter((p) => p.isProtectionEnabled).length;
    const lockedUsers = profiles.filter((p) => p.isLocked).length;
    const totalSaved = profiles.reduce((acc, p) => acc + (p.estimatedSavedNgn || 0), 0);
    const openTickets = tickets.filter(
      (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS',
    ).length;
    return {
      totalUsers: profiles.length,
      activeShields,
      lockedUsers,
      totalSaved,
      openTickets,
    };
  }, [profiles, tickets]);

  const filteredProfiles = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return profiles.filter((p) => {
      if (riskFilter === 'LOCKED' && !p.isLocked) return false;
      if (riskFilter === 'PAUSED' && p.isProtectionEnabled) return false;
      if (
        (riskFilter === 'CRITICAL' || riskFilter === 'HIGH') &&
        p.surveyRiskTier !== riskFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        p.email.toLowerCase().includes(q) ||
        p.displayName.toLowerCase().includes(q) ||
        p.preferredName.toLowerCase().includes(q) ||
        p.surveyPrimaryFormat.toLowerCase().includes(q)
      );
    });
  }, [profiles, userSearch, riskFilter]);

  const selectedProfile = useMemo(
    () =>
      filteredProfiles.find((p) => p.ownerId === selectedUserId) ?? filteredProfiles[0] ?? null,
    [filteredProfiles, selectedUserId],
  );

  const filteredTickets = useMemo(() => {
    if (ticketFilter === 'ALL') return tickets;
    return tickets.filter((t) => t.status === ticketFilter);
  }, [tickets, ticketFilter]);

  const selectedTicket = useMemo(
    () =>
      filteredTickets.find((t) => t.ticketId === selectedTicketId) ?? filteredTickets[0] ?? null,
    [filteredTickets, selectedTicketId],
  );

  const handleSelectTicket = (tkt: SupportTicketRecord) => {
    setSelectedTicketId(tkt.ticketId);
    setReplyText(tkt.adminReply || '');
    setReplyStatus(tkt.status === 'OPEN' ? 'IN_PROGRESS' : tkt.status);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setSavingReply(true);
    try {
      await onReplyTicket(selectedTicket.ticketId, {
        status: replyStatus,
        adminReply: replyText,
      });
    } finally {
      setSavingReply(false);
    }
  };

  if (!isAuthorizedAdmin) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-12">
        <LiquidGlassCard className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--soft-accent-bg)] text-[var(--accent-ink)]">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold text-[var(--ink)]">
            Administrator Access Required
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink-muted)]">
            Sign in with the verified GambleAware administrator Google account to review synced
            user recovery records and respond to confidential support tickets.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {!adminEmail ? (
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-[var(--active-fill)] px-5 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
              >
                Sign In with Google
              </button>
            ) : null}
            <button
              type="button"
              onClick={onBackToShield}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-[var(--subtle-border)] px-5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
            >
              Return to Shield
            </button>
          </div>
        </LiquidGlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pt-4 pb-28 md:px-6 md:pt-6 md:pb-14">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 px-1 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider text-[var(--accent-ink)] uppercase">
            ADMIN CONSOLE · {adminEmail}
          </p>
          <h1 className="mt-0.5 font-display text-2xl font-bold tracking-tight text-[var(--ink)]">
            Recovery Operations &amp; Support Queue
          </h1>
        </div>

        <div
          role="tablist"
          aria-label="Admin views"
          className="inline-flex rounded-full border border-[var(--subtle-border)] bg-[var(--control-bg)] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'users'}
            onClick={() => setTab('users')}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              tab === 'users'
                ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Users ({profiles.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'tickets'}
            onClick={() => setTab('tickets')}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              tab === 'tickets'
                ? 'bg-[var(--active-fill)] text-[var(--active-content)]'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Tickets ({metrics.openTickets} open)</span>
          </button>
        </div>
      </div>

      {cloudError ? (
        <div className="flex items-start gap-2 rounded-[16px] border border-[var(--glass-border)] bg-[var(--soft-accent-bg)] p-3.5 text-xs text-[var(--ink)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
          <p>{cloudError}</p>
        </div>
      ) : null}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <KpiCard label="Synced Users" value={String(metrics.totalUsers)} />
        <KpiCard label="Active Shields" value={String(metrics.activeShields)} />
        <KpiCard label="Time-Locked" value={String(metrics.lockedUsers)} />
        <KpiCard label="Combined Saved" value={formatNaira(metrics.totalSaved)} accent />
        <KpiCard
          label="Open Tickets"
          value={String(metrics.openTickets)}
          accent={metrics.openTickets > 0}
        />
      </div>

      {tab === 'users' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Users List */}
          <LiquidGlassCard className="p-4 sm:p-5 lg:col-span-7">
            <LiquidSectionHeader
              title="User Recovery Directory"
              subtitle="Click any synced user to inspect detailed protection & survey status"
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user name, email, or format"
                  className="h-10 w-full rounded-[12px] border border-[var(--subtle-border)] bg-[var(--control-bg)] pr-3 pl-9 text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {(['ALL', 'CRITICAL', 'HIGH', 'LOCKED', 'PAUSED'] as const).map((flt) => (
                  <button
                    key={flt}
                    type="button"
                    onClick={() => setRiskFilter(flt)}
                    className={`h-10 cursor-pointer rounded-[12px] border px-2.5 font-mono text-[11px] font-semibold ${
                      riskFilter === flt
                        ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                        : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink-muted)]'
                    }`}
                  >
                    {flt}
                  </button>
                ))}
              </div>
            </div>

            {filteredProfiles.length === 0 ? (
              <p className="mt-4 text-xs text-[var(--ink-muted)]">
                No matching user profiles synced yet. Users appear automatically once they sign in
                with Google.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-[var(--subtle-border)]/60">
                {filteredProfiles.map((profile) => {
                  const selected = selectedProfile?.ownerId === profile.ownerId;
                  return (
                    <button
                      key={profile.ownerId}
                      type="button"
                      onClick={() => setSelectedUserId(profile.ownerId)}
                      className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                        selected ? 'bg-[var(--muted-fill)]' : 'hover:bg-[var(--muted-fill)]/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-[var(--ink)]">
                          {profile.preferredName || profile.displayName || profile.email}
                        </p>
                        <p className="truncate font-mono text-[11px] text-[var(--ink-muted)]">
                          {profile.email}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-mono text-xs font-bold text-[var(--ink)] tabular-nums">
                          {profile.cleanDays}d · {formatNaira(profile.estimatedSavedNgn)}
                        </p>
                        <p className="font-mono text-[10px] font-semibold text-[var(--accent-ink)]">
                          {profile.surveyRiskTier} ·{' '}
                          {profile.isLocked
                            ? 'LOCKED'
                            : profile.isProtectionEnabled
                              ? 'SHIELD ON'
                              : 'PAUSED'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </LiquidGlassCard>

          {/* Selected User Telemetry Detail */}
          <LiquidGlassCard className="p-4 sm:p-5 lg:col-span-5">
            {selectedProfile ? (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-bold text-[var(--accent-ink)] uppercase">
                      RECOVERY TELEMETRY
                    </p>
                    <h2 className="mt-0.5 truncate font-display text-lg font-bold text-[var(--ink)]">
                      {selectedProfile.preferredName || selectedProfile.displayName}
                    </h2>
                    <p className="truncate font-mono text-xs text-[var(--ink-muted)]">
                      {selectedProfile.email}
                    </p>
                  </div>
                  {selectedProfile.isProtectionEnabled ? (
                    <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--accent-ink)]" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0 text-[var(--ink-muted)]" />
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <DetailTile label="Clean Streak" value={`${selectedProfile.cleanDays} Days`} />
                  <DetailTile
                    label="Est. Naira Saved"
                    value={formatNaira(selectedProfile.estimatedSavedNgn)}
                  />
                  <DetailTile
                    label="Daily Spend Base"
                    value={formatNaira(selectedProfile.dailyBetSpendEstimate)}
                  />
                  <DetailTile
                    label="Blocked Attempts"
                    value={String(selectedProfile.totalBlockedCount)}
                  />
                  <DetailTile
                    label="Urges Resisted"
                    value={String(selectedProfile.totalUrgeResistedCount)}
                  />
                  <DetailTile label="Logged Relapses" value={String(selectedProfile.relapseCount)} />
                  <DetailTile label="Survey Risk Tier" value={selectedProfile.surveyRiskTier} />
                  <DetailTile
                    label="Lock Status"
                    value={selectedProfile.isLocked ? 'Commitment Locked' : 'Unlocked'}
                  />
                </div>

                <div className="mt-3 rounded-[14px] border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3 text-xs">
                  <p className="text-[var(--ink-muted)]">
                    Primary Format:{' '}
                    <span className="font-semibold text-[var(--ink)]">
                      {selectedProfile.surveyPrimaryFormat || 'Not assessed yet'}
                    </span>
                  </p>
                  <p className="mt-1 text-[var(--ink-muted)]">
                    Last Synced:{' '}
                    <span className="font-mono text-[var(--ink)]">
                      {selectedProfile.lastActiveMs
                        ? new Date(selectedProfile.lastActiveMs).toLocaleString()
                        : 'N/A'}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="py-10 text-center text-xs text-[var(--ink-muted)]">
                Select a user row to view full recovery metrics.
              </p>
            )}
          </LiquidGlassCard>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Ticket Queue */}
          <LiquidGlassCard className="p-4 sm:p-5 lg:col-span-6">
            <LiquidSectionHeader
              title="Confidential Support Queue"
              subtitle="Review open cases and send direct assistance"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setTicketFilter(status)}
                  className={`cursor-pointer rounded-full border px-3 py-1 font-mono text-[11px] font-semibold ${
                    ticketFilter === status
                      ? 'border-[var(--active-fill)] bg-[var(--active-fill)] text-[var(--active-content)]'
                      : 'border-[var(--subtle-border)] bg-[var(--control-bg)] text-[var(--ink-muted)]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {filteredTickets.length === 0 ? (
              <p className="mt-4 text-xs text-[var(--ink-muted)]">No tickets match this filter.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {filteredTickets.map((tkt) => {
                  const selected = selectedTicket?.ticketId === tkt.ticketId;
                  return (
                    <button
                      key={tkt.ticketId}
                      type="button"
                      onClick={() => handleSelectTicket(tkt)}
                      className={`w-full cursor-pointer rounded-[14px] border p-3 text-left transition-colors ${
                        selected
                          ? 'border-[var(--active-fill)] bg-[var(--muted-fill)]'
                          : 'border-[var(--subtle-border)] bg-[var(--control-bg)] hover:bg-[var(--muted-fill)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-bold text-[var(--ink)]">{tkt.subject}</p>
                        <span className="shrink-0 font-mono text-[10px] font-bold text-[var(--accent-ink)]">
                          {tkt.urgency} · {tkt.status}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--ink-muted)]">
                        {tkt.userName} ({tkt.userEmail}) · {tkt.category}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </LiquidGlassCard>

          {/* Reply Console */}
          <LiquidGlassCard className="p-4 sm:p-5 lg:col-span-6">
            {selectedTicket ? (
              <form onSubmit={(e) => void handleSubmitReply(e)} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[10px] font-bold text-[var(--accent-ink)]">
                      {selectedTicket.category} · {selectedTicket.urgency}
                    </p>
                    <h2 className="mt-0.5 font-display text-base font-bold text-[var(--ink)]">
                      {selectedTicket.subject}
                    </h2>
                    <p className="font-mono text-[11px] text-[var(--ink-muted)]">
                      From {selectedTicket.userName} ({selectedTicket.userEmail})
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                </div>

                <div className="rounded-[14px] border border-[var(--subtle-border)] bg-[var(--control-bg)] p-3 text-xs leading-relaxed text-[var(--ink)]">
                  {selectedTicket.message}
                </div>

                <div>
                  <label
                    htmlFor="admin-ticket-status"
                    className="mb-1 block text-xs font-semibold text-[var(--ink)]"
                  >
                    Ticket Status
                  </label>
                  <select
                    id="admin-ticket-status"
                    value={replyStatus}
                    onChange={(e) =>
                      setReplyStatus(e.target.value as SupportTicketRecord['status'])
                    }
                    className="h-10 w-full rounded-[12px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 text-xs text-[var(--ink)] focus:border-[var(--active-fill)] focus:outline-none"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="admin-ticket-reply"
                    className="mb-1 block text-xs font-semibold text-[var(--ink)]"
                  >
                    Official Response
                  </label>
                  <textarea
                    id="admin-ticket-reply"
                    rows={5}
                    maxLength={2000}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write clear, empathetic guidance or share domain/bank-block verification steps..."
                    className="w-full rounded-[14px] border border-[var(--subtle-border)] bg-[var(--canvas)] p-3 text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingReply}
                  className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{savingReply ? 'Saving...' : 'Save Reply & Status'}</span>
                </button>
              </form>
            ) : (
              <p className="py-12 text-center text-xs text-[var(--ink-muted)]">
                Select a support ticket from the queue to inspect and reply.
              </p>
            )}
          </LiquidGlassCard>
        </div>
      )}
    </div>
  );
};

const KpiCard: React.FC<{ label: string; value: string; accent?: boolean }> = ({
  label,
  value,
  accent = false,
}) => (
  <LiquidGlassCard className="rounded-[18px] p-3.5">
    <p className="truncate text-[11px] font-medium text-[var(--ink-muted)]">{label}</p>
    <p
      className={`mt-1 truncate font-mono text-lg font-bold tabular-nums ${
        accent ? 'text-[var(--accent-ink)]' : 'text-[var(--ink)]'
      }`}
    >
      {value}
    </p>
  </LiquidGlassCard>
);

const DetailTile: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-[12px] border border-[var(--subtle-border)] bg-[var(--control-bg)] px-3 py-2">
    <p className="text-[10px] text-[var(--ink-muted)]">{label}</p>
    <p className="mt-0.5 truncate font-mono text-xs font-bold text-[var(--ink)] tabular-nums">
      {value}
    </p>
  </div>
);
