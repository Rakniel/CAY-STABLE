const assert=require('assert');
const Core=require('../tracking_core_v1.js');
const Stats=require('../player_stats_v1.js');
let pass=0,fail=0;
function check(name,fn){try{fn();console.log('PASS',name);pass++;}catch(e){console.error('FAIL',name,e.message);fail++;}}
const s=Core.createState();
const f=(v)=>[v,v+.01,v+.02];
Core.assignFrame(s,[{x:.2,y:.4,cat:'team',feature:f(.1),score:.92}],10,{maxPlayers:11,allowNew:true});
for(let t=10.5;t<=16;t+=.5)Core.assignFrame(s,[{x:.2+(t-10)*.01,y:.4,cat:'team',feature:f(.1),score:.92}],t,{maxPlayers:11,allowNew:true});
Core.assignFrame(s,[
  {x:.27,y:.4,cat:'team',feature:f(.1),score:.92},
  {x:.7,y:.5,cat:'team',feature:f(.7),score:.95}
],17,{maxPlayers:11,allowNew:true});
for(let t=17.5;t<=22;t+=.5)Core.assignFrame(s,[
  {x:.27+(t-17)*.006,y:.4,cat:'team',feature:f(.1),score:.92},
  {x:.7-(t-17)*.005,y:.5,cat:'team',feature:f(.7),score:.95}
],t,{maxPlayers:11,allowNew:true});
const r=Stats.buildReport(s,Core,{});
const first=r.players[0],later=r.players[1];
check('analysis start comes from earliest tracked observation',()=>assert.equal(r.analysisStart,10));
check('early player is present at beginning of analysis',()=>assert.equal(first.rosterState.entry,'PRESENT_AU_DEBUT_ANALYSE'));
check('later player is not falsely declared substitute',()=>assert.equal(later.rosterState.entry,'APPARU_PLUS_TARD'));
check('replacement remains unconfirmed without validated event',()=>assert.equal(later.rosterState.replacementConfirmed,false));
check('report explains why replacement is unconfirmed',()=>assert.match(later.rosterState.replacementReason,/aucun événement/));
check('team confirmed replacement count stays zero',()=>assert.equal(r.team.confirmedReplacements,0));
check('presence intervals are exposed in player card',()=>assert.ok(Array.isArray(first.presenceIntervals)&&first.presenceIntervals.length>=1));
check('metric data still unavailable without projector',()=>assert.equal(first.metric.quality,'INDISPONIBLE'));
check('ball-derived stats remain unavailable',()=>assert.ok(r.unavailable.possession&&r.unavailable.passes&&r.unavailable.shots));
check('later appearance is counted separately from confirmed replacement',()=>assert.equal(r.team.appearedLater,1));
console.log(`roster presence states: ${pass} PASS / ${fail} FAIL`);
if(fail)process.exit(1);
