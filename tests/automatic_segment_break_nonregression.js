'use strict';
const assert=require('assert');
const Bridge=require('../stable_tracking_bridge_v1.js');

let checks=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);checks++;};
const eq=(a,b,msg)=>{assert.equal(a,b,msg);checks++;};

const panOnly=Bridge.inferSegmentBreak({cameraMotionScore:.95,cameraTransformDelta:.28,fieldGeometryDelta:.08},0,0.04,{});
eq(panOnly.break,false,'pan seul ne doit pas créer un nouveau segment');
ok(panOnly.evidence.includes('pan_motion_only_ignored'),'le pan seul ignoré doit être diagnostiqué');

const hardCut=Bridge.inferSegmentBreak({sceneCutScore:.91},1,1.04,{});
eq(hardCut.break,true,'cut visuel fort doit créer un segment');
eq(hardCut.reason,'strong_scene_cut','raison cut fort explicite');
ok(hardCut.confidence>=.9,'confiance du cut fort conservée');

const combined=Bridge.inferSegmentBreak({sceneCutScore:.61,fieldGeometryDelta:.34},2,2.04,{});
eq(combined.break,true,'indices scène+géométrie concordants doivent segmenter');
eq(combined.reason,'combined_scene_geometry_change','raison combinée explicite');

const reframe=Bridge.inferSegmentBreak({cameraTransformDelta:.81,fieldGeometryDelta:.29,zoomDelta:.12},3,3.04,{});
eq(reframe.break,true,'reframing fort avec dérive terrain doit segmenter');
eq(reframe.reason,'camera_reframe_geometry_change','reframing doit avoir une raison traçable');

const gap=Bridge.inferSegmentBreak({},4,7,{});
eq(gap.break,true,'long saut temporel non qualifié doit ouvrir un segment');
eq(gap.reason,'long_timeline_gap','saut temporel non qualifié doit être explicite');

const validatedGap=Bridge.inferSegmentBreak({continuityValidated:true},4,7,{});
eq(validatedGap.break,false,'un trou temporel avec continuité visuelle explicitement validée ne doit pas fragmenter le segment');
ok(validatedGap.evidence.some(v=>String(v).startsWith('validated_continuity_gap:')),'le trou temporel conservé doit rester traçable');

const sameShotGap=Bridge.inferSegmentBreak({sameShotContinuous:true},4,7,{});
eq(sameShotGap.break,false,'un même plan confirmé doit survivre à un échantillonnage espacé');

const validatedGapButCut=Bridge.inferSegmentBreak({continuityValidated:true,sceneCutScore:.93},4,7,{});
eq(validatedGapButCut.break,true,'une continuité déclarée ne doit jamais masquer un cut visuel fort');
eq(validatedGapButCut.reason,'strong_scene_cut','le vrai cut visuel doit rester prioritaire');

const validatedGapButGeometry=Bridge.inferSegmentBreak({sameCameraContinuous:true,fieldGeometryDelta:.71},4,7,{});
eq(validatedGapButGeometry.break,true,'une continuité déclarée ne doit jamais masquer une forte rupture de géométrie terrain');
eq(validatedGapButGeometry.reason,'strong_field_geometry_change','la rupture géométrique doit rester prioritaire');

const b=Bridge.create({longGapSeconds:2.5});
const p=(x,y)=>[{x,y,cat:'team',score:.9,feature:[.8,.1,.1]}];
b.processFrame(p(.2,.4),0,{fieldGeometryDelta:0});
b.processFrame(p(.21,.4),.04,{cameraMotionScore:.92,fieldGeometryDelta:.04});
eq(b.snapshot().segmentBreaks,0,'pan continu ne doit pas fragmenter la timeline');
b.processFrame(p(.22,.4),3.2,{continuityValidated:true,fieldGeometryDelta:.03});
eq(b.snapshot().segmentBreaks,0,'gap validé comme continu ne doit pas créer un faux segment');
b.processFrame(p(.62,.42),3.24,{sceneCutScore:.88,fieldGeometryDelta:.55});
eq(b.snapshot().segmentBreaks,1,'cut automatique doit créer exactement une rupture');
eq(b.snapshot().automaticSegmentBreaks,1,'rupture automatique comptabilisée séparément');
const report=b.report({});
eq(report.bridge.segments.length,2,'deux segments doivent être conservés dans la provenance');
eq(report.bridge.segments[1].breakReason,'strong_scene_cut','nouveau segment conserve la raison de rupture');
ok(report.bridge.segments[1].breakEvidence.some(v=>String(v).startsWith('scene:')),'nouveau segment conserve les preuves de rupture');
const cutEvent=report.bridge.timeline.find(e=>e.type==='SEGMENT_BREAK');
ok(!!cutEvent,'timeline globale doit contenir la rupture');
ok(cutEvent.confidence>.8,'timeline conserve la confiance de rupture');

console.log(`${checks}/${checks} automatic segment-break non-regression: PASS`);