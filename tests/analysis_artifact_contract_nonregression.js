'use strict';
const assert=require('assert');
const A=require('../analysis_artifact_contract_v1.js');

const base={schemaVersion:'1',analysisId:'match-1'};
const artifact=(stage,fingerprint)=>A.createArtifactDescriptor({stage,inputFingerprint:fingerprint,...base});

assert.strictEqual(A.VERSION,'CAY_ANALYSIS_ARTIFACT_CONTRACT_V1');
assert.throws(()=>A.createArtifactDescriptor({stage:'tracking_v1',schemaVersion:'1',analysisId:'match-1',inputFingerprint:''}),/inputFingerprint required/);
assert.throws(()=>A.createArtifactDescriptor({stage:'unknown',schemaVersion:'1',analysisId:'match-1',inputFingerprint:'x'}),/invalid artifact stage/);

const missingEvidence=A.createArtifactDescriptor({stage:'tracking_v1',schemaVersion:'1',analysisId:'match-1',inputFingerprint:'det-v3',coverage:null,confidence:null});
assert.strictEqual(missingEvidence.coverage,null,'missing coverage must stay absent instead of coercing to zero');
assert.strictEqual(missingEvidence.confidence,null,'missing confidence must stay absent instead of coercing to zero');
assert.strictEqual(missingEvidence.spatialReference,null,'legacy descriptors without spatial metadata remain valid');
for(const blank of ['', '   ']){
  const blankEvidence=A.createArtifactDescriptor({stage:'tracking_v1',schemaVersion:'1',analysisId:'match-1',inputFingerprint:'det-v3',coverage:blank,confidence:blank});
  assert.strictEqual(blankEvidence.coverage,null,'blank coverage must stay absent');
  assert.strictEqual(blankEvidence.confidence,null,'blank confidence must stay absent');
}
const boundedEvidence=A.createArtifactDescriptor({stage:'tracking_v1',schemaVersion:'1',analysisId:'match-1',inputFingerprint:'det-v3',coverage:1.2,confidence:-.2});
assert.strictEqual(boundedEvidence.coverage,1,'explicit numeric coverage remains clamped');
assert.strictEqual(boundedEvidence.confidence,0,'explicit numeric confidence remains clamped');

const pitchReference={
  coordinateSystem:'PITCH_METERS',
  unit:'METERS',
  origin:'TOP_LEFT',
  xAxisDirection:'LEFT_TO_RIGHT',
  yAxisDirection:'TOP_TO_BOTTOM',
  orientation:'BROADCAST_ACTUAL',
  normalized:false,
  pitchLengthM:105,
  pitchWidthM:68
};
const metricArtifact=A.createArtifactDescriptor({stage:'metric_projection_v1',schemaVersion:'1',analysisId:'match-1',inputFingerprint:'cal-v2',spatialReference:pitchReference});
assert.deepStrictEqual(metricArtifact.spatialReference,pitchReference,'spatial reference must travel with metric artifacts');
assert.strictEqual(A.isReusable(metricArtifact,{stage:'metric_projection_v1',schemaVersion:'1',analysisId:'match-1',inputFingerprint:'cal-v2',spatialReference:{...pitchReference}}),true,'same spatial reference must remain reusable');
assert.strictEqual(A.isReusable(metricArtifact,{stage:'metric_projection_v1',schemaVersion:'1',analysisId:'match-1',inputFingerprint:'cal-v2',spatialReference:{...pitchReference,orientation:'CAY_ATTACKS_LEFT_TO_RIGHT'}}),false,'orientation changes must invalidate reuse');
assert.strictEqual(A.isReusable(metricArtifact,{stage:'metric_projection_v1',schemaVersion:'1',analysisId:'match-1',inputFingerprint:'cal-v2',spatialReference:{...pitchReference,pitchLengthM:100}}),false,'pitch geometry changes must invalidate reuse');
assert.strictEqual(A.isReusable(metricArtifact,{stage:'metric_projection_v1',schemaVersion:'1',analysisId:'match-1',inputFingerprint:'cal-v2'}),true,'spatial comparison stays opt-in for backward compatibility');
assert.strictEqual(A.isReusable(artifact('metric_projection_v1','cal-v2'),{stage:'metric_projection_v1',schemaVersion:'1',analysisId:'match-1',inputFingerprint:'cal-v2',spatialReference:pitchReference}),false,'an unlabelled metric artifact cannot satisfy an explicit spatial expectation');
assert.throws(()=>A.normalizeSpatialReference({coordinateSystem:'PITCH_METERS',pitchLengthM:105}),/pitch dimensions must be provided together/);
assert.throws(()=>A.normalizeSpatialReference({coordinateSystem:'PITCH_METERS',pitchLengthM:-105,pitchWidthM:68}),/pitch dimensions must be positive/);
assert.throws(()=>A.normalizeSpatialReference({pitchLengthM:105,pitchWidthM:68}),/coordinateSystem required/);

