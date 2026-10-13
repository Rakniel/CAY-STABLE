'use strict';
const assert=require('node:assert/strict');
const Stats=require('../player_stats_v1.js');
const Quality=require('../metric_quality_guard_v1.js');
const Heat=require('../metric_pitch_heatmap_v1.js');
const Publication=require('../metric_publication_guard_v1.js');
const path=[{time:0,segment:1,x:.1,y:.1},{time:.5,segment:1,x:.105,y:.105},{time:1,segment:1,x:.11,y:.11}];
const track={fullPath:path};
const project=p=>({x:p.x*105,y:p.y*68});
const core={archive:[],active:[{globalId:42,cayIdentityConfirmed:true,fullPath:path}]};
const base={tracks:[{id:42,quality:'FIABLE'}]};
let checks=0;
for(const confidence of [true,false]){
 const p={validated:true,confidence,source:'test',project},projectors={1:p};
 assert.equal(Stats.projectorInfo(p).confidence,null,'boolean confidence must stay unknown');
 assert.equal(Stats.metricProjectorInfo(p).metricEligible,false,'boolean confidence must never authorize metric geometry');
 const team=Stats.buildInstantTeamTimeline(core,base,projectors);
 assert.equal(team.metricCoverage,0,'team metric coverage must fail closed');
 assert.equal(team.frames[0].metricProjectionValidated,false,'no frame may become metric validated');
 const metric=Quality.robustMetricForTrack(track,projectors);
 assert.equal(metric.avgCalibrationConfidence,0,'boolean confidence must not count toward metric evidence');
 assert.equal(metric.quality,'INDISPONIBLE','physical metric quality must be unavailable');
 assert.equal(Publication.publicationDecision(metric).publishable,false,'physical fields must not publish');
 assert.equal(Heat.build(track,projectors).status,'INDISPONIBLE','pitch heatmap must stay unavailable');
 checks+=8;
}
for(const confidence of [0,.49,.5,.8,1,'0.8']){
 const p={validated:true,confidence,source:'test',project},projectors={1:p};
 const eligible=Number(confidence)>=Stats.MIN_METRIC_CALIBRATION_CONFIDENCE;
 assert.equal(Stats.metricProjectorInfo(p).metricEligible,eligible,'canonical confidence threshold');
 assert.equal(Stats.buildInstantTeamTimeline(core,base,projectors).metricCoverage,eligible?1:0,'team coverage uses same threshold');
 assert.equal(Stats.projectorInfo(p).confidence,Number(confidence),'valid numeric confidence retained');
 checks+=3;
}
for(const confidence of [null,undefined,'','   ','nope',NaN,Infinity,-1,1.1]){
 const p={validated:true,confidence,source:'test',project};
 assert.equal(Stats.projectorInfo(p).confidence,null,'missing or invalid confidence stays unavailable');
 assert.equal(Stats.metricProjectorInfo(p).metricEligible,false,'invalid confidence cannot authorize metrics');
 checks+=2;
}
console.log('player_stats_boolean_calibration_confidence_nonregression: PASS ('+checks+' assertions)');
