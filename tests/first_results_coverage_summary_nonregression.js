'use strict';
const assert=require('assert');
const Gate=require('../first_results_testability_gate_v1.js');

const card=(id,firstResults,extra={})=>({id,firstResults,...extra});
const trackingOnly=card('A',{tracking:true,trajectory:false,heatmap:false,distance:false,avgSpeed:false,maxSpeed:false,sprints:false,physicalMetrics:false},{presence:{trackingCoverage:80}});
const physicalReady=card('B',{tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true,physicalMetrics:true,physicalMetricsComplete:true},{presence:{trackingCoverage:90},pitchVisuals:{spatialCoverage:75,physicalMetricCoverage:60,spatialCoverageBasis:'TEMPORAL_SECONDS'}});
const unknownCoverage=card('C',{tracking:true,trajectory:false,heatmap:false,distance:false,avgSpeed:false,maxSpeed:false,sprints:false,physicalMetrics:false});

let result=Gate.evaluate({players:[trackingOnly,physicalReady]});
assert.strictEqual(result.version,'CAY_FIRST_RESULTS_TESTABILITY_GATE_V1_5');
assert.deepStrictEqual(result.coverageSummary.tracking,{eligiblePlayers:2,knownPlayers:2,minPct:80,avgPct:85,maxPct:90});
assert.deepStrictEqual(result.coverageSummary.pitchSpatial,{eligiblePlayers:1,knownPlayers:1,minPct:75,avgPct:75,maxPct:75});
assert.deepStrictEqual(result.coverageSummary.physicalMetric,{eligiblePlayers:1,knownPlayers:1,minPct:60,avgPct:60,maxPct:60});
assert.match(result.coverageSummary.policy,/AUCUN_SEUIL_DE_COUVERTURE_N_EST_INVENTE/);

result=Gate.evaluate({players:[unknownCoverage]});
assert.deepStrictEqual(result.coverageSummary.tracking,{eligiblePlayers:1,knownPlayers:0,minPct:null,avgPct:null,maxPct:null},'missing coverage must remain explicit instead of being invented as zero or 100%');
assert.deepStrictEqual(result.coverageSummary.pitchSpatial,{eligiblePlayers:0,knownPlayers:0,minPct:null,avgPct:null,maxPct:null});
assert.deepStrictEqual(result.coverageSummary.physicalMetric,{eligiblePlayers:0,knownPlayers:0,minPct:null,avgPct:null,maxPct:null});
assert.strictEqual(result.status,'TRACKING_TESTABLE','coverage summary is audit-only and must not silently introduce a readiness threshold');

const clampedReady=card('D',{tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true,physicalMetrics:true},{presence:{trackingCoverage:150},pitchVisuals:{spatialCoverage:-10,physicalMetricCoverage:125}});
result=Gate.evaluate({players:[clampedReady]});
assert.deepStrictEqual(result.coverageSummary.tracking,{eligiblePlayers:1,knownPlayers:1,minPct:100,avgPct:100,maxPct:100});
assert.deepStrictEqual(result.coverageSummary.pitchSpatial,{eligiblePlayers:1,knownPlayers:1,minPct:0,avgPct:0,maxPct:0});
assert.deepStrictEqual(result.coverageSummary.physicalMetric,{eligiblePlayers:1,knownPlayers:1,minPct:100,avgPct:100,maxPct:100});

console.log('first results coverage summary non-regression: PASS');
