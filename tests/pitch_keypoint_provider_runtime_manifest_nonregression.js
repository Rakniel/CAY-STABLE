const assert=require('assert');
const fs=require('fs');

const integrator=fs.readFileSync('tools/integrate_tracking_v2.py','utf8');
const providerTag='<script src="./pitch_keypoint_artifact_provider_v1.js"></script>';
const runtimeTag='<script src="./stable_runtime_tracking_v2.js"></script>';
const autoCalibrationTag='<script src="./automatic_pitch_calibration_v1.js"></script>';

assert.strictEqual((integrator.match(new RegExp(providerTag.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,1,'provider must appear exactly once in canonical manifest');
assert.ok(integrator.indexOf(providerTag)>integrator.indexOf(autoCalibrationTag),'provider should load after calibration primitives');
assert.ok(integrator.indexOf(providerTag)<integrator.indexOf(runtimeTag),'provider must be available before stable runtime consumes CAYPitchKeypointProvider');
assert.ok(fs.existsSync('pitch_keypoint_artifact_provider_v1.js'),'provider module must exist');

const Provider=require('../pitch_keypoint_artifact_provider_v1.js');
const artifact={
  contractVersion:Provider.VERSION,
  providerId:'manifest-smoke',
  provenance:{source:'test-fixture',license:'MIT',revision:'fixture-1'},
  coordinateSpace:'PIXEL',
  frames:[{time:1,segment:0,keypoints:[{index:0,x:100,y:80,confidence:.9}]}]
};
const p=Provider.createProvider(artifact,{maxSampleAgeSec:.4,minConfidence:.5});
assert.strictEqual(p.runtimeDefaultAllowed,true);
assert.strictEqual(typeof p.inferPitchKeypoints,'function');

(async()=>{
  const hit=await p.inferPitchKeypoints({width:640,height:360},{width:640,height:360,time:1.2,segment:0});
  assert.strictEqual(hit.keypoints.length,1);
  const stale=await p.inferPitchKeypoints({width:640,height:360},{width:640,height:360,time:2,segment:0});
  assert.strictEqual(stale.keypoints.length,0);
  console.log('pitch_keypoint_provider_runtime_manifest_nonregression: PASS');
})().catch(err=>{console.error(err);process.exit(1);});
