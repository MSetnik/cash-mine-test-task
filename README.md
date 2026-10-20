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
npm run build:web
```

The static web build is written to `dist/`.

## What works

- The Expo starter home and explore screens.
- File-based navigation in `src/app/`, with strict TypeScript and `@/` imports.
- Web development and static export.

CashMine balances, token entry, claims, and activity are not implemented yet.

Local environment files are ignored by Git. Do not embed API tokens in source code or `EXPO_PUBLIC_` environment variables.

The initial npm audit reports 27 transitive dependency advisories (8 moderate, 19 high), originating in `braces`, `node-forge`, and `uuid`. npm proposes incompatible Expo major-version changes; no forced dependency changes were applied.
