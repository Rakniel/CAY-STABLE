'use strict';
const assert=require('node:assert/strict');
const stats=require('../player_stats_v1.js');
const projectors={0:{validated:true,confidence:0.95,source:'test',pitch:{lengthM:105,widthM:68},project:p=>({x:p.x,y:p.y})}};
const invalid=[
 {time:0,segment:0,x:true,y:10},
 {time:0,segment:0,x:10,y:'20'},
 {time:-1,segment:0,x:10,y:20},
 {time:'0',segment:0,x:10,y:20},
 {time:true,segment:0,x:10,y:20},
 {time:0,segment:'0',x:10,y:20},
 {time:0,segment:-1,x:10,y:20},
 {time:0,segment:0.5,x:10,y:20}
];
for(let repeat=0;repeat<5;repeat++){
 for(const p of invalid)assert.equal(stats.projectedMetricSeries([p],projectors)[0],null,'invalid metric input must fail closed');
 const state={active:[
  {globalId:1,cayIdentityConfirmed:true,fullPath:[{time:0,segment:0,x:10,y:10},{time:1,segment:0,x:200,y:10}]},
  {globalId:2,cayIdentityConfirmed:true,fullPath:[{time:0,segment:0,x:12,y:10},{time:1,segment:0,x:13,y:10}]}
 ],archive:[]};
 const summary={tracks:[{id:1,quality:'FIABLE'},{id:2,quality:'FIABLE'}]};
 const team=stats.buildInstantTeamTimeline(state,summary,projectors);
 assert.equal(team.metricCoverage,0.75,'only actual metric projections count');
 assert.equal(team.metricPlayerSlots,3);
 assert.equal(team.frames[1].metricEligibleCount,1);
 assert.equal(team.frames[1].metricQuality,'PARTIEL');
 assert.equal(team.frames[1].metricProjectionValidated,true);
 const negative=stats.metricForTrack({fullPath:[{time:-1,segment:0,x:10,y:10},{time:0,segment:0,x:11,y:10}]},projectors);
 assert.equal(negative.metricCoveredSeconds,0);
 assert.equal(negative.distanceM,null);
}
console.log('player stats metric projection integrity: PASS');