const assert=require('assert');

require('../stable_runtime_tracking_v2.js');
const api=global.CAYStableSemanticKeypointRuntime;
assert.ok(api&&typeof api.refresh==='function','semantic keypoint runtime bridge must be exposed');

(async()=>{
  assert.strictEqual(api.providerVerdict(null).allowed,false);
  assert.strictEqual(api.providerVerdict(null).reason,'PITCH_KEYPOINT_PROVIDER_UNAVAILABLE');

  let blockedCalls=0;
  const blocked={
    runtimeDefaultAllowed:false,
    provenance:{source:'blocked/model',license:'Apache-2.0',revision:'r1'},
    async inferPitchKeypoints(){blockedCalls++;return [];}
  };
  let r=await api.refresh({width:1280,height:720},1,2,{provider:blocked,metricRuntime:{}});
  assert.strictEqual(r.reason,'PITCH_KEYPOINT_PROVIDER_NOT_APPROVED');
  assert.strictEqual(blockedCalls,0,'unapproved provider must never execute');

  const missingProvenance={runtimeDefaultAllowed:true,async inferPitchKeypoints(){blockedCalls++;return [];}};
  r=await api.refresh({width:1280,height:720},1,2,{provider:missingProvenance,metricRuntime:{}});
  assert.strictEqual(r.reason,'PITCH_KEYPOINT_PROVENANCE_REQUIRED');
  assert.strictEqual(blockedCalls,0,'provider without provenance must never execute');

  const agpl={
    runtimeDefaultAllowed:true,
    provenance:{source:'example/agpl-keypoints',license:'AGPL-3.0',revision:'deadbeef'},
    async inferPitchKeypoints(){blockedCalls++;return [];}
  };
  r=await api.refresh({width:1280,height:720},1,2,{provider:agpl,metricRuntime:{}});
  assert.strictEqual(r.reason,'PITCH_KEYPOINT_LICENSE_REJECTED');
  assert.strictEqual(blockedCalls,0,'copyleft provider must be rejected before inference');

  let calibratedArgs=null,keyframeArgs=null,inferContext=null;
  const projector={validated:true,confidence:.91,project(p){return {x:p.x,y:p.y};}};
  const metricRuntime={
    calibrateSemanticSegment(segment,keypoints,options){
      calibratedArgs={segment,keypoints,options};
      return {ok:true,status:'REGISTERED_VALIDATED_SEMANTIC_CALIBRATION',registered:true,metricEligible:true,dynamicRefresh:false,projectorAvailable:true,calibration:{projector}};
    },
    registerValidatedKeyframe(segment,time,p,options){keyframeArgs={segment,time,p,options};return {ok:true,projectorAvailable:true};}
  };
  const provider={
    id:'permissive-pitch-kpts',runtimeDefaultAllowed:true,minConfidence:.62,maxCalibrationAgeSec:.4,
    provenance:{source:'example/permissive-pitch-kpts',license:'Apache-2.0',revision:'abc123'},
    async inferPitchKeypoints(canvas,context){inferContext=context;return {keypoints:[0,1,2,3,4,5].map(i=>({index:i,x:100+i*10,y:200+i*5,confidence:.9}))};}
  };
  r=await api.refresh({width:1280,height:720},12.5,4,{provider,metricRuntime});
  assert.strictEqual(r.ok,true);
  assert.strictEqual(r.providerCalled,true);
  assert.strictEqual(r.providerId,'permissive-pitch-kpts');
  assert.strictEqual(r.dynamicArmed,true,'first accepted automatic calibration must be freshness-gated as dynamic by default');
  assert.deepStrictEqual(inferContext,{time:12.5,segment:4,width:1280,height:720});
  assert.strictEqual(calibratedArgs.segment,4,'semantic calibration must bind exact tracking segment');
  assert.strictEqual(calibratedArgs.options.time,12.5);
  assert.deepStrictEqual(calibratedArgs.options.frameSize,{width:1280,height:720});
  assert.strictEqual(calibratedArgs.options.minConfidence,.62);
  assert.strictEqual(calibratedArgs.options.maxCalibrationAgeSec,.4);
  assert.strictEqual(calibratedArgs.keypoints.length,6);
  assert.strictEqual(keyframeArgs.segment,4);
  assert.strictEqual(keyframeArgs.time,12.5);
  assert.strictEqual(keyframeArgs.p,projector);

  let staticArms=0;
  const staticRuntime={
    calibrateSemanticSegment(){return {ok:true,status:'REGISTERED_VALIDATED_SEMANTIC_CALIBRATION',registered:true,dynamicRefresh:false,projectorAvailable:true,calibration:{projector}};},
    registerValidatedKeyframe(){staticArms++;return {ok:true,projectorAvailable:true};}
  };
  const staticProvider={...provider,assumeStaticCamera:true};
  r=await api.refresh({width:640,height:360},3,1,{provider:staticProvider,metricRuntime:staticRuntime});
  assert.strictEqual(r.ok,true);
  assert.strictEqual(r.dynamicArmed,false);
  assert.strictEqual(staticArms,0,'explicit static-camera provider must not be forced into dynamic freshness mode');

  let failedCalls=0;
  const failingProvider={...provider,async inferPitchKeypoints(){failedCalls++;throw new Error('backend offline');}};
  r=await api.refresh({width:640,height:360},3,1,{provider:failingProvider,metricRuntime});
  assert.strictEqual(r.reason,'PITCH_KEYPOINT_INFERENCE_FAILED');
  assert.strictEqual(r.providerCalled,true);
  assert.strictEqual(failedCalls,1);

  console.log('stable_semantic_keypoint_provider_runtime_nonregression: PASS');
})().catch(err=>{console.error(err);process.exitCode=1;});
