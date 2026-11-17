package com.example.blocker

object GamblingRegistry {

    val sportsbookDomains: Set<String> = setOf(
        // Global & European Sportsbooks
        "bet365.com", "bet365.es", "bet365.it", "bet365.gr", "bet365.dk", "bet365.com.au",
        "bet365.ng", "bet365.co.za", "bet365.ca", "bet365.mx", "bet365.bet.br",
        "draftkings.com", "fanduel.com", "betmgm.com", "caesars.com", "caesarssportsbook.com",
        "espnbet.com", "fanatics.com", "betrivers.com", "pointsbet.com", "pointsbet.com.au",
        "williamhill.com", "williamhill.us", "ladbrokes.com", "ladbrokes.com.au",
        "coral.co.uk", "paddypower.com", "betfair.com", "betfair.com.au",
        "skybet.com", "unibet.com", "unibet.co.uk", "unibet.com.au", "bwin.com", "bwin.es",
        "betway.com", "betway.co.za", "betway.co.uk", "betway.com.ng", "betway.com.gh",
        "betway.co.ke", "betway.co.tz", "betway.co.zm", "betway.ug",
        "888sport.com", "betsson.com", "betsafe.com", "nordicbet.com", "pinnacle.com",
        "pinnacle.ca", "pinnacle.bet", "marathonbet.com", "parimatch.com", "parimatch.ng",
        "parimatch.co.tz", "parimatch.in",

        // SportyBet & African / Emerging Market Bookmakers
        "sportybet.com", "sportybet.ng", "sportybet.com.gh", "sportybet.co.ke",
        "sportybet.co.tz", "sportybet.co.zm", "sportybet.ug", "sporty.com",
        "bet9ja.com", "bet9ja.ng", "betking.com", "betking.ng",
        "msport.com", "msport.ng", "msport.co.ke", "msport.com.gh", "msport.co.ug",
        "bangbet.com", "bangbet.ng", "bangbet.co.ke", "bangbet.com.gh",
        "betpawa.com", "betpawa.ng", "betpawa.co.ke", "betpawa.com.gh", "betpawa.ug",
        "betpawa.co.tz", "betpawa.co.zm", "betpawa.rw", "betpawa.cm",
        "paripesa.com", "paripesa.ng", "paripesa.co.ke",
        "nairabet.com", "merrybet.com", "accessbet.com", "surebet247.com", "betbonanza.com",
        "frapapa.com", "winnersgoldenbet.com", "1960bet.com", "betland.com.ng",
        "livescorebet.ng", "hallabet.com", "zeusbet.com", "ilot.ng", "ilotbet.com",
        "naijabet.com", "konfambet.com", "betfarm.com",
        "sportpesa.com", "sportpesa.co.ke", "sportpesa.co.tz", "sportpesa.co.za",
        "betika.com", "betika.co.tz", "betika.com.gh", "betika.et",
        "odibets.com", "odibets.com.gh", "mozzartbet.com", "mozzartbet.co.ke",
        "mozzartbet.ng", "mozzartbet.com.gh", "mozzartbet.rs",
        "betlion.co.ke", "betlion.co.zm", "shabiki.com", "mcheza.co.ke",
        "premierbet.com", "premierbet.com.gh", "premierbet.co.mw", "premierbet.co.mz",
        "premierbet.co.ao", "premierbet.cm", "premierbet.sn", "premierbet.cd",
        "hollywoodbets.net", "supabets.co.za", "supabets.com.gh", "supabets.co.tz",
        "yesplay.bet", "easybet.co.za", "lottostar.co.za", "playabets.co.za",
        "gbets.co.za", "sunbet.co.za", "worldsportsbetting.co.za", "wsb.co.za",
        "bet.co.za", "10bet.co.za", "10bet.com", "10bet.co.uk", "betfred.co.za",
        "tictacbets.co.za", "sokabet.co.tz", "wasafibet.co.tz", "meridianbet.com",
        "meridianbet.co.tz", "meridianbet.rs", "fortebet.ug", "gsb.co.zm", "gsb.ug",
        "bongobongo.ug", "bongobongo.co.ke", "kagwirawo.co.ug",

        // International Mirrors & Fast-Growing Sportsbooks
        "1xbet.com", "1xbet.ng", "1xbet.co.ke", "1xbet.com.gh", "1xbet.co.zm",
        "1xbet.ci", "1xbet.sn", "1xbet.cm", "1xbit.com",
        "22bet.com", "22bet.ng", "22bet.co.ke", "22bet.com.gh", "22bet.co.tz",
        "melbet.com", "melbet.ng", "melbet.co.ke", "mostbet.com", "linebet.com",
        "linebet.ng", "megapari.com", "megapari.ng", "betwinner.com", "betwinner.ng",
        "helabet.com", "helabet.ng", "helabet.co.ke", "888starz.bet", "20bet.com",
        "ivibet.com", "leon.bet", "leonbets.com", "pin-up.bet", "dafabet.com",
        "sbobet.com", "fonbet.com", "winline.ru",

        // Americas, Australia & Europe
        "bovada.lv", "betonline.ag", "mybookie.ag", "sportsbetting.ag", "bookmaker.eu",
        "heritagesports.eu", "everygame.eu", "betus.com.pa", "gtbets.ag", "xbet.ag",
        "bodog.eu", "bodog.lv", "sportsinteraction.com", "prolineplus.olg.ca", "playnow.com",
        "thescore.bet", "hardrock.bet", "hardrockbet.com", "betfred.com", "betvictor.com",
        "boylesports.com", "betdaq.com", "smarkets.com", "matchbook.com", "spreadex.com",
        "sportingbet.com", "sportingbet.bet.br", "superbet.ro", "superbet.com", "superbet.pl",
        "superbet.bet.br", "tipico.com", "tipico.de", "betano.com", "betano.pt",
        "betano.ro", "betano.br", "betano.bet.br", "kaizen.bet",
        "betclic.fr", "betclic.pt", "betclic.pl", "winamax.fr", "pmu.fr", "fdj.fr",
        "parionssport.fdj.fr", "zebet.fr", "netbet.com", "netbet.co.uk",
        "tab.com.au", "sportsbet.com.au", "neds.com.au", "bluebet.com.au",
        "palmerbet.com", "tabtouch.com.au",
        "sts.pl", "fortuna.pl", "efortuna.cz", "tipsport.cz", "chance.cz",
        "codere.com", "codere.es", "caliente.mx", "betplay.com.co", "rushbet.co",
        "wplay.co", "betcris.com", "betsson.pe", "inkabet.pe", "doradobet.com",
        "kambi.com", "oddsportal.com", "oddschecker.com", "actionnetwork.com",
        "covers.com", "vegasinsider.com", "bettingpros.com", "scoresandodds.com",
        "sportsbookreview.com", "pickswise.com", "betql.co", "circasports.com",
        "borgatabet.com", "twinspires.com", "tvg.com", "fanduelracing.com", "nyrabets.com",
        "1stbet.com", "xpressbet.com", "amwager.com", "betamerica.com", "stardustcasino.com",
        "virginbet.com", "livescorebet.com", "quinnbet.com", "tote.co.uk", "kwiff.com",
        "midnite.com", "copybet.com", "betuk.com", "grosvenorcasinos.com", "meccabingo.com",
        "novibet.com", "novibet.bet.br", "stoiximan.gr", "pamestoixima.gr", "opap.gr",
        "snai.it", "sisal.it", "lottomatica.it", "eurobet.it", "goldbet.it", "planetwin365.it",
        "leovegas.com", "leovegas.co.uk", "casumo.com", "rizk.com", "mrgreen.com",
        "kto.com", "kto.bet.br", "pixbet.com", "esportesdasorte.com", "estrelabet.com",
        "galera.bet", "blazebet.com", "blaze.com", "betnacional.com", "vaidebet.com",
        "sportingindex.com", "cloudbet.com", "nitrogensports.eu", "betfury.io",
        "thunderpick.io", "rivalry.com", "gg.bet", "ggbet.com", "loot.bet",
        "egb.com", "csgolounge.com",
    )

