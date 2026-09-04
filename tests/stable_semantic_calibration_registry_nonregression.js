const assert=require('assert');
const runtime=require('../stable_metric_visuals_runtime_v1.js');
const semantic=require('../pitch_semantic_calibration_v2.js');

function semanticKeypoints(){
  return semantic.canonicalVertices({lengthM:105,widthM:68}).map((p,index)=>({
    index,
    x:80+p.x*8,
    y:70+p.y*6,
    confidence:.96,
    visible:true
  }));
}

assert.strictEqual(runtime.metricRegistrySummary().validatedSegments,0,'semantic runtime registry must start empty in a fresh process');

const accepted=runtime.calibrateSemanticSegment(3,semanticKeypoints(),{
  frameSize:{width:1000,height:560},
  lengthM:105,
  widthM:68,
  minConfidence:.5,
  minSourceMeanConfidence:.5,
  time:12.5,
  shotId:'shot-semantic-3'
});
assert.strictEqual(accepted.ok,true,'defendable semantic calibration must enter the shared metric registry');
assert.strictEqual(accepted.registered,true);
assert.strictEqual(accepted.status,'REGISTERED_VALIDATED_SEMANTIC_CALIBRATION');
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
assert.strictEqual(record.provenance.registration,'PREVALIDATED_PROJECTOR_FAIL_CLOSED');
assert.strictEqual(record.provenance.upstreamValidationPreserved,true);
assert.strictEqual(record.provenance.semanticCalibration.version,semantic.VERSION);
assert.strictEqual(record.provenance.semanticCalibration.legacyFreePolygonUsed,false);
assert.strictEqual(record.provenance.semanticCalibration.visibleKeypoints,32);

const beforeRejected=runtime.metricRegistrySummary().validatedSegments;
const weak=runtime.calibrateSemanticSegment(4,semanticKeypoints().slice(0,5),{
  frameSize:{width:1000,height:560},lengthM:105,widthM:68,time:14
});
assert.strictEqual(weak.ok,false,'fewer than six semantic landmarks must remain fail-closed');
assert.strictEqual(weak.registered,false);
assert.strictEqual(weak.status,'INSUFFICIENT_EVIDENCE');
assert.strictEqual(runtime.metricRegistrySummary().validatedSegments,beforeRejected,'a rejected semantic frame must not contaminate the registry');
assert.strictEqual(runtime.exportProjectors()[4],undefined);

const noConfidence=runtime.registerValidatedProjector(5,{validated:true,project(){return {x:1,y:1};}});
assert.strictEqual(noConfidence.ok,false,'prevalidated import without explicit confidence must be rejected');
assert.strictEqual(runtime.exportProjectors()[5],undefined);

const invalidSegment=runtime.calibrateSemanticSegment('',semanticKeypoints(),{frameSize:{width:1000,height:560}});
assert.strictEqual(invalidSegment.ok,false,'missing segment identity must never create a metric projector');

console.log('stable_semantic_calibration_registry_nonregression: PASS');
