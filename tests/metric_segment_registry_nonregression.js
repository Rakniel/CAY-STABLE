const assert=require('assert');
const projectorApi=require('../metric_homography_projector_v1.js');
const registryApi=require('../metric_segment_registry_v1.js');

const r=registryApi.createRegistry(projectorApi);
const correspondence=[
  {image:{x:100,y:100},pitch:{x:0,y:0}},
  {image:{x:1100,y:120},pitch:{x:105,y:0}},
  {image:{x:1080,y:700},pitch:{x:105,y:68}},
  {image:{x:120,y:680},pitch:{x:0,y:68}}
];
const validationPoints=[
  {image:{x:600,y:400},pitch:{x:52.5,y:34}},
  {image:{x:350,y:390},pitch:{x:26.25,y:34}}
];

const good=r.calibrate(0,{correspondences:correspondence,validationPoints,maxMeanErrorM:3,maxPeakErrorM:5,shotId:'shot-A'});
assert.strictEqual(good.ok,true,'segment 0 should validate');
assert.strictEqual(r.summary().validatedSegments,1);
assert.ok(r.projectorFor(0),'validated segment must export projector');
assert.strictEqual(r.projectorFor(1),null,'registry must never silently reuse another plan calibration');

const bad=r.calibrate(1,{correspondences:correspondence,validationPoints:[
  {image:{x:600,y:400},pitch:{x:5,y:5}},
  {image:{x:350,y:390},pitch:{x:100,y:60}}
],maxMeanErrorM:2,maxPeakErrorM:3,shotId:'shot-B'});
assert.strictEqual(bad.ok,false,'bad independent validation must reject segment');
assert.strictEqual(r.projectorFor(1),null,'rejected segment must not provide metric projection');

const projectors=r.exportProjectors();
assert.deepStrictEqual(Object.keys(projectors),['0'],'only validated exact segment must be exported');
assert.strictEqual(typeof projectors[0].project,'function');

assert.strictEqual(r.invalidate(0,'plan changed'),true);
assert.strictEqual(r.projectorFor(0),null,'explicit invalidation must remove metric eligibility');
assert.strictEqual(r.summary().validatedSegments,0);
assert.strictEqual(r.summary().policy,'CALIBRATION_EXACTE_PAR_SEGMENT_SANS_REUTILISATION_SILENCIEUSE_ENTRE_PLANS');

console.log('metric_segment_registry_nonregression: PASS');
