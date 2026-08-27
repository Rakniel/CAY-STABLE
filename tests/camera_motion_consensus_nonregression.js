'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
let checks=0;const ok=(c,m)=>{assert.ok(c,m);checks++;};const near=(a,b,t,m)=>{assert.ok(Math.abs(a-b)<=t,`${m}: ${a} vs ${b}`);checks++;};
const Core={assignFrame(){return[];},appearanceDistance(a,b){if(!a||!b)return .45;return Math.abs((a[0]||0)-(b[0]||0));}};
const TwoStage={assignFrame(){return {assigned:[]};}};
const sandbox={console,setTimeout,clearTimeout,CAYTrackingCore:Core,CAYTrackingTwoStageAdapter:TwoStage};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','tracking_two_stage_runtime_patch_v1.js'),'utf8'),sandbox);
const C=sandbox.CAYCameraMotionConsensus;ok(C&&typeof C.estimateGlobalTranslation==='function','API compensation caméra exportée');
const state={active:[
 {globalId:1,cat:'team',x:.20,y:.40,seen:9,feature:[.10],motionHistory:[{x:.18,y:.40,time:0},{x:.20,y:.40,time:1}]},
 {globalId:2,cat:'team',x:.45,y:.52,seen:9,feature:[.20],motionHistory:[{x:.43,y:.52,time:0},{x:.45,y:.52,time:1}]},
 {globalId:3,cat:'team',x:.70,y:.35,seen:9,feature:[.30],motionHistory:[{x:.68,y:.35,time:0},{x:.70,y:.35,time:1}]},
 {globalId:4,cat:'goalkeeper',x:.10,y:.50,seen:9,feature:[.40],motionHistory:[{x:.10,y:.50,time:0},{x:.10,y:.50,time:1}]}
]};
const dets=[
 {cat:'team',x:.27,y:.41,feature:[.10]},{cat:'team',x:.52,y:.53,feature:[.20]},{cat:'team',x:.77,y:.36,feature:[.30]},{cat:'goalkeeper',x:.17,y:.51,feature:[.40]}
];
const e=C.estimateGlobalTranslation(state,dets,{cameraMotionScore:.9,fieldGeometryDelta:.05,zoomDelta:.02});
ok(e.available,'translation caméra cohérente détectée');near(e.dx,.07,.012,'pan horizontal estimé');near(e.dy,.01,.012,'pan vertical estimé');ok(e.support>=3,'consensus multi-joueurs requis');
const before=state.active[0].motionHistory[1].x;const changed=C.applyTranslationToState(state,e);ok(changed===4,'tous les tracks actifs compensés');near(state.active[0].x,.27,.012,'position courante déplacée dans le repère caméra actuel');near(state.active[0].motionHistory[1].x,before+.07,.012,'historique de mouvement compensé sans toucher fullPath');ok(state.cameraCompensations===1,'provenance compensation enregistrée');
const zoomReject=C.estimateGlobalTranslation(state,dets,{cameraMotionScore:.9,fieldGeometryDelta:.05,zoomDelta:.5});ok(!zoomReject.available&&zoomReject.reason==='non_translation_camera_change','zoom fort rejeté par le compensateur translation-only');
const weakReject=C.estimateGlobalTranslation({active:state.active.slice(0,2)},dets.slice(0,2),{cameraMotionScore:.9,fieldGeometryDelta:.02,zoomDelta:.01});ok(!weakReject.available,'moins de trois joueurs: aucune compensation inventée');
console.log(`${checks}/${checks} camera motion consensus non-regression: PASS`);
