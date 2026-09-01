'use strict';
const assert=require('assert');
const Direction=require('../metric_attacking_direction_v1.js');

assert.strictEqual(Direction.normalizeDirection('rtl'),'RIGHT_TO_LEFT');
assert.strictEqual(Direction.normalizeDirection('left-to-right'),'LEFT_TO_RIGHT');
assert.strictEqual(Direction.normalizeDirection('unknown'),null);

assert.deepStrictEqual(Direction.normalizePoint({x:10,y:5},'LEFT_TO_RIGHT'),{x:10,y:5,direction:'LEFT_TO_RIGHT',mirrored:false});
assert.deepStrictEqual(Direction.normalizePoint({x:10,y:5},'RIGHT_TO_LEFT'),{x:95,y:63,direction:'RIGHT_TO_LEFT',mirrored:true});
assert.strictEqual(Direction.normalizePoint({x:10,y:5},null),null);

const projectors={1:{validated:true,confidence:1,project:p=>({x:p.x,y:p.y})}};
const track={fullPath:[
  {time:0,segment:1,x:10,y:5,attackingDirection:'LEFT_TO_RIGHT'},
  {time:.5,segment:1,x:95,y:63,attackingDirection:'RIGHT_TO_LEFT'}
]};
const raw=JSON.parse(JSON.stringify(track));
const heatmap=Direction.buildAttackingHeatmap(track,projectors,{cols:6,rows:4,minMetricCoverage:1,minCalibrationConfidence:.5,maxDwellGapSec:1});
assert.strictEqual(heatmap.status,'DISPONIBLE');
assert.strictEqual(heatmap.coordinateSystem,'PITCH_METERS_CAY_ATTACKS_LEFT_TO_RIGHT');
assert.strictEqual(heatmap.trajectory.coordinateSystem,'PITCH_METERS_CAY_ATTACKS_LEFT_TO_RIGHT');
assert.strictEqual(heatmap.attackingDirectionNormalized,true);
assert.strictEqual(heatmap.normalizationRequiresExplicitDirection,true);
assert.strictEqual(heatmap.observations,2);
assert.strictEqual(heatmap.metricCoverage,1);
assert.strictEqual(heatmap.cells[0][0],2,'same tactical location in opposite directions must land in the same normalized cell');
assert.deepStrictEqual(track,raw,'raw track coordinates must never be mutated');

const unavailable=Direction.buildAttackingHeatmap({fullPath:[
  {time:0,segment:1,x:10,y:5},
  {time:.5,segment:1,x:11,y:5}
]},projectors,{minMetricCoverage:.35});
assert.strictEqual(unavailable.status,'INDISPONIBLE');
assert.strictEqual(unavailable.metricCoverage,0);
assert.strictEqual(unavailable.normalizationRequiresExplicitDirection,true);

const resolved=Direction.buildAttackingHeatmap({fullPath:[
  {time:0,segment:1,x:10,y:5,period:1},
  {time:.5,segment:1,x:95,y:63,period:2}
]},projectors,{cols:6,rows:4,minMetricCoverage:1,directionResolver:p=>p.period===1?'LTR':'RTL'});
assert.strictEqual(resolved.status,'DISPONIBLE');
assert.strictEqual(resolved.cells[0][0],2);

console.log('metric attacking direction non-regression: PASS');
