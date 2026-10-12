'use strict';
const assert=require('assert');
const h=require('../metric_homography_projector_v1.js');
let checks=0;
const eq=(a,b,message)=>{assert.deepStrictEqual(a,b,message);checks++;};
const ok=(condition,message)=>{assert.ok(condition,message);checks++;};

// Independent, intentionally exhaustive oracle: never reuse the optimized unranking algorithm.
function exhaustive(n,max){
  const all=[];
  for(let a=0;a<n-3;a++)for(let b=a+1;b<n-2;b++)for(let c=b+1;c<n-1;c++)for(let d=c+1;d<n;d++)all.push([a,b,c,d]);
  const limit=Number.isFinite(Number(max))?Math.max(1,Math.floor(Number(max))):512;
  if(all.length<=limit)return all;
  if(limit===1)return [all[Math.floor((all.length-1)/2)]];
  return Array.from({length:limit},(_,i)=>all[Math.round(i*(all.length-1)/(limit-1))]);
}

for(let n=4;n<=24;n++){
  for(const budget of [1,2,3,7,16,70,512]){
    const actual=h.combinations4(n,budget);
    eq(actual,exhaustive(n,budget),`exact lexicographic order n=${n} budget=${budget}`);
    ok(actual.length===new Set(actual.map(row=>row.join(','))).size,'no repeated hypothesis');
  }
}
// Large enough to detect the original C(n,4) allocation without relying on wall-clock timing.
const large=h.combinations4(60,512);
eq(large,exhaustive(60,512),'60-point sample exactly matches exhaustive oracle');
ok(large.length===512,'hypothesis budget is enforced for 60 points');
ok(large[0].join(',')==='0,1,2,3','first combination preserved');
ok(large[511].join(',')==='56,57,58,59','last combination preserved');
eq(h.combinations4(3,512),[],'less than four correspondences returns no hypotheses');
eq(h.combinations4(Number.NaN,512),[],'invalid point count fails closed');

// Regression sentinel: exhaustive materialization would allocate 64,684,950 arrays at n=200.
const stress=h.combinations4(200,512);
ok(stress.length===512,'200-point calibration must remain bounded to 512 hypotheses');
eq(stress[0],[0,1,2,3],'large-n first hypothesis preserved');
eq(stress[stress.length-1],[196,197,198,199],'large-n last hypothesis preserved');

// Calibration remains fail-closed without independent validation after sampling.
const correspondences=Array.from({length:12},(_,i)=>({
  image:{x:.1+.8*(i%4)/3,y:.1+.8*Math.floor(i/4)/2},
  pitch:{x:105*(i%4)/3,y:68*Math.floor(i/4)/2}
}));
const fit=h.buildHomography(correspondences,{maxHypotheses:50});
ok(fit.ok===true,'bounded hypotheses still fit a coherent calibration');
ok(fit.hypothesesTested===50,'calibration respects the requested budget');
ok(h.createProjector({correspondences,maxHypotheses:50}).validated===false,'independent validation remains mandatory');
console.log(`PASS ${checks} bounded homography sampling assertions`);
