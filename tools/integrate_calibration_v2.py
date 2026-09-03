from pathlib import Path
import re

path=Path('CAY_ANALYZER_STABLE.html')
text=path.read_text(encoding='utf-8')
marker='<!-- CALIBRATION_V2_SEMANTIC_PITCH -->'
player_tag='<script src="./player_candidate_recovery_v1.js"></script>'
pitch_tag='<script src="./pitch_semantic_calibration_v2.js"></script>'

# `integrate_tracking_v2.py` rebuilds its canonical script block. Remove the V2
# overlay first, then place each module back beside the dependency it extends.
# This makes the sequence tracking -> V2 -> tracking -> V2 byte-for-byte stable.
for token in (marker,player_tag,pitch_tag):
    text=re.sub(rf'^[ \t]*{re.escape(token)}[ \t]*(?:\r?\n)?','',text,flags=re.MULTILINE)


def replace_once(old,new,label):
    global text
    if new in text:
        return
    if old not in text:
        raise SystemExit(f'ERROR: expected source for {label} not found')
    text=text.replace(old,new,1)

# Load the generic player-recovery helper after the detector runtimes. It is
# independent from team identity and only contributes UNKNOWN candidates.
anchor='<script src="./rfdetr_onnx_runtime_v1.js"></script>'
if anchor not in text:
    raise SystemExit('ERROR: RF-DETR runtime tag missing')
text=text.replace(anchor,anchor+'\n'+marker+'\n'+player_tag,1)

# Semantic pitch calibration must load after the existing automatic calibration
# engine because the browser UMD factory binds that dependency at load time.
anchor='<script src="./automatic_pitch_calibration_v1.js"></script>'
if anchor not in text:
    raise SystemExit('ERROR: automatic calibration tag missing')
text=text.replace(anchor,anchor+'\n'+pitch_tag,1)

# The old 3-image / free-polygon workflow must no longer be offered to coaches.
replace_once(
    '<h3><span class="stepnum">3</span>Calibrage guidé — 3 images maximum</h3>',
    '<h3><span class="stepnum">3</span>Calibration terrain V2 — repères football</h3>',
    'legacy calibration heading'
)
replace_once(
    '<button id="prepareGuidedCalib" class="primary">🎯 Démarrer le calibrage intelligent</button>',
    '<button id="prepareGuidedCalib" class="secondary" disabled style="display:none">Ancien calibrage V1 retiré</button>',
    'legacy calibration button'
)
replace_once(
    "if($('prepareGuidedCalib'))$('prepareGuidedCalib').onclick=chooseThreeReferenceImages;",
    "if($('prepareGuidedCalib')){$('prepareGuidedCalib').disabled=true;$('prepareGuidedCalib').onclick=null;}",
    'legacy calibration click binding'
)

# COCO can miss tiny/distant footballers. Add only generic UNKNOWN candidates from
# grass-supported upright coloured components. They still pass through the existing
# tracking/team/identity guards and can never prove CAY by themselves.
old_return=" return footballDedupe(nms(all,.30));\n}\n\nasync function detectFootballSpecialized"
new_return=""" let appearanceRecovered=[];
 try{
   const recovery=globalThis.CAYPlayerCandidateRecovery;
   if(recovery&&typeof recovery.recoverFromCanvas==='function'){
     appearanceRecovered=recovery.recoverFromCanvas(c,all,{maxCandidates:6,stride:2,minGrassSupport:.22});
   }
 }catch(_){}
 return footballDedupe(nms(all.concat(appearanceRecovered),.30));
}

async function detectFootballSpecialized"""
replace_once(old_return,new_return,'generic missed-player recovery')

# Make the truth visible even if a developer manually unhides the legacy section.
replace_once(
    '<strong>Étape suivante :</strong> démarre le calibrage intelligent. L\'application choisit d\'abord UNE bonne image pour apprendre ton équipe. Après cette première validation, elle cherchera automatiquement la 2e puis la 3e image avec le plus de CAY reconnus.',
    '<strong>Calibration V2 :</strong> l’ancien polygone libre est retiré. La calibration métrique doit venir de repères sémantiques du terrain ; sinon les métriques terrain restent INDISPONIBLE et le tracking continue.',
    'legacy calibration instructions'
)

required=[
    marker,player_tag,pitch_tag,
    'CAYPlayerCandidateRecovery',
    'Calibration terrain V2 — repères football',
    'Ancien calibrage V1 retiré',
    'l’ancien polygone libre est retiré'
]
missing=[x for x in required if x not in text]
if missing:
    raise SystemExit('ERROR: calibration v2 integration incomplete: '+', '.join(missing))
if text.count(marker)!=1 or text.count(player_tag)!=1 or text.count(pitch_tag)!=1:
    raise SystemExit('ERROR: calibration v2 runtime tag duplicated')
if text.index(player_tag)<text.index('<script src="./rfdetr_onnx_runtime_v1.js"></script>'):
    raise SystemExit('ERROR: player recovery loaded before detector runtime')
if text.index(pitch_tag)<text.index('<script src="./automatic_pitch_calibration_v1.js"></script>'):
    raise SystemExit('ERROR: semantic calibration loaded before automatic calibration dependency')
if "$('prepareGuidedCalib').onclick=chooseThreeReferenceImages" in text:
    raise SystemExit('ERROR: legacy calibration click path still active')

path.write_text(text,encoding='utf-8')
print('integrated semantic pitch calibration v2, retired legacy polygon calibration, and generic missed-player recovery')
