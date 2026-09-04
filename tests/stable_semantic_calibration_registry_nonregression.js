const assert=require('assert');
const runtime=require('../stable_metric_visuals_runtime_v1.js');
const semantic=require('../pitch_semantic_calibration_v2.js');

const frameSize={width:1050,height:680};
function semanticKeypoints(){
  return semantic.canonicalVertices({lengthM:105,widthM:68}).map((p,index)=>({
    index,
    x:p.x*10,
    y:p.y*10,
    confidence:.96,
    visible:true
  }));
}

assert.strictEqual(runtime.metricRegistrySummary().validatedSegments,0,'semantic runtime registry must start empty in a fresh process');

const accepted=runtime.calibrateSemanticSegment(3,semanticKeypoints(),{
  frameSize,
  lengthM:105,
  widthM:68,
  minConfidence:.5,
  time:12.5,
  shotId:'shot-semantic-3'
});
assert.strictEqual(accepted.ok,true,JSON.stringify({status:accepted.status,reason:accepted.reason,calibrationStatus:accepted.calibration?.status,calibrationReason:accepted.calibration?.reason}));
assert.strictEqual(accepted.registered,true);
assert.strictEqual(accepted.status,'REGISTERED_VALIDATED_SEMANTIC_CALIBRATION');
assert.strictEqual(accepted.dynamicRefresh,false);
assert.strictEqual(accepted.visibleKeypoints,32);
assert.ok(Number.isFinite(accepted.confidence));

const exported=runtime.exportProjectors();
assert.deepStrictEqual(Object.keys(exported),['3'],'only the validated semantic segment must be exported');
assert.strictEqual(exported[3].segment,3,'semantic projector must remain bound to its exact plan');
assert.strictEqual(exported[3].validated,true);
assert.strictEqual(typeof exported[3].project,'function');
assert.ok(Number.isFinite(Number(exported[3].confidence)),'semantic projector must carry explicit calibration confidence');

const record=runtime.metricRegistrySummary().segments.find(x=>x.segment===3);
assert.ok(record,'registered semantic segment must be observable in registry diagnostics');
assert.strictEqual(record.source,'semantic_pitch_keypoints_v2');
assert.strictEqual(record.shotId,'shot-semantic-3');
assert.strictEqual(record.createdAt,12.5);
assert.strictEqual(record.dynamicCamera,false,'first semantic calibration remains the absolute segment anchor');
assert.strictEqual(record.provenance.registration,'PREVALIDATED_PROJECTOR_FAIL_CLOSED');
assert.strictEqual(record.provenance.upstreamValidationPreserved,true);
assert.strictEqual(record.provenance.semanticCalibration.version,semantic.VERSION);
assert.strictEqual(record.provenance.semanticCalibration.legacyFreePolygonUsed,false);
assert.strictEqual(record.provenance.semanticCalibration.visibleKeypoints,32);

const refresh=runtime.calibrateSemanticSegment(3,semanticKeypoints(),{
  frameSize,
  lengthM:105,
  widthM:68,
  minConfidence:.5,
  time:12.7,
  shotId:'shot-semantic-3'
});
assert.strictEqual(refresh.ok,true,JSON.stringify({status:refresh.status,reason:refresh.reason}));
assert.strictEqual(refresh.status,'REGISTERED_VALIDATED_SEMANTIC_KEYFRAME','a repeated semantic calibration must extend the existing timeline instead of replacing it');
assert.strictEqual(refresh.dynamicRefresh,true);
assert.strictEqual(refresh.metricEligible,true);
assert.strictEqual(refresh.projectorAvailable,true);

const refreshedRecord=runtime.metricRegistrySummary().segments.find(x=>x.segment===3);
assert.strictEqual(refreshedRecord.dynamicCamera,true,'semantic refresh must promote the segment to dynamic-camera calibration');
assert.strictEqual(refreshedRecord.calibrationKeyframes.length,2,'absolute anchor + semantic refresh must both survive');
assert.strictEqual(refreshedRecord.calibrationKeyframes[0].time,12.5);
assert.strictEqual(refreshedRecord.calibrationKeyframes[1].time,12.7);
assert.strictEqual(refreshedRecord.calibrationKeyframes[1].kind,'semantic_pitch_keypoints_v2_refresh');
assert.strictEqual(runtime.metricRegistrySummary().reliableCalibrationKeyframes,2);
const dynamicProjector=runtime.exportProjectors()[3];
assert.strictEqual(dynamicProjector.source,'temporal_calibration_keyframes');
const interpolated=dynamicProjector.project({x:525,y:340,time:12.6});
assert.ok(interpolated&&Number.isFinite(interpolated.x)&&Number.isFinite(interpolated.y),'fresh semantic keyframes must provide a metric projection between anchors');
assert.strictEqual(interpolated.calibrationKind,'interpolated_validated_keyframes');

const beforeNoTime=runtime.metricRegistrySummary().segments.find(x=>x.segment===3).calibrationKeyframes.length;
const noTimeRefresh=runtime.calibrateSemanticSegment(3,semanticKeypoints(),{frameSize,lengthM:105,widthM:68});
assert.strictEqual(noTimeRefresh.ok,false,'an existing calibrated segment cannot be silently overwritten by an untimed refresh');
assert.strictEqual(noTimeRefresh.status,'REJECTED');
assert.strictEqual(runtime.metricRegistrySummary().segments.find(x=>x.segment===3).calibrationKeyframes.length,beforeNoTime,'rejected untimed refresh must preserve the timeline');

const beforeRejected=runtime.metricRegistrySummary().validatedSegments;
const weak=runtime.calibrateSemanticSegment(4,semanticKeypoints().slice(0,5),{
  frameSize,lengthM:105,widthM:68,time:14
});
assert.strictEqual(weak.ok,false,'fewer than six semantic landmarks must remain fail-closed');
assert.strictEqual(weak.registered,false);
assert.strictEqual(weak.status,'INSUFFICIENT_EVIDENCE');
assert.strictEqual(runtime.metricRegistrySummary().validatedSegments,beforeRejected,'a rejected semantic frame must not contaminate the registry');
assert.strictEqual(runtime.exportProjectors()[4],undefined);

const noConfidence=runtime.registerValidatedProjector(5,{validated:true,project(){return {x:1,y:1};}});
assert.strictEqual(noConfidence.ok,false,'prevalidated import without explicit confidence must be rejected');
assert.strictEqual(runtime.exportProjectors()[5],undefined);

const invalidSegment=runtime.calibrateSemanticSegment('',semanticKeypoints(),{frameSize});
assert.strictEqual(invalidSegment.ok,false,'missing segment identity must never create a metric projector');

console.log('stable_semantic_calibration_registry_nonregression: PASS');
