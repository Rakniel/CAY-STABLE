'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','stable_runtime_tracking_v2.js'),'utf8');
const start=source.indexOf('function renderPlayerStats(report){');
const end=source.indexOf('function drawLongTrackFrame(',start);
assert(start>=0&&end>start,'canonical player-stats function must exist');
const fnSource=source.slice(start,end);
function run(kind){
 const nodes={stableStatsCardsV2:{innerHTML:'',dataset:{}},stableStatsCoverageV2:{textContent:''},stableTeamCoverageV2:{textContent:''}};
 let renderCalls=0;
 const root={CAYPlayerCardRenderer:{render(_model,el){renderCalls++;el.innerHTML='1234 m';return true;}}};
 const fn=new Function('root','$','ensureStatsPanel',fnSource+'return renderPlayerStats;')(root,id=>nodes[id],()=>{});
 const report={team:{avgMetricCoverage:.8,playersWithMetricData:1},teamCoverage:{identity:.9,metric:.8},bridge:{observationCoverage:.9,attemptedObservationFrames:100,unavailableObservationFrames:10},playerCards:{players:[{id:1}]}};
 if(kind==='full'){report.runtimeTrackingGuard={ok:true};report.observationCoverageGuard={visualResultsAllowed:true,physicalResultsAllowed:true};}
 if(kind==='partial'){report.runtimeTrackingGuard={ok:true};report.observationCoverageGuard={visualResultsAllowed:true,physicalResultsAllowed:false};}
 if(kind==='bad-runtime'){report.runtimeTrackingGuard={ok:false};report.observationCoverageGuard={visualResultsAllowed:true};}
 const result=fn(report);
 return {result,renderCalls,cards:nodes.stableStatsCardsV2.innerHTML,coverage:nodes.stableStatsCoverageV2.textContent};
}
for(let pass=0;pass<3;pass++){
 const missing=run('missing');assert.equal(missing.renderCalls,0);assert.match(missing.cards,/INDISPONIBLE/);assert.match(missing.coverage,/INDISPONIBLE/);
 assert.equal(run('bad-runtime').renderCalls,0);
 const partial=run('partial');assert.equal(partial.renderCalls,1);assert.equal(partial.result,true);
 const full=run('full');assert.equal(full.renderCalls,1);assert.equal(full.result,true);
}
console.log('RUN130 STABLE direct render guard: PASS');
