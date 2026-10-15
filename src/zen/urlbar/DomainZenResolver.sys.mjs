/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * DomainZen's safe, deterministic guidebook resolver.
 *
 * This module deliberately does not perform network requests. The URL bar's
 * native URL/search heuristics must get first refusal; callers should invoke
 * this resolver only for an otherwise-unclaimed, single-token input.
 */

const MAX_SHORTCUT_LENGTH = 64;
const SHORTCUT_RE = /^[a-z0-9][a-z0-9_-]*$/i;

function parseHttpsDestination(value) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Returns a normalized shortcut candidate, or null if the input looks like
 * an ordinary URL, a search query, or a malformed shortcut.
 *
 * A bare word such as "docs" is eligible. Dotted names such as "example.com",
 * explicit schemes, paths, ports, IP literals, and multi-word queries are not.
 *
 * @param {string} input
 * @returns {string|null}
 */
export function normalizeShortcutCandidate(input) {
  if (typeof input !== "string") {
    return null;
  }

  const candidate = input.trim();
  if (
    !candidate ||
    candidate.length > MAX_SHORTCUT_LENGTH ||
    /[\s./:\\?#@%]/.test(candidate) ||
    !SHORTCUT_RE.test(candidate)
  ) {
    return null;
  }

  return candidate.toLocaleLowerCase("en-US");
}

/**
 * Finds an exact shortcut/alias in a parsed DomainZen guidebook.
 *
 * Invalid entries are ignored instead of allowing a broken or unsafe mapping
 * to interfere with ordinary browsing.
 *
 * @param {string} input
 * @param {object} guidebook Parsed guidebook JSON.
 * @returns {{ shortcut: string, name: string, destination: string }|null}
 */
export function resolveGuidebookShortcut(input, guidebook) {
  const shortcut = normalizeShortcutCandidate(input);
  if (
    !shortcut ||
    !guidebook ||
    guidebook.schema_version !== 1 ||
    !Array.isArray(guidebook.domains)
  ) {
    return null;
  }

  for (const entry of guidebook.domains) {
    if (!entry || typeof entry.name !== "string") {
      continue;
    }

    const name = normalizeShortcutCandidate(entry.name);
    const aliases = Array.isArray(entry.aliases) ? entry.aliases : [];
    const candidates = [name, ...aliases.map(normalizeShortcutCandidate)];

    if (!candidates.includes(shortcut)) {
      continue;
    }

    const destination = parseHttpsDestination(entry.destination);
    if (!destination) {
      continue;
    }

    return { shortcut, name: entry.name, destination };
  }

  return null;
}
