'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const sourceGuard=fs.readFileSync(path.join(__dirname,'..','first_results_runtime_guard_bridge_v1.js'),'utf8');
const sourceRenderer=fs.readFileSync(path.join(__dirname,'..','player_card_renderer_v1.js'),'utf8');
function fixture(kind){
 const usable=kind==='FIABLE'?90:kind==='PARTIEL'?50:0;
 const bridge=kind==='MISSING'?{}:{attemptedObservationFrames:100,usableObservationFrames:usable,unavailableObservationFrames:100-usable};
 return {bridge,playerCards:{summary:{status:'TERRAIN_DISPONIBLE'},players:[{id:7,identity:{status:'FIABLE'},firstResults:{tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true},presence:{observations:44,observedDuration:60,trackingCoverage:90},observedVisuals:{status:'DISPONIBLE',heatmap:{cells:[[1]]}},pitchVisuals:{status:'DISPONIBLE',pitchLengthM:105,pitchWidthM:68,heatmap:{cells:[[1]]},trajectory:{status:'DISPONIBLE',runs:[[{x:1,y:1},{x:2,y:2}]]}},metrics:{distanceM:{status:'FIABLE',value:1234},avgSpeedKmh:{status:'FIABLE',value:7},maxSpeedKmh:{status:'FIABLE',value:24},sprintCount:{status:'FIABLE',value:2}}}]}};
}
function run(order,kind,trackingOk=true,withGuard=true){
 let writes=0,html='',leaks=0;
 const target={get innerHTML(){return html},set innerHTML(v){writes++;html=v;if(v.includes('1234 m'))leaks++},set textContent(v){html=v},get textContent(){return html}};
 const ctx={document:{getElementById:()=>target},CAYStableTrackingBridge:{create(){return {report(){return fixture(kind)}}}},CAYStableTrackingRuntimeGuard:{verdict(){return {ok:trackingOk,reasons:trackingOk?[]:['NO_TRACKING']}}}};
 if(order==='renderer-first'){vm.runInNewContext(sourceRenderer,ctx);if(withGuard)vm.runInNewContext(sourceGuard,ctx)}
 else{if(withGuard)vm.runInNewContext(sourceGuard,ctx);vm.runInNewContext(sourceRenderer,ctx)}
 const report=ctx.CAYStableTrackingBridge.create({}).report();
 return {writes,leaks,html,report};
}
for(let pass=0;pass<3;pass++){
 for(const order of ['renderer-first','guard-first']){
  const partial=run(order,'PARTIEL');assert.equal(partial.writes,1);assert.equal(partial.leaks,0);assert.equal(partial.report.playerCards.players[0].metrics.distanceM.value,null);
  const missing=run(order,'MISSING');assert.equal(missing.writes,1);assert.equal(missing.leaks,0);
  const full=run(order,'FIABLE');assert.equal(full.writes,1);assert.equal(full.leaks,1);
  const badRuntime=run(order,'FIABLE',false);assert.equal(badRuntime.writes,1);assert.equal(badRuntime.leaks,0);
 }
 assert.equal(run('renderer-first','FIABLE',true,false).writes,0,'renderer alone cannot publish without observation evidence');
}
console.log('RUN130 canonical publication order: PASS');
