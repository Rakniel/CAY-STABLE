'use strict';
const assert=require('assert');
const Stats=require('../player_stats_v1.js');

const invalid=Stats.heatmap([
  {x:null,y:.5},
  {x:'',y:.5},
  {x:'   ',y:.5},
  {x:.5,y:null},
  {x:.5,y:''},
  {x:undefined,y:.5}
]);
assert.strictEqual(invalid.observations,0,'missing/blank image coordinates must not count as observations');
assert.strictEqual(invalid.status,'INDISPONIBLE','no defensible image observation stays unavailable');
assert.strictEqual(invalid.max,0,'missing evidence must not create a false heatmap hotspot');
assert.strictEqual(invalid.cells.flat().reduce((sum,value)=>sum+value,0),0,'missing evidence must not enter any heatmap cell');

const explicitZero=Stats.heatmap([{x:0,y:0}]);
assert.strictEqual(explicitZero.observations,1,'explicit coordinate zero remains valid evidence');
assert.strictEqual(explicitZero.status,'OBSERVABLE','explicit coordinate zero is observable');
assert.strictEqual(explicitZero.cells[0][0],1,'real top-left observation is preserved');

const mixed=Stats.heatmap([{x:null,y:null},{x:.5,y:.5},{x:' ',y:.2}]);
assert.strictEqual(mixed.observations,1,'only defensible observations are counted');
assert.strictEqual(mixed.cells.flat().reduce((sum,value)=>sum+value,0),1,'invalid rows cannot inflate heatmap counts');

console.log('player image heatmap missing-coordinate non-regression: PASS');
