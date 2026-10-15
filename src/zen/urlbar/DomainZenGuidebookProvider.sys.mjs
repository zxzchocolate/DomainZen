/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
  UrlbarProvider,
  UrlbarUtils,
} from "moz-src:///browser/components/urlbar/UrlbarUtils.sys.mjs";
import { UrlbarShared } from "chrome://browser/content/urlbar/UrlbarShared.mjs";
import { resolveGuidebookShortcut } from "./DomainZenResolver.sys.mjs";
import { getDomainZenGuidebook } from "./DomainZenGuidebook.sys.mjs";

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  UrlbarResult: "chrome://browser/content/urlbar/UrlbarResult.mjs",
  UrlbarPrefs: "moz-src:///browser/components/urlbar/UrlbarPrefs.sys.mjs",
});

export class DomainZenGuidebookProvider extends UrlbarProvider {
  get name() {
    return "DomainZenGuidebookProvider";
  }

  get type() {
    return UrlbarShared.PROVIDER_TYPE.PROFILE;
  }

  async isActive(queryContext) {
    if (queryContext.isPrivate || !queryContext.trimmedSearchString) {
      return false;
    }
    return !!queryContext.sources?.includes(
      UrlbarShared.RESULT_SOURCE.OTHER_LOCAL
    );
  }

  async startQuery(queryContext, addCallback) {
    const input = queryContext.trimmedSearchString;
    const instance = this.queryInstance;
    const guidebook = await getDomainZenGuidebook();
    if (instance != this.queryInstance || !guidebook) {
      return;
    }

    const match = resolveGuidebookShortcut(input, guidebook);
    if (!match) {
      return;
    }

    addCallback(
      this,
      new lazy.UrlbarResult({
        type: UrlbarShared.RESULT_TYPE.URL,
        source: UrlbarShared.RESULT_SOURCE.OTHER_LOCAL,
        payload: {
          url: match.destination,
          title: `DomainZen · ${match.name}`,
          displayUrl: match.destination,
          icon: UrlbarShared.getIconForUrl(match.destination),
        },
        suggestedIndex: 2,
      })
    );
  }

  async pickResult(result, item) {
    // Standard URL result handling opens result.payload.url.
  }
}
