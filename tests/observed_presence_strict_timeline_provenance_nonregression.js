'use strict';
const assert=require('assert'),Runtime=require('../observed_presence_runtime_bridge_v1.js');
function bridge(opts={}){return {create(){const state={segment:1},timeline=[];return {state,
processFrame(items,time,ctx={}){if(ctx.segmentBreak)state.segment++;timeline.push({type:'FRAME',time,segment:state.segment,...(ctx.unavailable?{dataQuality:'INDISPONIBLE',invalidReason:ctx.reason||'TRACKING_FRAME_UNAVAILABLE'}:{})});return items;},
report(){return {players:[{id:1,identityQuality:'FIABLE'}],team:{},teamCoverage:{},bridge:opts.omit?{}:{timeline:opts.truncate?timeline.slice(0,1):[...timeline]}};}};}}}
const one=[{trackId:1,score:.9}],r=Runtime.decorate(bridge()).create();
r.processFrame(one,0,{});r.processFrame([],1,{unavailable:true,reason:'MORE_THAN_11_CAY_DETECTIONS'});r.processFrame(one,2,{});
const v=r.report({});
assert.strictEqual(v.presenceEvidence.validObservedInstants,2);
assert.strictEqual(v.presenceEvidence.invalidObservedInstants,1);
assert.strictEqual(v.presenceEvidence.observationCoverage,.6667);
assert.strictEqual(v.teamCoverage.observationCoverage,.6667);
assert.strictEqual(v.team.observationQuality,'PARTIEL');
assert.strictEqual(v.presenceEvidence.invalidFrameEvidence.trackingUnavailableFrames,1);
assert.strictEqual(v.teamTimeline[1].frameEvidenceReason,'MORE_THAN_11_CAY_DETECTIONS');
assert.strictEqual(v.teamTimeline[1].frameEvidenceSource,'STRICT_TRACKING_FRAME_GUARD');
assert.strictEqual(v.teamTimeline[1].presentCount,0);
assert.strictEqual(r.report({}).presenceEvidence.invalidObservedInstants,1);
const eleven=Array.from({length:11},(_,i)=>({trackId:i+1,score:.9})),full=Runtime.decorate(bridge()).create();
full.processFrame(eleven,0,{});full.processFrame([],1,{unavailable:true});full.processFrame(eleven,2,{});
assert.strictEqual(full.report({}).presenceEvidence.presenceCoverage,1);
assert.strictEqual(full.report({}).presenceEvidence.presenceQuality,'PARTIEL');
const mismatch=Runtime.decorate(bridge({truncate:true})).create();
mismatch.processFrame(one,0,{});mismatch.processFrame(one,1,{});
assert.strictEqual(mismatch.report({}).presenceEvidence.invalidObservedInstants,2);
const legacy=Runtime.decorate(bridge({omit:true})).create();
legacy.processFrame(one,0,{});
assert.strictEqual(legacy.report({}).presenceEvidence.invalidObservedInstants,0);
console.log('observed presence strict timeline provenance: PASS (14 assertions)');
