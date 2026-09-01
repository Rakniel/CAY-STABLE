from pathlib import Path
import re

path = Path('CAY_ANALYZER_STABLE.html')
text = path.read_text(encoding='utf-8')
marker = '<!-- STABLE_LONG_TERM_TRACKING_V2 -->'
canonical_tags = [
    '<script src="./detector_license_guard_v1.js"></script>',
    '<script src="./detector_candidate_registry_v1.js"></script>',
    '<script src="./rfdetr_onnx_adapter_v1.js"></script>',
    '<script src="./rfdetr_onnx_runtime_v1.js"></script>',
    '<script src="./tracking_core_v1.js"></script>',
    '<script src="./tracking_confidence_cascade_v1.js"></script>',
    '<script src="./tracking_two_stage_adapter_v1.js"></script>',
    '<script src="./tracking_two_stage_runtime_patch_v1.js"></script>',
    '<script src="./reid_evidence_fusion_v1.js"></script>',
    '<script src="./pitch_membership_guard_v1.js"></script>',
    '<script src="./metric_homography_projector_v1.js"></script>',
    '<script src="./metric_camera_motion_projector_v1.js"></script>',
    '<script src="./metric_segment_registry_v1.js"></script>',
    '<script src="./metric_pitch_heatmap_v1.js"></script>',
    '<script src="./metric_attacking_direction_v1.js"></script>',
    '<script src="./metric_trajectory_smoother_v1.js"></script>',
    '<script src="./ball_player_drift_guard_v1.js"></script>',
    '<script src="./ball_candidate_continuity_v1.js"></script>',
    '<script src="./ball_event_state_v1.js"></script>',
    '<script src="./ball_kick_evidence_v1.js"></script>',
    '<script src="./ball_event_evidence_bridge_v1.js"></script>',
    '<script src="./player_stats_v1.js"></script>',
    '<script src="./metric_quality_guard_v1.js"></script>',
    '<script src="./metric_publication_guard_v1.js"></script>',
    '<script src="./tracker_state_v1.js"></script>',
    '<script src="./stable_tracking_bridge_v1.js"></script>',
    '<script src="./stable_metric_visuals_runtime_v1.js"></script>',
    '<script src="./strict_tracking_frame_guard_v1.js"></script>',
    '<script src="./manual_identity_merge_guard_v1.js"></script>',
    '<script src="./segment_reid_guard_v1.js"></script>',
    '<script src="./observed_presence_v1.js"></script>',
    '<script src="./observed_presence_report_v1.js"></script>',
    '<script src="./observed_presence_runtime_bridge_v1.js"></script>',
    '<script src="./stable_runtime_tracking_v2.js"></script>',
]

for tag in canonical_tags:
    text = re.sub(
        rf'^[ \t]*{re.escape(tag)}[ \t]*(?:\r?\n)?',
        '',
        text,
        flags=re.MULTILINE,
    )
text = re.sub(
    rf'^[ \t]*{re.escape(marker)}[ \t]*(?:\r?\n)?',
    '',
    text,
    flags=re.MULTILINE,
)

needle = '</body>'
if needle not in text:
    raise SystemExit('ERROR: </body> not found')

prefix, suffix = text.split(needle, 1)
payload = marker + '\n' + '\n'.join(canonical_tags)
text = prefix.rstrip() + '\n\n' + payload + '\n' + needle + suffix

if text.count(marker) != 1:
    raise SystemExit('ERROR: integration marker is not unique')
positions = [text.index(tag) for tag in canonical_tags]
if positions != sorted(positions):
    raise SystemExit('ERROR: tracking runtime scripts are not in canonical order')
if any(text.count(tag) != 1 for tag in canonical_tags):
    raise SystemExit('ERROR: tracking runtime script duplicated')

path.write_text(text, encoding='utf-8')
print('integrated long-term tracking runtime in canonical dependency order')
