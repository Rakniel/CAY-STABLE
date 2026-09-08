'use strict';
const assert=require('assert');
const Pipeline=require('../roster_metric_pipeline_v1.js');

function trajectoryOnlyWindow(index,{pitchLengthM=105,pitchWidthM=68,x=10}={}){
  return {
    index,
    startMs:index*1000,
    endMs:index*1000+1000,
    spatial:{
      status:'INDISPONIBLE',
      reason:'couverture temporelle insuffisante pour une heatmap terrain défendable',
      coordinateSystem:'PITCH_METERS',
      pitchLengthM,
      pitchWidthM,
      rows:4,
      cols:6,
      observations:2,
      cells:Array.from({length:4},()=>Array(6).fill(0)),
      timeCells:Array.from({length:4},()=>Array(6).fill(0)),
      trajectory:{
        status:'DISPONIBLE',
        coordinateSystem:'PITCH_METERS',
        runs:[[
          {time:index,x,y:20,segment:0,calibrationConfidence:.95},
          {time:index+.5,x:x+1,y:20,segment:0,calibrationConfidence:.95}
        ]]
      }
    }
  };
}

const trajectoryOnly=Pipeline.summarizeSpatial([trajectoryOnlyWindow(0)]);
assert.strictEqual(trajectoryOnly.status,'FIABLE','a defendable pitch trajectory must remain publishable when heatmap evidence is insufficient');
assert.strictEqual(trajectoryOnly.heatmap,null,'trajectory evidence must never fabricate a heatmap');
assert.strictEqual(trajectoryOnly.heatmaps.length,0,'heatmap-ineligible windows must stay out of heatmap aggregation');
assert.strictEqual(trajectoryOnly.trajectory.status,'FIABLE');
assert.strictEqual(trajectoryOnly.trajectory.runs.length,1);
assert.deepStrictEqual(trajectoryOnly.trajectory.sourceWindowIndexes,[0]);
assert.strictEqual(trajectoryOnly.geometry.pitchLengthM,105);
assert.match(trajectoryOnly.policy,/TRAJECTORY_AND_HEATMAP_AVAILABILITY_ARE_INDEPENDENT/);

const mixedGeometry=Pipeline.summarizeSpatial([
  trajectoryOnlyWindow(0,{pitchLengthM:100,pitchWidthM:64,x:5}),
  trajectoryOnlyWindow(1,{pitchLengthM:105,pitchWidthM:68,x:20}),
  trajectoryOnlyWindow(2,{pitchLengthM:105,pitchWidthM:68,x:30})
]);
assert.strictEqual(mixedGeometry.status,'PARTIEL');
assert.strictEqual(mixedGeometry.coherentWindowCount,2);
assert.strictEqual(mixedGeometry.excludedGeometryWindowCount,1);
assert.strictEqual(mixedGeometry.heatmap,null);
assert.deepStrictEqual(mixedGeometry.trajectory.sourceWindowIndexes,[1,2]);
assert.ok(!mixedGeometry.trajectory.runs.flatMap(run=>run.points).some(point=>point.x===5),'incompatible pitch geometry must still be excluded');

const diagnosticOnly=Pipeline.summarizeSpatial([{
  index:0,startMs:0,endMs:1000,spatial:{
    status:'INDISPONIBLE',coordinateSystem:'PITCH_METERS',pitchLengthM:105,pitchWidthM:68,rows:4,cols:6,observations:2,
    trajectory:{status:'INDISPONIBLE',runs:[]}
  }
}]);
assert.strictEqual(diagnosticOnly.status,'INDISPONIBLE','diagnostic coordinates without a defendable trajectory remain unavailable');
assert.strictEqual(diagnosticOnly.trajectory.runs.length,0);
assert.strictEqual(diagnosticOnly.heatmap,null);

console.log('roster_metric_trajectory_first_results_nonregression: PASS');