    val casinoDomains: Set<String> = setOf(
        "888casino.com", "pokerstarscasino.com", "betmgmcasino.com", "goldennuggetcasino.com",
        "borgataonline.com", "partycasino.com", "jackpotcitycasino.com", "spinpalace.com",
        "spincasino.com", "rubyfortune.com", "royalvegascasino.com", "allslotscasino.com",
        "platincasino.com", "casinocom.com", "casino.com", "slots.lv", "cafecasino.lv",
        "ignitioncasino.eu", "wildcasino.ag", "superslots.ag", "reddogcasino.com",
        "lasatlantis.com", "elroyale.com", "slotocash.im", "bovegas.com", "chumbacasino.com",
        "luckylandslots.com", "pulsz.com", "wowvegas.com", "mcluck.com", "high5casino.com",
        "globalpoker.com", "stake.us", "fortunecoins.com", "zulacasino.com", "modo.us",
        "hellomillions.com", "funzpoints.com", "betrivers.net", "hardrock.games",
        "videoslots.com", "mrvegas.com", "playojo.com", "drueckglueck.com", "bacanaplay.com",
        "karamba.com", "hopa.com", "magicred.com", "griffoncasino.com", "slotsmagic.com",
        "queenvegas.com", "euromooncasino.com", "dunder.com", "guts.com", "kaboo.com",
        "thrills.com", "verajohn.com", "intercasino.com", "jackpotjoy.com", "virgingames.com",
        "monopolycasino.com", "ballycasino.co.uk", "ballybet.com", "heartbingo.co.uk",
        "foxygames.com", "galacasino.com", "galaspins.com", "ladbrokescasino.com",
        "coralcasino.co.uk", "32red.com", "unibet.casino", "skyvegas.com", "skycasino.com",
        "paddypowergames.com", "betfaircasino.com", "bet365casino.com", "vegas.williamhill.com",
        "mrq.com", "pubcasino.co.uk", "allbritishcasino.com", "fun88.com", "m88.com",
        "bk8.com", "w88.com", "12bet.com", "188bet.com", "k9win.com", "maxim88.com",
        "jilibet.com", "okbet.com", "bingoplus.com", "arenaplus.ph", "slotomania.com",
        "huuugecasino.com", "billionairecasino.com", "cashmancasino.com", "lightninglink.com",
        "doubleucasino.com", "jackpotparty.com", "myvegas.com", "popslots.com",
        "houseoffun.com", "zyngapoker.com", "wsop.com", "vegasslotsonline.com",
        "askgamblers.com", "casino.guru", "casinomeister.com", "lcb.org",
        "pin-up.casino", "wazamba.com", "rabona.com", "fezbet.com", "aviatorgames.com",
        "spribe.co", "sportycasino.com",
    )

