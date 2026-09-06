const Heatmap=require('../metric_pitch_heatmap_v1.js');
let pass=0,fail=0;
function check(name,cond){if(cond){console.log('PASS',name);pass++;}else{console.error('FAIL',name);fail++;}}
const projectors={
  1:{validated:true,confidence:.95,project:p=>({x:p.x,y:p.y})},
  2:{validated:true,confidence:.95,project:p=>({x:p.x,y:p.y})}
};
const multiPlan={fullPath:[
  {time:0,segment:1,x:10,y:20},
  {time:1,segment:1,x:11,y:20},
  {time:2,segment:2,x:20,y:20},
  {time:3,segment:2,x:21,y:20}
]};
const strict=Heatmap.build(multiPlan,projectors,{minMetricCoverage:.8,minTemporalCoverage:.8,minCalibrationConfidence:.5,maxDwellGapSec:1});
check('all four observations remain metrically projected',strict.observations===4&&strict.metricCoverage===1);
check('all adjacent chronological time stays in temporal denominator',strict.eligibleIntervalSeconds===3);
check('same-plan dwell allocates only two defensible seconds',strict.projectedIntervalSeconds===2);
check('camera-plan boundary is explicit',strict.segmentBoundaryBreaks===1&&strict.segmentBoundarySeconds===1);
check('multi-plan temporal coverage is penalized instead of hidden',strict.temporalCoverage===.6667);
check('strict 80% temporal publication becomes unavailable',strict.status==='INDISPONIBLE'&&/couverture temporelle insuffisante/.test(strict.reason||''));
check('trajectory never bridges camera plans',strict.trajectory.status==='DISPONIBLE'&&strict.trajectory.runs.length===2&&strict.trajectory.runs.every(run=>run.length===2));
check('no temporal interpolation is invented across the cut',strict.timeAllocation==='LINEAR_PITCH_SEGMENT'&&strict.temporalPolicy.includes('CHANGEMENT_SEGMENT_COMPTE_COMME_TEMPS_NON_DEFENDABLE_SANS_INTERPOLATION'));
const singlePlan={fullPath:[
  {time:0,segment:1,x:10,y:20},
  {time:1,segment:1,x:11,y:20},
  {time:2,segment:1,x:12,y:20},
  {time:3,segment:1,x:13,y:20}
]};
const control=Heatmap.build(singlePlan,projectors,{minMetricCoverage:.8,minTemporalCoverage:.8,minCalibrationConfidence:.5,maxDwellGapSec:1});
check('same-plan control keeps full temporal coverage',control.status==='DISPONIBLE'&&control.temporalCoverage===1&&control.segmentBoundaryBreaks===0&&control.segmentBoundarySeconds===0);
console.log(`metric multi-plan temporal coverage: ${pass} PASS / ${fail} FAIL`);
if(fail)process.exit(1);
