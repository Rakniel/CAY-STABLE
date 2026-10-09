'use strict';
const assert=require('assert');
const Heat=require('../metric_pitch_heatmap_v1.js');
const Stats=require('../player_stats_v1.js');
const Quality=require('../metric_quality_guard_v1.js');
const Publication=require('../metric_publication_guard_v1.js');
const track={fullPath:[{time:0,segment:1,x:.10,y:.10},{time:.5,segment:1,x:.105,y:.105},{time:1,segment:1,x:.110,y:.110}]};
const project=p=>({x:p.x*105,y:p.y*68});
for(const confidence of [-.01,1.01,1.5,'150',Infinity,-Infinity]){
  const projector={validated:true,confidence,source:'synthetic_test',project},projectors={1:projector};
  assert.strictEqual(Heat.projectorInfo(projector).confidence,null);
  assert.strictEqual(Stats.projectorInfo(projector).confidence,null);
  assert.strictEqual(Stats.metricProjectorInfo(projector).metricEligible,false);
  assert.strictEqual(Quality.projectorInfo(projector).confidence,null);
  const heat=Heat.build(track,projectors);
  assert.strictEqual(heat.status,'INDISPONIBLE');
  assert.strictEqual(heat.trajectory.status,'INDISPONIBLE');
  assert.strictEqual(heat.projectedPoints.length,0);
  assert.strictEqual(Stats.metricForTrack(track,projectors).distanceM,null);
  const robust=Quality.robustMetricForTrack(track,projectors);
  assert.strictEqual(robust.quality,'INDISPONIBLE');
  assert.strictEqual(Publication.publicationDecision(robust).publishable,false);
}
for(const confidence of [.5,.8,1,'0.8']){
  const projector={validated:true,confidence,source:'synthetic_test',project},projectors={1:projector};
  assert.strictEqual(Heat.projectorInfo(projector).confidence,Number(confidence));
  assert.strictEqual(Stats.projectorInfo(projector).confidence,Number(confidence));
  assert.strictEqual(Quality.projectorInfo(projector).confidence,Number(confidence));
  assert.strictEqual(Heat.build(track,projectors).status,'DISPONIBLE');
  assert.notStrictEqual(Stats.metricForTrack(track,projectors).distanceM,null);
}
console.log('metric_calibration_confidence_range_nonregression: PASS');
