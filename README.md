# Scroll-timeline Polyfill

A polyfill of ScrollTimeline and ViewTimeline as defined by the [spec](https://drafts.csswg.org/scroll-animations-1/).

View a [cool demo showing its usage](https://plain-insure.github.io/scroll-timeline/demo/parallax/)!

# Usage

To use this polyfill, import the module into your site and you can start creating animations that use a `ScrollTimeline` or `ViewTimeline`.

```js
import 'https://plain-insure.github.io/scroll-timeline/dist/scroll-timeline.js';

document.getElementById('parallax').animate(
    { transform: ['translateY(0)', 'translateY(100px)']},
    { fill: 'both',
      timeline: new ScrollTimeline({
        source: document.documentElement,
      }),
      rangeStart: new CSSUnitValue(0, 'px'),
      rangeEnd: new CSSUnitValue(200, 'px'),
    });
```

Also works with CSS Animations that use a `view-timeline` or `scroll-timeline`

```html
<script src="https://plain-insure.github.io/scroll-timeline/dist/scroll-timeline.js"></script>
```

```css
@keyframes parallax-effect {
  to { transform: translateY(100px) }
}
#parallax {
  animation: parallax-effect linear both;
  animation-timeline: scroll(block root);
  animation-range: 0px 200px;
}
```

Please ensure your CSS is hosted on the same domain as your website or included directly on the page within a <style> tag.

If you are loading stylesheets from other origins, the polyfill might not be able to fetch and apply them correctly, due to browser security restrictions.

For more details on and use-cases of scroll-driven animations, please refer to [https://developer.chrome.com/articles/scroll-driven-animations/](https://developer.chrome.com/articles/scroll-driven-animations/) and [https://scroll-driven-animations.style/](https://scroll-driven-animations.style/)

# Not implemented

The current draft keeps evolving, and this polyfill still has some larger gaps that would require broader architectural work rather than a surgical patch. At the moment, the following areas are not fully implemented:

- Full spec-complete CSS parsing/validation for every `animation-timeline`, `animation-range`, `scroll()`, and `view()` edge case.
- Full named timeline lookup parity with the current flat-tree/tree-order scoping rules in all DOM structures, including more complex descendant/sibling/shadow-DOM cases.
- Full view-timeline range fidelity for cases called out in the codebase TODOs such as sticky positioning and other layout-sensitive edge cases.
- Complete WPT parity with the latest draft across all declarative and imperative APIs.

# Fixes in this fork

The following bugs are fixed in this fork relative to the upstream [flackr/scroll-timeline](https://github.com/flackr/scroll-timeline).

## CSS parser: comma splitting ignores parentheses

**Symptom:** `Could not parse start offset "50%)"` (or similar fragment with a stray closing parenthesis).

**Root cause:** `extractMatches` and `extractScrollTimelineNames` split comma-separated CSS values using a naive `String.split(',')`. Any CSS function that uses a comma internally — `clamp(0%, 50%, 100%)`, `var(--x, fallback)`, `min(...)`, `max(...)` — would be split at the internal comma, producing malformed fragments like `50%)` as a separate token.

**Example:** `animation-range: entry clamp(0%, 50%), cover` was split into `['entry clamp(0%', '50%)', 'cover']` instead of `['entry clamp(0%, 50%)', 'cover']`.

**Fix:** Added `splitByCommaRespectingParens()` which tracks parenthesis depth and only splits on commas at depth zero. Used in place of `String.split(',')` throughout the CSS parser. ([scroll-timeline-css-parser.js](src/scroll-timeline-css-parser.js))

## CSS parser: `var()` in `animation-range` not resolved

**Symptom:** `Could not parse start offset "var(--sr-range-start, entry 20%)"`.

**Root cause:** After the comma-split fix correctly preserved `var(--sr-range-start, entry 20%)` as a single token, `CSSNumericValue.parse()` still cannot handle `var()` — it expects a resolved numeric or named value.

**Fix:** Added `resolveVarValue(value, element)` which resolves `var(--prop, fallback)` references against the animated element's computed styles (`getComputedStyle`). If the custom property is defined on the element, its value is used; otherwise the fallback inside the `var()` is substituted. Nested `var()` calls are resolved recursively. `parseAnimationRange` now accepts an optional `element` parameter and resolves `var()` references before tokenising. The `ProxyAnimation` constructor passes `animation.effect?.target` as the element. ([proxy-animation.js](src/proxy-animation.js))

## Other fixes

- **Vite dev server support**: The polyfill's CSS injection now works with Vite's dev server (`localhost:5173`) in addition to production builds.
- **Skip semicolon at-rules**: The CSS parser no longer chokes on at-rules that end with a semicolon (e.g. `@charset`, `@import`) instead of a block.
- **Restart animations on style addition**: Animations are restarted when new styles are added to the DOM so scroll-driven animations pick up dynamically injected stylesheets.

---

# Fork credits for imported fixes

This repository has incorporated a small set of targeted fixes from community forks. Credit for the source work goes to:

- **Viewport unit support (`vw`, `vh`, `vmin`, `vmax`)**: [SalahAdDin/scroll-timeline](https://github.com/SalahAdDin/scroll-timeline) by [@SalahAdDin](https://github.com/SalahAdDin)
- **`timeline-scope` support**: [johannesodland/scroll-timeline](https://github.com/johannesodland/scroll-timeline) by [@johannesodland](https://github.com/johannesodland)
- **Zero-scroll-distance / non-overflow animation guard fixes**: [nedap/scroll-timeline](https://github.com/nedap/scroll-timeline) by [@nedap](https://github.com/nedap)
- **TypeScript entry declarations**: [jhoopmann/scroll-timeline](https://github.com/jhoopmann/scroll-timeline) by [@jhoopmann](https://github.com/jhoopmann)

# Contributing
  
### 1. Polyfill dev 

Running a dev environment

```shell script
npm i
npm run dev 
```

Then open the browser `http://localhost:3000`, choose one of the demos (test) to see how your changes. 

#### Run the unit tests

```shell script
npm test
```

### 2. Configure & Run Tests

Test configurations are available in: `test/tests.config.json` that file includes:

1. polyfillFiles: an array of our JS shim / polyfill files, those will be injected in WPT tests files.
2. harnessTests: an array of WPT harness tests we want to test the polyfill against.
3. browsers.local: Browser our local selenium-webdriver will test against
4. browsers.sauce: Browser our local selenium-webdriver will test against in Saucelabs / CI environment.   

#### Run the tests locally

Simple test will serve the WPT tests folder and intercepts requests, if the request path matches a harness test we are interested in polyfilling, it will inject the polyfill.

*Required environment variables:*

```dotenv
WPT_DIR=test/wpt #defaults to test/wpt
WPT_SERVER_PORT=8081 # choose any port available on your machine
```

*Command*

```shell script
npm run test:simple
```

Go to `localhost:8081/scroll-animations/current-time-nan.html` as an example.

#### Run the tests via Web Driver

##### Local web driver

*Required environment variables:*

```dotenv
WPT_DIR=test/wpt #defaults to test/wpt
WPT_SERVER_PORT=8081 # choose any port available on your machine
LOCAL_BROWSER=chrome # choose one of 'chrome', 'edge', 'firefox', 'safari'
LOCAL_WEBDRIVER_BIN=? #/path/to/webdriver-binaries
```

*Command*

```shell script
npm run test:wpt
```

##### SauceLabs / CI

*Required environment variables:*

```dotenv
TEST_ENV=sauce
WPT_DIR=test/wpt #defaults to test/wpt
WPT_SERVER_PORT=8081 # choose any port available on your machine
SC_TUNNEL_ID=sc-wpt-tunnel # please specify 'sc-wpt-tunnel' as a SauceConnect Proxy Tunnel ID

SAUCE_NAME=<secret> # Your saucelabs account username
SAUCE_KEY=<secret> # Your API key
```

*Command*

```shell script
TEST_ENV=sauce npm run test:wpt
```
