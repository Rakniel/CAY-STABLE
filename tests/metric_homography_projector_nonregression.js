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
console.log(`PASS ${pass}/15 metric homography projector`);
