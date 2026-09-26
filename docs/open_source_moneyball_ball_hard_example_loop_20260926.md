# Open-source audit — SMozaffar/moneyball ball hard-example loop

Date: 2026-09-26

## Provenance

- Project: `SMozaffar/moneyball`
- Upstream revision audited: `cd6cc307f4d8d89cec8893dc33aa84edec79f838`
- Upstream LICENSE: MIT (copyright 2025).
- CAY-STABLE integration type: methodology/reference only in this change; no upstream source code, weights, dataset, generated labels or binary artifacts copied.

## Useful idea

The upstream pipeline has a pragmatic football-ball improvement loop that is useful for later CAY ball work: generate candidate crops from detector output and/or a motion fallback, keep negative crops, label compact crops rather than full panoramic frames, preview labels before training, then fine-tune on hard examples. Its motion fallback searches small moving blobs inside a field mask and ranks candidates with temporal proximity to the previous ball.

This is especially relevant to C.A. Yenne footage because a ball can occupy very few pixels in wide plans. Crop-first annotation avoids repeatedly labeling mostly irrelevant full frames and deliberately retaining negative crops provides examples of lines, shoes, highlights and other ball-like false positives.

## What CAY already has / must not be replaced

CAY-STABLE already has `ball_candidate_continuity_v1.js`, which is stricter than the upstream fallback for publication: it rejects missing continuity metadata, resets across segment/plan changes and observation gaps, supports pitch-space continuity, rejects drifted/invisible candidates, and returns `UNAVAILABLE` when no candidate is defensible.

Therefore the upstream motion fallback MUST NOT replace CAY continuity or publication gates. If a future candidate generator is adapted, its outputs are only low-level proposals and must pass the existing CAY evidence, continuity, roster, coverage and event gates.

## License boundary

MIT permits reuse/modification with preservation of the copyright and permission notice. This audit does not admit transitive dependencies or model assets. In particular, YOLO/Ultralytics code and weights, Torch/OpenCV packages, CVAT, pretrained weights, user-trained weights, datasets and exported annotations have independent licenses/terms and require their own admission decision before distribution or runtime integration.

No upstream code is copied by this commit, so no MIT notice is added to a runtime bundle yet.

## Proposed CAY adaptation

When ball work becomes the active milestone, prefer a CAY-native hard-example queue rather than a second tracker:

1. collect only frames/crops where the current ball detector is absent, ambiguous, continuity-rejected or close to a player but low-confidence;
2. retain explicit negatives instead of silently discarding them;
3. attach plan/segment, frame time, source and rejection reason to every crop manifest entry;
4. preview/validate annotations before training;
5. benchmark the candidate detector before/after on the same held-out CAY clips;
6. never allow a motion-only proposal to create possession/pass/shot evidence without passing existing fail-closed gates.

This extends CAY's existing logic rather than duplicating it.

## Expected gain

Estimated work avoided: 1–3 days when the ball milestone starts, mainly in designing a practical hard-example collection/annotation loop and rediscovering the value of retained negatives on tiny-ball footage.

Expected measurable impact: faster creation of a CAY-specific ball validation/training set and, after a separately licensed detector is trained and benchmarked, lower false-positive rate on hard negatives and better recall on tiny/far-side balls. No runtime accuracy gain is claimed by this documentation-only change.

## Status

- Source/licence: audited.
- Methodology: accepted for future CAY adaptation.
- Runtime code: not integrated.
- Weights/data: not admitted.
- Risk: motion blobs are intrinsically ambiguous under camera motion, players' feet, line highlights and compression; they remain proposal generators only.
