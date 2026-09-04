const assert=require('assert');
const Registry=require('../metric_segment_registry_v1.js');
const Homography=require('../metric_homography_projector_v1.js');

const registry=Registry.createRegistry(Homography);
const projector=(dx,confidence=.9)=>({
  validated:true,
  source:'semantic_pitch_keypoints_v2',
  confidence,
  pitch:{lengthM:105,widthM:68},
  validation:{semantic:true},
  project(point){return {x:Number(point.x)+dx,y:Number(point.y)};}
});

assert.strictEqual(registry.registerValidatedProjector(2,projector(0,.92),{
  createdAt:10,
  source:'semantic_pitch_keypoints_v2',
  semanticCalibration:{version:'2.0.0',visibleKeypoints:12}
}).ok,true);

const refreshed=registry.registerValidatedKeyframe(2,10.2,projector(2,.88),{
  kind:'semantic_refresh',
  maxCalibrationAgeSec:.35
});
assert.strictEqual(refreshed.ok,true,'a separately validated semantic projector must enter the existing segment as a keyframe');
assert.strictEqual(refreshed.eligible,true,'confidence >= dynamic threshold must be eligible');
assert.strictEqual(refreshed.projectorAvailable,true);
assert.strictEqual(refreshed.record.dynamicCamera,true);
assert.deepStrictEqual(refreshed.record.calibrationKeyframes.map(k=>k.time),[10,10.2]);
assert.deepStrictEqual(refreshed.record.calibrationKeyframes.map(k=>k.kind),['absolute_anchor','semantic_refresh']);
assert.strictEqual(refreshed.record.provenance.registration,'PREVALIDATED_DYNAMIC_KEYFRAME_FAIL_CLOSED');
assert.strictEqual(refreshed.record.provenance.upstreamValidationPreserved,true);
assert.ok(Math.abs(refreshed.record.confidence-.9)<1e-9,'published record confidence must average only metric-eligible keyframes');
assert.ok(Math.abs(refreshed.record.diagnosticConfidence-.9)<1e-9);

const temporal=registry.exportProjectors()[2];
assert.ok(temporal&&temporal.validated===true);
assert.strictEqual(temporal.segment,2);
assert.ok(Math.abs(temporal.confidence-refreshed.record.confidence)<1e-9,'registry and exported temporal projector must expose the same publishable confidence');
const mid=temporal.project({x:20,y:30,time:10.1});
assert.ok(mid,'fresh point between two validated keyframes must project');
assert.strictEqual(mid.calibrationKind,'interpolated_validated_keyframes');
assert.ok(Math.abs(mid.x-21)<1e-9,'projection must blend in metric output space');
assert.strictEqual(temporal.project({x:20,y:30,time:11}),null,'stale calibration must remain fail-closed');

const weak=registry.registerValidatedKeyframe(2,10.3,projector(5,.49),{kind:'weak_semantic_refresh'});
assert.strictEqual(weak.ok,true,'weak but validated keyframe may remain as diagnostic evidence');
assert.strictEqual(weak.eligible,false,'weak keyframe must never become metric evidence');
assert.ok(Math.abs(weak.record.confidence-.9)<1e-9,'weak diagnostic keyframe must not lower publishable calibration confidence');
assert.ok(weak.record.diagnosticConfidence<weak.record.confidence,'diagnostic confidence may reflect weak evidence without contaminating metric confidence');
assert.strictEqual(weak.record.validation.reliableKeyframes,2);
const summary=registry.summary();
assert.strictEqual(summary.calibrationKeyframes,3);
assert.strictEqual(summary.reliableCalibrationKeyframes,2);
assert.ok(Math.abs(summary.avgConfidence-.9)<1e-9);
assert.ok(summary.avgDiagnosticConfidence<summary.avgConfidence);
const afterWeak=registry.exportProjectors()[2];
assert.strictEqual(afterWeak.validation.lowConfidenceKeyframesRejected,1);
assert.ok(Math.abs(afterWeak.confidence-weak.record.confidence)<1e-9,'export confidence must stay aligned with registry publication confidence');
const nearWeak=afterWeak.project({x:20,y:30,time:10.3});
assert.ok(nearWeak,'previous trustworthy keyframe may still serve within freshness horizon');
assert.ok(Math.abs(nearWeak.x-22)<1e-9,'weak keyframe must not pull the metric trajectory');

const before=registry.summary().calibrationKeyframes;
const rejected=registry.registerValidatedKeyframe(2,10.4,{validated:true,confidence:.99,project:null});
assert.strictEqual(rejected.ok,false,'missing projection function must be rejected');
assert.strictEqual(registry.summary().calibrationKeyframes,before,'rejected refresh must not mutate the registry');

assert.strictEqual(registry.invalidate(2,'camera cut'),true);
assert.strictEqual(registry.exportProjectors()[2],undefined,'invalidated segment must immediately stop publishing metric projection');

console.log('metric_prevalidated_dynamic_keyframe_nonregression: PASS');