    val pokerBingoDomains: Set<String> = setOf(
        "pokerstars.com", "pokerstars.uk", "pokerstars.eu", "pokerstars.es", "pokerstars.fr",
        "ggpoker.com", "ggpoker.co.uk", "partypoker.com", "888poker.com", "acrpoker.eu",
        "americascardroom.eu", "blackchippoker.eu", "truepoker.eu", "betonlinepoker.ag",
        "sportsbettingpoker.ag", "ignitionpoker.eu", "bovadapoker.lv", "coinpoker.com",
        "swcpoker.club", "phenompoker.com", "wptglobal.com", "clubwpt.com", "wsoponline.com",
        "betmgmpoker.com", "borgatapoker.com", "unibetpoker.com", "ipoker.com",
        "winamax.com", "runitonce.eu", "natural8.com", "pokerbros.net", "pppoker.net",
        "upoker.net", "supremapoker.com", "clubgg.net", "tombola.co.uk", "buzzbingo.com",
        "foxybingo.com", "galabingo.com", "sunbingo.co.uk", "winkbingo.com", "888ladies.com",
        "chickabingo.com", "bootybingo.com", "butlersbingo.com", "dottybingo.com",
        "glossybingo.com", "rosybingo.com", "jackpotbingo.co.uk", "bingocams.co.uk",
        "pokerscout.com", "pokernews.com", "cardschat.com", "twoplustwo.com",
    )

