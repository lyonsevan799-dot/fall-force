# Gravity Switch / Fall Force: standalone HTML5 candidate

This is a game-only build, separate from the hosted Base44 application. The existing in-game title is Fall Force; it has not been renamed by this stability pass.

## Requirements and commands

Use Node.js 22.12+ and npm. From an exported project root, run `npm install` once, then `npx vite build --config standalone/vite.config.js`. Alternatively run `bash standalone/prepare-standalone.sh` after dependencies are installed. The script no longer replaces or deletes application files, hooks, or authentication code.

The separate output is `dist-standalone/`, with `index.html` at its root. With a ZIP utility installed the script also packages that directory's CONTENTS as `gravity-switch-crazygames.zip`. Do not include a parent dist folder in the uploaded ZIP.

To run the built game locally use `npx vite preview --config standalone/vite.config.js --host 127.0.0.1` and open the printed HTTP URL. Do not double-click index.html: ES modules need HTTP, and CrazyGames serves the bundle over HTTPS. Dev mode uses `npx vite --config standalone/vite.config.js`.

## Dependency isolation

The standalone configuration selects `standalone/src/App.jsx` instead of the hosted auth/router entry and does not load the Base44 Vite plugin. It retains all game hooks and UI. The game itself uses Canvas, procedural WebAudio, and CrazyGames Data Module saves (browser fallback off-platform), with React, ReactDOM, lucide-react and canvas-confetti. No Base44 SDK, auth, database, analytics, or backend endpoints are needed by this build's reachable game code.

Fonts are bundled locally with their SIL Open Font License notices; paths are relative. No Google Fonts request is necessary for this build. No advertisements, SDK mocks, third-party trackers, or account screens are added. Custom fullscreen requests are disabled for the CrazyGames build, since the portal supplies fullscreen.

The downloadable source kit uses the slim manifest from `standalone/package.json` at its root and includes only the game source, hooks, fonts and build configuration. The regular Base44 source export can also use this configuration without replacing its original package manifest.

## Saves

The original `gravity-switch-save-v1` key and progress format are retained. Startup awaits the official CrazyGames v3 SDK and save preload before mounting the game. On supported `local`/`crazygames` environments the Data Module is the only persistent player store; ordinary browser saves are used when the SDK is unavailable or its environment is `disabled`. A valid legacy browser save migrates once only if the Data Module has no save. Existing SDK saves always win; wallets and claim histories are never merged. Unreadable originals are protected from overwriting, and browser originals additionally receive a recovery copy when possible. Save failures retain gameplay progress in memory with a visible warning; failed purchases do not debit the accepted wallet.

CrazyGames cannot read saves from base44.app or another origin. Migration can access only the browser storage on the current game origin; keep the same CrazyGames game ID/origin for future updates. No player data is bundled in the export.

The Data Module integration is implemented, but real guest/account/cross-device sync is NOT verified. Enable **Progress Save → Yes, using the Data Module from the CrazyGames SDK** in the Developer Portal submission. The SDK handles guest/account transitions and its own approximately one-second debounce (sometimes up to 30 seconds). Do not force-reload immediately after a save when checking cloud sync. No undocumented flush/ack method is used. This remains a client-authoritative economy, not a trusted source for cash or competitive leaderboards.

## Submission status

This is a Basic Launch candidate, NOT a claim of CrazyGames acceptance or completed gameplay QA. Under the official requirements reviewed on 2026-10-16, SDK integration is optional for Basic Launch and ads are not allowed; Full Launch requires the official SDK gameplay lifecycle and applicable account/progress integrations. None is faked here.

Before submission, run the QA checklist through Testing Agent and the CrazyGames Developer Portal preview, confirm desktop/mobile/iframe behavior, and supply real cover assets and gameplay videos. For this integration, read `src/standalone/CRAZYGAMES_INTEGRATION_REPORT.md`; `src/standalone/PUBLISHING_REPORT.md` is the earlier historical stability report. To test the real SDK locally use localhost/127.0.0.1, or append `?useLocalSdk=true` on another domain; `&muteAudio=true` and `&disableChat=true` exercise platform settings. The SDK determines its own environment.