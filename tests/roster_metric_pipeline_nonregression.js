const assert=require('assert');
const Domain=require('../app_domain_models_v1.js');
const Binding=require('../track_roster_binding_v1.js');
const Pipeline=require('../roster_metric_pipeline_v1.js');

const roster=Array.from({length:12},(_,i)=>({id:`p${i+1}`,name:`Joueur ${i+1}`,status:'ACTIVE'}));
const team=Domain.createTeam({id:'cay-seniors',name:'C.A. Yenne Seniors',roster,defaultLineup:roster.slice(0,11).map(p=>p.id),bench:[roster[11].id]});
let match=Domain.createMatchState(team,{activePlayerIds:team.defaultLineup,benchPlayerIds:team.bench});
match=Domain.applySubstitution(team,match,{outPlayerId:'p1',inPlayerId:'p12',atMs:30000,reason:'TACTICAL'});
const participation=Domain.deriveParticipationWindows(team,match,60000);

const projectors={0:{validated:true,confidence:.95,source:'TEST_METRIC',project:p=>({x:p.x,y:p.y})}};
let bindings=Binding.createState();
bindings=Binding.bind(bindings,{trackId:'t1',playerId:'p1',source:'MANUAL',confidence:.99,confirmed:true,atMs:0});
bindings=Binding.bind(bindings,{trackId:'t12',playerId:'p12',source:'REID_FUSED',confidence:.9,confirmed:true,atMs:30000,evidence:['appearance-gallery','shirt-number-12']});

const starterTrack={globalId:'t1',fullPath:[
  {time:0,segment:0,x:0,y:0},{time:1,segment:0,x:1,y:0},{time:2,segment:0,x:2,y:0},{time:29,segment:0,x:3,y:0},
  {time:31,segment:0,x:30,y:0},{time:32,segment:0,x:31,y:0}
]};
const starter=Pipeline.build({trackId:'t1',trackRaw:starterTrack,bindingState:bindings,participation,projectors});
assert.strictEqual(starter.status,'FIABLE');
assert.strictEqual(starter.playerId,'p1');
assert.strictEqual(starter.participation.acceptedObservations,4);
assert.strictEqual(starter.participation.rejectedObservations,2);
assert.strictEqual(starter.windows.length,1);
assert.strictEqual(starter.metric.distanceM,2);
assert.strictEqual(starter.metric.metricCoveredSeconds,2);
assert.strictEqual(starter.metric.participationWindowCount,1);
assert.strictEqual(starter.spatial.status,'FIABLE');
assert.strictEqual(starter.spatial.projectedObservations,4);
assert.strictEqual(starter.spatial.heatmaps.length,1);
assert.strictEqual(starter.spatial.heatmaps[0].observations,4);
assert.strictEqual(starter.spatial.coherentWindowCount,1);
assert.strictEqual(starter.spatial.excludedGeometryWindowCount,0);
assert.deepStrictEqual(starter.spatial.heatmap.sourceWindowIndexes,[0]);
assert.ok(starter.spatial.trajectory.runs.flatMap(run=>run.points).every(point=>point.time<=29));
assert.ok(starter.spatial.trajectory.runs.flatMap(run=>run.points).every(point=>point.x<=3));

const subTrack={globalId:'t12',fullPath:[
  {time:29,segment:0,x:0,y:0},{time:30,segment:0,x:10,y:0},{time:31,segment:0,x:11,y:0},{time:32,segment:0,x:12,y:0}
]};
const substitute=Pipeline.build({trackId:'t12',trackRaw:subTrack,bindingState:bindings,participation,projectors});
assert.strictEqual(substitute.status,'FIABLE');
assert.strictEqual(substitute.playerId,'p12');
assert.strictEqual(substitute.participation.acceptedObservations,3);
assert.strictEqual(substitute.participation.rejectedObservations,1);
assert.strictEqual(substitute.metric.distanceM,2);
assert.strictEqual(substitute.spatial.status,'FIABLE');
assert.strictEqual(substitute.spatial.projectedObservations,3);
assert.ok(substitute.spatial.trajectory.runs.flatMap(run=>run.points).every(point=>point.time>=30));
assert.ok(substitute.spatial.trajectory.runs.flatMap(run=>run.points).every(point=>point.x>=10));

