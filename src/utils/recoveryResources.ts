export type ResourceCategory =
  | 'FINANCIAL_BLOCKS'
  | 'SELF_EXCLUSION'
  | 'HELPLINES'
  | 'RELAPSE_CBT';

export interface RecoveryResourceItem {
  id: string;
  category: ResourceCategory;
  region: string;
  title: string;
  subtitle: string;
  steps: string[];
  url?: string;
  urlLabel?: string;
  phone?: string;
}

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  FINANCIAL_BLOCKS: 'Bank & Card Blocks',
  SELF_EXCLUSION: 'Self-Exclusion',
  HELPLINES: '24/7 Helplines',
  RELAPSE_CBT: 'Relapse & Advice',
};

export const RECOVERY_RESOURCES: RecoveryResourceItem[] = [
  {
    id: 'bank-uk-neo',
    category: 'FINANCIAL_BLOCKS',
    region: 'UK & Global Cards',
    title: 'Bank Gambling Transaction Freeze (Monzo, Starling, Chase, Revolut, Barclays)',
    subtitle:
      'Gambling merchant category code (MCC 7995) card blocks enforce a mandatory 48-hour to 7-day cooling-off delay before reactivation.',
    steps: [
      'Open your bank mobile app → Card Controls / Manage Card.',
      'Enable "Gambling Block" (blocks betting websites, casinos, and bookmakers automatically).',
      'If available, turn on Cooling-Off Period lock so disabling requires live customer chat + waiting days.',
    ],
  },
  {
    id: 'bank-ng-friction',
    category: 'FINANCIAL_BLOCKS',
    region: 'Nigeria & West Africa',
    title: 'Nigerian Bank, OPay & Kuda Spending Friction Setup',
    subtitle:
      'Add practical payment barriers so spare balance cannot hit betting wallets during late-night urges.',
    steps: [
      'Lower daily debit card & NIP transfer limits inside your primary banking app (GTWorld, AccessMore, Zenith, UBA, Kuda).',
      'Move salary or savings into a locked Fixed / SafeLock vault requiring 24–72 hours or target date withdrawal.',
      'Disable online/web card payments on one everyday card and keep only trusted merchant transfers enabled.',
    ],
  },
  {
    id: 'gamstop-uk',
    category: 'SELF_EXCLUSION',
    region: 'United Kingdom',
    title: 'GAMSTOP National Online Self-Exclusion',
    subtitle:
      'Free legal exclusion across every online gambling company licensed in Great Britain for 6 months, 1 year, or 5 years.',
    steps: [
      'Register once using your legal name, date of birth, postcode, and current email/phone.',
      'Choose 6 months, 1 year, or 5 years (cannot be cancelled early before your chosen expiry).',
      'Layer alongside GambleAware All-Browser & Ad Shield to cover offshore & unlicensed sites outside UK regulation.',
    ],
    url: 'https://www.gamstop.co.uk',
    urlLabel: 'Visit gamstop.co.uk',
  },
  {
    id: 'betstop-au',
    category: 'SELF_EXCLUSION',
    region: 'Australia',
    title: 'BetStop National Self-Exclusion Register',
    subtitle:
      'Australian Government register blocking all licensed online and phone wagering providers from 3 months up to a lifetime.',
    steps: [
      'Verify identity on betstop.gov.au in under 5 minutes.',
      'Active accounts are closed automatically and marketing messages are legally prohibited.',
    ],
    url: 'https://www.betstop.gov.au',
    urlLabel: 'Visit betstop.gov.au',
  },
  {
    id: 'talkbanstop',
    category: 'SELF_EXCLUSION',
    region: 'Multi-Layer Standard',
    title: 'Combining Device, Bank & Operator Blocks',
    subtitle:
      'No single barrier covers everything on its own. Layering device blocking, bank freezes, and self-exclusion closes the usual workarounds.',
    steps: [
      'Device: Keep GambleAware site, app, and Device Admin locks turned on.',
      'Banking: Move spare money into a locked vault and enable bank card gambling blocks.',
      'Operators: Unsubscribe from promo SMS and request permanent closure on old accounts.',
      'Accountability: Add a Partner Unlock code or reach out to Support after any close call.',
    ],
  },
  {
    id: 'helpline-mani',
    category: 'HELPLINES',
    region: 'Nigeria',
    title: 'Mentally Aware Nigeria Initiative (MANI)',
    subtitle:
      'Free, confidential mental health & behavioral addiction support helpline across Nigeria.',
    steps: [
      'Call or WhatsApp during crisis moments or after a heavy loss.',
      'Always allowlisted by GambleAware Safe-Support Guard.',
    ],
    phone: '+234 809 111 6264',
    url: 'https://mentallyaware.org',
    urlLabel: 'Open mentallyaware.org',
  },
  {
    id: 'helpline-gamcare',
    category: 'HELPLINES',
    region: 'United Kingdom',
    title: 'GamCare · National Gambling Helpline',
    subtitle:
      'Free 24/7 confidential advisers via phone or live chat, plus structured CBT treatment referrals.',
    steps: [
      'Call 0808 8020 133 any hour of day or night.',
      'Ask specifically for practical debt signposting and trigger-management plans.',
    ],
    phone: '0808 8020 133',
    url: 'https://www.gamcare.org.uk',
    urlLabel: 'Open gamcare.org.uk',
  },
  {
    id: 'helpline-ncpg',
    category: 'HELPLINES',
    region: 'US & International',
    title: 'National Problem Gambling Helpline (NCPG)',
    subtitle: '24/7 confidential call, text, and web chat for individuals and family members.',
    steps: [
      'Call or text 1-800-GAMBLER (1-800-522-4700).',
      'Live international web chat available via ncpgambling.org/chat.',
    ],
    phone: '1-800-522-4700',
    url: 'https://www.ncpgambling.org',
    urlLabel: 'Open ncpgambling.org',
  },
  {
    id: 'helpline-ga',
    category: 'HELPLINES',
    region: 'Global Peer Support',
    title: 'Gamblers Anonymous (Daily Online & Local Meetings)',
    subtitle:
      'Peer-led recovery rooms running every day across timezone regions worldwide with zero cost.',
    steps: [
      'Join a voice or video meeting silently at first if you prefer listening.',
      'Focus only on staying betting-free for the next 24 hours.',
    ],
    url: 'https://www.gamblersanonymous.org',
    urlLabel: 'Find a meeting',
  },
  {
    id: 'cbt-relapse-reset',
    category: 'RELAPSE_CBT',
    region: 'Recovery Plan',
    title: 'If You Had a Slip Today: 48-Hour Reset',
    subtitle:
      'One slip does not wipe out the progress you have already made. The priority right now is stopping a single bet from turning into chasing losses.',
    steps: [
      '1. Treat what was spent as gone — trying to win it back almost always leads to bigger losses.',
      '2. Move any available balance into a locked savings vault or ask someone you trust to hold it for 48 hours.',
      '3. Close whatever let you through (add that mirror link, app, or browser to your blocklist now).',
      '4. Extend your lock timer and run the 48-hour reset tool below.',
    ],
  },
  {
    id: 'cbt-urge-wave',
    category: 'RELAPSE_CBT',
    region: 'Practical Habit',
    title: 'Waiting Out a 15-Minute Urge',
    subtitle:
      'Most betting urges peak for 10 to 20 minutes and fade when you do not act on them.',
    steps: [
      'Start the 60-second breathing reset right away instead of debating with yourself.',
      'Leave your phone charging across the room or step outside for 10 minutes.',
      'Remember the math: bookmakers build a 7% to 15% margin into multi-leg slips over time.',
    ],
  },
  {
    id: 'cbt-payday-plan',
    category: 'RELAPSE_CBT',
    region: 'Money Management',
    title: 'Protecting Paydays & Rebuilding Savings',
    subtitle:
      'A large share of slips happen within 48 hours of getting paid or receiving extra cash.',
    steps: [
      'Handle rent, bills, food, and family transfers the same morning money lands.',
      'Track what you did not bet so you can put it toward something tangible.',
      'Keep Payday rules (25th–3rd) turned on so stricter filtering runs automatically on paydays.',
    ],
  },
];

export const RELAPSE_QUICK_ACTIONS = [
  'Stop the session now and step away from your phone for 15 minutes',
  'Move any remaining balance out of easy reach before another urge hits',
  'Add the site or app that got through to your Custom Blocklist',
  'Extend your lock timer (at least 30 days) or message Support',
];
