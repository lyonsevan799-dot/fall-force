# Fall Force — Standalone HTML5 Export

This folder contains everything needed to turn an exported copy of the Base44
app into a self-contained HTML5 game bundle for CrazyGames.

The game itself is 100% client-side (canvas, WebAudio, localStorage). The only
Base44 dependency is the auth shell that wraps the app — this kit removes it.

## What's in here

| File | Purpose |
|------|---------|
| `src/App.jsx` | Minimal entry — renders `<Home />` directly, no auth/router/providers |
| `vite.config.js` | Vite config without the `@base44/vite-plugin` (keeps the `@` alias) |
| `package.json` | Slim deps: only `react`, `react-dom`, `lucide-react`, `canvas-confetti` |
| `index.html` | Same branded splash, local favicon (no base44.com logo) |
| `prepare-standalone.sh` | One-command script that assembles & builds the standalone project |

## How to use

1. **Export** your app from the Base44 editor (top-right export button → ZIP).
2. **Unzip** the download and open a terminal in the project root.
3. **Run:**
   ```bash
   bash standalone/prepare-standalone.sh
   ```
4. The script replaces the entry files, deletes all Base44/auth/UI-shell files,
   installs the slim dependency set, and runs `vite build`.
5. **Upload the contents of `dist/`** to CrazyGames.

## What gets removed

- `base44/` — entity schemas, backend functions, config (no backend needed)
- `src/api/`, `src/lib/`, `src/hooks/`, `src/utils/` — Base44 SDK client, auth context, helpers
- `src/components/ui/` — shadcn/ui component library (the game has its own UI)
- `src/components/{AuthLayout,GoogleIcon,ProtectedRoute,ScrollToTop,UserNotRegisteredError}.jsx`
- `src/pages/{Login,Register,ForgotPassword,ResetPassword,OAuthConsent}.jsx`
- `@base44/sdk`, `@base44/vite-plugin` and ~60 unused dependencies from package.json

## What stays

- `src/main.jsx`, `src/App.jsx` (replaced), `src/index.css`, `tailwind.config.js`
- `src/pages/Home.jsx` — the entire game (menu, level select, all game modes)
- `src/game/**` — engine, levels, renderer, audio, particles, progress
- `src/components/game/**` — all in-game UI components
- `postcss.config.js`, `jsconfig.json`

## Notes

- Player progress (unlocked levels, stars, gems, settings) is saved to
  `localStorage` — no backend, no account required.
- The branded loading splash is preserved in `index.html`.
- The `standalone/` folder itself is not part of the Vite build (nothing imports
  it), so it's safe to leave in or delete after building.
- Your hosted Base44 app at flip-shift-dash.base44.app is untouched — this kit
  only modifies the local exported copy.