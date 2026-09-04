const assert=require('assert');
const runtime=require('../stable_metric_visuals_runtime_v1.js');
const bridge=require('../stable_tracking_bridge_v1.js');

assert.strictEqual(runtime.metricRegistrySummary().validatedSegments,0,'runtime registry must start empty');
assert.deepStrictEqual(runtime.resolveProjectors({}),{},'empty registry must remain fail-closed');

const correspondences=[
  {image:{x:100,y:100},pitch:{x:0,y:0}},
  {image:{x:1100,y:120},pitch:{x:105,y:0}},
  {image:{x:1080,y:700},pitch:{x:105,y:68}},
  {image:{x:120,y:680},pitch:{x:0,y:68}}
];
const validationPoints=[
  {image:{x:600,y:400},pitch:{x:52.5,y:34}},
  {image:{x:350,y:390},pitch:{x:26.25,y:34}}
];
const calibrated=runtime.calibrateSegment(0,{correspondences,validationPoints,maxMeanErrorM:3,maxPeakErrorM:5,shotId:'runtime-test'});
assert.strictEqual(calibrated.ok,true,'validated segment calibration must enter shared runtime registry');
const exported=runtime.resolveProjectors({});
assert.deepStrictEqual(Object.keys(exported),['0'],'empty report input must resolve only validated registry projectors');
assert.strictEqual(exported[0].segment,0,'runtime projector must preserve exact segment binding');
assert.strictEqual(exported[0].validated,true);
assert.strictEqual(typeof exported[0].project,'function');
assert.ok(Number.isFinite(Number(exported[0].confidence)),'runtime projector must expose calibration confidence');
const bridgeBound=bridge.bindProjectorsToSegments(exported);
assert.strictEqual(bridgeBound[0].validated,true,'tracking bridge must accept shared registry projector');

const explicit={0:{validated:true,segment:9,confidence:.99,project(){return {x:0,y:0};}}};
assert.strictEqual(runtime.resolveProjectors(explicit),explicit,'explicit report projectors must never be silently mixed with registry state');
const rejected=bridge.bindProjectorsToSegments(runtime.resolveProjectors(explicit));
assert.strictEqual(rejected[0].validated,false,'bridge must still reject explicit cross-segment projector');
assert.strictEqual(rejected[0].project,null);

assert.strictEqual(runtime.invalidateSegment(0,'plan changed'),true);
assert.deepStrictEqual(runtime.resolveProjectors({}),{},'invalidated registry segment must immediately disappear from report projectors');
assert.strictEqual(runtime.metricRegistrySummary().validatedSegments,0);

console.log('stable_metric_registry_runtime_nonregression: PASS');
