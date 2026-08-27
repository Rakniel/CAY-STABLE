'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
let checks=0;const ok=(c,m)=>{assert.ok(c,m);checks++;};const near=(a,b,t,m)=>{assert.ok(Math.abs(a-b)<=t,`${m}: ${a} vs ${b}`);checks++;};
const Core={assignFrame(){return[];},appearanceDistance(a,b){if(!a||!b)return .45;return Math.abs((a[0]||0)-(b[0]||0));}};
const TwoStage={assignFrame(){return {assigned:[]};}};
const sandbox={console,setTimeout,clearTimeout,CAYTrackingCore:Core,CAYTrackingTwoStageAdapter:TwoStage};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','tracking_two_stage_runtime_patch_v1.js'),'utf8'),sandbox);
const C=sandbox.CAYCameraMotionConsensus;ok(C&&typeof C.estimateGlobalMotion==='function','API compensation caméra exportée');
const state={active:[
 {globalId:1,cat:'team',x:.20,y:.40,seen:9,feature:[.10],motionHistory:[{x:.18,y:.40,time:0},{x:.20,y:.40,time:1}]},
 {globalId:2,cat:'team',x:.45,y:.52,seen:9,feature:[.20],motionHistory:[{x:.43,y:.52,time:0},{x:.45,y:.52,time:1}]},
 {globalId:3,cat:'team',x:.70,y:.35,seen:9,feature:[.30],motionHistory:[{x:.68,y:.35,time:0},{x:.70,y:.35,time:1}]},
 {globalId:4,cat:'goalkeeper',x:.10,y:.50,seen:9,feature:[.40],motionHistory:[{x:.10,y:.50,time:0},{x:.10,y:.50,time:1}]}
]};
const dets=[
 {cat:'team',x:.27,y:.41,feature:[.10]},{cat:'team',x:.52,y:.53,feature:[.20]},{cat:'team',x:.77,y:.36,feature:[.30]},{cat:'goalkeeper',x:.17,y:.51,feature:[.40]}
];
const e=C.estimateGlobalMotion(state,dets,{cameraMotionScore:.9,fieldGeometryDelta:.05,zoomDelta:.02});
ok(e.available,'translation caméra cohérente détectée');ok(e.model==='translation','petit déplacement classé translation');near(e.tx,.07,.012,'pan horizontal estimé');near(e.ty,.01,.012,'pan vertical estimé');ok(e.support>=3,'consensus multi-joueurs requis');
const before=state.active[0].motionHistory[1].x;const changed=C.applyMotionToState(state,e);ok(changed===4,'tous les tracks actifs compensés');near(state.active[0].x,.27,.012,'position courante déplacée dans le repère caméra actuel');near(state.active[0].motionHistory[1].x,before+.07,.012,'historique de mouvement compensé sans toucher fullPath');ok(state.cameraCompensations===1,'provenance compensation enregistrée');ok(state.lastCameraCompensation.model==='translation','modèle enregistré');

const zoomState={active:[
 {globalId:1,cat:'team',x:.20,y:.30,seen:12,feature:[.10],motionHistory:[{x:.20,y:.30,time:1}]},
 {globalId:2,cat:'team',x:.45,y:.70,seen:12,feature:[.20],motionHistory:[{x:.45,y:.70,time:1}]},
 {globalId:3,cat:'team',x:.75,y:.35,seen:12,feature:[.30],motionHistory:[{x:.75,y:.35,time:1}]},
 {globalId:4,cat:'goalkeeper',x:.12,y:.55,seen:12,feature:[.40],motionHistory:[{x:.12,y:.55,time:1}]}
]};
const scale=1.08,tx=.02,ty=-.03;const zp=(x,y)=>({x:scale*x+tx,y:scale*y+ty});
const zoomDets=zoomState.active.map(tr=>({cat:tr.cat,...zp(tr.x,tr.y),feature:tr.feature}));
const z=C.estimateGlobalMotion(zoomState,zoomDets,{cameraMotionScore:.92,fieldGeometryDelta:.08,zoomDelta:.08});
ok(z.available,'léger zoom cohérent détecté');ok(z.model==='similarity','zoom classé similarity');near(z.scale,1.08,.015,'échelle estimée');near(z.tx,.02,.015,'translation x avec zoom');near(z.ty,-.03,.015,'translation y avec zoom');ok(z.residual<.01,'résidu faible');
const zx=zoomState.active[0].x,zy=zoomState.active[0].y;C.applyMotionToState(zoomState,z);near(zoomState.active[0].x,scale*zx+tx,.015,'track transformé avec zoom');near(zoomState.active[0].y,scale*zy+ty,.015,'track y transformé avec zoom');ok(zoomState.lastCameraCompensation.model==='similarity','provenance similarity enregistrée');

const huge=C.estimateGlobalMotion(zoomState,zoomDets,{cameraMotionScore:.9,fieldGeometryDelta:.05,zoomDelta:.5});ok(!huge.available&&huge.reason==='camera_change_too_large','changement caméra extrême rejeté');
const weak=C.estimateGlobalMotion({active:zoomState.active.slice(0,2)},zoomDets.slice(0,2),{cameraMotionScore:.9,fieldGeometryDelta:.02,zoomDelta:.01});ok(!weak.available,'moins de trois joueurs: aucune compensation inventée');
console.log(`${checks}/${checks} camera motion consensus non-regression: PASS`);
