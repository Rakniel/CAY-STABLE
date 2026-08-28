const assert=require('assert');
const h=require('../metric_homography_projector_v1.js');
const stats=require('../player_stats_v1.js');
let pass=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);pass++;};

const correspondences=[
  {image:{x:.1,y:.1},pitch:{x:0,y:0}},
  {image:{x:.9,y:.1},pitch:{x:105,y:0}},
  {image:{x:.9,y:.9},pitch:{x:105,y:68}},
  {image:{x:.1,y:.9},pitch:{x:0,y:68}}
];
const validationPoints=[
  {image:{x:.5,y:.5},pitch:{x:52.5,y:34}},
  {image:{x:.3,y:.7},pitch:{x:26.25,y:51}}
];
const p=h.createProjector({correspondences,validationPoints,pitchLengthM:105,pitchWidthM:68});
ok(p.validated===true,'homographie validée avec points indépendants cohérents');
ok(p.source==='manual_4_point_homography_cay_v1','provenance explicite');
ok(p.confidence>=.5,'confiance exposée');
ok(p.validation.count===2&&p.validation.meanM<1e-6,'erreur reprojection contrôlée');
const center=p.project({x:.5,y:.5});
ok(Math.abs(center.x-52.5)<1e-6&&Math.abs(center.y-34)<1e-6,'projection métrique correcte');
ok(p.project({x:2,y:2})===null,'projection hors terrain raisonnable rejetée');

const raw={fullPath:[
  {time:0,segment:1,x:.5,y:.5},
  {time:1,segment:1,x:.51,y:.5},
  {time:2,segment:1,x:.52,y:.5}
]};
const metric=stats.metricForTrack(raw,{1:p});
ok(metric.metricCoverage===1,'projecteur compatible directement avec player_stats');
ok(metric.distanceM>0&&metric.distanceM<5,'distance métrique produite sans extrapolation');
ok(metric.avgSpeedKmh!==null&&metric.maxSpeedKmh!==null,'vitesses métriques disponibles quand défendables');

const noValidation=h.createProjector({correspondences});
ok(noValidation.validated===false,'pas de métrique validée sans points indépendants');
ok(noValidation.project===null,'aucune projection consommable si validation insuffisante');

const badValidation=h.createProjector({correspondences,validationPoints:[
  {image:{x:.5,y:.5},pitch:{x:80,y:60}},
  {image:{x:.3,y:.7},pitch:{x:90,y:10}}
]});
ok(badValidation.validated===false,'reprojection incohérente rejetée');
ok(badValidation.reason.includes('reprojection'),'raison de rejet explicite');

const degenerate=h.createProjector({correspondences:[
  {image:{x:.1,y:.1},pitch:{x:0,y:0}},
  {image:{x:.2,y:.2},pitch:{x:10,y:0}},
  {image:{x:.3,y:.3},pitch:{x:20,y:0}},
  {image:{x:.4,y:.4},pitch:{x:30,y:0}}
],validationPoints});
ok(degenerate.validated===false,'géométrie dégénérée refusée');
ok(typeof h.buildHomography==='function'&&typeof h.createProjector==='function','API stable exposée');

// Multi-point robust fit: five coherent, slightly noisy landmarks + one gross bad click.
// The winning minimal hypothesis identifies the consensus; an all-inlier refit may only replace it when mean inlier error improves.
const robust=[
  {image:{x:.08,y:.12},pitch:{x:0.2,y:0.1}},
  {image:{x:.91,y:.10},pitch:{x:104.7,y:0.3}},
  {image:{x:.89,y:.91},pitch:{x:104.8,y:67.7}},
  {image:{x:.11,y:.88},pitch:{x:0.3,y:67.8}},
  {image:{x:.50,y:.51},pitch:{x:52.7,y:34.1}},
  {image:{x:.35,y:.30},pitch:{x:95,y:61}}
];
const robustFit=h.buildHomography(robust,{consensusThresholdM:2.5,minInlierRatio:.7});
ok(robustFit.ok===true,'consensus multi-point robuste résolu');
ok(robustFit.inlierCount===5&&robustFit.rejectedIndices.includes(5),'mauvais clic isolé rejeté');
ok(robustFit.refitAttempted===true,'refit tous-inliers tenté quand plus de quatre inliers sont disponibles');
ok(robustFit.meanInlierErrorM<=robustFit.seedMeanInlierErrorM+.0001,'sortie retenue ne dégrade jamais erreur moyenne des inliers');
ok(robustFit.refitApplied===true||robustFit.refitRejectedReason==='NO_MEAN_ERROR_IMPROVEMENT','refit appliqué seulement avec gain mesurable, sinon seed robuste conservée');
ok(typeof h.fitLeastSquares==='function','API de refit explicite et testable');

const robustProjector=h.createProjector({
  correspondences:robust,
  consensusThresholdM:2.5,
  minInlierRatio:.7,
  validationPoints:[
    {image:{x:.50,y:.50},pitch:{x:52.5,y:34}},
    {image:{x:.30,y:.65},pitch:{x:27.8,y:46.0}}
  ],
  maxMeanErrorM:3,
  maxPeakErrorM:5
});
ok(robustProjector.fit.refitAttempted===true,'provenance runtime expose la tentative de refit');
ok(robustProjector.fit.seedMeanInlierErrorM!==null&&robustProjector.fit.meanInlierErrorM!==null,'erreurs avant/après auditables');
ok(robustProjector.fit.refitApplied===true||robustProjector.fit.refitRejectedReason!==null,'décision de refit auditée explicitement');

console.log(`PASS ${pass} metric homography projector`);