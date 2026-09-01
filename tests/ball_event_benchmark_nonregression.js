const assert=require('assert');
const {evaluateBallEvents,compareBallEvents}=require('../ball_event_benchmark_v1.js');
const truth=[
 {type:'PASS',time:10.0},{type:'TURNOVER',time:22.0},{type:'PASS',time:35.0}
];
const before=[
 {type:'PASS',time:10.4},{type:'PASS',time:14.0},{type:'TURNOVER',time:23.2}
];
const after=[
 {type:'PASS',time:10.2},{type:'TURNOVER',time:22.3},{type:'PASS',time:35.4}
];
const b=evaluateBallEvents(truth,before,{timeToleranceSec:.75});
assert.strictEqual(b.truePositives,1);
assert.strictEqual(b.falsePositives,2);
assert.strictEqual(b.falseNegatives,2);
const a=evaluateBallEvents(truth,after,{timeToleranceSec:.75});
assert.strictEqual(a.truePositives,3);
assert.strictEqual(a.falsePositives,0);
assert.strictEqual(a.falseNegatives,0);
assert.strictEqual(a.precision,1);
assert.strictEqual(a.recall,1);
assert.strictEqual(a.f1,1);
assert.ok(a.meanTimingErrorSec>0&&a.meanTimingErrorSec<.5);
assert.strictEqual(a.byType.PASS.truePositives,2);
assert.strictEqual(a.byType.TURNOVER.truePositives,1);
const cmp=compareBallEvents(truth,before,after,{timeToleranceSec:.75});
assert.ok(cmp.delta.f1>0);
assert.strictEqual(cmp.delta.falsePositives,-2);
assert.strictEqual(cmp.delta.falseNegatives,-2);
assert.strictEqual(evaluateBallEvents([],after).quality,'INDISPONIBLE');
console.log('ball_event_benchmark_nonregression: PASS');
