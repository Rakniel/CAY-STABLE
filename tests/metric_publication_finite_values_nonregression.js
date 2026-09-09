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
  sprintQualifiedSeconds:1.8,
  speedSamples:[
    {time:0,segment:1,kmh:7.0},{time:1,segment:1,kmh:7.1},{time:2,segment:1,kmh:7.3},{time:3,segment:1,kmh:7.2},{time:4,segment:1,kmh:7.4}
  ]
};

ok(guard.publicationDecision(base).publishable===true,'une métrique physique complète, finie et temporellement continue reste publiable');
ok(guard.publicationDecision({...base,distanceM:NaN}).status==='INDISPONIBLE','le bloc complet reste non complet si la distance est invalide');
ok(guard.publicationDecision({...base,maxSpeedKmh:Infinity}).status==='INDISPONIBLE','le bloc complet reste non complet si la vitesse max source est invalide');
ok(guard.publicationDecision({...base,sprintQualifiedSeconds:undefined}).status==='INDISPONIBLE','le bloc complet reste non complet si la durée de sprint est absente');
ok(guard.publicationDecision({...base,distanceM:null}).status==='INDISPONIBLE','null ne doit jamais être converti silencieusement en zéro publiable');
ok(guard.publicationDecision({...base,avgSpeedKmh:''}).status==='INDISPONIBLE','une chaîne vide ne doit jamais devenir une vitesse zéro publiable');
ok(guard.publicationDecision({...base,metricCoveredSeconds:null}).status==='INDISPONIBLE','une durée couverte null reste indisponible');
ok(guard.publicationDecision({...base,avgSpeedKmh:-1}).status==='INDISPONIBLE','une vitesse négative doit être rejetée');
ok(guard.publicationDecision({...base,sprintCount:1.5}).status==='INDISPONIBLE','le compteur de sprints doit rester entier');

const invalidDistance=guard.applyPublicationPolicy({...base,distanceM:NaN});
ok(invalidDistance.distanceM===null&&invalidDistance.avgSpeedKmh===7.2&&Number.isFinite(invalidDistance.maxSpeedKmh)&&invalidDistance.sprintCount===2,'une distance NaN masque uniquement la distance; les champs indépendamment défendables restent publiables');
ok(Number.isNaN(invalidDistance.diagnosticPhysicalMetrics.distanceM),'la distance invalide reste disponible uniquement dans le diagnostic audit');

const invalidSpeed=guard.applyPublicationPolicy({...base,avgSpeedKmh:Infinity});
ok(invalidSpeed.distanceM===124.5&&invalidSpeed.avgSpeedKmh===null&&invalidSpeed.maxSpeedKmh===null&&invalidSpeed.sprintCount===null,'une vitesse moyenne invalide ferme la famille vitesse/sprints/max mais conserve une distance fiable');

const invalidSprint=guard.applyPublicationPolicy({...base,sprintCount:1.5});
ok(invalidSprint.distanceM===124.5&&invalidSprint.avgSpeedKmh===7.2&&invalidSprint.sprintCount===null&&invalidSprint.sprintQualifiedSeconds===null&&Number.isFinite(invalidSprint.maxSpeedKmh),'un compteur de sprints invalide ferme les sprints sans supprimer distance, vitesse moyenne ou max défendables');

const invalidPeak=guard.applyPublicationPolicy({...base,maxSpeedKmh:Infinity});
ok(invalidPeak.distanceM===124.5&&invalidPeak.avgSpeedKmh===7.2&&invalidPeak.sprintCount===2&&invalidPeak.maxSpeedKmh===null,'une vitesse max source infinie masque uniquement la vitesse max lorsque les autres preuves restent valides');

const inconsistentPeak=guard.applyPublicationPolicy({...base,maxSpeedKmh:7.0});
ok(inconsistentPeak.distanceM===124.5&&inconsistentPeak.avgSpeedKmh===7.2&&inconsistentPeak.sprintCount===2&&inconsistentPeak.maxSpeedKmh===null,'un pic soutenu supérieur au maximum source ferme uniquement la vitesse max');
ok(inconsistentPeak.publication.fieldStatus.maxSpeedKmh.reason.includes('incohérente'),'le diagnostic explique explicitement l’incohérence entre pic soutenu et maximum source');

const commonFailure=guard.applyPublicationPolicy({...base,metricCoveredSeconds:null});
ok(commonFailure.publication.status==='INDISPONIBLE'&&commonFailure.distanceM===null&&commonFailure.avgSpeedKmh===null&&commonFailure.maxSpeedKmh===null&&commonFailure.sprintCount===null,'une preuve commune invalide ferme toujours tous les champs physiques');
console.log(`PASS ${pass}/17 metric publication finite values`);
