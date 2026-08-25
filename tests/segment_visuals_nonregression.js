const assert=require('assert');
const report=require('../validated_report_bridge_v1.js');

const coreState={
  archive:[],
  active:[{
    globalId:'CAY-7',
    fullPath:[
      {time:0,segment:1,x:.1,y:.2},
      {time:1,segment:1,x:.2,y:.3},
      {time:10,segment:2,x:.8,y:.7},
      {time:11,segment:2,x:.7,y:.6},
      {time:12,segment:2,x:NaN,y:.5}
    ]
  }]
};
const byId=report.buildSegmentVisuals(coreState);
const views=byId.get('CAY-7');
assert.strictEqual(views.length,2,'deux plans doivent rester deux espaces visuels distincts');
assert.deepStrictEqual(views.map(v=>v.segment),[1,2]);
assert.strictEqual(views[0].observations,2);
assert.strictEqual(views[1].observations,2,'les coordonnées invalides doivent être ignorées');
assert.strictEqual(views[0].heatmap.observations,2);
assert.strictEqual(views[1].heatmap.observations,2);
assert.strictEqual(views[0].coordinateSpace,'IMAGE_NORMALISEE_SEGMENT');
assert.strictEqual(views[0].fusionRule,'NE_PAS_FUSIONNER_AVEC_UN_AUTRE_SEGMENT_SANS_GEOMETRIE_COMPATIBLE');
assert.ok(views[0].trajectoryNormalized.every(p=>p.segment===1));
assert.ok(views[1].trajectoryNormalized.every(p=>p.segment===2));
assert.strictEqual(report.segmentHeatmap([{x:-2,y:2}]).observations,1,'les coordonnées observables sont bornées au repère image normalisé');
console.log('segment_visuals_nonregression: 10/10');
