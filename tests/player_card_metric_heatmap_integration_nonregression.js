'use strict';
const assert=require('assert');
const Stats=require('../player_stats_v1.js');

const summary={
  id:7,cat:'team',segments:[1],firstTime:0,lastTime:3,observedDuration:3,observations:4,
  presenceIntervals:[[0,3]],reidentifications:0,mergedFrom:[],identityConfidence:.96,
  dataQuality:{identity:'FIABLE'},quality:'FIABLE',normalizedTravel:.3
};
const raw={archived:false,fullPath:[
  {time:0,segment:1,x:.10,y:.20},
  {time:1,segment:1,x:.15,y:.25},
  {time:2,segment:1,x:.20,y:.30},
  {time:3,segment:1,x:.25,y:.35}
]};
const projectors={1:{validated:true,source:'test_homography',confidence:.99,project:p=>({x:p.x*105,y:p.y*68})}};

const card=Stats.buildPlayerCard(summary,raw,projectors,0);
assert.strictEqual(card.heatmap.status,'DISPONIBLE','fiche joueur utilise la heatmap métrique validée');
assert.strictEqual(card.heatmap.coordinateSystem,'PITCH_METERS','heatmap affichable en coordonnées terrain');
assert.strictEqual(card.heatmap.metricCoverage,1,'couverture métrique complète propagée');
assert.strictEqual(card.heatmap.quality,'FIABLE');
assert.strictEqual(card.quality.heatmap,'FIABLE','qualité fiche dérivée de la heatmap métrique');
assert.strictEqual(card.heatmap.policy,'AUCUN_FALLBACK_COORDONNEES_IMAGE_POUR_HEATMAP_TERRAIN');
assert.strictEqual(card.observedImageHeatmap.coordinateSystem,'IMAGE_NORMALIZED','ancienne heatmap image conservée uniquement comme preuve observable séparée');
assert.strictEqual(card.observedImageHeatmap.observations,4);

const unavailable=Stats.buildPlayerCard(summary,raw,{},0);
assert.strictEqual(unavailable.heatmap.status,'INDISPONIBLE','aucune calibration => aucune heatmap terrain');
assert.strictEqual(unavailable.heatmap.metricCoverage,0);
assert.strictEqual(unavailable.quality.heatmap,'INDISPONIBLE');
assert.strictEqual(unavailable.heatmap.policy,'AUCUN_FALLBACK_COORDONNEES_IMAGE_POUR_HEATMAP_TERRAIN');
assert.strictEqual(unavailable.observedImageHeatmap.observations,4,'les observations image restent auditables sans être présentées comme terrain');

console.log('player_card_metric_heatmap_integration_nonregression: OK');
