'use strict';
const assert=require('assert');
const Bench=require('../synthetic_tracking_benchmark_v1.js');

const fixture=Bench.generateFixture({players:11,frames:30,cutFrame:15});
assert.equal(fixture.players,11);
assert.equal(fixture.frames,30);
assert.equal(fixture.data.length,30);
assert.equal(fixture.data[0].detections.length,11);
assert.ok(fixture.data.some(f=>f.detections.length<11),'fixture must contain deterministic occlusions');

const result=Bench.runFixture(fixture);
assert.equal(result.segments,2,'camera cut must create an explicit second segment');
assert.ok(result.maxPublished<=11,'published simultaneous CAY players must never exceed 11');
assert.ok(result.coverage>=.98,`visible-player assignment coverage too low: ${result.coverage}`);
assert.ok(result.idContinuity>=.98,`persistent identity continuity too low: ${result.idContinuity}`);
assert.ok(result.reidentified>=1,'camera cut should exercise archived-track re-identification');
assert.equal(result.passed,true,'synthetic benchmark promotion gate must pass');

const second=Bench.runFixture(Bench.generateFixture({players:11,frames:30,cutFrame:15}));
assert.deepStrictEqual(second,result,'synthetic benchmark must be deterministic');

console.log('synthetic_tracking_benchmark_nonregression: PASS',JSON.stringify(result));
