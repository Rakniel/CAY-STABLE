'use strict';
const assert=require('assert');
const ViewModel=require('../player_card_view_model_v1.js');
const Renderer=require('../player_card_renderer_v1.js');

const available=value=>({status:'FIABLE',value});
const unavailable={status:'INDISPONIBLE',value:null};
function card(metrics={}){
  return {
    presence:{observations:10},
    observedVisuals:{status:'DISPONIBLE'},
    pitchVisuals:{trajectory:{status:'DISPONIBLE'},heatmap:{status:'DISPONIBLE'}},
    metrics:{
      distanceM:metrics.distanceM||unavailable,
      avgSpeedKmh:metrics.avgSpeedKmh||unavailable,
      maxSpeedKmh:metrics.maxSpeedKmh||unavailable,
      sprintCount:metrics.sprintCount||unavailable
    }
  };
}

const complete=card({distanceM:available(1000),avgSpeedKmh:available(8),maxSpeedKmh:available(26),sprintCount:available(4)});
const partial=card({distanceM:available(700),avgSpeedKmh:available(7)});
const splitSpeed=card({maxSpeedKmh:available(24)});

const completeReadiness=ViewModel.firstResultsReadiness(complete);
assert.strictEqual(completeReadiness.physicalMetrics,true);
assert.strictEqual(completeReadiness.physicalMetricsComplete,true,'4/4 must be explicitly complete');

const partialReadiness=ViewModel.firstResultsReadiness(partial);
assert.strictEqual(partialReadiness.physicalMetrics,true,'legacy any-physical evidence remains compatible');
assert.strictEqual(partialReadiness.physicalMetricsComplete,false,'partial metrics must never become complete');

const summary=ViewModel.readinessSummary([complete,partial,splitSpeed]);
assert.strictEqual(summary.players,3);
assert.strictEqual(summary.withPhysicalMetrics,3,'legacy any-physical counter remains unchanged');
assert.strictEqual(summary.withCompletePhysicalMetrics,1,'only one player has all four physical metrics');
assert.strictEqual(summary.withMetricDistance,2);
assert.strictEqual(summary.withMetricAvgSpeed,2);
assert.strictEqual(summary.withMetricMaxSpeed,2);
assert.strictEqual(summary.withMetricSprints,1);

const html=Renderer.readinessHtml(summary);
assert.match(html,/distance 2\/3/);
assert.match(html,/vit\. moy\. 2\/3/);
assert.match(html,/vit\. max 2\/3/);
assert.match(html,/sprints 1\/3/);
assert.match(html,/stats 4\/4 1\/3/,'global summary must expose fully complete physical-stat players');
assert.doesNotMatch(html,/ • vitesse /,'ambiguous combined speed counter must not return');

console.log('player card complete physical readiness non-regression: PASS');
