'use strict';
const assert=require('assert');
const ReID=require('../reid_evidence_fusion_v1.js');

function vec(deg){
  const r=deg*Math.PI/180;
  return [Math.cos(r),Math.sin(r)];
}
function seed(engine,id,embedding){
  engine.add(id,embedding,{quality:.95,team:'CAY',time:0});
  engine.add(id,embedding,{quality:.95,team:'CAY',time:1});
  engine.add(id,embedding,{quality:.95,team:'CAY',time:2});
}

const engine=ReID.create({minSamples:3,minSimilarity:.85,minMargin:.01,minTemporalSeparation:.35});
seed(engine,'A',vec(0));
seed(engine,'B',vec(20));
seed(engine,'C',vec(25));

const legacy=engine.suggest('A',['B','C']);
assert.strictEqual(legacy.status,'A_VERIFIER');
assert.strictEqual(legacy.reason,'REID_SUGGESTION_ONLY');
assert.strictEqual(legacy.best.trackId,'B');

const guarded=engine.suggest('A',['B','C'],{requireReciprocalMatch:true});
assert.strictEqual(guarded.status,'A_VERIFIER');
assert.strictEqual(guarded.reason,'NON_RECIPROCAL_REID');
assert.strictEqual(guarded.best.trackId,'B');
assert.strictEqual(guarded.reciprocal.reciprocal,false);
assert.strictEqual(guarded.reciprocal.reverseBest.trackId,'C');

const reciprocalOnly=engine.suggest('A',['B'],{requireReciprocalMatch:true});
assert.strictEqual(reciprocalOnly.status,'A_VERIFIER');
assert.strictEqual(reciprocalOnly.reason,'RECIPROCAL_REID_SUGGESTION_ONLY');
assert.strictEqual(reciprocalOnly.reciprocal.reciprocal,true);
assert.strictEqual(reciprocalOnly.policy,'NEVER_AUTO_MERGE');

console.log('reid reciprocal consistency non-regression: PASS');
