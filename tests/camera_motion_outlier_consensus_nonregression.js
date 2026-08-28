'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
let checks=0;const ok=(c,m)=>{assert.ok(c,m);checks++;};const near=(a,b,t,m)=>{assert.ok(Math.abs(a-b)<=t,`${m}: ${a} vs ${b}`);checks++;};
const Core={assignFrame(){return[];},appearanceDistance(a,b){if(!a||!b)return .45;return Math.abs((a[0]||0)-(b[0]||0));}};
const TwoStage={assignFrame(){return {assigned:[]};}};
const sandbox={console,setTimeout,clearTimeout,CAYTrackingCore:Core,CAYTrackingTwoStageAdapter:TwoStage};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','tracking_two_stage_runtime_patch_v1.js'),'utf8'),sandbox);
const C=sandbox.CAYCameraMotionConsensus;ok(C&&typeof C.estimateGlobalMotion==='function','API compensation caméra exportée');
const state={active:[
 {globalId:1,cat:'team',x:.15,y:.25,seen:12,feature:[.10],motionHistory:[]},
 {globalId:2,cat:'team',x:.32,y:.62,seen:12,feature:[.20],motionHistory:[]},
 {globalId:3,cat:'team',x:.54,y:.30,seen:12,feature:[.30],motionHistory:[]},
 {globalId:4,cat:'team',x:.74,y:.68,seen:12,feature:[.40],motionHistory:[]},
 {globalId:5,cat:'team',x:.86,y:.42,seen:12,feature:[.50],motionHistory:[]}
]};
const dx=.06,dy=.012;
const dets=state.active.map(tr=>({cat:'team',x:tr.x+dx,y:tr.y+dy,feature:tr.feature}));
// One appearance-plausible correspondence is spatially wrong but still within the candidate gate.
dets[4]={cat:'team',x:.64,y:.59,feature:[.50]};
const e=C.estimateGlobalMotion(state,dets,{cameraMotionScore:.92,fieldGeometryDelta:.05,zoomDelta:.02});
ok(e.available,'consensus robuste disponible malgré un appariement aberrant');
ok(e.model==='translation','mouvement cohérent conservé comme translation');
near(e.tx,dx,.012,'translation x récupérée');near(e.ty,dy,.012,'translation y récupérée');
ok(e.support===4,'quatre correspondances cohérentes conservées');
ok(e.rejectedPairs===1,'une correspondance aberrante rejetée');
ok(e.residual<.01,'résidu final faible après raffinement');
const before=state.active.map(tr=>({x:tr.x,y:tr.y}));C.applyMotionToState(state,e);
for(let i=0;i<4;i++){near(state.active[i].x,before[i].x+dx,.012,`track ${i+1} compensé en x`);near(state.active[i].y,before[i].y+dy,.012,`track ${i+1} compensé en y`);}
ok(state.lastCameraCompensation.rejectedPairs===1,'provenance du rejet enregistrée');
console.log(`${checks}/${checks} robust GMC outlier consensus non-regression: PASS`);
