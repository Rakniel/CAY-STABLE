const assert=require('assert');
const Registry=require('../metric_segment_registry_v1.js');

const api={createProjector:options=>options.projector};
const registry=Registry.createRegistry(api);
const strong={validated:true,source:'strong_absolute',confidence:.90,pitch:{lengthM:105,widthM:68},project:p=>({x:p.x,y:p.y})};
const weak={validated:true,source:'weak_absolute',confidence:.10,pitch:{lengthM:105,widthM:68},project:p=>({x:1000+p.x,y:1000+p.y})};

assert.strictEqual(registry.calibrate(0,{projector:strong,createdAt:0}).ok,true);
assert.strictEqual(registry.markDynamic(0,0,{maxCalibrationAgeSec:.35}).ok,true);
assert.strictEqual(registry.addCalibrationKeyframe(0,.2,{projector:weak}).ok,true);

const dynamic=registry.projectorFor(0);
assert.ok(dynamic);
assert.strictEqual(dynamic.validated,true);
assert.strictEqual(dynamic.confidence,.9);
assert.strictEqual(dynamic.validation.sourceKeyframes,2);
assert.strictEqual(dynamic.validation.keyframes,1);
assert.strictEqual(dynamic.validation.lowConfidenceKeyframesRejected,1);
assert.strictEqual(dynamic.validation.minDynamicKeyframeConfidence,.5);

// Before: confidence average (.90 + .10) / 2 = .50 could make the weak keyframe
// participate in a metric interpolation. Now the weak absolute calibration is excluded.
let q=dynamic.project({x:10,y:20,time:.1});
assert.ok(q);
assert.strictEqual(q.x,10);
assert.strictEqual(q.y,20);
assert.strictEqual(q.calibrationKeyframeTime,0);

// The nearby weak keyframe must not extend metric coverage after the trusted anchor is stale.
q=dynamic.project({x:10,y:20,time:.4});
assert.strictEqual(q,null);

// Fail closed when every available absolute keyframe is below the confidence floor.
// Diagnostics remain available through registry.get/summary, but no metric projector may leak out.
const lowOnly=Registry.createRegistry(api);
assert.strictEqual(lowOnly.calibrate(1,{projector:weak,createdAt:0}).ok,true);
const lowDynamic=lowOnly.markDynamic(1,0,{maxCalibrationAgeSec:.35});
assert.strictEqual(lowDynamic.ok,false);
assert.match(lowDynamic.reason,/confiance suffisante/);
assert.strictEqual(lowOnly.projectorFor(1),null);
assert.strictEqual(Object.prototype.hasOwnProperty.call(lowOnly.exportProjectors(),'1'),false);
assert.strictEqual(lowOnly.get(1).calibrationKeyframes.length,1);
assert.match(lowOnly.summary().dynamicPolicy,/CONFIANCE_GE_0_5_REQUIS/);

// A later trusted absolute refresh restores metric availability without reviving the weak anchor.
assert.strictEqual(lowOnly.addCalibrationKeyframe(1,.2,{projector:strong}).ok,true);
const recovered=lowOnly.projectorFor(1);
assert.ok(recovered);
assert.strictEqual(recovered.confidence,.9);
assert.strictEqual(recovered.validation.sourceKeyframes,2);
assert.strictEqual(recovered.validation.keyframes,1);
assert.strictEqual(recovered.validation.lowConfidenceKeyframesRejected,1);
assert.ok(recovered.project({x:1,y:2,time:.2}));
assert.strictEqual(recovered.project({x:1,y:2,time:0}),null);

console.log('dynamic_keyframe_confidence_gate_nonregression: PASS');
