# CashMine

Expo app with TypeScript, Expo Router, and web support.

Live link: not deployed yet.

## Run locally

Use Node.js 24 LTS (`nvm install && nvm use` if you use nvm).

```sh
npm install
npm run web
```

Use `npm start` to open the Expo development server, or `npm run ios` / `npm run android` for a simulator or emulator.

## Checks and web build

```sh
npm run typecheck
npm run lint
npm test
npm run build:web
```

The static web build is written to `dist/`.

## What works

- A CashMine-branded balances dashboard with sample asset balances and USD totals.
- An interactive demo claim flow with asset selection, amount validation, Max, fee review, confirmation, and sample pending/completed/failed outcomes.
- Activity filters, date groups, and local pagination with dummy transactions.
- A typed Axios client for all five CashMine operations, with response validation, cancellation, timeouts, structured errors, and focused contract tests. See [API structure and integration guidance](docs/api-client.md).
- File-based navigation in `src/app/`, with strict TypeScript and `@/` imports.
- Web development and static export.

The screens remain a visual prototype using dummy data. They do not call the API or create real claims, and demo claims do not change fixture balances. The API client has been checked against the live read endpoints, but connecting it to runtime token entry, balances, claim submission/recovery, and activity pagination remains to be implemented.

Brand colors and the public logo are taken from [CashMine](https://cashmine.io/); see `DESIGN.md` for sources and visual conventions. Inter is bundled with its OFL license.

Local environment files are ignored by Git. Do not embed API tokens in source code or `EXPO_PUBLIC_` environment variables.

The initial npm audit reports 27 transitive dependency advisories (8 moderate, 19 high), originating in `braces`, `node-forge`, and `uuid`. npm proposes incompatible Expo major-version changes; no forced dependency changes were applied.
