'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const source=fs.readFileSync(path.join(__dirname,'..','pitch_semantic_calibration_v2.js'),'utf8');
const sandbox={console};
sandbox.globalThis=sandbox;
vm.createContext(sandbox);

// Reproduit l'ordre de chargement navigateur qui a cassé le build STABLE :
// le module sémantique arrive avant le moteur de calibration automatique.
vm.runInContext(source,sandbox,{filename:'pitch_semantic_calibration_v2.js'});
assert.ok(sandbox.CAYPitchSemanticCalibrationV2,'semantic calibration module should load without automatic engine');

const keypoints=[
  {index:0,x:100,y:100,confidence:.95},
  {index:5,x:100,y:700,confidence:.95},
  {index:13,x:640,y:100,confidence:.95},
  {index:16,x:640,y:700,confidence:.95},
  {index:24,x:1180,y:100,confidence:.95},
  {index:29,x:1180,y:700,confidence:.95}
];

const before=sandbox.CAYPitchSemanticCalibrationV2.evaluate({keypoints,frameSize:{width:1280,height:720}});
assert.strictEqual(before.status,'INDISPONIBLE');
assert.strictEqual(before.reason,'AUTO_CALIBRATION_ENGINE_UNAVAILABLE');

let calls=0;
sandbox.CAYAutomaticPitchCalibration={
  evaluateAutomaticCalibration(options){
    calls++;
    assert.strictEqual(options.correspondences.length,6);
    return {status:'ACCEPTED_AUTOMATIC',reason:null,confidence:.91,projector:{validated:true}};
  }
};

const after=sandbox.CAYPitchSemanticCalibrationV2.evaluate({keypoints,frameSize:{width:1280,height:720}});
assert.strictEqual(calls,1,'late-loaded automatic engine must be used');
assert.strictEqual(after.status,'ACCEPTED_AUTOMATIC');
assert.strictEqual(after.visibleKeypoints,6);
assert.strictEqual(after.calibrationInput,'SEMANTIC_PITCH_KEYPOINTS');
assert.strictEqual(after.legacyFreePolygonUsed,false);

console.log('pitch semantic late-engine non-regression: OK');
