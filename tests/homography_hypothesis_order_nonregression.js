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
const orderedOutliers=[
  {image:{x:.15,y:.15},pitch:{x:100,y:60}},
  {image:{x:.25,y:.75},pitch:{x:3,y:4}},
  {image:{x:.75,y:.25},pitch:{x:8,y:62}},
  {image:{x:.85,y:.85},pitch:{x:98,y:3}},
  ...clean
];
const fit=h.buildHomography(orderedOutliers,{minInlierRatio:.6,maxHypotheses:70});
ok(fit.ok===true,'le consensus ne doit pas dépendre de repères aberrants placés en premier');
ok(fit.inlierCount===6&&fit.totalCount===10,'les six repères cohérents restent retrouvés malgré ordre défavorable');
ok(fit.hypothesesTested===70,'budget limité de 70 hypothèses respecté');
ok(fit.hypothesisStrategy==='DETERMINISTIC_EVEN_COVERAGE','échantillonnage réparti auditable lorsque le budget est plafonné');
const sampled=h.combinations4(10,70);
ok(sampled.some(idx=>idx.every(i=>i>=4)),'le budget couvre aussi la fin de la liste des correspondances');
console.log(`PASS ${pass}/5 homography hypothesis order`);
