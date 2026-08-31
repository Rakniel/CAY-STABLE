const assert=require('assert');
const Presence=require('../observed_presence_v1.js');
const Report=require('../observed_presence_report_v1.js');

function cards(n){
  return Array.from({length:n},(_,i)=>({id:i+1,identityQuality:'FIABLE'}));
}

const projectors={1:{validated:true,source:'test',confidence:1,project:p=>({x:p.x||0,y:p.y||0})}};

const clean=Presence.createState();
Presence.observeFrame(clean,Array.from({length:11},(_,i)=>({trackId:i+1,score:.9})),0,{segment:1});
Presence.observeFrame(clean,Array.from({length:8},(_,i)=>({trackId:i+1,score:.85})),1,{segment:1});
const cleanReport=Report.buildPresenceReport(clean,cards(12),projectors);
assert.equal(cleanReport.frames[0].frameEvidenceValid,true);
assert.equal(cleanReport.frames[0].presenceQuality,'FIABLE');
assert.equal(cleanReport.frames[1].presenceQuality,'PARTIEL');
assert.equal(cleanReport.presenceQuality,'PARTIEL');
assert.equal(cleanReport.invalidObservedInstants,0);
assert.equal(cleanReport.observedPlayerSlots,19);
assert.equal(cleanReport.possiblePlayerSlots,22);
assert.equal(cleanReport.policy.noSilentTruncation,true);
assert.equal(cleanReport.policy.noSilentDeduplication,true);

const corrupted={
  frames:[
    {time:0,segment:1,observedIds:[1,2,3,4,5,6,7,8,9,10,11,12],confidence:.9},
    {time:1,segment:1,observedIds:[1,1,2,3],confidence:.9},
    {time:2,segment:1,observedIds:[1,2,3],confidence:.9}
  ],
  players:new Map(),maxObserved:0,rejectedDuplicateIds:0,rejectedOverflow:0
};
const badReport=Report.buildPresenceReport(corrupted,cards(12),projectors);
assert.equal(badReport.frames[0].frameEvidenceValid,false);
assert.equal(badReport.frames[0].frameEvidenceReason,'MORE_THAN_11_CAY_IDS');
assert.equal(badReport.frames[0].presentCount,0);
assert.equal(badReport.frames[0].presenceQuality,'INDISPONIBLE');
assert.equal(badReport.frames[1].frameEvidenceValid,false);
assert.equal(badReport.frames[1].frameEvidenceReason,'DUPLICATE_ID_SAME_FRAME');
assert.equal(badReport.frames[1].presentCount,0);
assert.equal(badReport.frames[2].frameEvidenceValid,true);
assert.equal(badReport.invalidObservedInstants,2);
assert.equal(badReport.validObservedInstants,1);
assert.equal(badReport.observedPlayerSlots,3);
assert.equal(badReport.possiblePlayerSlots,11);
assert.equal(badReport.presenceCoverage,+((3/11).toFixed(4)));
assert.equal(badReport.invalidFrameEvidence.overflowIds,1);
assert.equal(badReport.invalidFrameEvidence.duplicateIds,1);
assert.equal(badReport.invalidFrameEvidence.policy,'INVALID_FRAME_EXCLUDED_FROM_COVERAGE_DENOMINATOR');
assert.equal(badReport.teamMetricProjectionCoverage,undefined);
assert.equal(badReport.metricProjectionCoverage,1);

const allInvalid={
  frames:[{time:0,segment:1,observedIds:[1,1],confidence:.9}],
  players:new Map(),maxObserved:0,rejectedDuplicateIds:0,rejectedOverflow:0
};
const allInvalidReport=Report.buildPresenceReport(allInvalid,cards(12),projectors);
assert.equal(allInvalidReport.validObservedInstants,0);
assert.equal(allInvalidReport.possiblePlayerSlots,0);
assert.equal(allInvalidReport.presenceCoverage,0);
assert.equal(allInvalidReport.presenceQuality,'INDISPONIBLE');

const applied=Report.applyToReport({team:{},teamCoverage:{},players:cards(12)},corrupted,projectors);
assert.equal(applied.team.invalidObservedInstants,2);
assert.equal(applied.teamCoverage.invalidObservedInstants,2);
assert.equal(applied.presenceEvidence.policy.invalidFrame,'INDISPONIBLE_AND_EXCLUDED_FROM_OBSERVED_SLOTS_AND_COVERAGE_DENOMINATOR');
console.log('observed presence invalid-frame guard: PASS (31 checks)');
