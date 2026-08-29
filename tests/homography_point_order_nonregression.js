const assert=require('assert');
const h=require('../metric_homography_projector_v1.js');
let pass=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);pass++;};

const ordered=[
  {image:{x:.1,y:.1},pitch:{x:0,y:0}},
  {image:{x:.9,y:.1},pitch:{x:105,y:0}},
  {image:{x:.9,y:.9},pitch:{x:105,y:68}},
  {image:{x:.1,y:.9},pitch:{x:0,y:68}}
];

// Same four correspondences, deliberately entered in a bow-tie/crossing order.
const crossed=[ordered[0],ordered[2],ordered[1],ordered[3]];
const fitOrdered=h.buildHomography(ordered);
const fitCrossed=h.buildHomography(crossed);
ok(fitOrdered.ok===true,'ordre périmétrique valide');
ok(fitCrossed.ok===true,'ordre croisé ne crée plus une fausse dégénérescence');

for(const p of [{x:.5,y:.5},{x:.2,y:.3},{x:.8,y:.7}]){
  const a=h.project(fitOrdered.H,p);
  const b=h.project(fitCrossed.H,p);
  ok(a&&b&&Math.hypot(a.x-b.x,a.y-b.y)<1e-6,'projection indépendante de l’ordre des quatre correspondances');
}

const collinear=[
  {image:{x:.1,y:.1},pitch:{x:0,y:0}},
  {image:{x:.2,y:.2},pitch:{x:10,y:0}},
  {image:{x:.3,y:.3},pitch:{x:20,y:0}},
  {image:{x:.4,y:.4},pitch:{x:30,y:0}}
];
const degenerate=h.buildHomography(collinear);
ok(degenerate.ok===false,'vraie géométrie dégénérée toujours rejetée');
ok(h.orderInvariantArea(ordered.map(c=>c.image))>.6,'aire géométrique calculée sur enveloppe convexe');
ok(h.orderInvariantArea(crossed.map(c=>c.image))===h.orderInvariantArea(ordered.map(c=>c.image)),'aire indépendante de l’ordre de saisie');

console.log(`PASS ${pass} homography point-order nonregression`);