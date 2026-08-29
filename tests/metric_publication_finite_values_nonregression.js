const assert=require('assert');
const guard=require('../metric_publication_guard_v1.js');
let pass=0;
const ok=(cond,msg)=>{assert.ok(cond,msg);pass++;};

const base={
  metricCoverage:.92,
  metricCoveredSeconds:18,
  defendableScore:.91,
  quality:'FIABLE',
  distanceM:124.5,
  avgSpeedKmh:7.2,
  maxSpeedKmh:24.8,
  sprintCount:2,
  sprintQualifiedSeconds:1.8
};

ok(guard.publicationDecision(base).publishable===true,'une métrique physique complète et finie reste publiable');
ok(guard.publicationDecision({...base,distanceM:NaN}).status==='INDISPONIBLE','NaN ne doit jamais être publié comme distance fiable');
ok(guard.publicationDecision({...base,maxSpeedKmh:Infinity}).status==='INDISPONIBLE','Infinity ne doit jamais être publié comme vitesse fiable');
ok(guard.publicationDecision({...base,sprintQualifiedSeconds:undefined}).status==='INDISPONIBLE','une durée de sprint absente rend le bloc physique indisponible');
ok(guard.publicationDecision({...base,avgSpeedKmh:-1}).status==='INDISPONIBLE','une vitesse négative doit être rejetée');
ok(guard.publicationDecision({...base,sprintCount:1.5}).status==='INDISPONIBLE','le compteur de sprints doit rester entier');
const masked=guard.applyPublicationPolicy({...base,distanceM:NaN});
ok(masked.distanceM===null&&masked.avgSpeedKmh===null&&masked.maxSpeedKmh===null&&masked.sprintCount===null&&masked.sprintQualifiedSeconds===null,'une valeur physique invalide masque tout le bloc publié mais conserve le diagnostic');
ok(Number.isNaN(masked.diagnosticPhysicalMetrics.distanceM),'la valeur invalide reste disponible uniquement dans le diagnostic audit');
console.log(`PASS ${pass}/8 metric publication finite values`);
