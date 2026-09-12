'use strict';
const assert=require('assert');
const Gate=require('../first_results_testability_gate_v1.js');

const card=(id,firstResults,extra={})=>({id,firstResults,...extra});
const trackingOnly=card('A',{tracking:true,trajectory:false,heatmap:false,distance:false,avgSpeed:false,maxSpeed:false,sprints:false,physicalMetrics:false});
const visualReady=card('B',{tracking:true,trajectory:true,heatmap:true,distance:false,avgSpeed:false,maxSpeed:false,sprints:false,physicalMetrics:false});
const partialPhysical=card('C',{tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:false,sprints:false,physicalMetrics:true});
const fullPhysical=card('D',{tracking:true,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true,physicalMetrics:true,physicalMetricsComplete:true},{presence:{trackingCoverage:87},pitchVisuals:{spatialCoverage:72,physicalMetricCoverage:61,spatialCoverageBasis:'TEMPORAL_SECONDS',participationSeconds:100,renderedSeconds:72}});

let result=Gate.evaluate({players:[]});
assert.strictEqual(result.version,'CAY_FIRST_RESULTS_TESTABILITY_GATE_V1_5');
assert.strictEqual(result.status,'INDISPONIBLE');
assert.strictEqual(result.coreTestable,false);
assert.strictEqual(result.physicalTestable,false);
assert.strictEqual(result.nextAction,'OBTENIR_TRACKING_DEFENDABLE');

result=Gate.evaluate({players:[trackingOnly]});
assert.strictEqual(result.status,'TRACKING_TESTABLE');
assert.strictEqual(result.withTracking,1);
assert.strictEqual(result.withCorePitchVisuals,0,'tracking alone must never become a pitch-result test gate');
assert.strictEqual(result.metricReadyPlayers,0);
assert.strictEqual(result.evidence[0].status,'TRACKING_TESTABLE');
assert.deepStrictEqual(result.evidence[0].missingPitchVisualCore,['trajectory','heatmap']);
assert.deepStrictEqual(result.evidence[0].missingPhysicalMetrics,['distance','avgSpeed','maxSpeed','sprints']);
assert.strictEqual(result.evidence[0].nextAction,'DEBLOQUER_VISUELS_TERRAIN:trajectory,heatmap');
assert.deepStrictEqual(result.evidence[0].coverage,{trackingPct:null,pitchSpatialPct:null,physicalMetricPct:null,pitchBasis:null,participationSeconds:null,renderedSeconds:null,policy:'COUVERTURES_REPRISES_EN_LECTURE_SEULE_DEPUIS_LA_FICHE_JOUEUR; AUCUNE_PROMOTION_DE_STATUT_PAR_LA_COUVERTURE_SEULE'});
assert.deepStrictEqual(result.blockers,{tracking:0,trajectory:1,heatmap:1,distance:1,avgSpeed:1,maxSpeed:1,sprints:1});
assert.strictEqual(result.nextAction,'DEBLOQUER_VISUELS_TERRAIN:trajectory,heatmap');

result=Gate.evaluate({players:[trackingOnly,visualReady]});
assert.strictEqual(result.status,'PITCH_VISUAL_TESTABLE');
assert.strictEqual(result.withCorePitchVisuals,1);
assert.strictEqual(result.coreTestable,true);
assert.strictEqual(result.physicalTestable,false);
assert.strictEqual(result.evidence[1].status,'PITCH_VISUAL_TESTABLE');
assert.strictEqual(result.evidence[1].nextAction,'COMPLETER_METRIQUES_PHYSIQUES:distance,avgSpeed,maxSpeed,sprints');
assert.strictEqual(result.blockers.tracking,0);
assert.strictEqual(result.blockers.trajectory,1);
assert.strictEqual(result.blockers.heatmap,1);
assert.strictEqual(result.blockers.distance,2);
assert.strictEqual(result.nextAction,'COMPLETER_METRIQUES_PHYSIQUES:distance,avgSpeed,maxSpeed,sprints');

