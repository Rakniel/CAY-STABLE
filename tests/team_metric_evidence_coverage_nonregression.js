const assert=require('assert');
const report=require('../validated_report_bridge_v1.js');
let pass=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);pass++;};

const state={archive:[],active:[
  {globalId:'CAY-4',fullPath:[
    {time:0,segment:1,x:.10,y:.20},{time:1,segment:1,x:.20,y:.20},{time:2,segment:1,x:.30,y:.20}
  ]},
  {globalId:'CAY-7',fullPath:[
    {time:0,segment:1,x:.40,y:.30},{time:1,segment:1,x:.50,y:.30},{time:2,segment:1,x:.60,y:.30}
  ]}
]};
const projectors={1:{validated:true,source:'manual',confidence:.95,project:p=>{
  if(p.x>=.6)return null;
  return {x:p.x*10,y:p.y*10};
}}};
const byId=report.buildMetricSegmentProvenance(state,projectors);
const team=report.summarizeMetricEvidence(byId);
ok(team.eligibleSeconds===4,'quatre secondes-joueur éligibles');
ok(team.measuredSeconds===3,'seules les paires réellement projetées sont mesurées');
ok(team.coverage===.75,'couverture équipe réelle à 75% et non 100%');
ok(team.quality==='PARTIEL','75% classé PARTIEL');
ok(team.acceptedPairs===3&&team.rejectedPairs===1,'acceptations et rejets agrégés');
ok(team.rejectionReasons.COORDONNEES_METRIQUES_INVALIDES===1,'raison de rejet équipe conservée');
ok(team.policy.includes('REELLEMENT_ACCEPTEES'),'politique anti calibration-seule explicite');
ok(team.denominator==='SOMME_DES_INTERVALLES_JOUEURS_ELIGIBLES','dénominateur explicite');

const none=report.summarizeMetricEvidence(new Map());
ok(none.coverage===0&&none.quality==='INDISPONIBLE','absence de preuve métrique reste indisponible');
ok(none.measuredDistanceM===null,'aucune distance inventée sans mesure');
ok(typeof report.summarizeMetricEvidence==='function','API couverture métrique équipe exposée');
console.log(`PASS ${pass}/11 team metric evidence coverage`);
