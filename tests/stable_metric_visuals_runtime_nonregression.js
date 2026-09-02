const assert=require('assert');
const MetricHeatmap=require('../metric_pitch_heatmap_v1.js');
const Runtime=require('../stable_metric_visuals_runtime_v1.js');
const track={globalId:7,fullPath:[
 {time:0,segment:1,x:.10,y:.20},
 {time:.5,segment:1,x:.20,y:.30},
 {time:1,segment:1,x:.30,y:.40},
 {time:3,segment:2,x:.50,y:.50},
 {time:3.5,segment:2,x:.60,y:.55}
]};
const projectors={
 1:{validated:true,confidence:.95,project:p=>({x:p.x*105,y:p.y*68})},
 2:{validated:false,confidence:0,project:null}
};
const report={players:[{id:7,name:'Joueur 7'},{id:99,name:'Sans track'}]};
const out=Runtime.attachMetricVisuals(report,{active:[track],archive:[]},projectors,{minMetricCoverage:.5,minCalibrationConfidence:.5,maxDwellGapSec:1});
const p=out.players[0];
assert.ok(p.metricVisuals);
assert.strictEqual(p.metricVisuals.coordinateSystem,'PITCH_METERS');
assert.ok(p.metricVisuals.metricCoverage>0&&p.metricVisuals.metricCoverage<1);
assert.strictEqual(p.metricVisuals.pitchHeatmap.status,'DISPONIBLE');
assert.ok(p.metricVisuals.pitchHeatmap.normalizedCells.length>0);
assert.ok(p.metricVisuals.trajectory.points.length===3);
assert.strictEqual(p.metricVisuals.trajectory.runs.length,1);
assert.strictEqual(out.players[1].metricVisuals.status,'INDISPONIBLE');
const strict=Runtime.attachMetricVisuals({players:[{id:7}]},{active:[track]},projectors,{minMetricCoverage:.9,minCalibrationConfidence:.5});
assert.strictEqual(strict.players[0].metricVisuals.status,'INDISPONIBLE');
assert.deepStrictEqual(strict.players[0].metricVisuals.pitchHeatmap.normalizedCells,[]);
assert.ok(strict.players[0].metricVisuals.trajectory.metricCoverage>0);
assert.strictEqual(strict.metricVisualsPolicy,'TRAJECTOIRES_ET_HEATMAPS_TERRAIN_UNIQUEMENT_SUR_PROJECTION_METRIQUE_VALIDEE_AVEC_CONFIANCE_EXPLICITE; SINON INDISPONIBLE');

for(const confidence of [undefined,null,'','   ','not-a-number']){
  const missingProjector={validated:true,project:p=>({x:p.x*105,y:p.y*68})};
  if(confidence!==undefined)missingProjector.confidence=confidence;
  const blocked=Runtime.attachMetricVisuals({players:[{id:7}]},{active:[track]},{1:missingProjector,2:projectors[2]},{minMetricCoverage:.5,minCalibrationConfidence:.5});
  assert.strictEqual(blocked.players[0].metricVisuals.status,'INDISPONIBLE','missing calibration confidence must never publish STABLE metric visuals');
  assert.strictEqual(blocked.players[0].metricVisuals.avgCalibrationConfidence,null);
  assert.strictEqual(blocked.players[0].metricVisuals.trajectory,null);
  assert.deepStrictEqual(blocked.players[0].metricVisuals.pitchHeatmap.normalizedCells,[]);
  assert(/confiance calibration absente/.test(blocked.players[0].metricVisuals.reason));
}

const explicitZero=Runtime.attachMetricVisuals({players:[{id:7}]},{active:[track]},{1:{validated:true,confidence:0,project:p=>({x:p.x*105,y:p.y*68})},2:projectors[2]},{minMetricCoverage:.5,minCalibrationConfidence:.5});
assert.strictEqual(explicitZero.players[0].metricVisuals.status,'INDISPONIBLE');
assert.strictEqual(explicitZero.players[0].metricVisuals.avgCalibrationConfidence,0,'measured zero confidence must remain distinct from missing confidence');

console.log('stable_metric_visuals_runtime_nonregression: PASS');