    val cryptoBettingDomains: Set<String> = setOf(
        "stake.com", "stake.games", "stake.bet", "stake.ac", "stake.com.br",
        "roobet.com", "rollbit.com", "bc.game", "bcgame.top", "duelbits.com",
        "gamdom.com", "csgoempire.com", "csgoroll.com", "hellcase.com", "key-drop.com",
        "clash.gg", "rustclash.com", "shuffle.com", "razed.com", "metaspins.com",
        "bitstarz.com", "mbitcasino.io", "7bitcasino.com", "fortunejack.com",
        "cloudbet.io", "sportsbet.io", "bitcasino.io", "betpanda.io", "tg.casino",
        "megadice.com", "luckyblock.com", "wallstreetmemes.com", "wild.io", "vave.com",
        "cryptoleo.com", "weiss.bet", "fairspin.io", "trustdice.win", "primedice.com",
        "freebitco.in", "bustabit.com", "ethercrash.io", "crashino.com", "wolf.bet",
        "betplay.io", "winz.io", "katsubet.com", "miraxcasino.com", "flush.com",
        "betchain.com", "jackbit.com", "mystake.com", "mystake.bet", "donbet.com",
        "goldenbet.com", "freshbet.com", "velobet.com", "polymarket.com", "sx.bet",
        "azuro.org", "pancakeswap.finance", "rollspace.com", "solcasino.io",
        "chips.gg", "howl.gg", "packdraw.com", "hypedrop.com",
    )

    val fantasyLotteryDomains: Set<String> = setOf(
        "prizepicks.com", "underdogfantasy.com", "sleeper.com", "betr.app", "dabble.com",
        "dabble.com.au", "parlayplay.io", "boomfantasy.com", "thrivefantasy.com",
        "vividpicks.com", "jockmkt.com", "monkeyknifefight.com", "ownersbox.com",
        "fantasyspin.com", "superdraft.io", "yahoo.com.fantasy", "draft.com",
        "lottoland.com", "lottoland.co.uk", "lottoland.com.au", "thelotter.com",
        "jackpocket.com", "lotto.com", "lottery.com", "national-lottery.co.uk",
        "euro-millions.com", "powerball.com", "megamillions.com", "calottery.com",
        "nylottery.ny.gov", "illinoislottery.com", "michiganlottery.com", "palottery.pa.gov",
        "olg.ca", "lotoquebec.com", "wclc.com", "alc.ca", "ozlotteries.com",
        "thelott.com", "mylotto.co.nz", "singaporepools.com.sg", "magnum4d.my",
        "sportstoto.com.my", "hkjc.com", "bet.hkjc.com", "veikkaus.fi", "svenskaspel.se",
        "norsk-tipping.no", "danskespil.dk", "lotto.de", "tipp24.de", "lottohelden.de",
        "dream11.com", "my11circle.com", "mpl.live", "winzo.com", "a23.com",
        "jungleerummy.com", "rummycircle.com", "adda52.com", "pokerbaazi.com",
        "babaijebu.ng", "westernlotto.com", "goldenlucklotto.com",
    )

    val domainToCategory: Map<String, GamblingCategory> by lazy {
        buildMap {
            sportsbookDomains.forEach { put(it.lowercase(), GamblingCategory.SPORTSBOOK) }
            casinoDomains.forEach { put(it.lowercase(), GamblingCategory.CASINO) }
            pokerBingoDomains.forEach { put(it.lowercase(), GamblingCategory.POKER_BINGO) }
            cryptoBettingDomains.forEach { put(it.lowercase(), GamblingCategory.CRYPTO_BETTING) }
            fantasyLotteryDomains.forEach { put(it.lowercase(), GamblingCategory.FANTASY_LOTTERY) }
        }
    }

    /**
     * Domains that contain substrings like "bet", "slot", "jackpot", etc., but are legitimate
     * non-gambling services and must NEVER be blocked by keyword heuristics.
     */
    val safeDomains: Set<String> = setOf(
        "alphabet.com", "abc.xyz", "better.com", "betterhelp.com", "betterment.com",
        "diabetes.org", "diabetes.co.uk", "bethesda.net", "bethesda.com", "bethel.edu",
        "bette.com", "bettycrocker.com", "albertsons.com", "robert.com", "tibet.org",
        "sloterdijk.nl", "timeslot.com", "timeslots.com", "pokerrito.com",
        "google.com", "googleapis.com", "gstatic.com", "googleusercontent.com",
        "android.com", "apple.com", "icloud.com", "microsoft.com", "live.com",
        "cloudflare.com", "1.1.1.1", "github.com", "wikipedia.org", "wikimedia.org",
        "youtube.com", "youtu.be", "reddit.com", "stackoverflow.com", "medium.com",
        "nytimes.com", "bbc.com", "bbc.co.uk", "cnn.com", "reuters.com",
        "amazon.com", "ebay.com", "paypal.com", "stripe.com", "chase.com",
        "gamblersanonymous.org", "ncpgambling.org", "begambleaware.org", "gamcare.org.uk",
        "gamban.com", "betblocker.org", "samhsa.gov", "quitgambling.org",
    )

