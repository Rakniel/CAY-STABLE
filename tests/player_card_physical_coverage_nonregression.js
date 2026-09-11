'use strict';
const assert=require('assert');
const R=require('../player_card_renderer_v1.js');

const all=(distance,avg,max,sprints)=>({
  distanceM:{coverage:distance},
  avgSpeedKmh:{coverage:avg},
  maxSpeedKmh:{coverage:max},
  sprintCount:{coverage:sprints}
});

assert.equal(R.physicalMetricCoverage(all(80,80,80,20)),20,'aggregate physical coverage must use the weakest physical metric instead of the best-covered one');
assert.equal(R.physicalMetricCoverage(all(100,100,100,100)),100);
assert.equal(R.physicalMetricCoverage(all(120,95,90,110)),90,'coverage must remain clamped and conservative');
assert.equal(R.physicalMetricCoverage(all(-5,60,60,60)),0,'negative coverage must clamp to zero');
assert.equal(R.physicalMetricCoverage({distanceM:{coverage:90},avgSpeedKmh:{coverage:90},maxSpeedKmh:{coverage:90}}),null,'a cross-metric summary must remain unavailable when one physical metric has no coverage evidence');
assert.equal(R.physicalMetricCoverage({}),null);

const card={
  id:7,
  identity:{status:'FIABLE'},
  presence:{observedDuration:10,observations:100,trackingCoverage:100},
  observedVisuals:{status:'DISPONIBLE',heatmap:{cols:1,cells:[[1]]}},
  pitchVisuals:{status:'INDISPONIBLE',reason:'projection terrain non défendable'},
  metrics:all(85,70,65,40)
};
const html=R.cardHtml(card);
assert(html.includes('STATS PHYSIQUES • 40 %'),'player card must display the weakest complete physical coverage, not 85 %');

console.log('player card physical coverage non-regression: PASS');