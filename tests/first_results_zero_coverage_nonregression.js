'use strict';
const assert=require('node:assert/strict');
const Gate=require('../first_results_readiness_v1.js');
const make=()=>Object.fromEntries(Gate.REQUIRED.map(name=>[name,{available:true,analysisId:'match-1',inputFingerprint:name+'-input',coverage:.8}]));
for(const name of Gate.REQUIRED){const input=make();input[name].coverage=0;const out=Gate.evaluateFirstResults(input);assert.equal(out.status,'INDISPONIBLE');assert.equal(out.unavailable.find(x=>x.name===name)?.reason,'NO_USABLE_COVERAGE');}
assert.equal(Gate.evaluateFirstResults(make()).ready,true);
console.log('first_results_zero_coverage_nonregression: PASS');
