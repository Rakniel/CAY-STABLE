'use strict';
const assert=require('assert');
const A=require('../analysis_artifact_contract_v1.js');

const artifacts={},expected={};
for(const stage of A.STAGES){
  artifacts[stage]=A.createArtifactDescriptor({
    stage,schemaVersion:'1',analysisId:'match-1',inputFingerprint:stage+'-input'
  });
  expected[stage]={schemaVersion:'1',analysisId:'match-1',inputFingerprint:stage+'-input'};
}
const stale=(stage)=>({...artifacts,[stage]:{...artifacts[stage],inputFingerprint:'obsolete'}});
const check=(name,actual,want)=>{
  const plan=A.planReuse(actual,expected,[]);
  assert.deepStrictEqual(plan.recompute,want,name+': recompute');
  assert.deepStrictEqual(plan.reusable,A.STAGES.filter(s=>!want.includes(s)),name+': reusable');
  assert.deepStrictEqual([...new Set(plan.changed)].sort(),[...want].sort(),name+': changed');
};
check('all reusable',artifacts,[]);
check('tracking fingerprint changed',stale('tracking_v1'),A.STAGES.slice(1));
check('tracking missing',{...artifacts,tracking_v1:null},A.STAGES.slice(1));
check('detections changed',stale('detections_v1'),A.STAGES);
check('identity changed',stale('identity_evidence_v1'),A.STAGES.slice(2));
check('manual identity changed',stale('manual_identity_overrides_v1'),A.STAGES.slice(3));
check('metric projection changed',stale('metric_projection_v1'),A.STAGES.slice(4));
check('player metrics only',stale('player_metrics_v1'),['player_metrics_v1']);
check('ball events only',stale('ball_events_v1'),['ball_events_v1']);

const geometryExpected={
  ...expected,
  metric_projection_v1:{
    ...expected.metric_projection_v1,
    spatialReference:{coordinateSystem:'PITCH_METERS',pitchLengthM:105,pitchWidthM:68}
  }
};
assert.deepStrictEqual(
  A.planReuse(artifacts,geometryExpected,[]).recompute,
  A.STAGES.slice(4),
  'new metric geometry invalidates projection, metrics and events'
);
assert.deepStrictEqual(
  A.planReuse(artifacts,expected,['metric_projection_v1']).recompute,
  A.STAGES.slice(4),
  'explicit stage changes remain transitive'
);
assert.deepStrictEqual(
  A.planReuse(artifacts,{
    ...expected,identity_evidence_v1:{...expected.identity_evidence_v1,schemaVersion:'2'}
  },[]).recompute,
  A.STAGES.slice(2),
  'schema version mismatch invalidates dependent stages'
);
console.log('analysis artifact transitive reuse non-regression: PASS');
