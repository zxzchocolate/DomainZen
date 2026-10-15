/* Any copyright is dedicated to the Public Domain.
   https://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

ChromeUtils.defineESModuleGetters(this, {
  normalizeShortcutCandidate:
    "resource:///modules/DomainZenResolver.sys.mjs",
  resolveGuidebookShortcut:
    "resource:///modules/DomainZenResolver.sys.mjs",
});

const GUIDEBOOK = {
  schema_version: 1,
  name: "Test guidebook",
  domains: [
    {
      name: "docs",
      aliases: ["mdn", "dev-docs"],
      destination: "https://developer.mozilla.org/",
    },
    {
      name: "example",
      destination: "https://example.com/path",
    },
  ],
};

add_task(function test_shortcut_candidate_normalization() {
  Assert.equal(normalizeShortcutCandidate("  Docs  "), "docs");
  Assert.equal(normalizeShortcutCandidate("dev-docs"), "dev-docs");
  Assert.equal(normalizeShortcutCandidate("example.com"), null);
  Assert.equal(normalizeShortcutCandidate("https://example.com"), null);
  Assert.equal(normalizeShortcutCandidate("two words"), null);
  Assert.equal(normalizeShortcutCandidate("docs/path"), null);
  Assert.equal(normalizeShortcutCandidate(""), null);
});

add_task(function test_exact_names_and_aliases_resolve() {
  Assert.deepEqual(resolveGuidebookShortcut("docs", GUIDEBOOK), {
    shortcut: "docs",
    name: "docs",
    destination: "https://developer.mozilla.org/",
  });
  Assert.deepEqual(resolveGuidebookShortcut("MDN", GUIDEBOOK), {
    shortcut: "mdn",
    name: "docs",
    destination: "https://developer.mozilla.org/",
  });
  Assert.equal(
    resolveGuidebookShortcut("dev-docs", GUIDEBOOK).destination,
    "https://developer.mozilla.org/"
  );
});

add_task(function test_invalid_or_unsupported_entries_do_not_resolve() {
  Assert.equal(resolveGuidebookShortcut("missing", GUIDEBOOK), null);
  Assert.equal(
    resolveGuidebookShortcut("docs", {
      schema_version: 2,
      domains: GUIDEBOOK.domains,
    }),
    null
  );
  Assert.equal(
    resolveGuidebookShortcut("unsafe", {
      schema_version: 1,
      domains: [
        {
          name: "unsafe",
          destination: "http://example.com/",
        },
      ],
    }),
    null
  );
  Assert.equal(
    resolveGuidebookShortcut("example.com", GUIDEBOOK),
    null,
    "A normal domain must not be treated as a shortcut"
  );
});
