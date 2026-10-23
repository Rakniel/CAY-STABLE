# RUN190 — real-browser first-click smoke (2026-10-23)

## Why
Existing static JavaScript/HTML non-regression tests do not prove that a user can click a visible button in a real browser. RUN189 addresses blocked startup when model CDNs hang. This gate tests that specific user-visible failure with Chromium.

## Open-source component
- Source: https://github.com/microsoft/playwright
- Version pinned for CI: 1.56.1
- License: Apache-2.0 (upstream repository LICENSE).
- Scope: CI-only development/test dependency, never bundled into the CAY-STABLE application.
- Reuse: browser automation, file upload and real mouse interaction. No Playwright source code copied or modified.
- Original CAY adaptation: tests/index.html + CAY_ANALYZER_STABLE.html with optional CDN requests blocked, checks splash dismissal, video upload failure feedback, scan disabled, and help-button mouse click.
- Replaces: reliance on text-presence assertions alone for first-click readiness. Existing static tests remain; this adds non-overlapping browser behavior coverage.
- Expected impact: from zero real-browser first-click assertions to 12 assertions per run; catches regressions when a third-party model CDN stalls. Manual debugging avoided estimated 1–3 hours per incident (estimate, not benchmark).
- Status: INTEGRATED in main via PR #467 (merge 82aed2b47b9734d72f125fa939660539b85a3b0b). GitHub Actions Chromium smoke 12/12 PASS on both entry HTML files with model CDNs blocked; all four main workflows passed. This does not validate end-to-end tracking or football analytics.
- Risk: CI downloads Chromium, requires outbound network and increases CI duration; browser test deliberately does not invoke the detector or publish football metrics.

## Explicit limits
This is a *smoke test*, not evidence of reliable player tracking or calibrated physical metrics. Distance, speed, sprints, passes, possession and shots remain unavailable without their own valid evidence chain. No player identities, logo files, credentials, or club data are modified.
