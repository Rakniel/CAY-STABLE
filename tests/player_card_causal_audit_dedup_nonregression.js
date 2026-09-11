'use strict';
const assert=require('assert');
const R=require('../player_card_renderer_v1.js');

const audit='Causes principales auditées (non additives) : temps affecté par la projection (6 s, 4 événement(s)) ; trajectoire invalide (3.5 s, 3 événement(s)) ; projection hors terrain (3.5 s, 3 événement(s)).';
const unavailable=reason=>({status:'INDISPONIBLE',value:null,reason:`${reason} • ${audit}`});
const card={
  id:12,
  category:'player',
  identity:{status:'FIABLE'},
  presence:{observedDuration:30,observations:120,trackingCoverage:100},
  observedVisuals:{status:'DISPONIBLE',heatmap:{cols:1,cells:[[1]]}},
  pitchVisuals:{status:'INDISPONIBLE',reason:'couverture terrain insuffisante'},
  metrics:{
    distanceM:unavailable('couverture métrique insuffisante pour la distance'),
    avgSpeedKmh:unavailable('couverture métrique insuffisante pour la vitesse moyenne'),
    maxSpeedKmh:unavailable('couverture métrique insuffisante pour la vitesse max'),
    sprintCount:unavailable('couverture métrique insuffisante pour les sprints')
  }
};

const parsed=R.splitAuditReason(card.metrics.distanceM.reason);
assert.equal(parsed.reason,'couverture métrique insuffisante pour la distance','field-specific evidence reason must remain available');
assert.equal(parsed.audit,audit,'shared causal audit must be separated without rewriting its evidence');

const html=R.explainUnavailable(card);
assert(html.includes('couverture terrain insuffisante'),'pitch-specific reason must remain visible');
assert(html.includes('couverture métrique insuffisante pour la distance'),'distance-specific reason must remain visible');
assert(html.includes('couverture métrique insuffisante pour les sprints'),'sprint-specific reason must remain visible');
assert((html.match(/Causes principales auditées \(non additives\)/g)||[]).length===1,'shared causal audit must render once instead of once per unavailable physical field');
assert((html.match(/temps affecté par la projection \(6 s, 4 événement\(s\)\)/g)||[]).length===1,'causal evidence values must remain unchanged while deduplicated');
assert(html.includes('aria-label="diagnostic causal audité"'),'shared audit must remain explicitly identifiable as diagnostic evidence');

const noAudit=R.splitAuditReason('projection terrain métrique non défendable');
assert.deepEqual(noAudit,{reason:'projection terrain métrique non défendable',audit:''},'legacy reasons without audit suffix must remain byte-for-byte equivalent at rendering input');

console.log('player card causal audit dedup non-regression: PASS');