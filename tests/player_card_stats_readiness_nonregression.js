'use strict';
const assert=require('assert');
const Renderer=require('../player_card_renderer_v1.js');

function readiness(overrides={}){
  return Renderer.playerReadinessHtml({
    firstResults:{
      status:'TERRAIN_DISPONIBLE',tracking:true,trajectory:true,heatmap:true,
      distance:false,avgSpeed:false,maxSpeed:false,sprints:false,physicalMetrics:false,
      ...overrides
    }
  });
}

const none=readiness();
assert.match(none,/— stats 0\/4/,'zero physical metrics must stay unavailable');
assert.doesNotMatch(none,/✓ stats/);

const partial=readiness({distance:true,physicalMetrics:true});
assert.match(partial,/— stats 1\/4/,'one published physical metric must be shown as partial, not complete');
assert.doesNotMatch(partial,/✓ stats/,'a single physical metric must not advertise complete stats readiness');

const three=readiness({distance:true,avgSpeed:true,maxSpeed:true,physicalMetrics:true});
assert.match(three,/— stats 3\/4/);
assert.doesNotMatch(three,/✓ stats/,'missing sprint evidence must remain visible');

const all=readiness({distance:true,avgSpeed:true,maxSpeed:true,sprints:true,physicalMetrics:true});
assert.match(all,/✓ stats 4\/4/,'complete stats readiness requires distance, both speeds and sprints');

const trackingOnly=Renderer.playerReadinessHtml({firstResults:{status:'TRACKING_DISPONIBLE',tracking:true}});
assert.match(trackingOnly,/TRACKING PRÊT — TERRAIN EN COURS/);
assert.match(trackingOnly,/— stats 0\/4/);

console.log('player card stats readiness non-regression: PASS');
