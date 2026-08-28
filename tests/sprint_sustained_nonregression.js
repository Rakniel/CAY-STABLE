'use strict';
const assert=require('assert');
const Stats=require('../player_stats_v1.js');

const projectors={0:{validated:true,source:'test_identity',confidence:1,project:p=>({x:p.x,y:p.y})},1:{validated:true,source:'test_identity',confidence:1,project:p=>({x:p.x,y:p.y})}};
const track=(pts)=>({fullPath:pts.map(([time,x,segment=0])=>({time,x,y:0,segment}))});

// ~25.2 km/h for only 0.5 s: must not be counted as a sprint.
let out=Stats.metricForTrack(track([[0,0],[0.5,3.5]]),projectors);
assert.strictEqual(out.sprintCount,0,'single short speed spike must not count as sprint');
assert.strictEqual(out.minSprintSeconds,1);
assert.strictEqual(out.sprintThresholdKmh,25);

// ~25.2 km/h sustained for 1.0 s: exactly one sprint episode.
out=Stats.metricForTrack(track([[0,0],[0.5,3.5],[1.0,7.0],[1.5,10.5]]),projectors);
assert.strictEqual(out.sprintCount,1,'continuous >=25 km/h evidence for >=1 s must count once');

// Two sustained episodes separated by a below-threshold interval.
out=Stats.metricForTrack(track([
  [0,0],[0.5,3.5],[1.0,7.0],
  [1.5,8.0],
  [2.0,11.5],[2.5,15.0]
]),projectors);
assert.strictEqual(out.sprintCount,2,'two sustained sprint episodes must count twice');

// A camera/metric segment cut must break sprint continuity.
out=Stats.metricForTrack(track([[0,0,0],[0.5,3.5,0],[1.0,7.0,1],[1.5,10.5,1]]),projectors);
assert.strictEqual(out.sprintCount,0,'segment cut must reset accumulated sprint duration');

// A rejected implausible pair must also break continuity.
out=Stats.metricForTrack(track([[0,0],[0.5,3.5],[1.0,30],[1.5,33.5],[2.0,37]]),projectors);
assert.strictEqual(out.sprintCount,1,'rejected metric pair must not bridge two high-speed fragments');

console.log('sprint_sustained_nonregression: ok');