    /**
     * Substring keywords that reliably identify gambling domains when strict keyword mode is on.
     * Kept specific to avoid false positives on regular words like "bet" inside "alphabet" or "better".
     */
    val strictHostKeywords: List<String> = listOf(
        "casino", "sportsbook", "gambl", "betting", "poker", "blackjack", "roulette",
        "baccarat", "slotmachine", "freeslots", "jackpot", "bookmaker", "bookie",
        "wager", "parlay", "bet365", "1xbet", "22bet", "betway", "betmgm",
        "draftkings", "fanduel", "caesarssports", "williamhill", "ladbrokes",
        "paddypower", "betfair", "parimatch", "bovada", "betonline", "mybookie",
        "prizepicks", "underdogfantasy", "roobet", "rollbit", "duelbits",
        "chumbacasino", "luckyland", "lottoland", "sweepstakescasino",
        "sportybet", "bet9ja", "betking", "msport", "bangbet", "betpawa",
        "paripesa", "merrybet", "nairabet", "accessbet", "surebet247", "betbonanza",
        "ilotbet", "betwinner", "helabet", "megapari", "linebet", "mostbet",
        "melbet", "sportpesa", "betika", "odibets", "mozzartbet", "hollywoodbets",
        "supabets", "premierbet", "betlion", "dafabet", "sbobet", "betano",
        "superbet", "tipico", "unibet", "betclic", "winamax", "sportingbet",
        "lottostar", "yesplay", "easybet", "babaijebu",
    )

    val knownGamblingAppPackages: Set<String> = setOf(
        "com.draftkings.sportsbook", "com.draftkings.dknativermg", "com.draftkings.casino",
        "com.fanduel.android.sportsbook", "com.fanduel.casino", "com.fanduel.fantasy",
        "com.betmgm.sportsbook", "com.betmgm.casino", "com.roardigital.betmgm",
        "com.caesars.sportsbook", "com.williamhill.us.nj", "com.caesars.casino",
        "com.pennentertainment.espnbet", "com.betrivers.android", "com.rushstreet.betrivers",
        "com.hardrock.sportsbook", "com.hardrockdigital.sportsbook",
        "com.fanatics.betting", "com.pointsbet.android", "com.ballybet.sportsbook",
        "com.bet365.sport", "com.bet365.casino", "com.bet365.games", "com.bet365.poker",
        "com.ladbrokes.android", "com.coral.android", "com.paddypower.sports",
        "com.betfair.sportsbook", "com.betfair.exchange", "com.skybet.android",
        "com.unibet.sports", "com.unibet.casino", "com.bwin.sports", "com.bwin.casino",
        "com.betway.sports", "com.betway.casino", "com.eight88.sport", "com.eight88.casino",
        "com.eight88.poker", "com.starsmobile.pokerstars", "com.pyrsoftware.pokerstars",
        "com.ggpoker.android", "com.partypoker.android", "com.wsop.android",
        "com.prizepicks.android", "com.underdogfantasy.app", "com.sleeperbot",
        "com.betr.sports", "com.dabble.app", "com.parlayplay.app",
        "com.superbet.android", "com.tipico.sportsbook", "com.betano.android",
        "com.betclic.sport", "fr.winamax.app", "fr.pmu.hippique",
        "com.stake.android", "com.caliente.sports", "com.codere.apuestas",
        "com.betsson.android", "com.leovegas.android", "com.mrgreen.android",
        "com.casumo.android", "com.sportsbet.com.au", "au.com.tab.android",
        "com.neds.android", "com.ladbrokes.com.au", "com.bluebet.android",
        "com.playtika.slotomania", "com.huuuge.casino.slots", "com.productmadness.hovmobile",
        "com.zynga.livepoker", "com.myvegas.slots", "com.chumbacasino.app",
        "com.jackpocket.android", "com.lottoland.android", "com.thelotter.android",
        // SportyBet & African / Emerging Market Betting Apps
        "com.sportybet.android", "com.sportybet.ng", "com.sportybet.ke", "com.sportybet.gh",
        "com.sporty.mobile", "com.sporty.app",
        "com.bet9ja.android", "ng.bet9ja.app", "com.betking.android", "com.kingmakers.betking",
        "com.msport.android", "com.msport.ng", "com.bangbet.android",
        "com.betpawa.android", "org.paripesa.client", "com.merrybet.android",
        "com.nairabet.android", "com.accessbet.android",
        "com.betika.android", "com.sportybet.android", "com.hollywoodbets.app",
        "com.sportpesa.android", "com.odibets.android", "com.mozzartbet.android",
        "za.co.supabets.app", "za.co.easybet.app", "bet.yesplay.app", "com.premierbet.android",
        "org.xbet.client", "com.melbet.client", "com.parimatch.android",
        "org.betwinner.client", "org.megapari.client", "org.linebet.client",
        "org.helabet.client", "com.mostbet.app",
        "com.dream11.fantasy.cricket.app", "com.mpl.androidapp", "com.winzo.gold",
    )

