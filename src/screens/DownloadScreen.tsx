import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Cpu,
  Download,
  KeyRound,
  Lock,
  Shield,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { AndroidAppShowcase } from '../components/AndroidAppShowcase';
import { CoveredBrandsExplorer } from '../components/CoveredBrandsExplorer';
import { DeploymentHub } from '../components/DeploymentHub';
import { LiveFilterSandbox } from '../components/LiveFilterSandbox';
import { SavingsImpactSection } from '../components/SavingsImpactSection';
import { getRegistryMetrics } from '../utils/interactiveDemo';
import {
  ANDROID_APK_DOWNLOAD_URL,
  APK_DOWNLOAD_FILENAME,
  detectClientPlatform,
} from '../utils/platformCompatibility';

const ARCHITECTURE_LAYERS = [
  {
    num: '01',
    span: 'lg:col-span-7',
    icon: Shield,
    title: 'Zero-VPN All-Browser Shield',
    summary:
      'Operates through Android Accessibility without hijacking your VPN slot. Works simultaneously across Chrome, Brave, Opera, Firefox, Samsung Internet, and in-app webviews while ProtonVPN, WARP, and banking apps run uninterrupted.',
    detail: 'Chrome · Brave · Opera · Firefox · Edge · In-App Browsers',
  },
  {
    num: '02',
    span: 'lg:col-span-5',
    icon: Terminal,
    title: 'Instant Keystroke & Cashier Guard',
    summary:
      'Intercepts known betting stems like "sporty" or "bet9ja", homoglyph lookalikes, booking codes, and cashier deposit redirects before the page even renders.',
    detail: 'Sub-15ms local match · Redirect unwrapper',
  },
  {
    num: '03',
    span: 'lg:col-span-5',
    icon: Lock,
    title: 'Tamper-Proof Commitment Lock',
    summary:
      'Lock protection from 24 hours up to 2 years. Paired with Android Device Administrator, GambleAware blocks uninstalls, force-stops, and rule weakening during impulsive moments.',
    detail: '24h – 2y timer · Device Admin uninstall guard',
  },
  {
    num: '04',
    span: 'lg:col-span-7',
    icon: KeyRound,
    title: 'Zero-Server Trusted Buddy Co-Lock',
    summary:
      'Pair with a trusted friend or family member using a deterministic offline 6-digit challenge-response key. No central servers, no subscription account, and no way to bypass alone.',
    detail: 'Deterministic offline 6-digit approval token',
  },
  {
    num: '05',
    span: 'lg:col-span-6',
    icon: Activity,
    title: 'Tilt Radar & 60-Second Calm Reset',
    summary:
      'Detects bursts of repeated betting attempts in real time and surfaces a 60-second guided breathing reset plus 1-tap Stake Banking to convert resisted urges into visible savings.',
    detail: 'Real-time burst detection · 60s guided intervention',
  },
  {
    num: '06',
    span: 'lg:col-span-6',
    icon: Cpu,
    title: '100% On-Device Privacy & Safe-Support Guard',
    summary:
      'Your browsing activity never leaves your phone. Verified helplines, therapy services, and recovery portals are permanently allowlisted so help is always reachable.',
    detail: 'Zero cloud traffic logs · Protected helplines',
  },
];

