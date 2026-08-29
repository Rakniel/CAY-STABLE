const assert=require('assert');
const Report=require('../validated_report_bridge_v1.js');
const Stats=require('../player_stats_v1.js');

const projector={
  validated:true,
  source:'synthetic_test',
  confidence:1,
  project:p=>({x:Number(p.x)*100,y:Number(p.y)*68})
};

const track={
  globalId:7,
  fullPath:[
    {time:0,segment:1,x:0,y:0},
    {time:.5,segment:1,x:.01,y:0},
    {time:2.5,segment:1,x:.03,y:0}
  ]
};
const state={archive:[],active:[track]};
const rows=Report.buildMetricSegmentProvenance(state,{1:projector}).get(7);
assert.strictEqual(rows.length,1);
const row=rows[0];
const primary=Stats.metricForTrack(track,{1:projector});

assert.strictEqual(Report.MAX_METRIC_GAP_SEC,Stats.MAX_METRIC_GAP_SEC,'le rapport validé doit partager le contrat de gap du moteur principal');
assert.strictEqual(row.maxMetricGapSec,1);
assert.strictEqual(row.eligibleSeconds,2.5,'le trou reste dans le dénominateur de couverture');
assert.strictEqual(row.measuredSeconds,.5,'seule la paire continûment observée est mesurée');
assert.strictEqual(row.rejectedSeconds,2,'le gap >1s est explicitement audité');
assert.strictEqual(row.rejectionReasons.GAP_TEMPOREL_NON_OBSERVE,1);
assert.strictEqual(row.distanceM,1,'aucune distance fantôme ne traverse le gap');
assert.strictEqual(row.coverage,.2);
assert.strictEqual(row.quality,'PARTIEL');
assert.strictEqual(row.measuredSeconds,primary.metricCoveredSeconds,'rapport validé et métrique joueur doivent mesurer la même durée');
assert.strictEqual(row.eligibleSeconds,primary.eligibleSeconds,'rapport validé et métrique joueur doivent partager le même dénominateur');
assert.strictEqual(row.distanceM,primary.distanceM,'rapport validé et métrique joueur ne doivent pas diverger sur la distance');

const exact={globalId:8,fullPath:[{time:0,segment:1,x:0,y:0},{time:1,segment:1,x:.01,y:0}]};
const exactRow=Report.buildMetricSegmentProvenance({archive:[],active:[exact]},{1:projector}).get(8)[0];
assert.strictEqual(exactRow.measuredSeconds,1,'un intervalle exactement égal à 1s reste accepté');
assert.strictEqual(exactRow.coverage,1);
assert.strictEqual(exactRow.quality,'FIABLE');

console.log('PASS validated report gap contract non-regression: 16/16');
