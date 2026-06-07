# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm install` — install dependencies using the package manager pinned in `package.json`.
- `pnpm dev` — run `vite build --watch` for Chrome extension development.
- `pnpm build` — build the extension into `dist/` with Vite and `@crxjs/vite-plugin`.
- `pnpm typecheck` — run TypeScript checks with `tsc --noEmit`.

There are currently no lint or test scripts defined in `package.json`.

## Architecture

This is a Manifest V3 Chrome extension built with Vite, TypeScript, Lit, and `@crxjs/vite-plugin`.

- `src/manifest.ts` exports the CRX manifest consumed by `vite.config.ts`. It declares the MV3 service worker, side panel entry, and `sidePanel` permission.
- `src/background/service-worker.ts` is the extension background service worker. On install it configures Chrome to open the side panel when the extension action is clicked.
- `index.html` is the side panel HTML entry. It mounts `<web-api-side-panel>` and loads `src/side-panel/main.ts`.
- `src/side-panel/main.ts` registers all side-panel routes and imports the custom elements needed by the app. New routes should be registered here after their element modules are imported.
- `src/side-panel/router.ts` is a small hash router. Routes are registered with `registerRoute()`, resolved from `window.location.hash`, and changed with `navigate()`.
- `src/side-panel/web-api-side-panel.ts` is the side-panel shell. It listens for `hashchange`, resolves the active route, and renders the matching Lit page element.
- `src/side-panel/views/` contains Lit page components such as `home-page` and `requests-page`. Each view defines its own styles and registers its custom element.

TypeScript is strict (`strict`, `noUnusedLocals`, `noUnusedParameters`) and includes Chrome extension types via `types: ["chrome"]`.
