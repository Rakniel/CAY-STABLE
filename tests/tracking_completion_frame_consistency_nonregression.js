'use strict';
const assert=require('assert');
const guard=require('../first_results_runtime_guard_bridge_v1.js');
const env={CAYStableTrackingRuntimeGuard:{verdict:()=>({ok:true})}};
const player=(id=7)=>({id,cat:'team',x:.5,y:.5});
const frames=(count=10,usable=9)=>Array.from({length:count},(_,i)=>({
  time:i,status:i<usable?'OBSERVE':'INDISPONIBLE',
  detections:i<usable?[player()]:[]
}));
const report=(count=10,usable=9)=>({runtimeTrackingGuard:{ok:true},bridge:{
  attemptedObservationFrames:count,usableObservationFrames:usable,unavailableObservationFrames:count-usable,
  observationCoverage:usable/count,observationQuality:usable/count>=.8?'FIABLE':usable?'PARTIEL':'INDISPONIBLE'
}});
const summary={maxVisible:1,tracks:[{id:7,observations:9}]};
const verdict=(r=report(),s=summary,f=frames())=>guard.completionVerdict(r,s,f,env);
let assertions=0;
const check=(v,expected,message)=>{assert.strictEqual(v.exportAllowed,expected,message);assertions++;};
for(let pass=0;pass<5;pass++){
  check(verdict(),true,'valid stable track');
  check(verdict(report(10,6),summary,frames(10,6)),true,'partial but explicit');
  check(verdict(report(10,0),summary,frames(10,0)),false,'zero coverage');
  check(verdict(report(),summary,frames().map(f=>({...f,time:f.time-1}))),false,'negative video time');
  check(verdict(report(),summary,frames().map((f,i)=>({...f,time:i===9?-1:i}))),false,'negative unavailable time');
  const two=frames().map(f=>f.status==='OBSERVE'?{...f,detections:[...f.detections,player(8)]}:f);
  check(verdict(report(),summary,two),false,'maxVisible underdeclared');
  check(verdict(report(),{maxVisible:2,tracks:[...summary.tracks,{id:8,observations:9}]},two),true,'valid two-player peak');
  check(verdict(report(),summary,frames().map((f,i)=>({...f,time:Math.floor(i/2)}))),false,'duplicate time');
  check(verdict(report(),{...summary,maxVisible:12},frames()),false,'12 simultaneous disallowed');
  const substitutions=frames(16,16).map((f,i)=>({...f,detections:[player(i<5?7:i+3)]}));
  const roster=[{id:7,observations:5},...Array.from({length:11},(_,i)=>({id:i+8,observations:1}))];
  check(verdict(report(16,16),{maxVisible:1,tracks:roster},substitutions),true,'roster over 11 allowed');
}
console.log('tracking completion frame consistency: '+assertions+' assertions PASS');
