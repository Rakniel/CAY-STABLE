'use strict';
const assert=require('assert');
const Domain=require('../app_domain_models_v1.js');
const TrackBinding=require('../track_roster_binding_v1.js');
const CardBinding=require('../player_card_roster_binding_v1.js');
const VM=require('../player_card_view_model_v1.js');

const roster=Array.from({length:12},(_,i)=>({id:`p${i+1}`,name:`Joueur ${i+1}`,status:'ACTIVE'}));
const team=Domain.createTeam({id:'cay-seniors',name:'C.A. Yenne Seniors',roster,defaultLineup:roster.slice(0,11).map(p=>p.id),bench:['p12']});
let match=Domain.createMatchState(team,{activePlayerIds:team.defaultLineup,benchPlayerIds:team.bench});
match=Domain.applySubstitution(team,match,{outPlayerId:'p1',inPlayerId:'p12',atMs:30000,reason:'TACTICAL'});
const participation=Domain.deriveParticipationWindows(team,match,60000);
const projectors={0:{validated:true,confidence:.95,source:'TEST_METRIC',project:p=>({x:p.x,y:p.y})}};

let bindingState=TrackBinding.createState();
bindingState=TrackBinding.bind(bindingState,{trackId:'t1',playerId:'p1',source:'MANUAL',confidence:.99,confirmed:true,atMs:0});

const track={globalId:'t1',fullPath:[
  {time:0,segment:0,x:0,y:0},{time:1,segment:0,x:1,y:0},{time:2,segment:0,x:2,y:0},{time:29,segment:0,x:3,y:0},
  {time:31,segment:0,x:30,y:0},{time:32,segment:0,x:31,y:0}
]};
const report={players:[{id:'t1',cat:'CAY',identityQuality:'FIABLE',identityConfidence:.99,metric:{metricCoverage:1,distanceM:9999,avgSpeedKmh:99,maxSpeedKmh:99,sprintCount:99,quality:'FIABLE'},quality:{metricDistance:'FIABLE',metricSpeed:'FIABLE',sprints:'FIABLE'}}]};
const state={active:[track],archive:[]};

const attached=CardBinding.attachRosterMetrics(report,state,projectors,{bindingState,participation,timeScaleMs:1000});
assert.strictEqual(attached.players[0].metric.rosterBound,true);
assert.strictEqual(attached.players[0].metric.source,'ROSTER_METRIC_PIPELINE_V1');
assert.strictEqual(attached.players[0].metric.distanceM,null,'2 s of evidence must stay unavailable in the player card metric contract');
assert.strictEqual(attached.players[0].metric.diagnosticPhysicalMetrics.distanceM,2,'post-substitution observations must not inflate the auditable starter distance');
assert.strictEqual(attached.players[0].metric.publication.status,'INDISPONIBLE');
assert.strictEqual(attached.players[0].rosterMetric.participation.acceptedObservations,4);
assert.strictEqual(attached.players[0].rosterMetric.participation.rejectedObservations,2);
assert.strictEqual(attached.rosterMetricRuntime.status,'INDISPONIBLE');
assert.strictEqual(attached.rosterMetricRuntime.publishablePlayers,0);
assert.strictEqual(attached.rosterMetricRuntime.reliablePlayers,0);
assert.strictEqual(attached.rosterMetricRuntime.spatiallyAvailablePlayers,1,'pitch visuals may remain available even when physical metrics are not publishable');

const card=VM.buildCard(attached.players[0]);
assert.strictEqual(card.metrics.distanceM.status,'INDISPONIBLE');
assert.strictEqual(card.metrics.distanceM.value,null);
assert.strictEqual(card.pitchVisuals.status,'DISPONIBLE','trajectory/heatmap availability stays independent from physical metric publication');

const noContext=CardBinding.attachRosterMetrics(report,state,projectors,null);
assert.strictEqual(noContext.players[0].metric.distanceM,9999,'diagnostic report must remain untouched when no roster context is requested');
const unsafeCard=VM.buildCard(noContext.players[0]);
assert.strictEqual(unsafeCard.metrics.distanceM.status,'INDISPONIBLE','player card must fail closed without roster-bound evidence');

const missingBinding=CardBinding.attachRosterMetrics(report,state,projectors,{bindingState:TrackBinding.createState(),participation});
assert.strictEqual(missingBinding.players[0].metric.quality,'INDISPONIBLE');
assert.strictEqual(missingBinding.players[0].metric.distanceM,null);
assert.strictEqual(VM.buildCard(missingBinding.players[0]).metrics.distanceM.status,'INDISPONIBLE');

console.log('player card roster metric runtime non-regression: PASS');
