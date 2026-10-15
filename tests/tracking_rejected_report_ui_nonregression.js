'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','stable_runtime_tracking_v2.js'),'utf8');
new Function(source);
const marker='function drawLongTrackFrame(c,assigned){';
assert.equal(source.split(marker).length,2,'unique hook insertion anchor');
const instrumented=source.replace(marker,'root.__testRun=runTrackingLongTermStable;root.__testClear=clearPlayerStats;\\n'+marker).replace('\\nfunction drawLongTrackFrame','\nfunction drawLongTrackFrame');
let count=0;
function check(value,label){assert.ok(value,label);count++;}
async function scenario(mode){
  const ids=['stableStatsCardsV2','stableStatsCoverageV2','stableTeamCoverageV2','exportTracking','trackingGallery','trackingStatus','runTracking','trackingProgress','trackDuration','trackStep','tFrames','tIds','tStable','tMatches','tLongest','tSegments','trackingBar','stablePlayerStatsV2','analysisTeamName'];
  const nodes=Object.fromEntries(ids.map(id=>[id,{
    id,textContent:'ancien',innerHTML:'ancien',dataset:{cayRenderer:'OLD'},children:['old'],
    replaceChildren(){this.children=[];this.innerHTML='';},
    classList:{remove(){}},style:{},
    value:id==='trackDuration'?'1':id==='trackStep'?'1':''
  }]));
  const bridge={
    state:{segment:1},processUnavailableFrame(){},
    summary:()=>({tracks:[],rosterTotal:0,segments:1,maxVisible:0,reidentified:0,manualMerges:0,totalAssociations:0}),
    report:()=>({bridge:{attemptedObservationFrames:1,usableObservationFrames:0,unavailableObservationFrames:1,observationCoverage:0},unavailable:{}})
  };
  const env={
    document:{readyState:'loading',getElementById:id=>nodes[id]||null,addEventListener(){}},
    CAYStableTrackingRuntimeGuard:{verdict:()=>({ok:mode!=='blocked'})},
    CAYStableTrackingBridge:{create:()=>bridge},
    CAYFirstResultsRuntimeGuardBridge:{completionVerdict:()=>({status:'INDISPONIBLE',reason:'AUCUNE_FRAME',exportAllowed:false})},
    lastTrackingReport:{stale:true},currentFile:mode==='noFile'?null:{name:'test.mp4'},video:{duration:1},
    refsFor:()=>mode==='noRefs'?[]:[1,2,3],trackingStart:()=>0,
    getModel:async()=>{if(mode==='error')throw Error('modele absent');return {};},
    frame:async()=>({width:900,height:500}),trackingPoly:()=>null,
    tf:t=>String(t),status(){},setTimeout
  };
  const api=new Function('globalThis','document','lastTrackingReport','currentFile','video','refsFor','trackingStart','getModel','frame','trackingPoly','tf','status','setTimeout',
    instrumented+';return {run:globalThis.__testRun,clear:globalThis.__testClear,getReport:()=>lastTrackingReport};'
  )(env,env.document,env.lastTrackingReport,env.currentFile,env.video,env.refsFor,env.trackingStart,env.getModel,env.frame,env.trackingPoly,env.tf,env.status,env.setTimeout);
  let error=null;try{await api.run();}catch(e){error=e;}
  check(mode==='error'?error?.message==='modele absent':error===null,'exception '+mode);
  check(nodes.stableStatsCardsV2.textContent.includes('INDISPONIBLE'),'cards '+mode);
  check(nodes.stableStatsCardsV2.dataset.cayRenderer==='INDISPONIBLE','renderer '+mode);
  check(nodes.stableStatsCoverageV2.textContent.includes('INDISPONIBLE'),'coverage '+mode);
  check(nodes.stableTeamCoverageV2.textContent.includes('non publiables'),'team '+mode);
  check(nodes.exportTracking.disabled===true,'export '+mode);
  check(nodes.trackingGallery.children.length===0,'gallery '+mode);
  check(api.getReport()===null,'report cleared '+mode);
}
(async()=>{
  for(let repeat=0;repeat<5;repeat++){
    for(const mode of ['blocked','noFile','noRefs','error','rejected'])await scenario(mode);
  }
  console.log('tracking rejected report UI: '+count+' assertions PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
