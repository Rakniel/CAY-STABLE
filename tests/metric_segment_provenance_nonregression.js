const assert=require('assert');
const report=require('../validated_report_bridge_v1.js');
let pass=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);pass++;};
const coreState={
  archive:[],
  active:[{
    globalId:'CAY-4',
    fullPath:[
      {time:0,segment:1,x:.1,y:.2},
      {time:1,segment:1,x:.2,y:.2},
      {time:2,segment:1,x:.3,y:.2},
      {time:10,segment:2,x:.7,y:.5},
      {time:11,segment:2,x:.6,y:.5},
      {time:20,segment:3,x:.4,y:.4}
    ]
  }]
};
const projectors={
  1:{validated:true,source:'manual_4_points',confidence:.97,project:p=>({x:p.x*100,y:p.y*60})},
  2:{validated:false,source:'auto_guess',confidence:.42,reason:'géométrie insuffisante'}
};
const byId=report.buildMetricSegmentProvenance(coreState,projectors);
const rows=byId.get('CAY-4');
ok(rows.length===3,'provenance conservée pour chaque segment observé');
ok(rows[0].segment===1&&rows[1].segment===2&&rows[2].segment===3,'ordre des segments stable');
ok(rows[0].metricProjectionValidated===true,'segment 1 métrique validé');
ok(rows[0].eligibleSeconds===2&&rows[0].measuredSeconds===2,'temps métrique seulement sur intervalles projetés valides');
ok(rows[0].coverage===1&&rows[0].quality==='FIABLE','couverture validée explicite');
ok(rows[0].acceptedPairs===2&&rows[0].rejectedPairs===0,'paires métriques acceptées comptabilisées');
ok(rows[0].distanceM===20,'distance issue uniquement des paires métriques défendables');
ok(rows[0].calibrationSource==='manual_4_points'&&rows[0].calibrationConfidence===.97,'provenance calibration conservée');
ok(rows[1].metricProjectionValidated===false,'segment 2 non validé reste non métrique');
ok(rows[1].eligibleSeconds===1&&rows[1].measuredSeconds===0&&rows[1].coverage===0,'aucune mesure physique sur projection rejetée');
ok(rows[1].rejectionReasons.PROJECTION_NON_VALIDEE===1,'raison technique du rejet conservée');
ok(rows[1].reason==='géométrie insuffisante','raison indisponibilité calibration conservée');
ok(rows[2].quality==='INDISPONIBLE','une observation isolée ne fabrique pas une couverture métrique');
ok(rows.every(r=>r.aggregationPolicy==='DISTANCE_VITESSE_SPRINTS_UNIQUEMENT_SUR_PAIRES_METRIQUES_VALIDES_ET_DEFENDABLES'),'politique anti-extrapolation explicite');

const partialState={archive:[],active:[{globalId:'CAY-7',fullPath:[
  {time:0,segment:4,x:.1,y:.2},
  {time:1,segment:4,x:.2,y:.2},
  {time:2,segment:4,x:.3,y:.2}
]}]};
const partialProjector={4:{validated:true,source:'manual',confidence:.9,project:p=>p.x>=.3?null:{x:p.x*10,y:p.y*10}}};
const partial=report.buildMetricSegmentProvenance(partialState,partialProjector).get('CAY-7')[0];
ok(partial.metricProjectionValidated===true,'calibration peut être validée sans rendre chaque paire exploitable');
ok(partial.eligibleSeconds===2&&partial.measuredSeconds===1&&partial.coverage===.5,'couverture réelle partielle calculée paire par paire');
ok(partial.quality==='PARTIEL','projection partiellement exploitable classée PARTIEL');
ok(partial.acceptedPairs===1&&partial.rejectedPairs===1,'acceptations et rejets séparés');
ok(partial.rejectionReasons.COORDONNEES_METRIQUES_INVALIDES===1,'coordonnées métriques invalides explicites');
ok(partial.reason&&partial.reason.includes('partie'),'raison de couverture partielle exposée');

const absurdState={archive:[],active:[{globalId:'CAY-9',fullPath:[
  {time:0,segment:5,x:.1,y:.1},{time:1,segment:5,x:.2,y:.1}
]}]};
const absurdProjector={5:{validated:true,source:'manual',confidence:.95,project:p=>({x:p.x*1000,y:p.y*1000})}};
const absurd=report.buildMetricSegmentProvenance(absurdState,absurdProjector).get('CAY-9')[0];
ok(absurd.measuredSeconds===0&&absurd.distanceM===null,'vitesse physiquement non défendable exclue des métriques');
ok(absurd.rejectionReasons.VITESSE_NON_DEFENDABLE===1,'rejet vitesse aberrante tracé');
ok(typeof report.buildMetricSegmentProvenance==='function','API de provenance exposée');
console.log(`PASS ${pass}/23 metric segment provenance`);
