'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
let checks=0;const ok=(c,m)=>{assert.ok(c,m);checks++;};
const near=(a,b,t,m)=>{assert.ok(Math.abs(a-b)<=t,`${m}: got ${a}, expected ${b} ± ${t}`);checks++;};
const Core={assignFrame(){return[];},appearanceDistance(a,b){return a&&b&&a[0]===b[0]?0:1;}};
const TwoStage={assignFrame(){return {assigned:[]};}};
const sandbox={console,setTimeout,clearTimeout,CAYTrackingCore:Core,CAYTrackingTwoStageAdapter:TwoStage};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','tracking_two_stage_runtime_patch_v1.js'),'utf8'),sandbox);
const C=sandbox.CAYCameraMotionConsensus;ok(C&&typeof C.estimateGlobalMotion==='function','API GMC disponible');

// Enveloppe issue d'un probe sur une vraie vidéo club/broadcast locale :
// pan + changement d'échelle proche de +13 % entre deux observations à 0,5 s.
// La vidéo n'est pas commitée ; seules les contraintes géométriques anonymisées servent de non-régression.
const scale=1.13,rotation=.0013,tx=-.09,ty=-.0233;
const a=scale*Math.cos(rotation),b=scale*Math.sin(rotation);
const pts=[
 [.18,.30],[.30,.34],[.42,.38],[.54,.42],[.66,.46],[.76,.50]
];
const state={active:pts.map((p,i)=>({globalId:i+1,cat:'team',x:p[0],y:p[1],seen:12,feature:[i+1],motionHistory:[{x:p[0]-.004,y:p[1]}]}))};
const detections=pts.map((p,i)=>({cat:'team',x:a*p[0]-b*p[1]+tx,y:b*p[0]+a*p[1]+ty,feature:[i+1]}));
const ctx={cameraMotionScore:.90,cameraTransformDelta:.50,fieldGeometryDelta:.04,zoomDelta:.13};
const e=C.estimateGlobalMotion(state,detections,ctx);
ok(e.available===true,'GMC accepte une transformation cohérente dans l’enveloppe réelle');
ok(e.model==='similarity','pan + zoom réel utilise le modèle similarity');
ok(e.support===pts.length,'tous les joueurs cohérents soutiennent le consensus');
near(e.scale,scale,.005,'échelle GMC');
near(e.rotation,rotation,.004,'rotation GMC');
near(e.tx,tx,.008,'translation x GMC');
near(e.ty,ty,.008,'translation y GMC');
ok(e.confidence>=.60,'confiance GMC reste publiable sur consensus propre');

const before=state.active.map(t=>({x:t.x,y:t.y}));
const changed=C.applyMotionToState(state,e);
ok(changed===pts.length,'compensation appliquée à tous les tracks actifs');
for(let i=0;i<state.active.length;i++){
  near(state.active[i].x,detections[i].x,.01,`track ${i+1} x compensé`);
  near(state.active[i].y,detections[i].y,.01,`track ${i+1} y compensé`);
  ok(Math.hypot(state.active[i].x-before[i].x,state.active[i].y-before[i].y)>.005,`track ${i+1} réellement déplacé`);
}

// Au-delà de la borne STABLE, on préfère refuser plutôt que fabriquer une compensation agressive.
const tooLargeScale=1.16,aa=tooLargeScale,bb=0;
const tooLarge=pts.map((p,i)=>({cat:'team',x:aa*p[0]-bb*p[1]+tx,y:bb*p[0]+aa*p[1]+ty,feature:[i+1]}));
const e2=C.estimateGlobalMotion({active:pts.map((p,i)=>({globalId:i+1,cat:'team',x:p[0],y:p[1],seen:12,feature:[i+1]}))},tooLarge,ctx);
ok(e2.available===false,'zoom hors enveloppe refusé');
ok(['insufficient_similarity_consensus','unsupported_similarity'].includes(e2.reason),'refus hors enveloppe auditable');
console.log(`${checks}/${checks} camera motion real-video envelope non-regression: PASS`);
