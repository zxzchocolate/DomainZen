<!--
   - This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/.
-->

# DomainZen

**DomainZen is an experimental Zen Browser fork concept for user-controlled domain guidebooks.** A guidebook is a small JSON file that defines explicit shortcuts such as `docs` → `https://developer.mozilla.org/`.

> **Status:** guidebook format and validation CI are the first scaffold. The browser UI, remote-guidebook fetching, and address-bar integration are not implemented yet. This repository currently inherits the Zen Browser codebase; don't treat it as a finished DomainZen browser or download.

## What we're building

- **User-chosen guidebook URL:** users will be able to configure a HTTPS URL to a JSON guidebook.
- **Explicit shortcuts:** names and aliases map to full HTTPS URLs. They do not claim, register, or take ownership of anyone else's domain.
- **Safety first:** validate the guidebook, reject duplicate shortcut names, require HTTPS destinations, and keep ordinary URL navigation working. Native URL/search handling must take priority; the helper only matches a bare single-word shortcut and does not probe the network.
- **Release automation:** validate changes in GitHub Actions; native browser builds/releases need to be wired to the upstream build pipeline and configured signing/secrets before they can be published.

## Try the guidebook format

See [`guidebook.json`](./domainzen/guidebook.json) for an example and [`guidebook.schema.json`](./domainzen/guidebook.schema.json) for its schema.

A guidebook is data, not executable HTML or JavaScript. A browser feature that consumes it must explicitly fetch it, validate it, and ask for confirmation before any risky navigation. Don't put passwords, tokens, or other secrets in a public guidebook.

## Development status

- [x] Initial versioned JSON guidebook format
- [x] JSON Schema for guidebook validation
- [x] GitHub Actions validation workflow
- [ ] Settings UI for guidebook URL, refresh, enable/disable
- [ ] Safe fetch/cache/validation implementation in the browser
- [x] Safe pure shortcut-matching helper (`src/zen/urlbar/DomainZenResolver.sys.mjs`); not yet connected to the address bar
- [ ] Address-bar provider integration and automated tests
- [ ] Reproducible native builds and release pipeline

## Upstream

DomainZen is based on [Zen Browser](https://github.com/zen-browser/desktop), a Firefox-based browser. See [the upstream contribution guide](https://github.com/zen-browser/desktop/blob/dev/docs/contribute.md) and preserve the Mozilla Public License notices.

