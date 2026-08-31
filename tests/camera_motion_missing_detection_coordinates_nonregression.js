'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
let checks=0;const ok=(c,m)=>{assert.ok(c,m);checks++;};
const Core={assignFrame(){return[];},appearanceDistance(a,b){if(!a||!b)return .45;return Math.abs((a[0]||0)-(b[0]||0));}};
const TwoStage={assignFrame(){return {assigned:[]};}};
const sandbox={console,setTimeout,clearTimeout,CAYTrackingCore:Core,CAYTrackingTwoStageAdapter:TwoStage};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','tracking_two_stage_runtime_patch_v1.js'),'utf8'),sandbox);
const C=sandbox.CAYCameraMotionConsensus;ok(C&&typeof C.estimateGlobalMotion==='function','API GMC disponible');
const state={active:[
 {globalId:1,cat:'team',x:.08,y:.08,seen:10,feature:[.10]},
 {globalId:2,cat:'team',x:.18,y:.12,seen:10,feature:[.20]},
 {globalId:3,cat:'team',x:.28,y:.16,seen:10,feature:[.30]}
]};
const valid=[
 {cat:'team',x:.10,y:.09,feature:[.10]},
 {cat:'team',x:.20,y:.13,feature:[.20]}
];
const missingPoint={cat:'team',x:null,y:'',feature:[.30]};
const e=C.estimateGlobalMotion(state,[...valid,missingPoint],{cameraMotionScore:.9,fieldGeometryDelta:.02,zoomDelta:.01});
ok(!e.available,'une detection sans coordonnees ne peut pas rendre le GMC disponible');
ok(e.reason==='insufficient_players','la detection sans point exploitable est retiree avant consensus');
const missingBox={cat:'team',box:{x:null,y:10,w:20,h:40},feature:[.30]};
const b=C.estimateGlobalMotion(state,[...valid,missingBox],{cameraMotionScore:.9,fieldGeometryDelta:.02,zoomDelta:.01,width:1000,height:600});
ok(!b.available,'une bbox incomplete ne peut pas alimenter le GMC');
ok(b.reason==='insufficient_players','bbox incomplete retiree avant consensus');
const zeroPoint={cat:'team',x:0,y:0,feature:[.30]};
const z=C.estimateGlobalMotion(state,[...valid,zeroPoint],{cameraMotionScore:.9,fieldGeometryDelta:.02,zoomDelta:.01});
ok(z.reason!=='insufficient_players','un vrai point explicite (0,0) reste une coordonnee exploitable');
console.log(`${checks}/${checks} camera motion missing-coordinate non-regression: PASS`);
