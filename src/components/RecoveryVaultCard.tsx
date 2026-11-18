import React, { useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  HardDrive,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { encodeRecoveryKey, serializeBackupFile } from '../data/durableVault';
import { PersistedStore } from '../data/storage';
import { DurableStorageStatus } from '../data/types';
import { LiquidGlassCard, LiquidSectionHeader } from './LiquidGlass';

interface RecoveryVaultCardProps {
  store: PersistedStore;
  durableStatus: DurableStorageStatus;
  onForceSaveVault: () => void;
  onRestoreVault: (rawKeyOrJson: string) => { ok: boolean; error?: string };
}

export const RecoveryVaultCard: React.FC<RecoveryVaultCardProps> = ({
  store,
  durableStatus,
  onForceSaveVault,
  onRestoreVault,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [showRestoreBox, setShowRestoreBox] = useState(false);
  const [restoreInput, setRestoreInput] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const recoveryKey = encodeRecoveryKey(store);

  const activeLayersCount =
    Number(durableStatus.localSaved) +
    Number(durableStatus.indexedDbSaved) +
    Number(durableStatus.cacheVaultSaved);

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(recoveryKey);
      setCopiedKey(true);
      window.setTimeout(() => setCopiedKey(false), 2200);
    } catch {
      // Fallback: open restore box with key prefilled if clipboard blocked
      setRestoreInput(recoveryKey);
      setShowRestoreBox(true);
    }
  };

  const handleDownloadFile = () => {
    const content = serializeBackupFile(store);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gambleaware-backup-${new Date().toISOString().slice(0, 10)}.gambleaware.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleRestoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onRestoreVault(restoreInput);
    if (res.ok) {
      setRestoreInput('');
      setRestoreError(null);
      setShowRestoreBox(false);
    } else {
      setRestoreError(res.error ?? 'Could not restore from that key or file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const res = onRestoreVault(text);
      if (res.ok) {
        setRestoreError(null);
        setShowRestoreBox(false);
      } else {
        setRestoreError(res.error ?? 'Selected file is not a valid GambleAware backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <LiquidGlassCard className="p-3.5 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--active-fill)] text-[var(--active-content)]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <LiquidSectionHeader
            title="Local Backup"
            subtitle="Saved in three browser storage areas without needing an account"
          />
        </div>
        <button
          type="button"
          onClick={onForceSaveVault}
          title="Refresh local backup"
          aria-label="Refresh local backup"
          className="inline-flex h-7 w-fit shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-2.5 text-[10px] font-semibold text-[var(--ink)] hover:opacity-90"
        >
          <HardDrive className="h-3 w-3 text-[var(--accent-ink)]" />
          <span>{activeLayersCount}/3 saved</span>
        </button>
      </div>

      {/* Storage Summary */}
      <div className="mt-2.5 rounded-xl border border-[var(--subtle-border)] bg-[var(--muted-fill)] p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-[var(--ink)]">Protected across cache clears</span>
          <span className="font-mono text-[10px] font-semibold text-[var(--accent-ink)]">
            Local · IndexedDB · Cache
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-[var(--ink-muted)]">
          Your streak, goals, and blocklist stay intact if browser cache is cleared. Copy your
          Recovery Key or save a backup file to move data to a new phone.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void handleCopyKey()}
          className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-3 text-xs font-semibold text-[var(--active-content)] hover:opacity-90"
        >
          {copiedKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copiedKey ? 'Key Copied' : 'Copy Recovery Key'}</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadFile}
          className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--muted-fill)]"
        >
          <Download className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
          <span>Export Backup File</span>
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            setShowRestoreBox((v) => !v);
            setRestoreError(null);
          }}
          className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[var(--accent-ink)] hover:underline"
        >
          <RotateCcw className="h-3 w-3" />
          <span>{showRestoreBox ? 'Hide Restore' : 'Restore from Key or File'}</span>
        </button>
        <span className="font-mono text-[10px] text-[var(--ink-muted)]">
          {durableStatus.persistentGranted ? 'Persistent storage' : '3 local copies'}
        </span>
      </div>

      {showRestoreBox ? (
        <form
          onSubmit={handleRestoreSubmit}
          className="mt-3 space-y-2.5 rounded-[16px] border border-[var(--subtle-border)] bg-[var(--surface)] p-3"
        >
          <label
            htmlFor="recovery-vault-input"
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]"
          >
            <KeyRound className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
            <span>Paste GA1 Recovery Key</span>
          </label>
          <textarea
            id="recovery-vault-input"
            rows={2}
            value={restoreInput}
            onChange={(e) => setRestoreInput(e.target.value)}
            placeholder="GA1.eyJzY2hlbWF..."
            className="w-full rounded-[12px] border border-[var(--subtle-border)] bg-[var(--canvas)] p-2.5 font-mono text-xs text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--active-fill)] focus:outline-none"
          />
          {restoreError ? (
            <p className="text-xs font-medium text-[var(--accent-ink)]">{restoreError}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={!restoreInput.trim()}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--active-fill)] px-4 text-xs font-semibold text-[var(--active-content)] hover:opacity-90 disabled:opacity-50"
            >
              <span>Restore Now</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.gambleaware,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--subtle-border)] bg-[var(--muted-fill)] px-3.5 text-xs font-semibold text-[var(--ink)] hover:opacity-90"
            >
              <Upload className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
              <span>Upload Backup File</span>
            </button>
          </div>
        </form>
      ) : null}
    </LiquidGlassCard>
  );
};
