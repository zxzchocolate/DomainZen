import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeShortcutCandidate,
  resolveGuidebookShortcut,
} from "../../src/zen/urlbar/DomainZenResolver.sys.mjs";

const guidebook = {
  schema_version: 1,
  name: "Test",
  domains: [
    {
      name: "docs",
      aliases: ["mdn", "dev-docs"],
      destination: "https://developer.mozilla.org/",
    },
    { name: "example", destination: "https://example.com/path" },
  ],
};

test("normalizes bare shortcut candidates only", () => {
  assert.equal(normalizeShortcutCandidate(" Docs "), "docs");
  assert.equal(normalizeShortcutCandidate("dev-docs"), "dev-docs");
  for (const input of [
    "",
    "two words",
    "example.com",
    "https://example.com",
    "docs/path",
    "docs:8080",
    "user@example.com",
  ]) {
    assert.equal(normalizeShortcutCandidate(input), null, input);
  }
});

test("resolves exact names and aliases case-insensitively", () => {
  assert.deepEqual(resolveGuidebookShortcut("docs", guidebook), {
    shortcut: "docs",
    name: "docs",
    destination: "https://developer.mozilla.org/",
  });
  assert.equal(
    resolveGuidebookShortcut("MDN", guidebook).destination,
    "https://developer.mozilla.org/"
  );
  assert.equal(
    resolveGuidebookShortcut("dev-docs", guidebook).destination,
    "https://developer.mozilla.org/"
  );
});

test("rejects invalid destinations and unsupported guidebooks", () => {
  assert.equal(
    resolveGuidebookShortcut("unsafe", {
      schema_version: 1,
      domains: [{ name: "unsafe", destination: "http://example.com/" }],
    }),
    null
  );
  assert.equal(
    resolveGuidebookShortcut("docs", {
      schema_version: 2,
      domains: guidebook.domains,
    }),
    null
  );
  assert.equal(resolveGuidebookShortcut("example.com", guidebook), null);
  assert.equal(resolveGuidebookShortcut("unknown", guidebook), null);
});
