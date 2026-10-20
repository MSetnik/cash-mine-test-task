# CashMine

Live web build: **[add the public URL after deployment]**

## Run locally

Use Node.js 24, then install dependencies and start the web app:

```sh
npm ci
npm run web
```

For a simulator or emulator, run `npm run ios` or `npm run android`. Run `npm run build:web` to create a static web build in `dist/`.

## What works

- A responsive balances dashboard with sample asset balances and USD totals.
- A demo claim flow with asset selection, amount validation, Max, fee preview, confirmation, and sample pending, completed, and failed outcomes.
- Activity filters, date groups, and local pagination over sample transactions.

This branch is a visual prototype. Its data and claim outcomes are simulated; it does not yet make API requests or submit real claims.
