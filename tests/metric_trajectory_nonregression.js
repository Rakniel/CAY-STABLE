'use strict';
const assert=require('assert');
const Heat=require('../metric_pitch_heatmap_v1.js');
const projector={validated:true,confidence:.9,project:p=>({x:p.x*105,y:p.y*68})};

// Partial metric evidence must remain visible as a PARTIEL trajectory even when the stricter heatmap gate rejects publication.
const partial=Heat.build({fullPath:[
  {time:0,segment:1,x:.10,y:.10},
  {time:.5,segment:1,x:.20,y:.20},
  {time:1,segment:2,x:.30,y:.30},
  {time:1.5,segment:2,x:.40,y:.40}
]},{1:projector},{minMetricCoverage:.8,maxDwellGapSec:1});
assert.strictEqual(partial.status,'INDISPONIBLE','heatmap remains gated at 80% coverage');
assert.strictEqual(partial.projectedPoints.length,0,'legacy heatmap publication contract stays unchanged');
assert.strictEqual(partial.trajectory.status,'DISPONIBLE');
assert.strictEqual(partial.trajectory.quality,'PARTIEL');
assert.strictEqual(partial.trajectory.metricCoverage,.5);
assert.strictEqual(partial.trajectory.points.length,2);
assert.strictEqual(partial.trajectory.runs.length,1);
assert.strictEqual(partial.trajectory.continuousObservations,2);
assert.strictEqual(partial.trajectory.interpolation,'NONE');

// Never connect across camera cuts.
const cut=Heat.build({fullPath:[
  {time:0,segment:1,x:.10,y:.10},
  {time:.5,segment:1,x:.20,y:.20},
  {time:.6,segment:2,x:.80,y:.80},
  {time:1.1,segment:2,x:.90,y:.90}
]},{1:projector,2:projector},{maxDwellGapSec:1});
assert.strictEqual(cut.trajectory.runs.length,2);
assert.deepStrictEqual(cut.trajectory.runs.map(r=>r.map(p=>p.segment)),[[1,1],[2,2]]);

// Never bridge a missing/unprojectable observation even if points on both sides are metric-valid.
const hole=Heat.build({fullPath:[
  {time:0,segment:1,x:.10,y:.10},
  {time:.4,segment:1,x:.20,y:.20},
  {time:.8,segment:9,x:.30,y:.30},
  {time:1.2,segment:1,x:.40,y:.40}
]},{1:projector},{maxDwellGapSec:1});
assert.strictEqual(hole.trajectory.points.length,2,'isolated post-hole point is not published as a trajectory run');
assert.strictEqual(hole.trajectory.runs.length,1,'only continuous metric motion is published');
assert.strictEqual(hole.trajectory.continuousObservations,2);

// Long temporal gaps are explicit cuts, not invented travel. A singleton after the cut is diagnostic only.
const gap=Heat.build({fullPath:[
  {time:0,segment:1,x:.10,y:.10},
  {time:.5,segment:1,x:.20,y:.20},
  {time:4,segment:1,x:.70,y:.70}
]},{1:projector},{maxDwellGapSec:1});
assert.strictEqual(gap.trajectory.runs.length,1);
assert.strictEqual(gap.trajectory.points.length,2);
assert.strictEqual(gap.trajectory.continuousObservations,2);
assert.strictEqual(gap.trajectory.interpolation,'NONE');

// A calibrated point by itself is a position observation, not a defendable trajectory.
const singleton=Heat.build({fullPath:[{time:0,segment:1,x:.1,y:.1}]},{1:projector},{});
assert.strictEqual(singleton.trajectory.status,'INDISPONIBLE');
assert.strictEqual(singleton.trajectory.points.length,0);
assert.strictEqual(singleton.trajectory.observations,1,'raw metric observation remains auditable');
assert.strictEqual(singleton.trajectory.continuousObservations,0);
assert.match(singleton.trajectory.reason,/au moins deux positions métriques/);

// Multiple individually calibrated points separated by cuts must not masquerade as motion.
const isolated=Heat.build({fullPath:[
  {time:0,segment:1,x:.1,y:.1},
  {time:.5,segment:2,x:.2,y:.2},
  {time:1,segment:3,x:.3,y:.3}
]},{1:projector,2:projector,3:projector},{});
assert.strictEqual(isolated.trajectory.status,'INDISPONIBLE');
assert.strictEqual(isolated.trajectory.points.length,0);
assert.strictEqual(isolated.trajectory.observations,3);
assert.strictEqual(isolated.trajectory.continuousObservations,0);

const none=Heat.build({fullPath:[{time:0,segment:1,x:.1,y:.1}]},{},{});
assert.strictEqual(none.trajectory.status,'INDISPONIBLE');
assert.strictEqual(none.trajectory.points.length,0);
console.log('metric trajectory non-regression: PASS');
