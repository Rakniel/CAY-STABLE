'use strict';
const assert=require('assert');
const Guard=require('../metric_quality_guard_v1.js');

const projector={1:{validated:true,source:'test_metric',confidence:1,project:p=>({x:p.x,y:p.y})}};
const track={fullPath:[
  {x:0,y:0,time:0,segment:1},
  {x:1,y:0,time:1,segment:1},
  {x:30,y:0,time:6,segment:1},
  {x:31,y:0,time:7,segment:1}
]};

const metric=Guard.robustMetricForTrack(track,projector);
assert.strictEqual(metric.metricCoveredSeconds,2,'seules les deux secondes réellement continues sont créditées');
assert.strictEqual(metric.eligibleSeconds,7,'le blackout même segment reste dans le temps éligible observé entre bornes');
assert.strictEqual(metric.metricCoverage,0.2857,'le blackout doit pénaliser la couverture robuste');
assert.strictEqual(metric.distanceM,2,'aucune distance ne doit être inventée à travers le blackout');
assert.strictEqual(metric.gapBreaks,1,'le blackout est compté explicitement');
assert.strictEqual(metric.rejectedGapSeconds,5,'la durée du blackout rejeté reste auditée');
assert.strictEqual(metric.quality,'PARTIEL','une couverture amputée par un blackout ne peut pas rester FIABLE');
assert.strictEqual(metric.coveragePolicy,'LES_TROUS_TEMPORELS_MEME_SEGMENT_RESTENT_DANS_LE_TEMPS_ELIGIBLE_MAIS_JAMAIS_DANS_LE_TEMPS_METRIQUE','politique de couverture exposée');

console.log('PASS 8/8 robust metric gap coverage');
