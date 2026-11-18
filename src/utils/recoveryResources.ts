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
    title: 'The Multi-Layer Exclusion Stack (Gamban-Standard Defense)',
    subtitle:
      'No single tool is complete alone. Combine software blocking + bank merchant freezes + operator self-exclusion + accountability.',
    steps: [
      'Layer 1 (Device): Keep GambleAware All-Browser & Ad Shield + Device Admin Lock armed.',
      'Layer 2 (Money): Lock disposable funds & enable bank card gambling merchant blocks.',
      'Layer 3 (Operators): Opt out of promo SMS/email lists and request permanent account closure from past bookmakers.',
      'Layer 4 (Human): Pair Buddy Co-Lock or speak confidentially via Support Desk after any close call.',
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
    region: 'Relapse Recovery Protocol',
    title: 'If You Relapsed Today: The 48-Hour Damage-Control Protocol',
    subtitle:
      'A slip does NOT erase weeks of brain rewiring. What determines the outcome is preventing a single slip from turning into a chasing-losses binge.',
    steps: [
      '1. Accept the money already lost as a sunk cost — chasing never returns it and multiplies damage.',
      '2. Immediately move any remaining cash to a locked vault or trusted person for 48 hours.',
      '3. Close the vulnerability that bypassed your shield (add that mirror URL, app, or payment route right now).',
      '4. Extend your Commitment Lock and run the "I Relapsed — Reset & Harden" tool below without self-hatred.',
    ],
  },
  {
    id: 'cbt-urge-wave',
    category: 'RELAPSE_CBT',
    region: 'Behavioral Science',
    title: 'Urge Surfing: Outlasting the 15-Minute Dopamine Peak',
    subtitle:
      'Gambling cravings behave like ocean waves — they spike sharply for 10 to 20 minutes and subside if not fed.',
    steps: [
      'Trigger the 60s Guided Calm Reset immediately instead of arguing with the urge.',
      'Change your physical room for 10 minutes: leave your phone charging away from your bed at night.',
      'Remind yourself: bookmakers win on volume & overround margin (7%–15% per slip), never player luck.',
    ],
  },
  {
    id: 'cbt-payday-plan',
    category: 'RELAPSE_CBT',
    region: 'Money & Debt Repair',
    title: 'Payday Defense & Rebuilding Financially',
    subtitle:
      'Most relapses happen within 48 hours of receiving salary, bonuses, or business payouts.',
    steps: [
      'Pay rent, food, family obligations, and utility bills the same morning income arrives.',
      'Use your Savings & Recovery Ledger to turn weekly saved stakes into concrete life purchases.',
      'Turn on Payday Surge Guard (25th–3rd) so strict keyword & cashier firewalls auto-arm every payday.',
    ],
  },
];

export const RELAPSE_QUICK_ACTIONS = [
  'Stop the session now — walk away from screen/phone for 15 minutes',
  'Transfer remaining balance out of reach before another deposit urge hits',
  'Add the site/app mirror that slipped through to Custom Blocklist',
  'Re-arm Commitment Lock (at least 30 days) and message Support Desk if needed',
];
