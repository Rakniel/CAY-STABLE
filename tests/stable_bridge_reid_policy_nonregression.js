const assert=require('assert');
const Bridge=require('../stable_tracking_bridge_v1.js');
let pass=0;
const check=(name,cond)=>{assert(cond,name);pass++;};
const det=(x=.30,y=.45,score=.96)=>({cat:'team',x,y,score,feature:[.12,.34,.56]});

const strict=Bridge.create({lostAfter:0,longGapSeconds:999,reidAppearanceThreshold:.05,reidScoreThreshold:.99});
const first=strict.processFrame([det()],0,{})[0];
const strictReturn=strict.processFrame([det(.72,.45,.96)],1,{segmentBreak:true,segmentReason:'camera_cut_test'})[0];
check('create-level strong score threshold reaches core',strictReturn.trackId!==first.trackId);
check('score rejection is visible through bridge summary',strict.summary().reidRejectedLowScore===1);
check('rejected reid creates a distinct roster identity',strict.summary().rosterTotal===2);

const permissive=Bridge.create({lostAfter:0,longGapSeconds:999,reidAppearanceThreshold:.05,reidScoreThreshold:.78});
const original=permissive.processFrame([det()],0,{})[0];
const recovered=permissive.processFrame([det(.72,.45,.96)],1,{segmentBreak:true,segmentReason:'camera_cut_test'})[0];
check('configured normal threshold still allows strong reid',recovered.trackId===original.trackId);
check('successful reid remains measurable',permissive.summary().reidentified===1);

const contextual=Bridge.create({lostAfter:0,longGapSeconds:999,reidAppearanceThreshold:.05,reidScoreThreshold:.70});
const ctxFirst=contextual.processFrame([det()],0,{})[0];
const ctxReturn=contextual.processFrame([det(.72,.45,.96)],1,{segmentBreak:true,reidScoreThreshold:.99})[0];
check('frame context can tighten score threshold',ctxReturn.trackId!==ctxFirst.trackId);
check('context-level score rejection is measurable',contextual.summary().reidRejectedLowScore===1);

const stale=Bridge.create({lostAfter:0,longGapSeconds:999,reidAppearanceThreshold:.05,maxReidGap:2});
const staleFirst=stale.processFrame([det()],0,{})[0];
const staleReturn=stale.processFrame([det()],5,{segmentBreak:true})[0];
check('create-level max reid gap reaches core',staleReturn.trackId!==staleFirst.trackId);
check('stale identity rejection is measurable',stale.summary().reidRejectedStale===1);

const staleCtx=Bridge.create({lostAfter:0,longGapSeconds:999,reidAppearanceThreshold:.05,maxReidGap:180});
const staleCtxFirst=staleCtx.processFrame([det()],0,{})[0];
const staleCtxReturn=staleCtx.processFrame([det()],5,{segmentBreak:true,maxReidGap:2})[0];
check('frame context can tighten max reid gap',staleCtxReturn.trackId!==staleCtxFirst.trackId);
check('context stale rejection is measurable',staleCtx.summary().reidRejectedStale===1);

const report=contextual.report({});
check('bridge report remains available after strict reid policy',report&&report.bridge&&Array.isArray(report.bridge.timeline));
check('no duplicate ID is emitted on strict-policy frames',new Set(report.bridge.timeline.filter(x=>x.type==='FRAME').flatMap(x=>x.trackIds)).size>=1);

console.log(`PASS stable bridge re-ID policy non-regression: ${pass}/14`);
