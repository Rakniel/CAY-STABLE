'use strict';
const assert=require('assert');
const path=require('path');
const vm=require('vm');
const fs=require('fs');

let checks=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);checks++;};
const near=(a,b,tol,msg)=>{assert.ok(Math.abs(a-b)<=tol,`${msg}: ${a} vs ${b}`);checks++;};

const src=fs.readFileSync(path.join(__dirname,'..','stable_runtime_tracking_v2.js'),'utf8');
const sandbox={console,setTimeout,clearTimeout};
vm.createContext(sandbox);
vm.runInContext(src,sandbox,{filename:'stable_runtime_tracking_v2.js'});
const sig=sandbox.CAYStableRuntimeCameraSignals;
ok(typeof sig==='function','helper runtime camera/terrain exporté pour diagnostic et tests');

const base=[[100,100],[800,100],[800,600],[100,600]];
const same=[[100,100],[800,100],[800,600],[100,600]];
const sameSig=sig(base,same,900,700);
near(sameSig.cameraMotionScore,0,1e-9,'géométrie identique sans mouvement caméra');
near(sameSig.fieldGeometryDelta,0,1e-9,'géométrie identique sans rupture terrain');
near(sameSig.zoomDelta,0,1e-9,'géométrie identique sans zoom');

const pan=[[170,100],[870,100],[870,600],[170,600]];
const panSig=sig(base,pan,900,700);
ok(panSig.cameraMotionScore>=.75,'translation du terrain reconnue comme pan caméra fort');
ok(panSig.fieldGeometryDelta<.12,'pan pur conserve une géométrie terrain stable');
ok(panSig.zoomDelta<.18,'pan pur ne doit pas inventer un zoom');
ok(panSig.cameraTransformDelta<.45,'pan pur reste sous le seuil de reframe fort du bridge');

const zoom=[[180,150],[720,150],[720,550],[180,550]];
const zoomSig=sig(base,zoom,900,700);
ok(zoomSig.zoomDelta>=.18,'variation importante de taille du terrain signale un zoom/reframe');
ok(zoomSig.cameraTransformDelta>panSig.cameraTransformDelta,'zoom augmente le signal de transformation caméra');

const warped=[[120,160],[820,90],[760,610],[190,570]];
const warpedSig=sig(base,warped,900,700);
ok(warpedSig.fieldGeometryDelta>=.12,'déformation de perspective crée une rupture géométrique mesurable');

const normalized=[[.1,.1],[.8,.1],[.8,.6],[.1,.6]];
const normalizedPan=[[.18,.1],[.88,.1],[.88,.6],[.18,.6]];
const normalizedSig=sig(normalized,normalizedPan,900,700);
ok(normalizedSig.cameraMotionScore>=.75,'coordonnées déjà normalisées supportées');
ok(normalizedSig.fieldGeometryDelta<.12,'translation normalisée reste un pan sans faux changement de forme');

const unavailable=sig(null,base,900,700);
ok(unavailable.geometrySignalAvailable===false,'absence de polygone précédent reste explicitement indisponible');
near(unavailable.cameraMotionScore,0,1e-9,'aucun mouvement inventé sans preuve géométrique');

ok(src.includes('fieldGeometryDelta:cameraSignals.fieldGeometryDelta'),'runtime transmet le delta géométrique au bridge existant');
ok(src.includes('cameraMotionScore:cameraSignals.cameraMotionScore'),'runtime transmet le mouvement caméra au bridge existant');
ok(src.includes('zoomDelta:cameraSignals.zoomDelta'),'runtime transmet le zoom au bridge existant');

console.log(`${checks}/${checks} runtime camera geometry signals non-regression: PASS`);