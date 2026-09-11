'use strict';
const assert=require('assert');
const Gate=require('../first_results_testability_gate_v1.js');

const card=(id,firstResults)=>({id,firstResults});
const trackingOnly=card('A',{tracking:true,trajectory:false,heatmap:false,distance:false,avgSpeed:false,maxSpeed:false,sprints:false,physicalMetrics:false});
const visualReady=card('B',{tracking:true,trajectory:true,heatmap:true,distance:false,avgSpeed:false,maxSpeed:false,sprints:false,physicalMetrics:false});
const partialPhysical=card('C',{tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:false,sprints:false,physicalMetrics:true});
const fullPhysical=card('D',{tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true,physicalMetrics:true,physicalMetricsComplete:true});

let result=Gate.evaluate({players:[]});
assert.strictEqual(result.status,'INDISPONIBLE');
assert.strictEqual(result.coreTestable,false);
assert.strictEqual(result.physicalTestable,false);

result=Gate.evaluate({players:[trackingOnly]});
assert.strictEqual(result.status,'TRACKING_TESTABLE');
assert.strictEqual(result.withTracking,1);
assert.strictEqual(result.withCorePitchVisuals,0,'tracking alone must never become a pitch-result test gate');
assert.strictEqual(result.metricReadyPlayers,0);

result=Gate.evaluate({players:[trackingOnly,visualReady]});
assert.strictEqual(result.status,'PITCH_VISUAL_TESTABLE');
assert.strictEqual(result.withCorePitchVisuals,1);
assert.strictEqual(result.coreTestable,true);
assert.strictEqual(result.physicalTestable,false);

result=Gate.evaluate({players:[partialPhysical]});
assert.strictEqual(result.status,'PITCH_VISUAL_TESTABLE','partial physical evidence must not promote the 4/4 physical gate');
assert.strictEqual(result.withAnyPhysicalMetrics,1);
assert.strictEqual(result.withCompletePhysicalMetrics,0);
assert.strictEqual(result.metricReadyPlayers,0);

result=Gate.evaluate({players:[fullPhysical]});
assert.strictEqual(result.status,'PHYSICAL_TESTABLE');
assert.strictEqual(result.withCompletePhysicalMetrics,1);
assert.strictEqual(result.metricReadyPlayers,1);
assert.strictEqual(result.physicalTestable,true);

result=Gate.evaluate({players:[visualReady,fullPhysical]},{minCorePlayers:2,minMetricPlayers:2});
assert.strictEqual(result.coreTestable,true,'explicit core threshold must count only complete tracking+trajectory+heatmap players');
assert.strictEqual(result.physicalTestable,false,'metric threshold must count only players that also have the complete visual core');
assert.strictEqual(result.status,'PITCH_VISUAL_TESTABLE');

const contradictory=Gate.cardEvidence(card('E',{tracking:false,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true,physicalMetrics:true,physicalMetricsComplete:true}));
assert.strictEqual(contradictory.physicalComplete,true,'existing evidence may report complete metrics');
assert.strictEqual(contradictory.metricReady,false,'the testability gate must still require tracking + trajectory + heatmap');

console.log('first results testability gate non-regression: PASS');
