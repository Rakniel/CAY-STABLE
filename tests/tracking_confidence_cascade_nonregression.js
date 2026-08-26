'use strict';
const assert=require('assert');
const C=require('../tracking_confidence_cascade_v1.js');
const split=C.splitDetections([
  {id:'strong',score:.91},{id:'edge',score:.55},{id:'recover',score:.34},{id:'weak',score:.08}
]);
assert.deepStrictEqual(split.high.map(x=>x.id),['strong','edge']);
assert.deepStrictEqual(split.low.map(x=>x.id),['recover']);
assert.strictEqual(split.discarded.length,1);
assert.strictEqual(C.eligibleForNewTrack(split.high[0]),true);
assert.strictEqual(C.eligibleForNewTrack(split.low[0]),false,'une détection faible ne doit jamais créer un nouvel ID');
assert(C.recoveryThreshold(.6)<.6,'le second passage doit être plus strict sur le coût');
const custom=C.splitDetections([{score:.4},{score:.25},{score:.1}],{highScoreThreshold:.4,lowScoreThreshold:.2});
assert.strictEqual(custom.high.length,1);assert.strictEqual(custom.low.length,1);assert.strictEqual(custom.discarded.length,1);
console.log('tracking_confidence_cascade_nonregression: OK');
