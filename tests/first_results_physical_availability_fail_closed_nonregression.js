'use strict';
const assert=require('node:assert/strict');
const Gate=require('../first_results_testability_gate_v1.js');
const card=(id,core,flags,rosterStatus='LIÉ')=>({
  id,roster:{status:rosterStatus,playerId:'CAY-'+id},
  firstResults:{tracking:core,trajectory:core,heatmap:core,...flags}
});
const flags=row=>{
  const f=row.firstResults;
  return [f.distanceAvailable,f.avgSpeedAvailable,f.maxSpeedAvailable,f.sprintsAvailable,f.physicalMetricsAvailable];
};
for(let iteration=0;iteration<5;iteration++){
  const stale=card('stale',true,{
    distance:false,avgSpeed:false,maxSpeed:false,sprints:false,
    distanceAvailable:true,avgSpeedAvailable:true,maxSpeedAvailable:true,
    sprintsAvailable:true,physicalMetricsAvailable:true
  });
  assert.deepEqual(flags(Gate.alignPlayerCards({players:[stale]}).players[0]),
    [false,false,false,false,false],'stale availability cannot become a CAY result');
  const noCore=card('no-core',false,{
    distance:true,avgSpeed:true,maxSpeed:true,sprints:true,
    distanceAvailable:true,avgSpeedAvailable:true,maxSpeedAvailable:true,
    sprintsAvailable:true,physicalMetricsAvailable:true
  });
  assert.deepEqual(flags(Gate.alignPlayerCards({players:[noCore]}).players[0]),
    [false,false,false,false,false],'pitch-visual core required for physical publication');
  const partial=card('partial',true,{distance:true,avgSpeed:false,maxSpeed:false,sprints:false});
  assert.deepEqual(flags(Gate.alignPlayerCards({players:[partial]}).players[0]),
    [true,false,false,false,true],'only individually evidenced physical metrics are available');
  const all=card('complete',true,{distance:true,avgSpeed:true,maxSpeed:true,sprints:true});
  assert.deepEqual(flags(Gate.alignPlayerCards({players:[all]}).players[0]),
    [true,true,true,true,true],'complete physical evidence stays available');
  const model={players:[
    card('valid',true,{distance:true}),
    card('opponent',true,{distance:true,distanceAvailable:true},'NON_LIÉ')
  ]};
  const aligned=Gate.alignPlayerCards(model);
  assert.equal(aligned.summary.players,1);
  assert.deepEqual(flags(aligned.players[1]),[false,false,false,false,false],
    'unlinked players never publish CAY physical metrics');
  const conflict=Gate.alignPlayerCards({players:[
    card('track1',true,{distance:true}),
    {...card('track2',true,{distance:true}),roster:{status:'LIÉ',playerId:'CAY-track1'}}
  ]});
  assert.equal(conflict.summary.players,0);
  assert.deepEqual(flags(conflict.players[0]),[false,false,false,false,false]);
  assert.deepEqual(flags(conflict.players[1]),[false,false,false,false,false]);
}
console.log('first-results physical availability fail-closed: PASS');