# OSS browser media audit — 2026-10-15

Source: https://github.com/roboflow/supervision-js ; release v0.2.9 (2026-10-14), inspected main commit 1e7325d93200a0f141f284f9bc767496a128dc2e. **License MIT**, upstream LICENSE verified. No external code, models, weights or dependencies copied.

Candidate function: browser MediaSession synchronized with video boxes, polygons, labels, heatmaps and editing. Could replace CAY's custom playback/annotation UI glue, **not** its detector, tracking, homography or physical evidence guards. Compare roboflow/trackers v2.6.1 (Apache-2.0): better for offline Python ByteTrack/BoT-SORT tracking, whereas supervision-js is browser UI only. Estimated **3–6 engineering days avoided if adopted**, not measured. Risks: npm bundling/transitive licenses, WebCodecs HEVC/Firefox, Safari/Firefox frame upload fallback, no audio, 1M-frame cap. **Status: STUDIED / NOT INTEGRATED**, pending real CAY video A/B and bundle/performance/license checks.

This change uses the **existing** CAY tactical field, drawn marks and canonical lineup to export PNG/SVG, without importing an external screenshot library or duplicating formations. Club crest copied byte-for-byte from the existing embedded PNG in index.html, without redesign. Browser PNG smoke test remains necessary before declaring production-ready.
