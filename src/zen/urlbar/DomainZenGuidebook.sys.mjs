/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { normalizeShortcutCandidate } from "./DomainZenResolver.sys.mjs";

const URL_PREF = "domainzen.guidebook-url";
const CACHE_PREF = "domainzen.guidebook-cache-json";
const CACHE_TIME_PREF = "domainzen.guidebook-cache-time";
const CACHE_SOURCE_PREF = "domainzen.guidebook-cache-source";
const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_GUIDEBOOK_BYTES = 256 * 1024;
const MAX_DOMAINS = 1000;

let inFlight = null;
let inFlightUrl = "";
let memoryGuidebook = null;
let memoryFetchedAt = 0;
let memorySourceUrl = "";

function readStringPref(name, fallback = "") {
  try {
    return Services.prefs.getStringPref(name, fallback);
  } catch {
    return fallback;
  }
}

function readIntPref(name, fallback = 0) {
  try {
    return Services.prefs.getIntPref(name, fallback);
  } catch {
    return fallback;
  }
}

function writeStringPref(name, value) {
  try {
    Services.prefs.setStringPref(name, value);
  } catch {}
}

function writeIntPref(name, value) {
  try {
    Services.prefs.setIntPref(name, value);
  } catch {}
}

function safeHttpsUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  try {
    const url = new URL(value.trim());
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

function validateGuidebook(value) {
  if (
    !value ||
    value.schema_version !== 1 ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    !Array.isArray(value.domains) ||
    value.domains.length > MAX_DOMAINS
  ) {
    return null;
  }

  const used = new Set();
  const domains = [];
  for (const entry of value.domains) {
    if (!entry || typeof entry.name !== "string") {
      return null;
    }
    const name = normalizeShortcutCandidate(entry.name);
    const destination = safeHttpsUrl(entry.destination);
    const aliases = Array.isArray(entry.aliases) ? entry.aliases : [];
    if (!name || !destination || aliases.length > 32) {
      return null;
    }

    const normalizedAliases = [];
    for (const alias of aliases) {
      const normalized = normalizeShortcutCandidate(alias);
      if (!normalized) {
        return null;
      }
      normalizedAliases.push(normalized);
    }

    for (const key of [name, ...normalizedAliases]) {
      if (used.has(key)) {
        return null;
      }
      used.add(key);
    }
    domains.push({
      name,
      destination,
      aliases: normalizedAliases,
    });
  }

  return {
    schema_version: 1,
    name: value.name.trim().slice(0, 120),
    domains,
  };
}

function readCachedGuidebook() {
  const cached = readStringPref(CACHE_PREF);
  if (!cached || cached.length > MAX_GUIDEBOOK_BYTES) {
    return null;
  }
  try {
    return validateGuidebook(JSON.parse(cached));
  } catch {
    return null;
  }
}

/**
 * Returns the last validated guidebook immediately when possible, otherwise
 * fetches the configured HTTPS JSON document. Failed refreshes never erase the
 * last known-good cache. This is deliberately a small, bounded cache.
 */
export async function getDomainZenGuidebook({ forceRefresh = false } = {}) {
  const sourceUrl = safeHttpsUrl(readStringPref(URL_PREF));
  if (!sourceUrl) {
    return null;
  }

  const now = Date.now();
  if (
    !forceRefresh &&
    memoryGuidebook &&
    memorySourceUrl === sourceUrl &&
    now - memoryFetchedAt < CACHE_TTL_MS
  ) {
    return memoryGuidebook;
  }

  const persistedTime = readIntPref(CACHE_TIME_PREF) * 1000;
  const persisted =
    readStringPref(CACHE_SOURCE_PREF) === sourceUrl
      ? readCachedGuidebook()
      : null;
  if (
    !forceRefresh &&
    persisted &&
    now - persistedTime < CACHE_TTL_MS
  ) {
    memoryGuidebook = persisted;
    memoryFetchedAt = persistedTime;
    memorySourceUrl = sourceUrl;
    return persisted;
  }

  if (inFlight && inFlightUrl === sourceUrl) {
    return inFlight;
  }

  inFlightUrl = sourceUrl;
  const requestUrl = sourceUrl;
  inFlight = (async () => {
    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        credentials: "omit",
        cache: "no-store",
        redirect: "follow",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (
        !response.ok ||
        !safeHttpsUrl(response.url) ||
        !/application\/(?:[a-z.+-]*\+)?json\b/i.test(
          response.headers.get("content-type") || ""
        )
      ) {
        return persisted || (memorySourceUrl === sourceUrl ? memoryGuidebook : null);
      }

      const text = await response.text();
      if (new TextEncoder().encode(text).byteLength > MAX_GUIDEBOOK_BYTES) {
        return persisted || (memorySourceUrl === sourceUrl ? memoryGuidebook : null);
      }

      const guidebook = validateGuidebook(JSON.parse(text));
      if (!guidebook) {
        return persisted || (memorySourceUrl === sourceUrl ? memoryGuidebook : null);
      }

      memoryGuidebook = guidebook;
      memoryFetchedAt = Date.now();
      memorySourceUrl = requestUrl;
      writeStringPref(CACHE_PREF, JSON.stringify(guidebook));
      writeStringPref(CACHE_SOURCE_PREF, requestUrl);
      writeIntPref(CACHE_TIME_PREF, Math.floor(memoryFetchedAt / 1000));
      return guidebook;
    } catch {
      return persisted || (memorySourceUrl === sourceUrl ? memoryGuidebook : null);
    } finally {
      if (inFlightUrl === requestUrl) {
        inFlight = null;
        inFlightUrl = "";
      }
    }
  })();

  return inFlight;
}

/** Test-only reset hook. */
export function resetDomainZenGuidebookCacheForTests() {
  memoryGuidebook = null;
  memoryFetchedAt = 0;
  memorySourceUrl = "";
  inFlight = null;
  inFlightUrl = "";
}