    val gamblingPackageKeywords: List<String> = listOf(
        "sportsbook", "bet365", "draftkings", "fanduel", "betmgm", "caesarssports",
        "espnbet", "betrivers", "prizepicks", "underdogfantasy", "williamhill",
        "ladbrokes", "paddypower", "betfair", "skybet", "unibet", "betway",
        "pokerstars", "ggpoker", "partypoker", "1xbet", "22bet", "melbet",
        "parimatch", "superbet", "tipico", "betano", "betclic", "winamax",
        "bovada", "betonline", "roobet", "rollbit", "slotomania", "huuuge.casino",
        "chumbacasino", "lottoland", "jackpocket", "casino", "gambling",
        "sportybet", "bet9ja", "betking", "msport", "bangbet", "betpawa",
        "paripesa", "nairabet", "merrybet", "sportpesa", "odibets", "mozzartbet",
        "hollywoodbets", "supabets", "betwinner", "megapari", "linebet", "mostbet",
    )

    val gamblingBrandTokens: List<String> = listOf(
        "bet365", "draftkings", "fanduel", "betmgm", "caesars sportsbook",
        "espnbet", "espn bet", "betrivers", "pointsbet", "william hill",
        "ladbrokes", "paddy power", "betfair", "sky bet", "unibet", "betway",
        "888sport", "888casino", "888poker", "pokerstars", "ggpoker", "partypoker",
        "stake.com", "stake.us", "stake casino", "stake betting", "roobet", "rollbit",
        "bc.game", "duelbits", "1xbet", "22bet", "melbet", "parimatch", "superbet",
        "tipico", "betano", "betclic", "winamax", "bovada", "betonline", "mybookie",
        "prizepicks", "underdog fantasy", "hard rock bet", "fanatics sportsbook",
        "chumba casino", "luckyland slots", "pulsz", "wow vegas", "slotomania", "huuuge casino",
        "sportybet", "sporty bet", "bet9ja", "betking", "msport", "bangbet",
        "betpawa", "paripesa", "nairabet", "merrybet", "accessbet", "surebet247",
        "betbonanza", "ilotbet", "betwinner", "helabet", "megapari", "linebet",
        "mostbet", "sportpesa", "betika", "odibets", "mozzartbet", "hollywoodbets",
        "supabets", "premierbet", "yesplay", "easybet", "lottostar", "babaijebu",
    )

    val webContentSignals: List<String> = listOf(
        "bet slip", "place bet", "place your bet", "sportsbook", "live betting",
        "online casino", "live casino", "spin & win", "free spins", "slot machine",
        "real money poker", "texas hold'em", "roulette", "blackjack", "baccarat",
        "parlay", "moneyline", "cash out", "deposit bonus", "welcome bonus",
        "wager now", "jackpot", "crypto casino", "crash game", "betting odds",
        "book a bet", "booking code", "aviator", "virtual football", "cashout",
    )
}
