'use strict';
const assert=require('assert');
const VM=require('../player_card_view_model_v1.js');

const base={
  metricCoverage:.9,
  distanceM:1250,
  avgSpeedKmh:7.5,
  maxSpeedKmh:null,
  sprintCount:3,
  quality:'FIABLE',
  rosterBound:true,
  publication:{
    status:'FIABLE',
    fieldStatus:{
      distanceM:{status:'FIABLE',reason:null},
      avgSpeedKmh:{status:'FIABLE',reason:null},
      sprintCount:{status:'FIABLE',reason:null},
      maxSpeedKmh:{status:'INDISPONIBLE',reason:'pic de vitesse non soutenu'}
    }
  }
};

const card=VM.buildCard({id:9,identityQuality:'FIABLE',metric:base});
assert.equal(card.metrics.distanceM.status,'FIABLE');
assert.equal(card.metrics.distanceM.value,1250);
assert.equal(card.metrics.avgSpeedKmh.status,'FIABLE');
assert.equal(card.metrics.sprintCount.status,'FIABLE');
assert.equal(card.metrics.maxSpeedKmh.status,'INDISPONIBLE','field-scoped max-speed veto must reach the player card');
assert.equal(card.metrics.maxSpeedKmh.value,null);
assert.match(card.metrics.maxSpeedKmh.reason,/non soutenu/i);

const poisoned={...base,maxSpeedKmh:31.2};
const poisonedCard=VM.buildCard({id:9,identityQuality:'FIABLE',metric:poisoned});
assert.equal(poisonedCard.metrics.maxSpeedKmh.status,'INDISPONIBLE','a stale finite diagnostic value must not bypass fieldStatus');
assert.equal(poisonedCard.metrics.maxSpeedKmh.value,null);

const explicitReliable={...base,maxSpeedKmh:24.8,publication:{...base.publication,fieldStatus:{...base.publication.fieldStatus,maxSpeedKmh:{status:'FIABLE',reason:null}}}};
const reliableCard=VM.buildCard({id:9,identityQuality:'FIABLE',metric:explicitReliable});
assert.equal(reliableCard.metrics.maxSpeedKmh.status,'FIABLE');
assert.equal(reliableCard.metrics.maxSpeedKmh.value,24.8);

console.log('player card field-scoped publication non-regression: PASS');
