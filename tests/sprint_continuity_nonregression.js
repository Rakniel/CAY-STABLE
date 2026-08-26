const assert=require('assert');
const stats=require('../player_stats_v1.js');
let pass=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);pass++;};
const projector={validated:true,source:'test_metric',confidence:1,project:p=>({x:p.x*100,y:p.y*60})};

const acrossCut={fullPath:[
  {time:0,segment:1,x:.10,y:.2},
  {time:1,segment:1,x:.18,y:.2},
  {time:10,segment:2,x:.20,y:.2},
  {time:11,segment:2,x:.28,y:.2}
]};
const cutMetric=stats.metricForTrack(acrossCut,{1:projector,2:projector});
ok(cutMetric.sprintCount===2,'un sprint après cut caméra doit être compté comme un nouvel épisode');
ok(cutMetric.metricCoveredSeconds===2,'aucune durée inter-segment ajoutée aux métriques');
ok(cutMetric.distanceM===16,'distance agrégée uniquement dans chaque segment métrique');
ok(cutMetric.sprintContinuityPolicy==='RESET_SUR_CUT_SEGMENT_GAP_TEMPOREL_OU_PAIRE_METRIQUE_REJETEE','politique de continuité sprint exposée');

const afterGap={fullPath:[
  {time:0,segment:3,x:.10,y:.2},
  {time:1,segment:3,x:.18,y:.2},
  {time:7,segment:3,x:.20,y:.2},
  {time:8,segment:3,x:.28,y:.2}
]};
const gapMetric=stats.metricForTrack(afterGap,{3:projector});
ok(gapMetric.sprintCount===2,'un long trou temporel casse la continuité du sprint');
ok(gapMetric.metricCoveredSeconds===2,'le trou >3s reste hors couverture métrique');

const rejectingProjector={validated:true,source:'test_partial',confidence:1,project:p=>p.time===2?null:{x:p.x*100,y:p.y*60}};
const rejectedPair={fullPath:[
  {time:0,segment:4,x:.10,y:.2},
  {time:1,segment:4,x:.18,y:.2},
  {time:2,segment:4,x:.26,y:.2},
  {time:3,segment:4,x:.34,y:.2},
  {time:4,segment:4,x:.42,y:.2}
]};
const rejectMetric=stats.metricForTrack(rejectedPair,{4:rejectingProjector});
ok(rejectMetric.sprintCount===2,'une paire métrique rejetée casse la continuité avant le sprint suivant');
ok(rejectMetric.metricCoveredSeconds===2,'seules les paires projetables restent mesurées');
ok(rejectMetric.metricCoverage===.5,'couverture reflète les paires réellement défendables');
ok(rejectMetric.quality==='PARTIEL','couverture partielle reste explicitement PARTIEL');

const continuous={fullPath:[
  {time:0,segment:5,x:.10,y:.2},
  {time:1,segment:5,x:.18,y:.2},
  {time:2,segment:5,x:.26,y:.2}
]};
const continuousMetric=stats.metricForTrack(continuous,{5:projector});
ok(continuousMetric.sprintCount===1,'un sprint continu dans le même segment n’est pas surcompté');
ok(continuousMetric.metricCoverage===1,'segment entièrement métrique conserve couverture complète');
console.log(`PASS ${pass}/12 sprint continuity`);