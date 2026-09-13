const assert = require('assert');
const Guard = require('../stable_tracking_runtime_guard_v1.js');

function fakeDoc(){
  const nodes={
    runTracking:{disabled:false,dataset:{}},
    trackingStatus:{textContent:''},
  };
  return {nodes,getElementById:id=>nodes[id]||null};
}

{
  const env={
    CAYTrackingCore:{__cayTwoStagePatched:true},
    CAYStableTrackingBridge:{__cayCameraConsensusPatched:true},
  };
  const doc=fakeDoc();
  const verdict=Guard.install(env,doc);
  assert.strictEqual(verdict.ok,true,'canonical two-stage + camera-consensus runtime must be accepted');
  assert.strictEqual(verdict.backend,'CAY_TWO_STAGE_BYTETRACK_ADAPTED');
  assert.strictEqual(verdict.cameraMotion,'CAY_BOTSORT_STYLE_CONSENSUS');
  assert.strictEqual(doc.nodes.runTracking.disabled,false,'ready runtime must not disable tracking');
  assert.strictEqual(doc.nodes.runTracking.dataset.cayRuntimeGuard,'READY');
}

{
  const env={
    CAYTrackingCore:{},
    CAYStableTrackingBridge:{__cayCameraConsensusPatched:true},
  };
  const doc=fakeDoc();
  const verdict=Guard.install(env,doc);
  assert.strictEqual(verdict.ok,false,'missing ByteTrack-style two-stage patch must fail closed');
  assert(verdict.reasons.includes('TWO_STAGE_BYTETRACK_RUNTIME_NOT_PATCHED'));
  assert.strictEqual(doc.nodes.runTracking.disabled,true,'missing tracker patch must disable launch');
  assert.strictEqual(doc.nodes.runTracking.dataset.cayRuntimeGuard,'BLOCKED');
  assert(doc.nodes.trackingStatus.textContent.includes('Aucun fallback silencieux.'));
}

{
  const env={
    CAYTrackingCore:{__cayTwoStagePatched:true},
    CAYStableTrackingBridge:{},
  };
  const doc=fakeDoc();
  const verdict=Guard.install(env,doc);
  assert.strictEqual(verdict.ok,false,'missing camera-motion consensus patch must fail closed');
  assert(verdict.reasons.includes('CAMERA_MOTION_CONSENSUS_NOT_PATCHED'));
  assert.strictEqual(doc.nodes.runTracking.disabled,true);
}

console.log('stable tracking runtime guard non-regression: PASS');
