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
    '<div class="status" id="v55Status">Charge la vidéo, choisis l’équipe puis lance l’analyse. Les métriques terrain restent INDISPONIBLE tant qu’une vraie calibration géométrique n’est pas défendable.</div>',
    'automatic analysis status',
)

replace_policy(
    "status($('scanStatus'),`${scenes.length} type(s) de plan détecté(s). Étape suivante : 3 images de référence maximum.`,'success');",
    "status($('scanStatus'),`${scenes.length} type(s) de plan détecté(s). Analyse disponible immédiatement. La segmentation de pelouse sert uniquement de masque spatial ; elle n’est jamais utilisée comme calibration terrain.`,'success');",
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

# A restored/cumulative stadium appearance model blends medS/medV after the local
# frame estimate. These values are intentionally mutable. Declaring them const made
# the camera scan crash at 100% with "Assignment to constant variable" as soon as a
# previous CAY calibration session was present.
replace_policy(
    ' const medS=medianNumber(svals),medV=medianNumber(vvals);',
    ' let medS=medianNumber(svals),medV=medianNumber(vvals);',
    'mutable restored pitch appearance blend',
)

# The legacy autoField() algorithm learns the connected grass appearance. It is a
# coarse spatial ROI, NOT a football-pitch calibration and must never be exposed as
# a red calibration boundary or automatically create a calibration correction queue.
replace_policy(
    " s.auto=af.poly;s.conf=af.confidence;s.autoEval=ev;\n s.review=!ev.ok;\n s.reviewReasons=ev.reasons;",
    " s.auto=af.poly;s.autoRole='COARSE_GRASS_MASK_ONLY';s.conf=af.confidence;s.autoEval=ev;\n // Un masque de pelouse mauvais reste un diagnostic, jamais une demande de calibrage.\n s.review=false;\n s.reviewReasons=ev.ok?[]:ev.reasons.map(r=>'masque_gazon_'+r);",
    'grass mask must not create calibration review queue',
)

replace_policy(
    "points=s.manual?[...s.manual]:(s.auto?[...s.auto]:[]);selectedPoints=[];groupDragStart=null;boxSelectMode=false;boxSelectStart=null;boxSelectCurrent=null;polygonClosed=points.length>=3;",
    "// Ne jamais pré-remplir la ligne rouge avec autoField(): c'est un masque de pelouse, pas une calibration.\n points=s.manual?[...s.manual]:[];selectedPoints=[];groupDragStart=null;boxSelectMode=false;boxSelectStart=null;boxSelectCurrent=null;polygonClosed=points.length>=3;",
    'manual calibration must not inherit grass mask polygon',
)

replace_policy(
    "renderReviews();$('reviewSection').classList.add('hidden');\n  $('guidedCalibSection').classList.remove('hidden');renderGuidedRefs();\n  $('validation55Section').classList.remove('hidden');",
    "renderReviews();$('reviewSection').classList.add('hidden');\n  // Parcours principal : aucun écran de calibrage tant qu'une vraie géométrie terrain n'est pas disponible.\n  $('guidedCalibSection').classList.add('hidden');renderGuidedRefs();\n  $('validation55Section').classList.remove('hidden');",
    'hide legacy grass-based guided calibration from primary flow',
)

replace_policy(
    "  $('guidedCalibSection').scrollIntoView({behavior:'smooth',block:'start'});",
    "  $('validation55Section').scrollIntoView({behavior:'smooth',block:'start'});",
    'primary scan flow must scroll to analysis not calibration',
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
    'Les métriques terrain restent INDISPONIBLE tant qu’une vraie calibration géométrique n’est pas défendable.',
    'La segmentation de pelouse sert uniquement de masque spatial ; elle n’est jamais utilisée comme calibration terrain.',
    "$('validation55Section').classList.remove('hidden');",
    "label:'calibrage manuel optionnel (max 3)'",
    'Calibration manuelle optionnelle : conserver le compteur comme preuve de couverture',
    'let medS=medianNumber(svals),medV=medianNumber(vvals);',
    "s.autoRole='COARSE_GRASS_MASK_ONLY'",
    "points=s.manual?[...s.manual]:[];",
    "$('guidedCalibSection').classList.add('hidden');renderGuidedRefs();",
    "$('validation55Section').scrollIntoView({behavior:'smooth',block:'start'});",
]
if any(item not in text for item in required_policy):
    raise SystemExit('ERROR: automatic-analysis / scan runtime policy not fully integrated')
if "label:'3 images maximum',ok:metrics.calibrationImages===3" in text:
    raise SystemExit('ERROR: obsolete mandatory three-reference calibration gate remains')
if 'Calibrage incomplet : ${calibrated}/3 image(s). Termine d’abord les 3 références.' in text:
    raise SystemExit('ERROR: obsolete runtime manual-calibration gate remains')
if 'const medS=medianNumber(svals),medV=medianNumber(vvals);' in text:
    raise SystemExit('ERROR: restored pitch model would still reassign const medS/medV')
if "points=s.manual?[...s.manual]:(s.auto?[...s.auto]:[]);" in text:
    raise SystemExit('ERROR: grass mask would still be exposed as manual calibration polygon')

path.write_text(text, encoding='utf-8')
print('integrated long-term tracking runtime, auto-first analysis and strict grass-mask/calibration separation')
