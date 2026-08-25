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
ok(rows[0].eligibleSeconds===2&&rows[0].measuredSeconds===2,'temps métrique seulement sur intervalle éligible validé');
ok(rows[0].coverage===1&&rows[0].quality==='FIABLE','couverture validée explicite');
ok(rows[0].calibrationSource==='manual_4_points'&&rows[0].calibrationConfidence===.97,'provenance calibration conservée');
ok(rows[1].metricProjectionValidated===false,'segment 2 non validé reste non métrique');
ok(rows[1].eligibleSeconds===1&&rows[1].measuredSeconds===0&&rows[1].coverage===0,'aucune mesure physique sur projection rejetée');
ok(rows[1].reason==='géométrie insuffisante','raison indisponibilité conservée');
ok(rows[2].quality==='INDISPONIBLE','une observation isolée ne fabrique pas une couverture métrique');
ok(rows.every(r=>r.aggregationPolicy==='DISTANCE_VITESSE_SPRINTS_UNIQUEMENT_SUR_SEGMENT_METRIQUE_VALIDE'),'politique anti-extrapolation explicite');
ok(typeof report.buildMetricSegmentProvenance==='function','API de provenance exposée');
console.log(`PASS ${pass}/12 metric segment provenance`);
