'use strict';
const assert=require('assert');

const gatePath=require.resolve('../first_results_testability_gate_v1.js');
delete require.cache[gatePath];

const baseReport={
  marker:'preserved',
  playerCards:{
    summary:{status:'TERRAIN_DISPONIBLE'},
    players:[{
      id:'A',
      firstResults:{
        tracking:true,trajectory:true,heatmap:true,
        distance:true,avgSpeed:true,maxSpeed:true,sprints:true,
        physicalMetrics:true,physicalMetricsComplete:true
      }
    }]
  }
};

global.CAYStableTrackingBridge={
  create(){
    return {
      report(){
        return {
          ...baseReport,
          playerCards:{...baseReport.playerCards,players:[...baseReport.playerCards.players]}
        };
      }
    };
  }
};

const Gate=require('../first_results_testability_gate_v1.js');
assert.strictEqual(global.CAYStableTrackingBridge.__cayFirstResultsTestabilityPatched,true,'runtime bridge must be patched when the shipped gate loads after StableTrackingBridge');

const instance=global.CAYStableTrackingBridge.create({});
const report=instance.report();
assert.strictEqual(report.marker,'preserved','testability wiring must preserve unrelated report fields');
assert(report.playerCards.testability,'runtime report must expose player-card testability without requiring a second consumer-side evaluation');
assert.strictEqual(report.playerCards.testability.status,'PHYSICAL_TESTABLE');
assert.strictEqual(report.playerCards.testability.metricReadyPlayers,1);
assert.deepStrictEqual(report.playerCards.testability.blockers,{tracking:0,trajectory:0,heatmap:0,distance:0,avgSpeed:0,maxSpeed:0,sprints:0});
assert.strictEqual(report.playerCards.testability.nextAction,'PREMIERS_RESULTATS_PRETS');
assert.strictEqual(report.firstResultsTestability,report.playerCards.testability,'top-level runtime shortcut must reuse the exact same evaluation object, not recalculate it');
assert.strictEqual(report.playerCards.summary.status,'PHYSICAL_TESTABLE','runtime summary must align with the canonical testability gate');
assert.strictEqual(report.playerCards.players[0].firstResults.status,'PHYSICAL_TESTABLE','per-player readiness must align with the same canonical decision');
assert.strictEqual(report.playerCards.players[0].firstResults.pitchVisualCore,true);
assert.strictEqual(report.playerCards.players[0].firstResults.metricReady,true);
assert.strictEqual(report.playerCards.canonicalReadinessVersion,'CAY_FIRST_RESULTS_TESTABILITY_GATE_V1_8');

const contradictory=Gate.evaluate({players:[{id:'B',firstResults:{tracking:false,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true,physicalMetrics:true,physicalMetricsComplete:true}}]});
assert.strictEqual(contradictory.withCompletePhysicalMetrics,1,'existing physical evidence is preserved');
assert.strictEqual(contradictory.metricReadyPlayers,0,'runtime testability must remain fail-closed when tracking evidence is absent');
assert.strictEqual(contradictory.status,'INDISPONIBLE');
assert.strictEqual(contradictory.blockers.tracking,1,'runtime diagnostics must expose the actual missing proof instead of promoting contradictory physical evidence');
assert.strictEqual(contradictory.nextAction,'OBTENIR_TRACKING_DEFENDABLE');

assert.strictEqual(Gate.installRuntime(),false,'runtime patch must be idempotent');
delete global.CAYStableTrackingBridge;

console.log('first results testability runtime non-regression: PASS');