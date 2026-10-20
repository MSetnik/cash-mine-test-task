/** English UI copy. Keep complete phrases here, including accessible labels. */
export const en = {
  common: {
    brand: "CashMine",
    currency: "USD",
    unavailable: "—",
    amountPlaceholder: "0.00",
    usd: (amount: string) => `$${amount}`,
    assetAmount: (amount: string, asset: string) => `${amount} ${asset}`,
    balances: {
      available: "Available",
      pending: "Pending",
      claiming: "Claiming",
    },
    statuses: {
      Confirmed: "Confirmed",
      Pending: "Pending",
      Completed: "Completed",
      Failed: "Failed",
    },
    assets: { USDT: "Tether", BTC: "Bitcoin", ETH: "Ethereum" },
  },
  shell: {
    pageTitle: (title: string) => `${title} · CashMine`,
    description:
      "CashMine payback app — interactive visual preview with demo data.",
    loading: "Loading CashMine",
    homeLabel: "CashMine home",
    demo: "Demo data",
    footer: "A preview with sample balances. No real transactions.",
    navigation: { balances: "Balances", claim: "Claim", activity: "Activity" },
  },
  home: {
    pageTitle: "Balances",
    eyebrow: "YOUR PAYBACK",
    title: "Made from your trades.",
    refreshLabel: "Refresh demo balances",
    totalPayback: "Total payback",
    balanceCaption: "Your available, pending, and claiming balances.",
    allocationLabel:
      "Available 1,170 dollars and 81 cents, pending 71 dollars and 87 cents, claiming 32 dollars",
    claimPayback: "Claim payback",
    refreshing: "Refreshing demo balances…",
    refreshed: "Demo refreshed just now · Sample balances unchanged",
    snapshot: "Sample snapshot · 20 Oct 2026, 10:45 UTC",
    assetCount: (count: number) =>
      `${count} ${count === 1 ? "asset" : "assets"}`,
    yourAssets: "Your assets",
    claimAssetLabel: (name: string) => `Claim ${name}`,
    totalValue: "Total value",
    viewAll: "View all ↗",
    recentActivity: "Recent activity",
    goodToKnow: "Good to know",
    explainerTitle: "Trading fees. Coming back.",
    explainer:
      "Your confirmed payback is ready to claim. Pending payback becomes available once it’s confirmed.",
  },
  claim: {
    pageTitle: "Claim payback",
    back: "← Balances",
    eyebrow: "MAKE IT YOURS",
    titles: {
      edit: "Claim your payback.",
      review: "Everything look right?",
      pending: "Your claim is on its way.",
      completed: "Payback, paid back.",
      failed: "This claim didn’t complete.",
    },
    editSubtitle: "Choose an asset and move your payback to your wallet.",
    reviewSubtitle: "Review the details before you confirm your demo claim.",
    sampleSubtitle: "This is a sample claim. Your balances have not changed.",
    selectAsset: "Select asset",
    selectAssetLabel: (name: string) => `Select ${name}`,
    amountLabel: "Amount to claim",
    amountAccessibilityLabel: (asset: string) => `Amount to claim in ${asset}`,
    maxLabel: "Use maximum available amount",
    max: "Max",
    available: (amount: string, asset: string) =>
      `Available: ${amount} ${asset}`,
    receiveIn: "Receive in",
    myWallet: "My wallet",
    sampleDestination: "Sample destination · Wallet selected for this demo",
    fee: "Claim fee",
    minimum: "Minimum claim",
    receive: "You receive",
    feeNote: "The fee is deducted from your claim amount.",
    review: "Review claim",
    reviewStatus: "Review your claim",
    amount: "Claim amount",
    feeIncluded: "Fee included",
    destination: "Destination",
    disclaimer:
      "Demo only. Confirming previews the claim status; no funds are moved.",
    confirm: "Confirm demo claim",
    edit: "Edit amount",
    statuses: {
      failed: "Failed · sample",
      completed: "Completed · sample",
      pending: "Pending · sample",
    },
    descriptions: {
      failed:
        "In a live claim, the claim amount would return to your available balance.",
      completed: "This previews a completed payment to your wallet.",
      pending:
        "In a live claim, this screen would follow its status until it completes or fails.",
    },
    previewOutcome: "Preview an outcome",
    tryAgain: "Try another demo claim",
    validation: {
      invalidAmount: ({ decimals }: { decimals: number }) =>
        `Use a valid amount with up to ${decimals} decimal places.`,
      minimumAmount: ({ min, asset }: { min: string; asset: string }) =>
        `Minimum claim is ${min} ${asset}.`,
      exceedsAvailable: () => "This amount exceeds your available balance.",
    },
  },
  activity: {
    pageTitle: "Activity",
    eyebrow: "EVERY LITTLE BIT",
    title: "Your payback, on record.",
    subtitle: "The earnings, claims, and adjustments along the way.",
    filters: {
      All: "All",
      Payback: "Payback",
      Claim: "Claims",
      Reversal: "Reversals",
    },
    dateGroup: (date: string) => `${date} · UTC`,
    emptyTitle: "No activity yet",
    emptyDescription: "Payback and claims will appear here.",
    count: (visible: number, total: number) =>
      `${visible} of ${total} sample transactions`,
    loadMore: "Load more activity",
    paybackTitle: (exchange: string) => `${exchange} payback`,
    claimTitle: "Claim to wallet",
    adjustmentTitle: "Payback adjustment",
    paybackSubtitle: (time: string) => `Trading fee payback · ${time}`,
    walletSubtitle: (wallet: string, time: string) =>
      `Wallet ${wallet} · ${time}`,
    exchangeSubtitle: (exchange: string, time: string) =>
      `${exchange} · ${time}`,
    returnedSubtitle: (time: string) =>
      `Amount returned to available · ${time}`,
  },
  notFound: {
    pageTitle: "Page not found",
    title: "This page isn’t here.",
    description: "Head back to your balances to find your payback.",
    back: "Back to balances",
  },
  starter: {
    tryEditing: "Try editing",
    editPath: "app/index.tsx",
    version: (version: string) => `v${version}`,
  },
} as const;
