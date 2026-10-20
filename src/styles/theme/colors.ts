/** CashMine's public light-theme tokens, inspected on 2026-10-20. */
export const palette = {
  background: "#F5F2EE",
  ink: "#211D19",
  muted: "#625B54",
  border: "#D8D0C7",
  card: "#FFFFFF",
  field: "#EFEBE6",
  promo: "#F4E9DC",
  brand: "#F58A3A",
  brandHover: "#FFA15A",
  brandPressed: "#DC7224",
  accent: "#A94708",
  positive: "#21764B",
  positiveSoft: "#EAF3ED",
  negative: "#B83B38",
  negativeSoft: "#FBECEB",
  dark: "#1B1815",
  darkMuted: "#C0B8B0",
  darkBorder: "#484038",
  ethereum: "#5B3B8A",
  ethereumSoft: "#EDE9F7",
} as const;

export const assetColors = {
  USDT: { color: palette.positive, tint: palette.positiveSoft },
  BTC: { color: palette.accent, tint: palette.promo },
  ETH: { color: palette.ethereum, tint: palette.ethereumSoft },
} as const;

// Retained for the Expo starter components.
export const Colors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
  },
  dark: {
    text: "#ffffff",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const starterColors = {
  link: "#3c87f7",
  splash: "#208AEF",
  gradientStart: "#3C9FFE",
  gradientEnd: "#0274DF",
} as const;
