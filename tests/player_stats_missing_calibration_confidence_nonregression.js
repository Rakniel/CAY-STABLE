'use strict';
const assert=require('assert');
const Stats=require('../player_stats_v1.js');

const project=p=>({x:p.x*100,y:p.y*60});

for(const missing of [null,undefined,'','   ']){
  const info=Stats.projectorInfo({validated:true,source:'test',confidence:missing,project});
  assert.equal(info.validated,true,'missing confidence must not invalidate an otherwise explicit projector contract');
  assert.equal(info.confidence,null,'missing confidence must stay unavailable, never be coerced to zero');
}

const explicitZero=Stats.projectorInfo({validated:true,source:'test',confidence:0,project});
assert.equal(explicitZero.confidence,0,'an explicit measured zero confidence must remain a real zero');

const numericString=Stats.projectorInfo({validated:true,source:'test',confidence:'0.72',project});
assert.equal(numericString.confidence,.72,'a non-blank numeric confidence string remains accepted for backward compatibility');

const boundedHigh=Stats.projectorInfo({validated:true,source:'test',confidence:2,project});
assert.equal(boundedHigh.confidence,1,'confidence remains clamped to the published 0..1 contract');

const invalid=Stats.projectorInfo({validated:true,source:'test',confidence:'not-a-number',project});
assert.equal(invalid.confidence,null,'non-numeric confidence must remain unavailable');

console.log('player_stats_missing_calibration_confidence_nonregression: PASS');
