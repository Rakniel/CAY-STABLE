# Open-source/data audit — Driblab football tracking data

Date inspected: 2026-09-05

## Source
- Project/source: `driblab/open-data`
- Repository: https://github.com/driblab/open-data
- Advertised content: broadcast-derived football tracking data for 10 matches, sampled at 10 FPS, with player/ball positions, velocities, accelerations, visibility and camera projection metadata.
- Format version advertised by the repository at inspection: `0.1379`.

## Why it was useful to inspect
The dataset shape would be highly useful as an external benchmark for CAY-STABLE distance, velocity, acceleration sanity checks and camera-visibility handling, because it exposes both metric positions and provider-computed kinematics.

## Licence decision
No explicit reusable data licence was found in the repository material inspected. A public GitHub repository is not enough to grant reuse rights. Under the CAY-STABLE policy, absence of an explicit compatible licence means **no copying, embedding, fixture extraction or automated benchmark ingestion**.

## CAY decision
- Data copied: none.
- Code copied: none.
- Runtime dependency added: none.
- Dataset added to tests: no.
- Status: **REJECTED / licence non démontrée**.

## What this would have replaced
If a compatible licence were published later, the data could replace part of the bespoke synthetic metric benchmark work by providing realistic broadcast-derived reference trajectories with speed/acceleration/camera fields.

## Estimated work avoided if licence becomes usable
Roughly 0.5–1.5 days for assembling equivalent realistic benchmark fixtures and reference kinematics manually.

## Risk / follow-up
Do not use the dataset unless its owner publishes terms that explicitly permit the intended reuse. CAY may continue to use the public format description as factual architecture research, but not the underlying records.