result=Gate.evaluate({players:[partialPhysical]});
assert.strictEqual(result.status,'PITCH_VISUAL_TESTABLE','partial physical evidence must not promote the 4/4 physical gate');
assert.strictEqual(result.withAnyPhysicalMetrics,1);
assert.strictEqual(result.withCompletePhysicalMetrics,0);
assert.strictEqual(result.metricReadyPlayers,0);
assert.deepStrictEqual(result.evidence[0].missingPhysicalMetrics,['maxSpeed','sprints']);
assert.strictEqual(result.evidence[0].nextAction,'COMPLETER_METRIQUES_PHYSIQUES:maxSpeed,sprints');
assert.strictEqual(result.nextAction,'COMPLETER_METRIQUES_PHYSIQUES:maxSpeed,sprints');

result=Gate.evaluate({players:[fullPhysical]});
assert.strictEqual(result.status,'PHYSICAL_TESTABLE');
assert.strictEqual(result.withCompletePhysicalMetrics,1);
assert.strictEqual(result.metricReadyPlayers,1);
assert.strictEqual(result.physicalTestable,true);
assert.strictEqual(result.evidence[0].status,'PHYSICAL_TESTABLE');
assert.deepStrictEqual(result.evidence[0].missingPitchVisualCore,[]);
assert.deepStrictEqual(result.evidence[0].missingPhysicalMetrics,[]);
assert.deepStrictEqual(result.evidence[0].coverage,{trackingPct:87,pitchSpatialPct:72,physicalMetricPct:61,pitchBasis:'TEMPORAL_SECONDS',participationSeconds:100,renderedSeconds:72,policy:'COUVERTURES_REPRISES_EN_LECTURE_SEULE_DEPUIS_LA_FICHE_JOUEUR; AUCUNE_PROMOTION_DE_STATUT_PAR_LA_COUVERTURE_SEULE'});
assert.strictEqual(result.evidence[0].nextAction,'PREMIERS_RESULTATS_PRETS');
assert.strictEqual(result.nextAction,'PREMIERS_RESULTATS_PRETS');

const clamped=Gate.coverageEvidence({presence:{trackingCoverage:120},pitchVisuals:{spatialCoverage:-5,physicalMetricCoverage:'50'}});
assert.strictEqual(clamped.trackingPct,100);
assert.strictEqual(clamped.pitchSpatialPct,0);
assert.strictEqual(clamped.physicalMetricPct,50);

result=Gate.evaluate({players:[visualReady,fullPhysical]},{minCorePlayers:2,minMetricPlayers:2});
assert.strictEqual(result.coreTestable,true,'explicit core threshold must count only complete tracking+trajectory+heatmap players');
assert.strictEqual(result.physicalTestable,false,'metric threshold must count only players that also have the complete visual core');
assert.strictEqual(result.status,'PITCH_VISUAL_TESTABLE');

const contradictory=Gate.cardEvidence(card('E',{tracking:false,trajectory:true,heatmap:true,distance:true,avgSpeed:true,maxSpeed:true,sprints:true,physicalMetrics:true,physicalMetricsComplete:true},{presence:{trackingCoverage:99},pitchVisuals:{spatialCoverage:99,physicalMetricCoverage:99}}));
assert.strictEqual(contradictory.physicalComplete,true,'existing evidence may report complete metrics');
assert.strictEqual(contradictory.metricReady,false,'the testability gate must still require tracking + trajectory + heatmap');
assert.strictEqual(contradictory.status,'INDISPONIBLE');
assert.strictEqual(contradictory.nextAction,'OBTENIR_TRACKING_DEFENDABLE');
assert.deepStrictEqual(contradictory.missingPitchVisualCore,['tracking']);
assert.strictEqual(contradictory.coverage.pitchSpatialPct,99,'coverage must remain audit evidence, never promote readiness');

console.log('first results testability gate non-regression: PASS');
