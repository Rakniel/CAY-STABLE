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
assert.match(metric.coveragePolicy,/TEMPS_ELIGIBLE/,'la politique doit conserver le temps chronologique observable dans le dénominateur');
assert.match(metric.coveragePolicy,/CHANGEMENT_PLAN/,'la politique doit expliciter que les changements de plan restent non défendables');
assert.match(metric.coveragePolicy,/NE_CREE_JAMAIS_DE_DISTANCE/,'la politique doit interdire toute distance inventée sur les preuves rejetées');

console.log('PASS 10/10 robust metric gap coverage');
