---
version: alpha
name: CashMine
description: A mobile payback ledger using CashMine's orange, warm neutral surfaces, and Inter typography.
colors:
  primary: "#F58A3A"
  background: "#F5F2EE"
  foreground: "#211D19"
  surface: "#FFFFFF"
  muted: "#625B54"
  border: "#D8D0C7"
  accent: "#A94708"
  positive: "#21764B"
  negative: "#B83B38"
typography:
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: "21px"
  display:
    fontFamily: "InterSemiBold, Inter, system-ui, sans-serif"
    fontSize: "27px"
    lineHeight: "35px"
rounded:
  control: "12px"
  card: "20px"
  balance: "24px"
spacing:
  page-inset: "24px"
  section-gap: "28px"
  page-max: "1040px"
components:
  button: {}
  balance-card: {}
  asset-card: {}
  status: {}
---

# CashMine visual system

## Overview

This is a product interface for traders checking fee payback on a phone. Its job is to make balances and claim details easy to read. The owner explicitly requested the colors from [cashmine.io](https://cashmine.io/), replacing the initial navy/gold proposal.

Brand evidence, inspected 2026-10-20: the site's [public stylesheet](https://cashmine.io/assets/main-D6PaOQeq.css) defines orange `--cm-button-brand-bg-default`, warm `--cm-background-primary`, brown `--cm-text-primary`, and white `--cm-surface-card`. The site's English font is Inter. The bundled logo comes from [CashMine's public CDN](https://cdn.cashmine.io/assets/logo-black.webp); font files come from Google Fonts and include their OFL license.

The signature is a compact payback ledger: a dark summary card with an orange allocation strip, followed by explicit available/pending/claiming amounts. Avoid speculative market charts, trading-terminal density, metallic effects, or unrelated decorative illustration.

This branch is a visual prototype with fixtures. No API integration, token entry, real transaction, or final production claim policy is implied. Language is English; amounts use a decimal point and USD displays; fixture timestamps explicitly use UTC. No market-specific legal claims are made.

## Colors

Use the site's light theme. Orange supports primary actions; the darker accent provides readable small text on pale surfaces. Green means confirmed/completed; red means failed; status also appears in text. The dark summary uses `#1B1815`, white amounts, and `#C0B8B0` secondary labels.

Canonical runtime colors live in `src/styles/theme/colors.ts`. This document mirrors the primary roles. Browser theme tokens live in `src/styles/theme/web.css`; `src/global.css` applies scrollbar and focus styling. Asset-specific colors in `assetColors` distinguish Tether, Bitcoin, and Ethereum; they do not indicate financial status.

## Localization

All interface copy lives in `src/localization/en.ts`, exposed through `src/localization/index.ts`. Complete phrases, accessible labels, validation messages, and interpolated labels belong there. Activity dates use the explicit `en-GB` locale and UTC. Fixture IDs, asset codes, amounts, and timestamps remain data; status and filter logic use stable identifiers rather than translated labels. This extraction provides one English catalog, not a runtime language picker.

## Typography

Font tokens live in `src/styles/theme/typography.ts`; shared layout tokens live in `src/styles/theme/layout.ts`. Inter Regular is body text; Inter SemiBold is headings, actions, and amounts. Inter Bold is available for stronger emphasis. Fonts are bundled locally and loaded before the app renders to avoid a late swap. Use system fallbacks if loading fails. Numeric summaries use tabular figures. The dominant total is 49px, screen headings 27px, sections 19px, body 14px, and supplementary labels 11–12px.

## Layout

Design around 390px width with 24px page insets. The natural content scrolls inside the screen; the bottom navigation remains accessible above safe-area padding. Content reserves 110px at the bottom so navigation does not cover controls. At 840px and wider, dashboard assets and recent activity become two columns. Apply their flex proportions only at that desktop breakpoint; mobile sections retain their natural content height so the footer cannot overlap the explainer card. Claim and Activity remain constrained to readable 520px and 640px panels. The overall page cap is 1040px.

## Elevation & Depth

Use warm background, white cards, and restrained borders to separate surfaces. The balance card is the darkest surface. Do not add competing drop shadows, background gradients, or floating decorations.

## Shapes

Controls use 12px corners, cards approximately 18–20px, and the summary 24px. Asset marks use rounded squares; status badges are compact with a dot and text.

## Components

Runtime ownership:

| Capability | Canonical owner | Source of truth | Variants | Verification |
| --- | --- | --- | --- | --- |
| Form | `src/app/claim.tsx` and `src/data/demo.ts` | Demo scope and task API amount syntax | Edit, review, sample status | Amount unit checks and browser flow |
| Scrollbar | `src/global.css` | Global scrollbar tokens | Default, hover, active, forced colors | Browser computed style |
| Navigation | `src/components/cashmine/shell.tsx` | Expo Router routes | Balances, Claim, Activity | Mobile navigation and direct links |
| Button | `src/components/cashmine/ui.tsx` | Runtime palette | Primary, secondary, quiet, disabled, busy | Keyboard and click checks |
| Status | `src/components/cashmine/ui.tsx` | Runtime semantic colors | Neutral, positive, warning, negative | Text labels and live updates |

Token mapping: `colors.primary → palette.brand → Action.primary`; `foreground → palette.ink → Copy`; `surface → palette.card → screen cards`; `background → palette.background → Shell`; `accent → palette.accent → selected states`; `typography → typography → Copy`. Global CSS only provides browser-specific focus, pointer, reduced-motion, and scrollbar behavior.

Actions have explicit labels and at least 44px tap areas where practical. Focus is visible; hover darkens the control slightly; pressed feedback reduces opacity. Disabled actions cannot activate. Refresh keeps its button dimensions while busy and announces a fixed-data refresh.

Claim confirmation uses a full-page review, not a modal. Asset choices are visible buttons, with selected state exposed. Invalid input retains its value and shows associated text; review focuses invalid input. Stage changes focus the heading. The preview never changes balances or submits a request. Pending/completed/failed examples are clearly labeled as samples.

Activity uses local filters and explicit Load more, with date groups and UTC labels. Shared rows render identically on Home and Activity. Filter state is transient because it only navigates a small fixture set.

Icons use Expo Symbols' Material icons on web. No decorative motion is needed; reduced-motion preferences disable browser animations. The demo label remains visible in the header.

## Do's and Don'ts

- Do preserve asset precision in the claim preview.
- Do show fee and receive amount separately.
- Do keep the sample-data status obvious.
- Don't imply that a visual preview creates or settles a real claim.
- Don't make the production balance-after-claim decision through this prototype.
- Don't use orange-only or green-only status communication without text.
