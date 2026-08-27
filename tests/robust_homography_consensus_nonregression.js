const assert=require('assert');
const h=require('../metric_homography_projector_v1.js');
let pass=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);pass++;};

const clean=[
  {image:{x:.1,y:.1},pitch:{x:0,y:0}},
  {image:{x:.9,y:.1},pitch:{x:105,y:0}},
  {image:{x:.9,y:.9},pitch:{x:105,y:68}},
  {image:{x:.1,y:.9},pitch:{x:0,y:68}},
  {image:{x:.5,y:.1},pitch:{x:52.5,y:0}},
  {image:{x:.5,y:.9},pitch:{x:52.5,y:68}}
];
const oneBad={image:{x:.5,y:.5},pitch:{x:5,y:60}};
const validationPoints=[
  {image:{x:.3,y:.3},pitch:{x:26.25,y:17}},
  {image:{x:.7,y:.7},pitch:{x:78.75,y:51}}
];

const robust=h.createProjector({correspondences:[...clean,oneBad],validationPoints});
ok(robust.validated===true,'un point manuel aberrant ne doit pas invalider six correspondances cohérentes');
ok(robust.source==='manual_multi_point_homography_cay_v2','provenance multi-points explicite');
ok(robust.fit.method==='ROBUST_4_POINT_CONSENSUS','méthode robuste exposée');
ok(robust.fit.inlierCount===6&&robust.fit.totalCount===7,'consensus 6/7 mesuré');
ok(robust.fit.rejectedIndices.length===1&&robust.fit.rejectedIndices[0]===6,'index aberrant auditable');
const center=robust.project({x:.5,y:.5});
ok(Math.abs(center.x-52.5)<1e-6&&Math.abs(center.y-34)<1e-6,'projection conservée malgré outlier');

const four=h.createProjector({correspondences:clean.slice(0,4),validationPoints});
ok(four.validated===true&&four.source==='manual_4_point_homography_cay_v1','compatibilité 4 points conservée');

const mostlyBad=[...clean.slice(0,4),
  {image:{x:.2,y:.2},pitch:{x:100,y:60}},
  {image:{x:.3,y:.3},pitch:{x:100,y:5}},
  {image:{x:.4,y:.4},pitch:{x:0,y:60}},
  {image:{x:.6,y:.6},pitch:{x:2,y:2}},
  {image:{x:.7,y:.7},pitch:{x:5,y:60}}
];
const rejected=h.buildHomography(mostlyBad,{minInlierRatio:.7});
ok(rejected.ok===false,'consensus majoritairement incohérent rejeté');
ok(rejected.reason.includes('consensus insuffisant'),'raison de rejet explicite');

const badGeometry=h.buildHomography([
  {image:{x:.1,y:.1},pitch:{x:0,y:0}},
  {image:{x:.2,y:.2},pitch:{x:10,y:0}},
  {image:{x:.3,y:.3},pitch:{x:20,y:0}},
  {image:{x:.4,y:.4},pitch:{x:30,y:0}},
  {image:{x:.5,y:.5},pitch:{x:40,y:0}}
]);
ok(badGeometry.ok===false,'géométrie dégénérée toujours rejetée');
ok(typeof h.combinations4==='function','API de consensus testable exposée');
console.log(`PASS ${pass}/11 robust homography consensus`);
