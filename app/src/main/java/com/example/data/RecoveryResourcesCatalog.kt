package com.example.data

enum class RecoveryResourceCategory(val label: String) {
    FINANCIAL_BLOCKS("Bank & Card"),
    SELF_EXCLUSION("Self-Exclusion"),
    HELPLINES("24/7 Helplines"),
    RELAPSE_CBT("Relapse & CBT"),
}

data class RecoveryResourceItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val category: RecoveryResourceCategory,
    val region: String,
    val actionLabel: String,
    val url: String,
    val phoneNumber: String? = null,
    val hours: String? = null,
)

data class BankFreezeCheckItem(
    val id: String,
    val title: String,
    val detail: String,
)

data class RelapseQuickAction(
    val id: String,
    val title: String,
    val detail: String,
)

object RecoveryResourcesCatalog {
    val resources: List<RecoveryResourceItem> = listOf(
        RecoveryResourceItem(
            id = "bank-freeze-ng",
            title = "Nigerian Bank Gambling & Card Freeze",
            subtitle = "Turn off online/international web payments or lower daily transfer caps in GTWorld, Zenith, AccessMore, Kuda, OPay, or PalmPay.",
            category = RecoveryResourceCategory.FINANCIAL_BLOCKS,
            region = "Nigeria",
            actionLabel = "Gambling Therapy Debt Guide",
            url = "https://www.gamblingtherapy.org/support/managing-finances/",
        ),
        RecoveryResourceItem(
            id = "bank-freeze-uk",
            title = "UK Bank Gambling Block (Monzo, Starling, Barclays, Lloyds)",
            subtitle = "Activate your bank's built-in MCC 7995 gambling merchant block with a mandatory 48-hour cooling-off delay.",
            category = RecoveryResourceCategory.FINANCIAL_BLOCKS,
            region = "UK",
            actionLabel = "View Bank Block Directory",
            url = "https://www.gamcare.org.uk/self-help/blocking-software-and-bank-blocks/",
        ),
        RecoveryResourceItem(
            id = "bank-freeze-us",
            title = "Card Cash-Advance & Gambling Merchant Block",
            subtitle = "Call the number on the back of your debit or credit card to set cash-advance limits to zero and block gambling MCCs.",
            category = RecoveryResourceCategory.FINANCIAL_BLOCKS,
            region = "Global / US",
            actionLabel = "Financial Safeguards Guide",
            url = "https://www.ncpgambling.org/help-treatment/",
        ),
        RecoveryResourceItem(
            id = "self-exclude-nlrc",
            title = "Operator Self-Exclusion Request (Bet9ja, SportyBet, 1xBet)",
            subtitle = "Request a permanent or 12-month account closure directly from each sportsbook's Responsible Gaming desk.",
            category = RecoveryResourceCategory.SELF_EXCLUSION,
            region = "Nigeria & Global",
            actionLabel = "Self-Exclusion Steps",
            url = "https://www.gamblingtherapy.org/self-help/self-exclusion/",
        ),
        RecoveryResourceItem(
            id = "self-exclude-gamstop",
            title = "GAMSTOP National Self-Exclusion",
            subtitle = "Free single registration that blocks you from every UK-licensed gambling site and app for 6 months, 1 year, or 5 years.",
            category = RecoveryResourceCategory.SELF_EXCLUSION,
            region = "UK",
            actionLabel = "Register at GAMSTOP",
            url = "https://www.gamstop.co.uk/",
        ),
        RecoveryResourceItem(
            id = "self-exclude-betstop",
            title = "BetStop National Self-Exclusion Register",
            subtitle = "Official free register blocking all licensed interactive wagering providers across Australia in minutes.",
            category = RecoveryResourceCategory.SELF_EXCLUSION,
            region = "Australia",
            actionLabel = "Visit BetStop",
            url = "https://www.betstop.gov.au/",
        ),
        RecoveryResourceItem(
            id = "helpline-gambleaware-ng",
            title = "GambleAlert Nigeria Free Support",
            subtitle = "Confidential counselling, WhatsApp support, and recovery referrals tailored for Nigerian sports bettors and families.",
            category = RecoveryResourceCategory.HELPLINES,
            region = "Nigeria",
            actionLabel = "Visit GambleAlert",
            url = "https://gamblealert.org/",
            phoneNumber = "+2348188887886",
            hours = "Mon–Sat • Free & Confidential",
        ),
        RecoveryResourceItem(
            id = "helpline-gamcare",
            title = "National Gambling Helpline (GamCare)",
            subtitle = "Free 24/7 phone and live chat advisers for anyone affected by gambling urges, debt, or relapse.",
            category = RecoveryResourceCategory.HELPLINES,
            region = "UK",
            actionLabel = "Open GamCare Chat",
            url = "https://www.gamcare.org.uk/",
            phoneNumber = "08088020133",
            hours = "24/7 • Free",
        ),
        RecoveryResourceItem(
            id = "helpline-ncpg",
            title = "National Problem Gambling Helpline (1-800-GAMBLER)",
            subtitle = "24/7 confidential call, text, and live chat connecting you with trained recovery specialists.",
            category = RecoveryResourceCategory.HELPLINES,
            region = "US & Canada",
            actionLabel = "Open 1-800-GAMBLER",
            url = "https://www.ncpgambling.org/chat/",
            phoneNumber = "18004262537",
            hours = "24/7 • Call / Text / Chat",
        ),
        RecoveryResourceItem(
            id = "helpline-gordon-moody",
            title = "Gambling Therapy (Gordon Moody Global)",
            subtitle = "Free multilingual live support, peer forums, and recovery exercises accessible worldwide on any phone.",
            category = RecoveryResourceCategory.HELPLINES,
            region = "Worldwide",
            actionLabel = "Open Gambling Therapy",
            url = "https://www.gamblingtherapy.org/",
            hours = "24/7 • Multilingual",
        ),
        RecoveryResourceItem(
            id = "cbt-urge-surfing",
            title = "Urge Surfing & 15-Minute Wave Reset",
            subtitle = "Evidence-based CBT technique: cravings peak within 10–15 minutes and subside if you delay placing the bet.",
            category = RecoveryResourceCategory.RELAPSE_CBT,
            region = "Worldwide",
            actionLabel = "Read CBT Urge Guide",
            url = "https://www.gambleaware.org/advice/for-your-gambling/tips-to-stop-gambling/",
        ),
        RecoveryResourceItem(
            id = "cbt-gamblers-anonymous",
            title = "Gamblers Anonymous Peer Meetings",
            subtitle = "Free daily online and local peer fellowship meetings where people in recovery share practical tools without judgement.",
            category = RecoveryResourceCategory.RELAPSE_CBT,
            region = "Worldwide",
            actionLabel = "Find Online Meetings",
            url = "https://www.gamblersanonymous.org/ga/virtual-meetings",
        ),
    )

