# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A monorepo of small, independent, unpublished Chrome extensions (Manifest V3). Each extension is a self-contained folder — there is no shared build system, package manager, or dependency between them. There's also no test suite, linter, or build step: these are plain vanilla JS/CSS/HTML loaded directly by Chrome.

## Repo layout

Each extension lives in its own top-level folder as `<extension-name>/files/`, containing:
- `manifest.json` — MV3 manifest (name, version, permissions, content script matches)
- `content.js` — injected into the target site, reads `chrome.storage` and toggles `document.body` classes or injects a `<style>` tag
- `popup.js` + `popup.html` — the toolbar popup UI, reads/writes the same `chrome.storage` keys
- `styles.css` — CSS rules gated behind the `hide-*` body classes (when the extension uses that pattern)
- `icon.png` — toolbar icon

Screenshots/preview images referenced by the root `README.md` live alongside each extension folder (outside `files/`), e.g. `whatsapp-clean-header/wpp-clean-header.png`.

Current extensions:
- `whatsapp-clean-header/` — hides Status/Canais/Comunidades/Meta AI/Filtros icons on WhatsApp Web
- `pinterest-feed-width-control/` — controls Pinterest feed column width via a popup slider
- `youtube-no-comments/` — hides YouTube comments (always on) and lets the sidebar be hidden

## Development workflow

There is no build/lint/test command. To try changes:
1. Edit files directly under `<extension>/files/`.
2. In Chrome, go to `chrome://extensions/`, enable **Developer mode**, and **Load unpacked** → select the extension's `files/` folder (or click the reload icon on an already-loaded extension after editing).
3. Reload the target site tab (WhatsApp Web / Pinterest / YouTube) to re-run the content script, or use the popup to verify storage-driven behavior without a full reload.
4. Bump the `version` field in `manifest.json` when shipping a meaningful change to an extension.

## Architecture pattern shared across extensions

All three extensions follow the same storage-driven toggle pattern between `popup.js` and `content.js`:

1. **Preferences are a flat list of string keys** (e.g. `const preferences = ['status', 'channels', ...]`) mirrored between `popup.js` and `content.js` — keep these two lists in sync manually when adding/removing a toggle.
2. **`popup.js`** reads current values from `chrome.storage` on open to set checkbox state, and writes a single key via `chrome.storage.local.set({...})` on each checkbox `change` event.
3. **`content.js`** reads the same keys on load and applies them (usually via `document.body.classList.add/remove('hide-<key>')`, matched by CSS in `styles.css`), then subscribes to `chrome.storage.onChanged` to re-apply live without a page reload.
4. Storage area is **not consistent across extensions** — WhatsApp/YouTube use `chrome.storage.local`; Pinterest uses `chrome.storage.sync` (and pushes changes via an explicit tab reload from the popup instead of a live listener, plus a `MutationObserver` in `content.js` to reassert injected styles against Pinterest's own re-renders). Match whichever storage area and update mechanism the extension you're editing already uses.
5. Content scripts are permission-scoped per-site via `matches`/`host_permissions` in `manifest.json` — there is no cross-extension shared code to update when adding a new site-specific behavior.

## Language

READMEs, UI copy, and code comments are in Brazilian Portuguese. Keep new user-facing strings and comments consistent with that unless told otherwise.