export const DownloadScreen: React.FC = () => {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [sandboxExternalQuery, setSandboxExternalQuery] = useState<string>('');
  const [sandboxExternalSeq, setSandboxExternalSeq] = useState<number>(0);

  const clientPlatform = useMemo(() => {
    if (typeof navigator === 'undefined') return 'desktop' as const;
    return detectClientPlatform(navigator.userAgent, navigator.maxTouchPoints);
  }, []);

  const metrics = useMemo(() => getRegistryMetrics(), []);

  const handleTestDomainFromDirectory = (domain: string) => {
    setSandboxExternalQuery(domain);
    setSandboxExternalSeq((s) => s + 1);
    const el = document.getElementById('live-filter');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full">
      {/* Executive Split Hero Section */}
      <section className="relative border-b border-[var(--subtle-border)] bg-[var(--canvas)]">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:px-6 md:pt-14 lg:pt-16 lg:pb-20">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
            {/* Left 6 Cols: Authoritative Product Positioning */}
            <div className="lg:col-span-6">
              <p className="font-mono text-xs font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
                Android Native Blocker · v2.1.1 · Zero-VPN Architecture
              </p>

              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl lg:text-[52px] lg:leading-[1.06]">
                Stop betting sites and apps before they open.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
                GambleAware enforces on-device blocking across every Android browser, native betting app, and popunder ad network — without a VPN, without draining your battery, and backed by an unbreakable Commitment Lock.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={ANDROID_APK_DOWNLOAD_URL}
                  download={APK_DOWNLOAD_FILENAME}
                  data-testid="hero-download-apk-btn"
                  onClick={() => setDownloadStarted(true)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-6 text-sm font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span>Download Android App (APK)</span>
                </a>

                <a
                  href="#live-filter"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--glass-border)]"
                >
                  <span>Test Live Filter</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              {downloadStarted ? (
                <p
                  role="status"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--safe-ink)]"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>
                    Downloading {APK_DOWNLOAD_FILENAME} — scroll to Install Guide for setup tips.
                  </span>
                </p>
              ) : (
                <p className="mt-3 font-mono text-xs text-[var(--ink-muted)]">
                  Free forever · Android 7.0+ · No account or subscription required
                </p>
              )}

              {/* Crisp 3-Column Live Registry Metrics Strip (No Pills, No Borders) */}
              <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-[var(--subtle-border)] pt-6">
                <div>
                  <dt className="font-mono text-[11px] text-[var(--ink-muted)] uppercase">
                    Blocked Domains
                  </dt>
                  <dd className="mt-1 font-mono text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums sm:text-3xl">
                    {metrics.domainCount.toLocaleString()}+
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] text-[var(--ink-muted)] uppercase">
                    Betting Apps
                  </dt>
                  <dd className="mt-1 font-mono text-2xl font-bold tracking-tight text-[var(--ink)] tabular-nums sm:text-3xl">
                    {metrics.appCount}+
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[11px] text-[var(--ink-muted)] uppercase">
                    VPN Required
                  </dt>
                  <dd className="mt-1 font-mono text-2xl font-bold tracking-tight text-[var(--accent-ink)] tabular-nums sm:text-3xl">
                    0%
                  </dd>
                </div>
              </dl>
            </div>

            {/* Right 6 Cols: Live Interactive Android Device Walkthrough */}
            <div className="lg:col-span-6">
              <AndroidAppShowcase />
            </div>
          </div>
        </div>
      </section>

      {/* Section 01: Live On-Device Filter Engine Sandbox */}
      <LiveFilterSandbox
        externalQuery={sandboxExternalQuery}
        externalQuerySeq={sandboxExternalSeq}
      />

      {/* Section 02: Searchable & Filterable Covered Brands Explorer */}
      <CoveredBrandsExplorer onTestDomain={handleTestDomainFromDirectory} />

      {/* Section 03: Asymmetric Security Architecture Bento */}
      <section
        id="architecture"
        aria-labelledby="architecture-heading"
        className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20"
      >
        <div className="mb-8 max-w-2xl">
          <p className="font-mono text-xs font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
            03 · Defense-in-Depth Architecture
          </p>
          <h2
            id="architecture-heading"
            className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl"
          >
            Six layers engineered to hold when willpower dips.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
            Every loophole people use during late-night urges — incognito tabs, mirror domains, booking links, popunder ads, or uninstalling the blocker — is closed on-device.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {ARCHITECTURE_LAYERS.map((layer) => {
            const IconComponent = layer.icon;
            return (
              <article
                key={layer.num}
                className={`flex flex-col justify-between rounded-3xl border border-[var(--subtle-border)] bg-[var(--surface)] p-6 ${layer.span}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[var(--accent-ink)]">
                      {layer.num}
                    </span>
                    <IconComponent className="h-5 w-5 text-[var(--ink-muted)]" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-[var(--ink)]">
                    {layer.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                    {layer.summary}
                  </p>
                </div>
                <p className="mt-5 border-t border-[var(--subtle-border)] pt-3.5 font-mono text-[11px] text-[var(--ink-muted)]">
                  {layer.detail}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Section 04 & 05: Savings Calculator & Architecture Comparison */}
      <SavingsImpactSection />

      {/* Section 06: Direct Deployment Hub, Setup Guide & Confidential Helplines */}
      <DeploymentHub
        clientPlatform={clientPlatform}
        downloadStarted={downloadStarted}
        onTriggerApkDownload={() => setDownloadStarted(true)}
      />
    </div>
  );
};
