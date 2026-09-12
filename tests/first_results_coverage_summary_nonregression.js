'use strict';
const assert=require('assert');
const Gate=require('../first_results_testability_gate_v1.js');

const card=(id,firstResults,extra={})=>({id,firstResults,...extra});
const trackingOnly=card('A',{tracking:true,trajectory:false,heatmap:false,distance:false,avgSpeed:false,maxSpeed:false,sprints:false,physicalMetrics:false},{presence:{trackingCoverage:80},pitchVisuals:{participationSeconds:20}});
const physicalReady=card('B',{tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true,physicalMetrics:true,physicalMetricsComplete:true},{presence:{trackingCoverage:90},pitchVisuals:{spatialCoverage:75,physicalMetricCoverage:60,spatialCoverageBasis:'TEMPORAL_SECONDS',participationSeconds:80,renderedSeconds:60}});
const unknownCoverage=card('C',{tracking:true,trajectory:false,heatmap:false,distance:false,avgSpeed:false,maxSpeed:false,sprints:false,physicalMetrics:false},{pitchVisuals:{participationSeconds:40}});

let result=Gate.evaluate({players:[trackingOnly,physicalReady]});
assert.strictEqual(result.version,'CAY_FIRST_RESULTS_TESTABILITY_GATE_V1_7');
assert.deepStrictEqual(result.coverageSummary.tracking,{eligiblePlayers:2,knownPlayers:2,unknownPlayers:0,knownPlayerSharePct:100,minPct:80,avgPct:85,maxPct:90,weightedAvgPct:88,durationKnownPlayers:2,durationUnknownPlayers:0,durationKnownPlayerSharePct:100,temporalWeightingComplete:true,eligibleParticipationSeconds:100,knownParticipationSeconds:100,knownParticipationSharePct:100});
assert.deepStrictEqual(result.coverageSummary.pitchSpatial,{eligiblePlayers:1,knownPlayers:1,unknownPlayers:0,knownPlayerSharePct:100,minPct:75,avgPct:75,maxPct:75,weightedAvgPct:75,durationKnownPlayers:1,durationUnknownPlayers:0,durationKnownPlayerSharePct:100,temporalWeightingComplete:true,eligibleParticipationSeconds:80,knownParticipationSeconds:80,knownParticipationSharePct:100});
assert.deepStrictEqual(result.coverageSummary.physicalMetric,{eligiblePlayers:1,knownPlayers:1,unknownPlayers:0,knownPlayerSharePct:100,minPct:60,avgPct:60,maxPct:60,weightedAvgPct:60,durationKnownPlayers:1,durationUnknownPlayers:0,durationKnownPlayerSharePct:100,temporalWeightingComplete:true,eligibleParticipationSeconds:80,knownParticipationSeconds:80,knownParticipationSharePct:100});
assert.match(result.coverageSummary.policy,/PONDEREE_PAR_TEMPS_DE_PARTICIPATION/);
assert.match(result.coverageSummary.policy,/COMPLETUDE_DES_DUREES_EXPOSEE_EXPLICITEMENT/);
assert.match(result.coverageSummary.policy,/AUCUN_SEUIL_DE_COUVERTURE_N_EST_INVENTE/);

result=Gate.evaluate({players:[trackingOnly,unknownCoverage]});
assert.deepStrictEqual(result.coverageSummary.tracking,{eligiblePlayers:2,knownPlayers:1,unknownPlayers:1,knownPlayerSharePct:50,minPct:80,avgPct:80,maxPct:80,weightedAvgPct:80,durationKnownPlayers:2,durationUnknownPlayers:0,durationKnownPlayerSharePct:100,temporalWeightingComplete:true,eligibleParticipationSeconds:60,knownParticipationSeconds:20,knownParticipationSharePct:33.33},'unknown player coverage must remain explicit and temporal support must show how much eligible participation is actually evidenced');
assert.strictEqual(result.status,'TRACKING_TESTABLE','coverage summary is audit-only and must not silently introduce a readiness threshold');

result=Gate.evaluate({players:[unknownCoverage]});
assert.deepStrictEqual(result.coverageSummary.tracking,{eligiblePlayers:1,knownPlayers:0,unknownPlayers:1,knownPlayerSharePct:0,minPct:null,avgPct:null,maxPct:null,weightedAvgPct:null,durationKnownPlayers:1,durationUnknownPlayers:0,durationKnownPlayerSharePct:100,temporalWeightingComplete:true,eligibleParticipationSeconds:40,knownParticipationSeconds:null,knownParticipationSharePct:0},'missing coverage must remain explicit instead of being invented as zero or 100%');
assert.deepStrictEqual(result.coverageSummary.pitchSpatial,{eligiblePlayers:0,knownPlayers:0,unknownPlayers:0,knownPlayerSharePct:null,minPct:null,avgPct:null,maxPct:null,weightedAvgPct:null,durationKnownPlayers:0,durationUnknownPlayers:0,durationKnownPlayerSharePct:null,temporalWeightingComplete:false,eligibleParticipationSeconds:null,knownParticipationSeconds:null,knownParticipationSharePct:null});
assert.deepStrictEqual(result.coverageSummary.physicalMetric,{eligiblePlayers:0,knownPlayers:0,unknownPlayers:0,knownPlayerSharePct:null,minPct:null,avgPct:null,maxPct:null,weightedAvgPct:null,durationKnownPlayers:0,durationUnknownPlayers:0,durationKnownPlayerSharePct:null,temporalWeightingComplete:false,eligibleParticipationSeconds:null,knownParticipationSeconds:null,knownParticipationSharePct:null});
assert.strictEqual(result.status,'TRACKING_TESTABLE');

const clampedReady=card('D',{tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true,physicalMetrics:true},{presence:{trackingCoverage:150},pitchVisuals:{spatialCoverage:-10,physicalMetricCoverage:125}});
result=Gate.evaluate({players:[clampedReady]});
assert.strictEqual(result.coverageSummary.tracking.minPct,100);
assert.strictEqual(result.coverageSummary.tracking.avgPct,100);
assert.strictEqual(result.coverageSummary.tracking.maxPct,100);
assert.strictEqual(result.coverageSummary.tracking.weightedAvgPct,null,'no participation duration means no temporal weighting is fabricated');
assert.strictEqual(result.coverageSummary.tracking.durationKnownPlayers,0);
assert.strictEqual(result.coverageSummary.tracking.durationUnknownPlayers,1);
assert.strictEqual(result.coverageSummary.tracking.temporalWeightingComplete,false);
assert.strictEqual(result.coverageSummary.tracking.knownParticipationSharePct,null);
assert.strictEqual(result.coverageSummary.pitchSpatial.avgPct,0);
assert.strictEqual(result.coverageSummary.physicalMetric.avgPct,100);

console.log('first results coverage summary non-regression: PASS');
