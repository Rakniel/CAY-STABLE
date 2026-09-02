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
    '<script src="./pitch_geometry_guard_v1.js"></script>',
    '<script src="./pitch_membership_guard_v1.js"></script>',
    '<script src="./metric_homography_projector_v1.js"></script>',
    '<script src="./automatic_pitch_calibration_v1.js"></script>',
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

# STABLE UX policy: automatic analysis is the primary path. Manual calibration is a
# correction/fallback and must never gate tracking or the first result screen.
def replace_policy(old, new, label):
    global text
    if new in text:
        return
    if old not in text:
        raise SystemExit(f'ERROR: expected source for {label} not found')
    text = text.replace(old, new, 1)

replace_policy(
    '<div class="status" id="v55Status">Termine les 3 images de calibrage puis lance ce test unique.</div>',
    '<div class="status" id="v55Status">Charge la vidéo, choisis l’équipe puis lance l’analyse. Le terrain est calibré automatiquement ; correction manuelle seulement si nécessaire.</div>',
    'automatic analysis status',
)

replace_policy(
    "status($('scanStatus'),`${scenes.length} type(s) de plan détecté(s). Étape suivante : 3 images de référence maximum.`,'success');",
    "status($('scanStatus'),`${scenes.length} type(s) de plan détecté(s). Tu peux lancer l’analyse immédiatement ; correction terrain manuelle seulement si nécessaire.`,'success');",
    'scan completion automatic-analysis message',
)

replace_policy(
    "renderReviews();$('reviewSection').classList.add('hidden');\n  $('guidedCalibSection').classList.remove('hidden');renderGuidedRefs();\n  if(guidedCalibrationRefs.length===3&&guidedCalibrationRefs.every(r=>r.poly&&r.poly.length>=3)){",
    "renderReviews();$('reviewSection').classList.add('hidden');\n  $('guidedCalibSection').classList.remove('hidden');renderGuidedRefs();\n  $('validation55Section').classList.remove('hidden');\n  $('v55Refs').textContent=`${Math.min(3,guidedCalibrationRefs.filter(r=>r.poly&&r.poly.length>=3).length)}/3`;\n  if(guidedCalibrationRefs.length===3&&guidedCalibrationRefs.every(r=>r.poly&&r.poly.length>=3)){",
    'remove manual calibration gate before analysis',
)

replace_policy(
    " const calibrated=guidedCalibrationRefs.filter(r=>r.poly&&r.poly.length>=3).length;\n if(calibrated<3){\n   status($('v55Status'),`Calibrage incomplet : ${calibrated}/3 image(s). Termine d’abord les 3 références.`,'warning');return;\n }\n if(refsFor('team').length<3){",
    " const calibrated=guidedCalibrationRefs.filter(r=>r.poly&&r.poly.length>=3).length;\n // Calibration manuelle optionnelle : conserver le compteur comme preuve de couverture,\n // mais ne jamais bloquer l'analyse. Les métriques terrain restent INDISPONIBLE si\n // l'auto-calibrage / la projection ne fournissent pas une preuve suffisante.\n if(refsFor('team').length<3){",
    'remove runtime mandatory manual calibration gate',
)

replace_policy(
    "{label:'3 images maximum',ok:metrics.calibrationImages===3,value:`${metrics.calibrationImages}/3`},",
    "{label:'calibrage manuel optionnel (max 3)',ok:Number.isFinite(metrics.calibrationImages)&&metrics.calibrationImages>=0&&metrics.calibrationImages<=3,value:`${metrics.calibrationImages}/3`},",
    'manual calibration validation policy',
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

required_policy = [
    'Le terrain est calibré automatiquement ; correction manuelle seulement si nécessaire.',
    'Tu peux lancer l’analyse immédiatement ; correction terrain manuelle seulement si nécessaire.',
    "$('validation55Section').classList.remove('hidden');",
    "label:'calibrage manuel optionnel (max 3)'",
    'Calibration manuelle optionnelle : conserver le compteur comme preuve de couverture',
]
if any(item not in text for item in required_policy):
    raise SystemExit('ERROR: automatic-analysis entry policy not fully integrated')
if "label:'3 images maximum',ok:metrics.calibrationImages===3" in text:
    raise SystemExit('ERROR: obsolete mandatory three-reference calibration gate remains')
if 'Calibrage incomplet : ${calibrated}/3 image(s). Termine d’abord les 3 références.' in text:
    raise SystemExit('ERROR: obsolete runtime manual-calibration gate remains')

path.write_text(text, encoding='utf-8')
print('integrated long-term tracking runtime and auto-first analysis policy')
