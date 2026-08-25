const assert=require('assert');
const V=require('../validated_report_bridge_v1.js');
let pass=0; const check=(name,v)=>{assert(v,name);pass++;};
const coreState={};
const coreApi={summary(){return {segments:1,rosterTotal:2,maxVisible:2,tracks:[
  {id:2,cat:'player',segments:[1],firstTime:0,lastTime:60,observedDuration:60,observations:10,presenceIntervals:[[0,60]],reidentifications:0,mergedFrom:[],identityConfidence:.95,quality:'FIABLE',normalizedTravel:1},
  {id:12,cat:'player',segments:[1],firstTime:61,lastTime:120,observedDuration:59,observations:10,presenceIntervals:[[61,120]],reidentifications:0,mergedFrom:[],identityConfidence:.95,quality:'FIABLE',normalizedTravel:1}
]};}};
coreState.archive=[
 {globalId:2,archived:true,fullPath:[{time:0,segment:1,x:.2,y:.3},{time:1,segment:1,x:.21,y:.3}]},
];
coreState.active=[
 {globalId:12,archived:false,fullPath:[{time:61,segment:1,x:.4,y:.5},{time:62,segment:1,x:.41,y:.5}]},
];
let report=V.buildReport(coreState,coreApi,{},[
 {type:'replacement',validated:true,outPlayerId:2,inPlayerId:12,time:61.2,segment:1,source:'manual',confidence:.98},
 {type:'replacement',validated:false,outPlayerId:12,inPlayerId:2,time:90}
]);
check('validated replacement counted in team report',report.team.confirmedReplacements===1);
check('replacement quality reliable when accepted',report.team.replacementQuality==='FIABLE');
check('rejected replacement remains measurable',report.team.replacementRejectedCount===1);
check('validated layer exposed with provenance',report.validatedReplacements.events[0].source==='manual');
check('outgoing player card marked confirmed',report.players.find(p=>p.id===2).rosterState.replacementConfirmed===true);
check('incoming player card marked confirmed',report.players.find(p=>p.id===12).rosterState.replacementConfirmed===true);
check('outgoing direction retained',report.players.find(p=>p.id===2).replacementEvents[0].direction==='OUT');
check('incoming direction retained',report.players.find(p=>p.id===12).replacementEvents[0].direction==='IN');
check('unavailable replacement flag removed after validation',!Object.prototype.hasOwnProperty.call(report.unavailable,'confirmedReplacements'));
check('possession remains unavailable',typeof report.unavailable.possession==='string');
const none=V.buildReport(coreState,coreApi,{},[]);
check('no silent replacement inference',none.team.confirmedReplacements===0);
check('replacement unavailable without validated event',typeof none.unavailable.confirmedReplacements==='string');
check('player stays unconfirmed without event',none.players.every(p=>p.rosterState.replacementConfirmed===false));
const rejected=V.buildReport(coreState,coreApi,{},[
 {type:'replacement',validated:true,outPlayerId:2,inPlayerId:99,time:61.2,confidence:.99}
]);
check('unknown id not counted',rejected.team.confirmedReplacements===0);
check('unknown id rejection visible',rejected.validatedReplacements.rejected.some(x=>x.reason==='UNKNOWN_PLAYER_ID'));
check('rejected-only state stays unavailable',rejected.team.replacementQuality==='INDISPONIBLE');
console.log(`PASS validated report bridge: ${pass}/16`);
