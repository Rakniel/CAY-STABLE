'use strict';
const assert=require('assert');
const Stats=require('../player_stats_v1.js');

const path=[
  {x:0,y:0,time:0,segment:1},
  {x:.01,y:0,time:.5,segment:1},
  {x:.02,y:0,time:1,segment:1}
];
const project=p=>({x:p.x*100,y:p.y*68});
const track={fullPath:path};

const missing=Stats.metricForTrack(track,{1:{validated:true,source:'test',project}});
assert.equal(missing.metricCoverage,0,'missing calibration confidence must fail closed for distance/speed/sprints');
assert.equal(missing.distanceM,null);
assert.equal(missing.avgSpeedKmh,null);
assert.equal(missing.maxSpeedKmh,null);
assert.equal(missing.sprintCount,null);
assert.equal(missing.quality,'INDISPONIBLE');

const low=Stats.metricForTrack(track,{1:{validated:true,source:'test',confidence:.49,project}});
assert.equal(low.metricCoverage,0,'confidence below the defensible threshold must fail closed');
assert.equal(low.distanceM,null);

const boundary=Stats.metricForTrack(track,{1:{validated:true,source:'test',confidence:.5,project}});
assert.equal(boundary.metricCoverage,1,'the explicit threshold boundary remains eligible');
assert.equal(boundary.distanceM,2);
assert.ok(boundary.avgSpeedKmh>0);
assert.equal(boundary.quality,'FIABLE');

const high=Stats.metricForTrack(track,{1:{validated:true,source:'test',confidence:.9,project}});
assert.equal(high.metricCoverage,1);
assert.equal(high.distanceM,2);

const base={tracks:[{id:1,dataQuality:{identity:'FIABLE'}}]};
const coreState={archive:[],active:[{globalId:1,cayIdentityConfirmed:true,fullPath:path}]};
const missingTimeline=Stats.buildInstantTeamTimeline(coreState,base,{1:{validated:true,source:'test',project}});
assert.equal(missingTimeline.metricCoverage,0,'team metric coverage must not claim a structurally valid projector without confidence evidence');
assert.ok(missingTimeline.frames.every(f=>f.metricProjectionValidated===false));
assert.ok(missingTimeline.frames.every(f=>f.metricQuality==='INDISPONIBLE'));

const highTimeline=Stats.buildInstantTeamTimeline(coreState,base,{1:{validated:true,source:'test',confidence:.9,project}});
assert.equal(highTimeline.metricCoverage,1);
assert.ok(highTimeline.frames.every(f=>f.metricProjectionValidated===true));

const parsed=Stats.projectorInfo({validated:true,source:'test',project});
assert.equal(parsed.validated,true,'structural projector validation stays distinct from metric publication eligibility');
assert.equal(parsed.confidence,null);
const gated=Stats.metricProjectorInfo({validated:true,source:'test',project});
assert.equal(gated.metricEligible,false);
assert.match(gated.reason,/confiance calibration indisponible/i);

console.log('player_stats_metric_confidence_gate_nonregression: PASS');
