# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Project rules (UI/a11y, security, versioning, CodeGraph) live in AGENTS.md and apply in full:

@AGENTS.md

Docs, comments, commit messages and UI copy are written in PT-BR; the UI itself must ship PT-BR, EN-US and ES (`src/i18n/locales/*.json`, keep the three in sync).

## Commands

Node 22.12+ and pnpm 10.32.1 (`corepack enable`; without pnpm use `npm exec --yes pnpm@10.32.1 --`).

```sh
pnpm dev                 # Chrome with HMR (dev:edge, dev:firefox)
pnpm typecheck           # wxt prepare && tsc --noEmit
pnpm lint
pnpm format:check        # prettier; `pnpm format` to fix
pnpm test                # vitest: tests/unit + tests/integration (Node env, fake-indexeddb via tests/setup.ts)
pnpm build:all           # .output/{chrome,edge,firefox}-mv3
pnpm test:e2e            # Playwright, Chromium only
```

- Single unit/integration test: `pnpm exec vitest run tests/unit/generate.test.ts` or `-t "<name>"`.
- Single e2e test: `pnpm exec playwright test -g "<test title>"`.
- **E2E loads the built extension from `.output/chrome-mv3`**: run `pnpm build:chrome` (or `build:all`) before `test:e2e`, or it tests stale code. Each test uses a temporary persistent profile; first run needs `pnpm exec playwright install chromium`.
- Full validation (also what CI runs): typecheck → lint → format:check → test → build:all → test:e2e. A passing build is not a real-browser validation of the native side panel.

## Architecture

WXT (MV3) + React 19 + TypeScript + Tailwind v4 + Dexie. Feature-based: `src/entrypoints/*` only bootstrap; browser APIs and persistence live in `src/infrastructure/*`.

- **Entrypoints**: `sidepanel`, `dashboard` (full tab) and `options` all render the same `shared/app.tsx` (`page="editor" | "settings"`); `onboarding` is separate and opened by `background.ts` only on install. Firefox has no `sidePanel` permission (see `wxt.config.ts`). The manifest CSP sets `connect-src 'none'`: no network at all.
- **Data flow**: `features/tickets/use-workspace.ts` owns state. It loads via `local-repository.ts`, debounces saves (400 ms), and watches the DB with Dexie `useLiveQuery` to detect changes from other windows. Each save is optimistic-concurrency: `save(value, expectedRevision)` checks the revision inside the transaction and throws `ConflictError`. A newer observed revision reloads (if not dirty) or sets `conflict` (if dirty). `reload()` bumps `reloadId`, which is the `key` of `TicketEditor`, so any reload remounts the form (and drops focus); only react to revisions strictly newer than the local one.
- **Storage/crypto**: DB `service-desk-local-v2` has `deviceKeys` (non-extractable AES-GCM `CryptoKey`) and `localWorkspace` (one row: revision + encrypted envelope). AAD is `local-workspace:2:<revision>`, so ciphertext is bound to its revision. No password in normal use.
- **Legacy**: DB `service-desk-v1` (password/PBKDF2 vault) must never be modified, migrated in place or deleted; `features/vault/session.ts` + `legacy-recovery/` read it only for the optional one-time recovery into an empty ticket.
- **Model**: `features/tickets/model.ts` holds the Zod schemas (ticket, settings, workspace) and `collaboratorFields`, the single list that drives both the editor form and `description-generator/generate.ts` (pure functions; empty sections/fields are omitted from output). Add a collaborator field there plus the three locale files.
- **Settings** (`sectionOrder`, theme, density, language, troubleshooting mode/marker) are part of the same encrypted workspace and are validated with `settingsSchema` before every update.
- **Styling**: design tokens are CSS variables in `shared/styles/globals.css` (light + `.dark`, mapped to Tailwind via `@theme inline`); dark mode is the `.dark` class toggled in `App`. Shared classes: `.form-section` (collapsible `<details>`), `.segmented` (native radios shown as a segmented control). `components/ui` follows shadcn/ui; `Button variant="icon"` must stay background-transparent (e2e asserts it).

## Docs

`docs/requirements.md`, `docs/architecture.md` (storage, migration, rollback), `docs/security.md`, `docs/development.md` (coverage and pre-release smoke checklist).