    val bankFreezeChecklist: List<BankFreezeCheckItem> = listOf(
        BankFreezeCheckItem(
            id = "freeze-web-pos",
            title = "Disable online gambling / card web payments in your bank app",
            detail = "Prevents one-tap card top-ups to sportsbook wallets during late-night urges.",
        ),
        BankFreezeCheckItem(
            id = "freeze-wallet-cap",
            title = "Lower daily transfer limit on OPay / PalmPay / Kuda / Moniepoint",
            detail = "Adds deliberate friction before moving cash into a betting wallet.",
        ),
        BankFreezeCheckItem(
            id = "freeze-remove-saved",
            title = "Delete saved debit cards from Chrome and Autofill",
            detail = "Removes instant checkout triggers across mobile browsers.",
        ),
        BankFreezeCheckItem(
            id = "freeze-unsubscribe",
            title = "Mute sportsbook SMS promo codes & Telegram tipster channels",
            detail = "Cuts off free-bet bait, odds boosts, and booking-code notifications.",
        ),
        BankFreezeCheckItem(
            id = "freeze-partner",
            title = "Share your GambleAware Buddy Co-Lock with someone you trust",
            detail = "Accountability doubles long-term recovery rates.",
        ),
    )

    val relapseQuickActions: List<RelapseQuickAction> = listOf(
        RelapseQuickAction(
            id = "relapse-stop-chasing",
            title = "1. Stop chasing losses right now",
            detail = "The next bet cannot repair a loss — it only deepens it. Lock your shield immediately.",
        ),
        RelapseQuickAction(
            id = "relapse-60s-breath",
            title = "2. Ride the 60-second Calm Reset",
            detail = "Slow 4-4-4 breathing drops cortisol and pulls your brain out of impulse mode.",
        ),
        RelapseQuickAction(
            id = "relapse-move-funds",
            title = "3. Move remaining balance out of reach",
            detail = "Transfer spare cash to a locked savings vault or trusted family account for 48 hours.",
        ),
        RelapseQuickAction(
            id = "relapse-call-human",
            title = "4. Message a friend or call a free helpline",
            detail = "Secrecy feeds relapse. One 5-minute honest conversation breaks the spiral.",
        ),
    )
}
