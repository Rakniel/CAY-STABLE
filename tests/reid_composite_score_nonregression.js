const assert=require('assert');
const T=require('../tracking_core_v1.js');
let pass=0;
const check=(name,cond)=>{assert(cond,name);pass++;};
const det=(x,y,feature,score=.96,cat='team')=>({cat,x,y,score,feature});

const cross=T.createState();
const a=T.assignFrame(cross,[det(.20,.45,[.10,.20,.30]),det(.70,.45,[.60,.20,.30])],0,{lostAfter:0});
T.assignFrame(cross,[det(.21,.45,[.10,.20,.30]),det(.69,.45,[.60,.20,.30])],.5,{lostAfter:0});
const ids=a.map(x=>x.trackId);
T.startSegment(cross,'camera_cut');
const reacquired=T.assignFrame(cross,[det(.80,.50,[.10,.20,.30]),det(.15,.50,[.60,.20,.30])],8,{reidentifyArchived:true,reidAppearanceThreshold:.08,reidScoreThreshold:.78});
check('cross-plan strong appearance preserves both IDs',reacquired.map(x=>x.trackId).sort((x,y)=>x-y).join(',')===ids.slice().sort((x,y)=>x-y).join(','));
check('cross-plan position is not blindly reused',reacquired[0].trackId===ids[0]&&reacquired[1].trackId===ids[1]);
check('no duplicate ID after re-identification',new Set(reacquired.map(x=>x.trackId)).size===2);
let s=T.summary(cross);
check('re-identification count recorded',s.reidentified===2);
check('strong re-ID stores score',s.tracks.every(x=>typeof x.lastReidScore==='number'&&x.lastReidScore>=.78));
check('strong re-ID stores provenance',s.tracks.every(x=>x.lastReidEvidence&&x.lastReidEvidence.segment===2));
check('re-ID evidence stores gap',s.tracks.every(x=>x.lastReidEvidence.gap>0));

const weak=T.createState();
T.assignFrame(weak,[det(.25,.45,[.20,.20,.20],.55)],0,{lostAfter:0});
T.startSegment(weak,'camera_cut');
const weakReturn=T.assignFrame(weak,[det(.75,.45,[.20,.20,.20],.10)],170,{reidentifyArchived:true,reidAppearanceThreshold:.08,reidScoreThreshold:.90,maxReidGap:180})[0];
check('low composite score creates a new ID',weakReturn.trackId!==1);
s=T.summary(weak);
check('low-score rejection is measurable',s.reidRejectedLowScore===1);
check('low-score rejection does not count as re-ID',s.reidentified===0);

const stale=T.createState();
T.assignFrame(stale,[det(.25,.45,[.30,.30,.30])],0,{lostAfter:0});
T.startSegment(stale,'camera_cut');
const staleReturn=T.assignFrame(stale,[det(.25,.45,[.30,.30,.30])],200,{reidentifyArchived:true,maxReidGap:60,reidAppearanceThreshold:.08})[0];
check('stale identity creates a new ID',staleReturn.trackId!==1);
check('stale rejection is measurable',T.summary(stale).reidRejectedStale===1);

const ambiguous=T.createState();
T.assignFrame(ambiguous,[det(.20,.45,[.200,.20,.20]),det(.70,.45,[.205,.20,.20])],0,{lostAfter:0});
T.startSegment(ambiguous,'camera_cut');
const amb=T.assignFrame(ambiguous,[det(.45,.45,[.202,.20,.20])],5,{reidentifyArchived:true,reidAppearanceThreshold:.05,reidScoreThreshold:.75,reidScoreUniquenessMargin:.035})[0];
check('near-tied candidates are not force-merged',amb.trackId>2);
check('ambiguity rejection is measurable',T.summary(ambiguous).reidRejectedAmbiguous===1);

const same=T.createState();
const original=T.assignFrame(same,[det(.20,.50,[.12,.34,.56])],0,{lostAfter:1})[0];
T.assignFrame(same,[],1,{lostAfter:1});
T.assignFrame(same,[],2,{lostAfter:1});
const sameReturn=T.assignFrame(same,[det(.78,.51,[.12,.34,.56])],5,{lostAfter:1,reidentifyArchived:true,reidAppearanceThreshold:.05,reidScoreThreshold:.78,minSameSegmentReidGap:2})[0];
check('same-plan long disappearance can recover with exact appearance',sameReturn.trackId===original.trackId);
s=T.summary(same);
check('same-plan recovery keeps two presence intervals',s.tracks[0].presenceIntervals.length===2);
check('same-plan recovery records score',s.tracks[0].lastReidScore>=.78);

const category=T.createState();
T.assignFrame(category,[det(.50,.20,[.11,.22,.33],.96,'goalkeeper')],0,{lostAfter:0});
T.startSegment(category,'camera_cut');
const field=T.assignFrame(category,[det(.50,.20,[.11,.22,.33],.96,'team')],4,{reidentifyArchived:true,reidAppearanceThreshold:.05})[0];
check('goalkeeper cannot be silently reused as field-player ID',field.trackId!==1);

check('composite scorer exported for diagnostics',typeof T.reidCandidateScore==='function');
check('hard roster invariant still respected',T.assignFrame(T.createState(),Array.from({length:15},(_,i)=>det(i/20,.5,[i/100,.2,.3])),0).length===11);

console.log(`PASS composite re-ID non-regression: ${pass}/20`);