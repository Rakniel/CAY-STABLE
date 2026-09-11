'use strict';
const assert=require('assert');
const Guard=require('../metric_quality_guard_v1.js');

const track={fullPath:[
  {x:0,y:0,time:0,segment:1},
  {x:5,y:0,time:1,segment:1},
  {x:10,y:0,time:2,segment:1}
]};

const unavailable=Guard.robustMetricForTrack(track,{1:{validated:false,project:null}});
assert.strictEqual(unavailable.metricCoverage,0,'unvalidated projector must provide no metric coverage');
assert.strictEqual(unavailable.distanceM,null,'unvalidated projector must not invent distance');
assert.strictEqual(unavailable.rejectedUnvalidatedProjectorSamples,3,'every sample without validated projection must be auditable');
assert.strictEqual(unavailable.rejectedProjectionFailureSamples,0,'unvalidated projector must not be confused with runtime projection failure');
assert.match(Guard.metricUnavailableReason(unavailable),/indisponible|non validée/i,'reason must expose unavailable calibration');

const throwing=Guard.robustMetricForTrack(track,{1:{validated:true,confidence:1,project:p=>{if(p.x===5)throw new Error('synthetic projection failure');return {x:p.x,y:p.y};}}});
assert.strictEqual(throwing.metricCoverage,0,'a failed middle projection must cut continuity instead of bridging distance');
assert.strictEqual(throwing.distanceM,null,'projection failure must never bridge the two valid endpoints');
assert.strictEqual(throwing.rejectedUnvalidatedProjectorSamples,0,'validated projector must not be classified unavailable');
assert.strictEqual(throwing.rejectedProjectionFailureSamples,1,'runtime projection exception must be counted exactly once');
assert.match(Guard.metricUnavailableReason(throwing),/calcul impossible|non fini/i,'reason must expose validated projection failure');

const nonFinite=Guard.robustMetricForTrack(track,{1:{validated:true,confidence:1,project:p=>p.x===5?{x:Infinity,y:0}:{x:p.x,y:p.y}}});
assert.strictEqual(nonFinite.metricCoverage,0,'non-finite middle projection must cut continuity');
assert.strictEqual(nonFinite.distanceM,null,'non-finite projection must not create metric distance');
assert.strictEqual(nonFinite.rejectedProjectionFailureSamples,1,'non-finite projected coordinate must be audited as projection failure');

const clean=Guard.robustMetricForTrack(track,{1:{validated:true,confidence:1,project:p=>({x:p.x,y:p.y})}});
assert.strictEqual(clean.metricCoverage,1,'clean validated projection must preserve full metric coverage');
assert.strictEqual(clean.distanceM,10,'clean validated projection must preserve distance');
assert.strictEqual(clean.rejectedUnvalidatedProjectorSamples,0,'clean path must report no unavailable projection');
assert.strictEqual(clean.rejectedProjectionFailureSamples,0,'clean path must report no projection failure');

console.log('metric projection rejection audit non-regression: PASS');