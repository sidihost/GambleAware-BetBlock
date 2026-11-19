export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4 | 5;
  label: 'Empty' | 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  checks: {
    minLength: boolean;
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

export interface RegistrationInput {
  firstName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export interface RegistrationValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof RegistrationInput, string>>;
}

export interface WelcomeEmailParams {
  firstName: string;
  email: string;
  verificationUrl: string;
  welcomePackUrl: string;
  apkDownloadUrl: string;
  dailyStakeNgn?: number;
  domainCount?: number;
  appCount?: number;
}

export interface WelcomePackHelpline {
  title: string;
  region: string;
  subtitle: string;
  phone?: string;
  url?: string;
}

export interface WelcomePackParams {
  firstName?: string;
  email?: string;
  generatedDate?: string;
  domainCount?: number;
  appCount?: number;
  iosDomains?: readonly string[];
  helplines?: readonly WelcomePackHelpline[];
}

export const DEFAULT_DOMAIN_COUNT = 1035;
export const DEFAULT_APP_COUNT = 153;

export const DEFAULT_IOS_DOMAINS: readonly string[] = [
  'sportybet.com',
  'bet9ja.com',
  'betking.com',
  '1xbet.com',
  'msport.com',
  'betway.com',
  'bet365.com',
  'stake.com',
  'paripesa.com',
  '22bet.com',
  'betpawa.com',
  'bangbet.com',
  'betwinner.com',
  'melbet.com',
  'merrybet.com',
  'nairabet.com',
  'accessbet.com',
  'betbonanza.com',
  'draftkings.com',
  'fanduel.com',
  'roobet.com',
  'bc.game',
];

export const DEFAULT_HELPLINES: readonly WelcomePackHelpline[] = [
  {
    region: 'Nigeria',
    title: 'Mentally Aware Nigeria Initiative (MANI)',
    subtitle: 'Free, confidential mental health & behavioral addiction support helpline across Nigeria.',
    phone: '+234 809 111 6264',
    url: 'https://mentallyaware.org',
  },
  {
    region: 'United Kingdom',
    title: 'GamCare · National Gambling Helpline',
    subtitle: 'Free 24/7 confidential advisers via phone or live chat, plus structured CBT treatment referrals.',
    phone: '0808 8020 133',
    url: 'https://www.gamcare.org.uk',
  },
  {
    region: 'US & International',
    title: 'National Problem Gambling Helpline (NCPG)',
    subtitle: '24/7 confidential call, text, and web chat for individuals and family members.',
    phone: '1-800-522-4700',
    url: 'https://www.ncpgambling.org',
  },
  {
    region: 'Global Peer Support',
    title: 'Gamblers Anonymous (Daily Online & Local Meetings)',
    subtitle: 'Peer-led recovery rooms running every day across timezone regions worldwide with zero cost.',
    url: 'https://www.gamblersanonymous.org',
  },
];

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeFirstName(raw?: string): string {
  const cleaned = (raw ?? '')
    .replace(/[^A-Za-z0-9 '\-]/g, '')
    .trim()
    .slice(0, 40);
  return cleaned || 'Friend';
}

export function isValidEmailAddress(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 160) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };

  if (!password) {
    return { score: 0, label: 'Empty', checks };
  }

  let rawScore = 0;
  if (checks.minLength) rawScore += 1;
  if (checks.hasLowercase) rawScore += 1;
  if (checks.hasUppercase) rawScore += 1;
  if (checks.hasNumber) rawScore += 1;
  if (checks.hasSymbol) rawScore += 1;

  const score = Math.min(password.length < 8 ? 2 : 5, rawScore) as 0 | 1 | 2 | 3 | 4 | 5;
  const labels: Record<PasswordStrengthResult['score'], PasswordStrengthResult['label']> = {
    0: 'Empty',
    1: 'Very Weak',
    2: 'Weak',
    3: 'Fair',
    4: 'Good',
    5: 'Strong',
  };

  return {
    score,
    label: labels[score],
    checks,
  };
}

export function validateRegistrationInput(
  input: RegistrationInput,
): RegistrationValidationResult {
  const errors: Partial<Record<keyof RegistrationInput, string>> = {};

  if (!input.firstName.trim()) {
    errors.firstName = 'Enter your first name so we can personalize your welcome pack.';
  } else if (input.firstName.trim().length > 40) {
    errors.firstName = 'First name must be 40 characters or fewer.';
  }

  if (!isValidEmailAddress(input.email)) {
    errors.email = 'Enter a valid email address to receive your welcome pack.';
  }

  const strength = evaluatePasswordStrength(input.password);
  if (!strength.checks.minLength) {
    errors.password = 'Use at least 8 characters for your recovery account password.';
  } else if (strength.score < 3) {
    errors.password = 'Add uppercase letters, numbers, or a symbol for a stronger password.';
  }

  if (input.password !== input.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match. Please re-enter to confirm.';
  }

  if (!input.acceptedTerms) {
    errors.acceptedTerms = 'Please accept the free license & privacy commitment to continue.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildWelcomeEmailSubject(firstName: string): string {
  const safeName = sanitizeFirstName(firstName);
  return `Welcome to GambleAware, ${safeName} — Your Free Shield & Welcome Pack`;
}

export function buildWelcomeEmailHtml(params: WelcomeEmailParams): string {
  const safeName = escapeHtml(sanitizeFirstName(params.firstName));
  const safeEmail = escapeHtml(params.email.trim());
  const safeVerifyUrl = escapeHtml(params.verificationUrl);
  const safeWelcomePackUrl = escapeHtml(params.welcomePackUrl);
  const safeApkUrl = escapeHtml(params.apkDownloadUrl);
  const domainCount = params.domainCount ?? DEFAULT_DOMAIN_COUNT;
  const appCount = params.appCount ?? DEFAULT_APP_COUNT;

  const monthlySavingsLine =
    typeof params.dailyStakeNgn === 'number' && params.dailyStakeNgn >= 500
      ? `<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:#94A3B8;">Your estimated 30-day bet-free savings target: <strong style="color:#FFFFFF;">₦${(params.dailyStakeNgn * 30).toLocaleString('en-US')}</strong>.</p>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to GambleAware</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F1F5F9;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #E2E8F0;">
          <tr>
            <td style="background-color:#0A0B10;padding:28px 32px;border-bottom:3px solid #D81B78;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <svg width="36" height="36" viewBox="0 0 108 108" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
                      <rect x="2" y="2" width="104" height="104" rx="24" fill="#0A0B10" stroke="#FF3D9A" stroke-opacity="0.5" stroke-width="2" />
                      <g transform="translate(54 54) scale(1.42) translate(-54 -54)">
                        <path d="M68,36 L63.5,41 L45,41 L41,45 L41,63 L45,67 L63,67 L67.5,71.8 L63.8,74.5 L42,74.5 L33.5,66 L33.5,42 L42,33.5 L64.2,33.5 Z" fill="#FFFFFF" />
                        <path d="M52,50.5 L74.5,50.5 L74.5,65.5 L67.2,72.5 L67.2,57.5 L48.5,57.5 Z" fill="#FF3D9A" />
                        <path d="M67.2,57.5 L74.5,50.5 L74.5,65.5 L67.2,72.5 Z" fill="#C4116B" />
                        <path d="M70.5,34.5 Q70.5,39.8 75.8,39.8 Q70.5,39.8 70.5,45.1 Q70.5,39.8 65.2,39.8 Q70.5,39.8 70.5,34.5 Z" fill="#FF72B8" />
                      </g>
                    </svg>
                    <span style="margin-left:12px;color:#FFFFFF;font-size:20px;font-weight:700;letter-spacing:-0.3px;vertical-align:middle;">GambleAware</span>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#FF72B8;">100% FREE · ZERO VPN</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:22px 0 6px;font-size:26px;line-height:1.2;font-weight:700;color:#FFFFFF;">Welcome to GambleAware, ${safeName}.</h1>
              <p style="margin:0;font-size:14px;line-height:1.55;color:#CBD5E1;">
                You just took a decisive, confidential step to protect your device, your peace of mind, and your finances — completely free forever.
              </p>
              ${monthlySavingsLine}
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">
                Your free account for <strong style="color:#0F172A;">${safeEmail}</strong> is ready. Unlike subscription VPN blockers that drain battery and break banking apps, GambleAware enforces on-device blocking across <strong>${domainCount.toLocaleString()}+ betting domains</strong> and <strong>${appCount}+ native betting apps</strong> with zero VPN slot usage.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0 10px;">
                <tr>
                  <td>
                    <a href="${safeVerifyUrl}" style="display:inline-block;background-color:#D81B78;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;padding:14px 26px;border-radius:999px;">
                      Confirm Account &amp; Launch Setup
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:12px;line-height:1.5;color:#64748B;">
                If the button does not open, copy this link into your browser:<br />
                <a href="${safeVerifyUrl}" style="color:#D81B78;word-break:break-all;">${safeVerifyUrl}</a>
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FDF2F7;border:1px solid #FBCFE8;border-radius:16px;padding:20px;margin:0 0 24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#D81B78;">YOUR FREE RECOVERY KIT</p>
                    <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:#334155;">
                      Download your printable <strong>GambleAware Welcome Pack</strong> (3-step Android setup guide, iPhone 22-site Screen Time list, bank gambling freeze steps, and 24/7 helplines) plus the latest Android APK.
                    </p>
                    <a href="${safeWelcomePackUrl}" style="display:inline-block;background-color:#0A0B10;color:#FFFFFF;text-decoration:none;font-size:13px;font-weight:700;padding:12px 20px;border-radius:999px;margin-right:10px;margin-bottom:8px;">
                      Download Welcome Pack
                    </a>
                    <a href="${safeApkUrl}" style="display:inline-block;background-color:#FFFFFF;color:#0F172A;border:1px solid #CBD5E1;text-decoration:none;font-size:13px;font-weight:700;padding:11px 18px;border-radius:999px;margin-bottom:8px;">
                      Download Android APK
                    </a>
                    <p style="margin:10px 0 0;font-size:12px;color:#64748B;">
                      Direct Welcome Pack link: <a href="${safeWelcomePackUrl}" style="color:#D81B78;word-break:break-all;">${safeWelcomePackUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:#0F172A;">
                3-Step Zero-VPN Setup (Under 60 Seconds)
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:22px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #E2E8F0;font-size:13px;color:#334155;">
                    <strong style="color:#D81B78;">Step 01 ·</strong> Enable <strong>All-Browser Accessibility Shield</strong> (Chrome, Brave, Opera, Firefox &amp; in-app browsers — no VPN needed).
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #E2E8F0;font-size:13px;color:#334155;">
                    <strong style="color:#D81B78;">Step 02 ·</strong> Turn on <strong>Uninstall Protection</strong> so impulsive deletion is blocked.
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;font-size:13px;color:#334155;">
                    <strong style="color:#D81B78;">Step 03 ·</strong> Choose a <strong>Commitment Lock Timer</strong> (24 hours up to 2 years) or pair a <strong>Trusted Buddy Co-Lock</strong>.
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#334155;">
                Need confidential human support right now? Verified helplines (Mentally Aware Nigeria, National Gambling Helpline, Gamblers Anonymous) remain permanently reachable inside GambleAware.
              </p>
              <p style="margin:18px 0 0;font-size:14px;color:#0F172A;font-weight:600;">
                Stay protected,<br />The GambleAware Team
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#64748B;">
                100% Free Forever · Zero Subscriptions · Private On Your Phone
              </p>
              <p style="margin:0;font-size:11px;color:#94A3B8;">
                GambleAware Anti-Betting Shield · You received this email because you registered a free account at GambleAware.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildWelcomePackHtml(params: WelcomePackParams = {}): string {
  const safeName = escapeHtml(sanitizeFirstName(params.firstName));
  const safeEmail = params.email ? escapeHtml(params.email.trim()) : '';
  const dateStr = escapeHtml(
    params.generatedDate ||
      new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
  );
  const domainCount = params.domainCount ?? DEFAULT_DOMAIN_COUNT;
  const appCount = params.appCount ?? DEFAULT_APP_COUNT;
  const iosDomains = params.iosDomains ?? DEFAULT_IOS_DOMAINS;
  const helplines = params.helplines ?? DEFAULT_HELPLINES;

  const iosDomainsHtml = iosDomains
    .map(
      (domain) =>
        `<span style="display:inline-block;padding:5px 10px;margin:3px;border-radius:8px;background:#FDF2F7;border:1px solid #FBCFE8;font-family:monospace;font-size:12px;color:#0F172A;">${escapeHtml(domain)}</span>`,
    )
    .join('');

  const helplinesHtml = helplines
    .map(
      (item) => `
      <div style="padding:12px 14px;border:1px solid #E2E8F0;border-radius:12px;margin-bottom:10px;background:#FFFFFF;">
        <div style="font-weight:700;font-size:14px;color:#0F172A;">${escapeHtml(item.title)}</div>
        <div style="font-size:12px;color:#D81B78;font-family:monospace;margin-top:2px;">${escapeHtml(item.region)}${item.phone ? ` · ${escapeHtml(item.phone)}` : ''}${item.url ? ` · ${escapeHtml(item.url)}` : ''}</div>
        <div style="font-size:13px;color:#475569;margin-top:4px;line-height:1.5;">${escapeHtml(item.subtitle)}</div>
      </div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GambleAware Welcome Pack — ${safeName}</title>
  <style>
    @media print {
      body { background: #FFFFFF !important; }
      .no-print { display: none !important; }
      .sheet { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:24px 16px;background:#F8F9FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <div class="sheet" style="max-width:780px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
    <div style="background:#0A0B10;color:#FFFFFF;padding:32px;border-bottom:4px solid #D81B78;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <svg width="32" height="32" viewBox="0 0 108 108" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="104" height="104" rx="24" fill="#0A0B10" stroke="#FF3D9A" stroke-opacity="0.5" stroke-width="2" />
            <g transform="translate(54 54) scale(1.42) translate(-54 -54)">
              <path d="M68,36 L63.5,41 L45,41 L41,45 L41,63 L45,67 L63,67 L67.5,71.8 L63.8,74.5 L42,74.5 L33.5,66 L33.5,42 L42,33.5 L64.2,33.5 Z" fill="#FFFFFF" />
              <path d="M52,50.5 L74.5,50.5 L74.5,65.5 L67.2,72.5 L67.2,57.5 L48.5,57.5 Z" fill="#FF3D9A" />
              <path d="M67.2,57.5 L74.5,50.5 L74.5,65.5 L67.2,72.5 Z" fill="#C4116B" />
              <path d="M70.5,34.5 Q70.5,39.8 75.8,39.8 Q70.5,39.8 70.5,45.1 Q70.5,39.8 65.2,39.8 Q70.5,39.8 70.5,34.5 Z" fill="#FF72B8" />
            </g>
          </svg>
          <span style="font-size:20px;font-weight:800;letter-spacing:-0.3px;">GambleAware <span style="color:#FF72B8;font-weight:600;font-size:13px;margin-left:8px;">WELCOME PACK</span></span>
        </div>
        <div style="font-family:monospace;font-size:12px;color:#94A3B8;">100% FREE · NO VPN · ${dateStr}</div>
      </div>
      <h1 style="margin:20px 0 8px;font-size:30px;line-height:1.15;">Recovery &amp; Device Setup Playbook for ${safeName}</h1>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#CBD5E1;">
        Prepared for ${safeName}${safeEmail ? ` (${safeEmail})` : ''}. Blocks ${domainCount.toLocaleString()}+ betting websites and ${appCount}+ gambling apps completely free, without slowing down your phone or requiring a VPN.
      </p>
      <div class="no-print" style="margin-top:18px;">
        <button onclick="window.print()" style="background:#D81B78;color:#FFFFFF;border:none;border-radius:999px;padding:10px 20px;font-weight:700;font-size:13px;cursor:pointer;">
          Print / Save as PDF
        </button>
      </div>
    </div>

    <div style="padding:32px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#0F172A;">1. Android 3-Step Setup (No VPN Needed)</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.6;">
        Unlike paid blockers that force a battery-draining VPN, GambleAware runs directly on your Android phone so your banking apps and work networks keep running smoothly.
      </p>
      <ol style="margin:0 0 26px;padding-left:20px;font-size:14px;line-height:1.7;color:#1E293B;">
        <li><strong>Enable All-Browser Shield:</strong> Open Android <em>Settings → Accessibility → Installed Apps → GambleAware → Switch ON → Allow</em>. This protects Chrome, Brave, Opera, Firefox, Samsung Internet, and social app links.</li>
        <li><strong>Turn On Uninstall Lock:</strong> Inside GambleAware, tap <em>Lock → Enable Uninstall Lock</em> and confirm <em>Activate</em>. Impulsive deletion is now blocked while your timer runs.</li>
        <li><strong>Set Commitment Lock or Trusted Buddy Co-Lock:</strong> Choose a timer (24 hours up to 2 years) or pair a trusted friend using a 6-digit approval code.</li>
      </ol>

      <h2 style="margin:0 0 12px;font-size:18px;color:#0F172A;">2. Bank Card Gambling Freeze</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
        Combine device blocking with payment protection: open your banking app (GTBank, Access, Zenith, Kuda, Monzo, Starling, or Revolut) and turn on <strong>Gambling Card Block</strong> or set your betting transfer limit to ₦0.
      </p>

      <h2 style="margin:0 0 12px;font-size:18px;color:#0F172A;">3. iPhone / iPad Screen Time Blocklist (22 Priority Sites)</h2>
      <p style="margin:0 0 12px;font-size:14px;color:#475569;line-height:1.6;">
        Go to <em>Settings → Screen Time → Content &amp; Privacy Restrictions → Content Restrictions → Web Content → Limit Adult Websites → Never Allow</em> and add:
      </p>
      <div style="margin-bottom:26px;">${iosDomainsHtml}</div>

      <h2 style="margin:0 0 12px;font-size:18px;color:#0F172A;">4. Confidential 24/7 Support Helplines</h2>
      <p style="margin:0 0 14px;font-size:14px;color:#475569;line-height:1.6;">
        Every verified recovery portal below stays permanently reachable inside GambleAware:
      </p>
      ${helplinesHtml}
    </div>
  </div>
</body>
</html>`;
}
