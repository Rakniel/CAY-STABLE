'use strict';
const assert=require('assert');
const Registry=require('../metric_segment_registry_v1.js');

const projectorApi={
  createProjector:()=>({
    validated:true,
    confidence:1,
    source:'test',
    reason:null,
    validation:{ok:true},
    pitch:{lengthM:105,widthM:68},
    project:p=>p
  })
};

const registry=Registry.createRegistry(projectorApi);

for(const missing of [null,undefined,'','   ']){
  const result=registry.calibrate(missing,{});
  assert.equal(result.ok,false,'missing segment id must be rejected');
  assert.equal(result.reason,'segment invalide');
  assert.equal(registry.get(missing),null,'missing segment id must never alias segment 0');
  assert.equal(registry.projectorFor(missing),null,'missing segment id must not return a projector');
  assert.equal(registry.invalidate(missing),false,'missing segment id must not invalidate segment 0');
}

assert.equal(registry.summary().configuredSegments,0,'rejected missing ids must not create registry entries');

const valid=registry.calibrate(0,{shotId:'plan-0'});
assert.equal(valid.ok,true,'explicit segment 0 remains valid');
assert.equal(registry.summary().configuredSegments,1);
assert.equal(registry.get(0).shotId,'plan-0');
assert.ok(registry.projectorFor(0),'explicit segment 0 must resolve normally');

assert.equal(registry.get(null),null,'null must remain distinct from explicit segment 0 after calibration');
assert.equal(registry.invalidate('   '),false,'blank id must not invalidate explicit segment 0');
assert.ok(registry.projectorFor(0),'segment 0 must remain valid after blank invalidation attempt');

console.log('metric_segment_missing_id_nonregression: PASS');
