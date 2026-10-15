<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
-->

# DomainZen

**DomainZen is an experimental Zen Browser fork concept for user-controlled domain guidebooks.** A guidebook is a small JSON file that defines explicit shortcuts such as `docs` → `https://developer.mozilla.org/`.

> **Status:** the first implementation pass adds guidebook settings, bounded HTTPS fetch/cache/validation, and address-bar suggestions for exact shortcuts. It has not yet been built or run in a full Zen browser environment. This repository is experimental; do not treat it as a finished browser release.

## What we're building

- **User-chosen guidebook URL:** configure an HTTPS JSON URL under Settings → Look and Feel → URL Bar → Domain guidebook.
- **Explicit shortcuts:** names and aliases map to full HTTPS URLs. A matching bare word appears as an alternative address-bar suggestion; normal URL navigation and the default search heuristic keep priority. This does not yet automatically intercept a failed page load or DNS failure.
- **Safety first:** validate the guidebook, reject duplicate shortcut names, require HTTPS destinations, and keep ordinary URL navigation working. Native URL/search handling must take priority; the helper only matches a bare single-word shortcut and does not probe the network.
- **Release automation:** validate changes in GitHub Actions; native browser builds/releases need to be wired to the upstream build pipeline and configured signing/secrets before they can be published.

## Try the guidebook format

See [`guidebook.json`](./domainzen/guidebook.json) for an example and [`guidebook.schema.json`](./domainzen/guidebook.schema.json) for its schema.

A guidebook is data, not executable HTML or JavaScript. The browser fetches and validates the JSON as data, never executes it. Destinations must use HTTPS. The guidebook provider is disabled in private windows. Failed refreshes preserve the last valid cache for the same configured URL. Don't put passwords, tokens, or other secrets in a public guidebook.

## Development status

- [x] Initial versioned JSON guidebook format
- [x] JSON Schema for guidebook validation
- [x] GitHub Actions validation workflow
- [x] Settings UI for guidebook URL, refresh, enable/disable
- [x] HTTPS-only fetch, bounded JSON validation, 15-minute cache, and last-known-good fallback
- [x] Safe pure shortcut-matching helper (`src/zen/urlbar/DomainZenResolver.sys.mjs`)
- [x] Address-bar provider registered for exact bare-word shortcut suggestions
- [x] Node resolver tests and browser-chrome resolver tests added (not yet run in a full Zen build)
- [ ] Reproducible native builds and release pipeline

## Upstream

DomainZen is based on [Zen Browser](https://github.com/zen-browser/desktop), a Firefox-based browser. See [the upstream contribution guide](https://github.com/zen-browser/desktop/blob/dev/docs/contribute.md) and preserve the Mozilla Public License notices.

