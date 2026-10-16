# Gravity Switch / Fall Force: standalone HTML5 candidate

This is a game-only build, separate from the hosted Base44 application. The existing in-game title is Fall Force; it has not been renamed by this stability pass.

## Requirements and commands

Use Node.js 22.12+ and npm. From an exported project root, run `npm install` once, then `npx vite build --config standalone/vite.config.js`. Alternatively run `bash standalone/prepare-standalone.sh` after dependencies are installed. The script no longer replaces or deletes application files, hooks, or authentication code.

The separate output is `dist-standalone/`, with `index.html` at its root. With a ZIP utility installed the script also packages that directory's CONTENTS as `gravity-switch-crazygames.zip`. Do not include a parent dist folder in the uploaded ZIP.

To run the built game locally use `npx vite preview --config standalone/vite.config.js --host 127.0.0.1` and open the printed HTTP URL. Do not double-click index.html: ES modules need HTTP, and CrazyGames serves the bundle over HTTPS. Dev mode uses `npx vite --config standalone/vite.config.js`.

## Dependency isolation

The standalone configuration selects `standalone/src/App.jsx` instead of the hosted auth/router entry and does not load the Base44 Vite plugin. It retains all game hooks and UI. The game itself uses Canvas, procedural WebAudio, and localStorage, with React, ReactDOM, lucide-react and canvas-confetti. No Base44 SDK, auth, database, analytics, or backend endpoints are needed by this build's reachable game code.

Fonts are bundled locally with their SIL Open Font License notices; paths are relative. No Google Fonts request is necessary for this build. No advertisements, SDK mocks, third-party trackers, or account screens are added. Custom fullscreen requests are disabled for the CrazyGames build, since the portal supplies fullscreen.

The downloadable source kit uses the slim manifest from `standalone/package.json` at its root and includes only the game source, hooks, fonts and build configuration. The regular Base44 source export can also use this configuration without replacing its original package manifest.

## Saves

The original `gravity-switch-save-v1` key and progress format are retained and repaired field-by-field when needed. Unreadable JSON is copied to `gravity-switch-save-v1-corrupt-backup` before fallback. Data is local to a browser and origin. CrazyGames cannot automatically read saves from base44.app, other domains or private-browser sessions. Keep the same CrazyGames game ID/origin for future updates. No player data is bundled in either ZIP.

There is no server-authoritative economy in this offline game. Local saves can be edited by their owner. Rewards must not be used for cash or competitive leaderboards without a separate trusted service. Cloud saves/account synchronization would be later SDK work.

## Submission status

This is a Basic Launch candidate, NOT a claim of CrazyGames acceptance or completed gameplay QA. Under the official requirements reviewed on 2026-10-16, SDK integration is optional for Basic Launch and ads are not allowed; Full Launch requires the official SDK gameplay lifecycle and applicable account/progress integrations. None is faked here.

Before submission, run the included QA checklist through Testing Agent and the CrazyGames Developer Portal preview, confirm desktop/mobile/iframe behavior, and supply real cover assets and gameplay videos. See `src/standalone/PUBLISHING_REPORT.md` for findings, measured build results and remaining checks.