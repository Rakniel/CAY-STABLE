const assert=require('assert');
const Stats=require('../player_stats_v1.js');
const projectors={1:{validated:true,confidence:.95,source:'test',project:p=>({x:p.mx,y:p.my})}};
const jitterTrack={fullPath:Array.from({length:7},(_,i)=>({x:.1+i*.01,y:.5,time:i,segment:1,mx:i,my:i%2?-.3:.3}))};
const jitter=Stats.metricForTrack(jitterTrack,projectors);
assert.strictEqual(jitter.metricCoverage,1);
assert.ok(jitter.smoothingSamples>=3,'metric path should use the smoother');
assert.ok(jitter.distanceM<jitter.rawDistanceM,'smoothed metric distance should reduce jitter inflation');
assert.ok(jitter.distanceCorrectionPct<0,'distance audit should expose the correction');
assert.ok(jitter.smoothingPairs>0,'speed/distance pairs should record smoothing use');

const linearTrack={fullPath:Array.from({length:7},(_,i)=>({x:.1+i*.01,y:.5,time:i,segment:1,mx:i,my:0}))};
const linear=Stats.metricForTrack(linearTrack,projectors);
assert.strictEqual(linear.distanceM,6);
assert.strictEqual(linear.rawDistanceM,6);
assert.strictEqual(linear.avgSpeedKmh,3.6);

const splitTrack={fullPath:[
 {x:.1,y:.5,time:0,segment:1,mx:0,my:0},{x:.2,y:.5,time:.2,segment:1,mx:1,my:.2},{x:.3,y:.5,time:.4,segment:1,mx:2,my:0},
 {x:.4,y:.5,time:.6,segment:2,mx:20,my:10},{x:.5,y:.5,time:.8,segment:2,mx:21,my:10.2},{x:.6,y:.5,time:1,segment:2,mx:22,my:10}
]};
const split=Stats.metricForTrack(splitTrack,{...projectors,2:{validated:true,confidence:.95,source:'test2',project:p=>({x:p.mx,y:p.my})}});
assert.strictEqual(split.smoothingSamples,0,'camera cut must prevent cross-plan smoothing');
assert.ok(split.distanceM<10,'camera cut must not create artificial cross-plan distance');

const unavailable=Stats.metricForTrack(jitterTrack,{1:{validated:false,project:p=>({x:p.mx,y:p.my})}});
assert.strictEqual(unavailable.quality,'INDISPONIBLE');
assert.strictEqual(unavailable.distanceM,null);
console.log('player_stats_metric_smoothing_nonregression: PASS');
