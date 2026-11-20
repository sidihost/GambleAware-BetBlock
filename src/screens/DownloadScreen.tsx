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
    title: 'Works Freely Alongside Any VPN',
    summary:
      'Protects Chrome, Brave, Opera, Firefox, Samsung Internet, and social links without using Android’s VPN slot — so ProtonVPN, Mullvad, NordVPN, WARP, and banking apps keep running untouched.',
    detail: 'Zero VPN conflict · Banking, social & work apps untouched',
  },
  {
    num: '02',
    span: 'lg:col-span-5',
    icon: Terminal,
    title: 'Play Store & Install Guard',
    summary:
      'Automatically blocks searching or downloading betting apps in Google Play Store and APK sideloaders, and immediately detects installed betting apps with 1-tap removal.',
    detail: 'Play Store blocker · APK sideload guard · Instant install scan',
  },
  {
    num: '03',
    span: 'lg:col-span-5',
    icon: Lock,
    title: 'Unbreakable Commitment Lock',
    summary:
      'Lock your shield from 24 hours up to 2 years. Blocks uninstall, Force Stop, Device Admin revocation, and Date & Time clock tampering until your timer finishes.',
    detail: '24h – 2y timer · Clock-tamper & uninstall protection',
  },
  {
    num: '04',
    span: 'lg:col-span-7',
    icon: KeyRound,
    title: 'Trusted Buddy Co-Lock',
    summary:
      'Pair with a trusted friend or family member using a simple 6-digit approval code so protection cannot be weakened alone — completely private and 100% free.',
    detail: '6-digit friend approval code · Free forever',
  },
  {
    num: '05',
    span: 'lg:col-span-6',
    icon: Activity,
    title: 'Instant Typing, Tilt Radar & Calm Reset',
    summary:
      'Stops SportyBet, Bet9ja, booking codes, and deposit pages as you type, detects urge bursts, and opens a 60-second Calm Reset plus 1-tap Stake Banking.',
    detail: 'Keystroke blocking · 60-second calm reset · Stake vault',
  },
  {
    num: '06',
    span: 'lg:col-span-6',
    icon: Cpu,
    title: 'Only Betting Apps Blocked · 100% Private',
    summary:
      'Never slows down or blocks everyday apps — only betting platforms and extra apps you explicitly choose. Verified helplines always stay reachable.',
    detail: 'Private on your phone · Protected helplines',
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
    <div className="w-full overflow-x-clip">
      {/* Executive Split Hero Section */}
      <section className="relative border-b border-[var(--subtle-border)] bg-[var(--canvas)]">
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:px-6 md:pt-12 lg:pt-16 lg:pb-20">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-10">
            {/* Left 6 Cols: Authoritative Product Positioning */}
            <div className="min-w-0 lg:col-span-6">
              <p className="font-mono text-[11px] font-semibold tracking-wider text-[var(--accent-ink)] uppercase sm:text-xs">
                100% Free Forever · Android &amp; iPhone Protection
              </p>

              <h1 className="mt-3.5 font-display text-[32px] leading-[1.08] font-bold tracking-tight text-[var(--ink)] sm:mt-4 sm:text-5xl lg:text-[52px] lg:leading-[1.06]">
                Stop betting sites and apps before they open.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--ink-muted)] sm:mt-5 sm:text-base lg:text-lg">
                GambleAware blocks betting websites, Play Store downloads, installed betting apps, and popunder ads on-device — while letting you use any VPN freely, leaving everyday apps untouched, and enforcing an unbreakable Commitment Lock.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
                <a
                  href={ANDROID_APK_DOWNLOAD_URL}
                  download={APK_DOWNLOAD_FILENAME}
                  data-testid="hero-download-apk-btn"
                  onClick={() => setDownloadStarted(true)}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-6 text-sm font-semibold text-[var(--active-content)] transition-opacity hover:opacity-90 sm:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--active-fill)]"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span>Download Android App (APK)</span>
                </a>

                <a
                  href="#live-filter"
                  data-testid="hero-try-filter-btn"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--subtle-border)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--glass-border)] sm:w-auto"
                >
                  <span>Try Live Blocker</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </a>
              </div>

              {downloadStarted ? (
                <p
                  role="status"
                  className="mt-3 inline-flex items-start gap-1.5 text-xs font-medium text-[var(--safe-ink)]"
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Downloading {APK_DOWNLOAD_FILENAME} — scroll to Install Guide for setup tips.
                  </span>
                </p>
              ) : (
                <p className="mt-3 font-mono text-[11px] leading-relaxed text-[var(--ink-muted)] sm:text-xs">
                  Free forever · Android 7.0+ · No account or sign-up required
                </p>
              )}

              {/* Crisp 3-Column Live Registry Metrics Strip */}
              <dl className="mt-8 grid grid-cols-3 gap-3 border-t border-[var(--subtle-border)] pt-5 sm:mt-10 sm:gap-6 sm:pt-6">
                <div className="min-w-0">
                  <dt className="font-mono text-[10px] leading-tight text-[var(--ink-muted)] uppercase sm:text-[11px]">
                    Blocked Domains
                  </dt>
                  <dd className="mt-1 font-mono text-xl font-bold tracking-tight text-[var(--ink)] tabular-nums sm:text-2xl lg:text-3xl">
                    {metrics.domainCount.toLocaleString()}+
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="font-mono text-[10px] leading-tight text-[var(--ink-muted)] uppercase sm:text-[11px]">
                    Betting Apps
                  </dt>
                  <dd className="mt-1 font-mono text-xl font-bold tracking-tight text-[var(--ink)] tabular-nums sm:text-2xl lg:text-3xl">
                    {metrics.appCount}+
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="font-mono text-[10px] leading-tight text-[var(--ink-muted)] uppercase sm:text-[11px]">
                    VPN Required
                  </dt>
                  <dd className="mt-1 font-mono text-xl font-bold tracking-tight text-[var(--accent-ink)] tabular-nums sm:text-2xl lg:text-3xl">
                    0%
                  </dd>
                </div>
              </dl>
            </div>

            {/* Right 6 Cols: Live Interactive Android Device Walkthrough */}
            <div className="min-w-0 lg:col-span-6">
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
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20"
      >
        <div className="mb-8 max-w-2xl">
          <p className="font-mono text-xs font-semibold tracking-wider text-[var(--accent-ink)] uppercase">
            03 · Built to Protect You
          </p>
          <h2
            id="architecture-heading"
            className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-3xl"
          >
            Six layers designed to hold when urges hit.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
            Every loophole people use during late-night urges — incognito tabs, mirror domains, booking links, popunder ads, or uninstalling the blocker — is closed on-device.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
          {ARCHITECTURE_LAYERS.map((layer) => {
            const IconComponent = layer.icon;
            return (
              <article
                key={layer.num}
                className={`flex min-w-0 flex-col justify-between rounded-2xl border border-[var(--subtle-border)] bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6 ${layer.span}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[var(--accent-ink)]">
                      {layer.num}
                    </span>
                    <IconComponent className="h-5 w-5 text-[var(--ink-muted)]" />
                  </div>
                  <h3 className="mt-3.5 font-display text-base font-bold tracking-tight text-[var(--ink)] sm:mt-4 sm:text-lg">
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
