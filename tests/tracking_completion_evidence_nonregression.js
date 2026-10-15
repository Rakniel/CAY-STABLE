'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const guard=require('../first_results_runtime_guard_bridge_v1.js');
const env={CAYStableTrackingRuntimeGuard:{verdict:()=>({ok:true})}};
const frames=(n=9)=>Array.from({length:10},(_,i)=>i<n?{time:i,status:'OBSERVE',detections:[{id:7,cat:'team',x:.5,y:.5}]}:{time:i,status:'INDISPONIBLE',detections:[]});
const report=(n=9)=>({runtimeTrackingGuard:{ok:true},bridge:{attemptedObservationFrames:10,usableObservationFrames:n,unavailableObservationFrames:10-n,observationCoverage:n/10,observationQuality:n>=8?'FIABLE':n?'PARTIEL':'INDISPONIBLE'}});
const summary={maxVisible:1,tracks:[{id:7,observations:9}]};
const verdict=(r=report(),s=summary,f=frames(),e=env)=>guard.completionVerdict(r,s,f,e);
let count=0;
function check(actual,expected,label){assert.strictEqual(actual,expected,label);count++;}
for(let repeat=0;repeat<5;repeat++){
 check(verdict().status,'ANALYSE_TERMINEE','ready');
 check(verdict(report(6),summary,frames(6)).status,'PARTIEL','partial');
 check(verdict(report(0),summary,frames(0)).exportAllowed,false,'zero');
 check(verdict(report(),{...summary,maxVisible:12},frames()).exportAllowed,false,'12');
 check(verdict(report(),{...summary,tracks:[]},frames()).exportAllowed,false,'no stable');
 check(verdict(report(),summary,frames().map(f=>({...f,detections:f.detections.map(d=>({...d,id:8}))}))).exportAllowed,false,'ghost');
 check(verdict(report(),summary,frames().map(f=>f.status==='OBSERVE'?{...f,detections:[...f.detections,...f.detections]}:f)).exportAllowed,false,'duplicate');
 check(verdict(report(),summary,frames().map(f=>f.status==='OBSERVE'?{...f,detections:f.detections.map(d=>({...d,cat:'spectator'}))}:f)).exportAllowed,false,'spectator');
 check(verdict({...report(),runtimeTrackingGuard:{ok:false}}).exportAllowed,false,'runtime');
 check(verdict(report(),summary,frames(),{CAYStableTrackingRuntimeGuard:{verdict:()=>({ok:false})}}).exportAllowed,false,'runtime env');
 check(verdict(report(),summary,frames().slice(1)).exportAllowed,false,'missing frame');
 check(verdict(report(),summary,frames().map((f,i)=>({...f,time:9-i}))).exportAllowed,false,'reversed time');
 check(verdict(report(),summary,frames().map((f,i)=>({...f,time:Math.floor(i/2)}))).exportAllowed,false,'duplicate frame timestamp');
 check(verdict(report(),summary,frames().map(f=>f.status==='OBSERVE'?{...f,detections:f.detections.map(d=>({...d,x:NaN}))}:f)).exportAllowed,false,'invalid coords');
 check(verdict(report(),summary,frames().map(f=>f.status==='OBSERVE'?{...f,detections:Array.from({length:12},(_,i)=>({id:i+1,cat:'team',x:.5,y:.5}))}:f)).exportAllowed,false,'12 detections');
 check(verdict(report(),summary,frames().map(f=>f.status==='INDISPONIBLE'?{...f,detections:[{id:7,cat:'team',x:.5,y:.5}]}:f)).exportAllowed,false,'unavailable detections');
}
const source=fs.readFileSync(require.resolve('../stable_runtime_tracking_v2.js'),'utf8');
new vm.Script(source);
check(source.includes('completionVerdict?.(playerStats,sum,frames,root)'),true,'runtime wired');
check(source.includes('Tracking longue durée terminé ✓'),false,'no unconditional success');
console.log('tracking completion evidence: '+count+' assertions PASS');