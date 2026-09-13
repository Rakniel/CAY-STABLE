'use strict';
const assert=require('assert');

const gatePath=require.resolve('../first_results_testability_gate_v1.js');
const bridgePath=require.resolve('../first_results_runtime_guard_bridge_v1.js');
delete require.cache[gatePath];
delete require.cache[bridgePath];

let observationBridge=null;
function readyReport(){
  return {
    marker:'preserved',
    ...(observationBridge?{bridge:{...observationBridge}}:{}),
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
assert.strictEqual(report.firstResultsTestability.status,'PHYSICAL_TESTABLE','ready runtime without strict-frame evidence keeps legacy verdict');
assert.strictEqual(report.firstResultsTestability.runtimeTrackingReady,true);
assert.strictEqual(report.playerCards.players[0].firstResults.status,'PHYSICAL_TESTABLE');

observationBridge={attemptedObservationFrames:100,usableObservationFrames:90,unavailableObservationFrames:10,observationCoverage:.9,observationQuality:'FIABLE',unavailableReasons:{DETECTOR_INFERENCE_FAILED:10}};
report=global.CAYStableTrackingBridge.create({}).report();
assert.strictEqual(report.firstResultsTestability.status,'PHYSICAL_TESTABLE','fiable observation coverage must preserve physical results');
assert.strictEqual(report.firstResultsTestability.observationCoverageReady,true);
assert.strictEqual(report.observationCoverageGuard.physicalResultsAllowed,true);
assert.strictEqual(report.observationCoverageGuard.coverage,.9);

observationBridge={attemptedObservationFrames:100,usableObservationFrames:70,unavailableObservationFrames:30,observationCoverage:.7,observationQuality:'PARTIEL',unavailableReasons:{DETECTOR_INFERENCE_FAILED:30}};
report=global.CAYStableTrackingBridge.create({}).report();
assert.strictEqual(report.firstResultsTestability.diagnosticStatus,'PHYSICAL_TESTABLE','partial observation guard must preserve previous physical verdict diagnostically');
assert.strictEqual(report.firstResultsTestability.status,'PITCH_VISUAL_TESTABLE','partial global observation coverage must downgrade physical publication only');
assert.strictEqual(report.firstResultsTestability.physicalTestable,false);
assert.strictEqual(report.firstResultsTestability.observationCoverageReady,false);
assert.strictEqual(report.firstResultsTestability.nextAction,'AMELIORER_COUVERTURE_ANALYSE');
assert.strictEqual(report.playerCards.players[0].firstResults.tracking,true,'visual evidence remains usable when observation coverage is partial');
assert.strictEqual(report.playerCards.players[0].firstResults.trajectory,true);
assert.strictEqual(report.playerCards.players[0].firstResults.heatmap,true);
assert.strictEqual(report.playerCards.players[0].firstResults.distance,false,'distance must not be published from partial global observation coverage');
assert.strictEqual(report.playerCards.players[0].firstResults.avgSpeed,false);
assert.strictEqual(report.playerCards.players[0].firstResults.maxSpeed,false);
assert.strictEqual(report.playerCards.players[0].firstResults.sprints,false);
assert.strictEqual(report.playerCards.players[0].firstResults.metricReady,false);
assert.strictEqual(report.playerCards.players[0].firstResults.diagnosticReadiness.metricReady,undefined,'raw card readiness remains auditable without inventing derived flags');
assert.strictEqual(report.observationCoverageGuard.physicalResultsAllowed,false);
assert.strictEqual(report.observationCoverageGuard.visualResultsAllowed,true);

observationBridge={attemptedObservationFrames:20,usableObservationFrames:0,unavailableObservationFrames:20,observationCoverage:0,observationQuality:'INDISPONIBLE',unavailableReasons:{FIELD_POLYGON_UNAVAILABLE:20}};
report=global.CAYStableTrackingBridge.create({}).report();
assert.strictEqual(report.firstResultsTestability.status,'INDISPONIBLE','zero usable attempted frames must block stale first results');
assert.strictEqual(report.firstResultsTestability.coreTestable,false);
assert.strictEqual(report.firstResultsTestability.physicalTestable,false);
assert.strictEqual(report.playerCards.players[0].firstResults.status,'INDISPONIBLE');
assert.strictEqual(report.playerCards.players[0].firstResults.tracking,false);
assert.strictEqual(report.playerCards.players[0].firstResults.nextAction,'AMELIORER_COUVERTURE_ANALYSE');
assert.strictEqual(report.observationCoverageGuard.visualResultsAllowed,false);

observationBridge=null;
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
console.log('first results runtime tracking/coverage guard non-regression: PASS');
