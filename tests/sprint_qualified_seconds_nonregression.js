'use strict';
const assert=require('assert');
const Stats=require('../player_stats_v1.js');
const Guard=require('../metric_publication_guard_v1.js');

const projectors={
  0:{validated:true,source:'test_identity',confidence:1,project:p=>({x:p.x,y:p.y})},
  1:{validated:true,source:'test_identity',confidence:1,project:p=>({x:p.x,y:p.y})}
};
const track=pts=>({fullPath:pts.map(([time,x,segment=0])=>({time,x,y:0,segment}))});

let metric=Stats.metricForTrack(track([[0,0],[0.5,3.5]]),projectors);
assert.strictEqual(metric.sprintCount,0,'a sub-second speed spike must not become a sprint');
assert.strictEqual(metric.sprintQualifiedSeconds,0,'unqualified sprint fragments must contribute zero qualified seconds');

metric=Stats.metricForTrack(track([[0,0],[0.5,3.5],[1.0,7.0],[1.5,10.5]]),projectors);
assert.strictEqual(metric.sprintCount,1,'one continuous >=25 km/h episode lasting >=1s must count once');
assert.strictEqual(metric.sprintQualifiedSeconds,1.5,'once qualified, the full sustained episode duration must be retained');

metric=Stats.metricForTrack(track([[0,0],[0.5,3.5],[1.0,7.0],[1.5,8.0],[2.0,11.5],[2.5,15.0]]),projectors);
assert.strictEqual(metric.sprintCount,2,'two qualified episodes separated below threshold must remain distinct');
assert.strictEqual(metric.sprintQualifiedSeconds,2,'qualified seconds must sum only the two sustained episodes');

metric=Stats.metricForTrack(track([[0,0,0],[0.5,3.5,0],[1.0,7.0,1],[1.5,10.5,1]]),projectors);
assert.strictEqual(metric.sprintCount,0,'segment cuts must break sprint qualification');
assert.strictEqual(metric.sprintQualifiedSeconds,0,'segment cuts must not bridge qualified seconds');

const publishable={...Stats.metricForTrack(track([[0,0],[0.5,3.5],[1.0,7.0],[1.5,10.5],[2.0,14.0],[2.5,17.5],[3.0,21.0]]),projectors),defendableScore:.95,quality:'FIABLE'};
const published=Guard.applyPublicationPolicy(publishable,{identityQuality:'FIABLE'});
assert.strictEqual(published.publication.fieldStatus.sprintCount.status,'FIABLE','runtime-generated sustained sprint evidence must pass the existing publication guard');
assert.strictEqual(published.sprintCount,1);
assert.strictEqual(published.sprintQualifiedSeconds,3);

console.log('sprint qualified seconds non-regression: PASS');
