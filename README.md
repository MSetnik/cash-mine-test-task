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

- Runtime token entry, browser persistence, token replacement, and isolated session caches. Enter your own CashMine test API token when prompted.
- Live balances, clearly labeled USD totals, server snapshot time, refresh, and error/retry states.
- Live claim rules and destinations, exact decimal validation, Max, fee/receive review, and confirmation.
- Persisted idempotent submission, user-triggered same-key recovery after an unknown outcome or reload, and polling to completed/failed. Another claim stays blocked until settlement appears in a newer balance snapshot.
- Live cursor-paginated activity with filters and duplicate-ID removal.
- Axios transport and TanStack Query server state, with shared session rate-limit handling.
- Unit and contract tests, strict TypeScript, and a static Expo web export.

Use one active tab per token for claiming. Token replacement keeps unresolved requests scoped to their original token. Test funds come from the live task API; no sample balances are substituted on errors. Claim failure/recovery scenarios are verified with controlled responses, while live verification uses read endpoints only. See [decisions and remaining work](NOTES.md) and [API guidance](docs/api-client.md).

Brand colors and the public logo are taken from [CashMine](https://cashmine.io/); see `DESIGN.md` for sources and visual conventions. Inter is bundled with its OFL license.

Local environment files are ignored by Git. Do not embed API tokens in source code or `EXPO_PUBLIC_` environment variables.

The initial npm audit reports 27 transitive dependency advisories (8 moderate, 19 high), originating in `braces`, `node-forge`, and `uuid`. npm proposes incompatible Expo major-version changes; no forced dependency changes were applied.