const tracking=artifact('tracking_v1','det-v3');
assert.strictEqual(A.isReusable(tracking,{stage:'tracking_v1',schemaVersion:'1',analysisId:'match-1',inputFingerprint:'det-v3'}),true);
assert.strictEqual(A.isReusable(tracking,{stage:'tracking_v1',schemaVersion:'2',analysisId:'match-1',inputFingerprint:'det-v3'}),false);
assert.strictEqual(A.isReusable(tracking,{stage:'tracking_v1',schemaVersion:'1',analysisId:'match-2',inputFingerprint:'det-v3'}),false);
assert.strictEqual(A.isReusable(tracking,{stage:'tracking_v1',schemaVersion:'1',analysisId:'match-1',inputFingerprint:'det-v4'}),false);

assert.deepStrictEqual(A.invalidatedStages('metric_projection_v1'),['metric_projection_v1','player_metrics_v1','ball_events_v1']);
assert.deepStrictEqual(A.invalidatedStages('manual_identity_overrides_v1',{includeSelf:false}),['metric_projection_v1','player_metrics_v1','ball_events_v1']);

const artifacts={};
const expected={};
for(const stage of A.STAGES){
  artifacts[stage]=artifact(stage,stage+'-input');
  expected[stage]={schemaVersion:'1',analysisId:'match-1',inputFingerprint:stage+'-input'};
}
let plan=A.planReuse(artifacts,expected,[]);
assert.deepStrictEqual(plan.recompute,[]);
assert.deepStrictEqual(plan.reusable,A.STAGES);

plan=A.planReuse(artifacts,expected,['metric_projection_v1']);
assert.deepStrictEqual(plan.recompute,['metric_projection_v1','player_metrics_v1','ball_events_v1']);
assert(plan.reusable.includes('tracking_v1'));
assert(plan.reusable.includes('manual_identity_overrides_v1'));

const stale={...artifacts,tracking_v1:artifact('tracking_v1','old-detections')};
plan=A.planReuse(stale,expected,[]);
assert(plan.recompute.includes('tracking_v1'));
assert(!plan.reusable.includes('tracking_v1'));

const spatialArtifacts={...artifacts,metric_projection_v1:metricArtifact};
const spatialExpected={...expected,metric_projection_v1:{...expected.metric_projection_v1,inputFingerprint:'cal-v2',spatialReference:pitchReference}};
plan=A.planReuse(spatialArtifacts,spatialExpected,[]);
assert(!plan.recompute.includes('metric_projection_v1'),'matching spatial reference can be reused');
spatialExpected.metric_projection_v1={...spatialExpected.metric_projection_v1,spatialReference:{...pitchReference,yAxisDirection:'BOTTOM_TO_TOP'}};
plan=A.planReuse(spatialArtifacts,spatialExpected,[]);
assert(plan.recompute.includes('metric_projection_v1'),'axis convention changes must trigger recompute');

console.log('analysis artifact contract non-regression: PASS');