const unknown=Pipeline.build({trackId:'missing',trackRaw:starterTrack,bindingState:bindings,participation,projectors});
assert.strictEqual(unknown.status,'INDISPONIBLE');
assert.strictEqual(unknown.metric,null);
assert.strictEqual(unknown.spatial,null);

let weak={bindings:[{trackId:'weak',playerId:'p2',source:'MANUAL',confidence:.7,confirmed:true}]};
const weakResult=Pipeline.build({trackId:'weak',trackRaw:starterTrack,bindingState:weak,participation,projectors});
assert.strictEqual(weakResult.status,'INDISPONIBLE');
assert.strictEqual(weakResult.metric,null);
assert.strictEqual(weakResult.spatial,null);

const noMetric=Pipeline.build({trackId:'t1',trackRaw:starterTrack,bindingState:bindings,participation,projectors:{}});
assert.strictEqual(noMetric.status,'INDISPONIBLE');
assert.strictEqual(noMetric.metric.distanceM,null);
assert.strictEqual(noMetric.spatial.status,'INDISPONIBLE');

const spatialOnly=Pipeline.build({
  trackId:'t1',trackRaw:starterTrack,bindingState:bindings,participation,projectors,
  heatmapOptions:{minMetricCoverage:.5,minCalibrationConfidence:.5,maxDwellGapSec:1}
});
assert.strictEqual(spatialOnly.spatial.status,'FIABLE');
assert.strictEqual(spatialOnly.spatial.trajectory.policy,'AUCUN_RACCORDEMENT_ENTRE_FENETRES_DE_PARTICIPATION_ET_AUCUN_MELANGE_DE_GEOMETRIES_TERRAIN');

function spatialWindow(index,pitchLengthM,pitchWidthM,x,timeValue){
  return {index,startMs:index*10000,endMs:index*10000+9000,spatial:{
    status:'DISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM,pitchWidthM,rows:2,cols:2,observations:1,
    cells:[[1,0],[0,0]],timeCells:[[timeValue,0],[0,0]],normalizedCells:[[1,0],[0,0]],
    trajectory:{runs:[[{x,y:20,time:index*10,segment:index}]]},metricCoverage:1,temporalCoverage:1,quality:'FIABLE'
  }};
}
const mixed=Pipeline.summarizeSpatial([
  spatialWindow(0,100,64,90,9),
  spatialWindow(1,105,68,11,1),
  spatialWindow(2,105,68,41,2)
]);
assert.strictEqual(mixed.status,'PARTIEL','mixed pitch geometries must never be published as fully reliable');
assert.strictEqual(mixed.availableWindowCount,3);
assert.strictEqual(mixed.coherentWindowCount,2);
assert.strictEqual(mixed.renderedWindowCount,2);
assert.strictEqual(mixed.excludedGeometryWindowCount,1);
assert.strictEqual(mixed.geometry.pitchLengthM,105);
assert.strictEqual(mixed.geometry.pitchWidthM,68);
assert.deepStrictEqual(mixed.geometry.sourceWindowIndexes,[1,2]);
assert.deepStrictEqual(mixed.heatmap.sourceWindowIndexes,[1,2]);
assert.deepStrictEqual(mixed.heatmap.cells,[[3,0],[0,0]],'only the dominant coherent geometry may contribute to the merged heatmap');
assert.deepStrictEqual(mixed.trajectory.sourceWindowIndexes,[1,2]);
assert.strictEqual(mixed.trajectory.runs.length,2);
assert.ok(!mixed.trajectory.runs.flatMap(run=>run.points).some(point=>point.x===90),'incompatible geometry trajectory must be excluded in the shared pipeline');
assert.match(mixed.coverageNote,/géométrie est incompatible/i);

const missingGeometry=Pipeline.summarizeSpatial([{index:0,startMs:0,endMs:1000,spatial:{status:'DISPONIBLE',trajectory:{runs:[[{x:1,y:1,time:0}]]},cells:[[1]],timeCells:[[1]],rows:1,cols:1}}]);
assert.strictEqual(missingGeometry.status,'INDISPONIBLE','pitch dimensions are required before spatial publication');
assert.strictEqual(missingGeometry.heatmap,null);
assert.strictEqual(missingGeometry.trajectory.runs.length,0);

console.log('roster_metric_pipeline_nonregression: ok');
