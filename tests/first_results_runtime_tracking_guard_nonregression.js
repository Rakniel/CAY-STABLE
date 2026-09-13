'use strict';
const assert=require('assert');

const gatePath=require.resolve('../first_results_testability_gate_v1.js');
const bridgePath=require.resolve('../first_results_runtime_guard_bridge_v1.js');
delete require.cache[gatePath];
delete require.cache[bridgePath];

function readyReport(){
  return {
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
}

global.CAYStableTrackingBridge={
  create(){
    return {report(){return readyReport();}};
  }
};

require('../first_results_testability_gate_v1.js');
let runtimeOk=true;
global.CAYStableTrackingRuntimeGuard={
  verdict(){
    return runtimeOk
      ? {version:'guard',ok:true,twoStage:true,cameraConsensus:true,reasons:[]}
      : {version:'guard',ok:false,twoStage:false,cameraConsensus:true,reasons:['TWO_STAGE_BYTETRACK_RUNTIME_NOT_PATCHED']};
  }
};

const GuardBridge=require('../first_results_runtime_guard_bridge_v1.js');
assert.strictEqual(global.CAYStableTrackingBridge.__cayFirstResultsRuntimeGuardPatched,true,'runtime first-results guard must patch the shipped bridge');

let report=global.CAYStableTrackingBridge.create({}).report();
assert.strictEqual(report.marker,'preserved');
assert.strictEqual(report.firstResultsTestability.status,'PHYSICAL_TESTABLE','ready runtime must preserve canonical first-results verdict');
assert.strictEqual(report.firstResultsTestability.runtimeTrackingReady,true);
assert.strictEqual(report.playerCards.players[0].firstResults.status,'PHYSICAL_TESTABLE');

runtimeOk=false;
report=global.CAYStableTrackingBridge.create({}).report();
assert.strictEqual(report.firstResultsTestability.diagnosticStatus,'PHYSICAL_TESTABLE','blocked runtime must preserve the previous verdict as diagnostic evidence');
assert.strictEqual(report.firstResultsTestability.status,'INDISPONIBLE','stale cards must never publish first results when ByteTrack/GMC runtime proof fails');
assert.strictEqual(report.firstResultsTestability.coreTestable,false);
assert.strictEqual(report.firstResultsTestability.physicalTestable,false);
assert.deepStrictEqual(report.firstResultsTestability.runtimeBlockers,['TWO_STAGE_BYTETRACK_RUNTIME_NOT_PATCHED']);
assert.strictEqual(report.firstResultsTestability.nextAction,'RETABLIR_RUNTIME_TRACKING_STABLE');
assert.strictEqual(report.playerCards.testability,report.firstResultsTestability,'top-level and player-card testability must share the same fail-closed object');
assert.strictEqual(report.playerCards.summary.status,'INDISPONIBLE');
assert.strictEqual(report.playerCards.players[0].firstResults.status,'INDISPONIBLE');
assert.strictEqual(report.playerCards.players[0].firstResults.tracking,false);
assert.strictEqual(report.playerCards.players[0].firstResults.metricReady,false);
assert.strictEqual(report.playerCards.players[0].firstResults.diagnosticReadiness.status,'PHYSICAL_TESTABLE','raw previous player readiness must remain auditable');
assert.strictEqual(report.playerCards.players[0].firstResults.diagnosticReadiness.metricReady,true);

assert.strictEqual(GuardBridge.install(global),false,'runtime guard bridge installation must be idempotent');

delete global.CAYStableTrackingRuntimeGuard;
const missing=GuardBridge.runtimeState(global);
assert.strictEqual(missing.ok,false,'missing runtime guard must fail closed');
assert.deepStrictEqual(missing.reasons,['TRACKING_RUNTIME_GUARD_MISSING']);

delete global.CAYStableTrackingBridge;
console.log('first results runtime tracking guard non-regression: PASS');
