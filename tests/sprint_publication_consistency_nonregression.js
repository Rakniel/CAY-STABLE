'use strict';
const assert=require('assert');
const Stats=require('../player_stats_v1.js');
const Guard=require('../metric_publication_guard_v1.js');

const projectors={0:{validated:true,source:'test_identity',confidence:1,project:p=>({x:p.x,y:p.y})}};
const track=pts=>({fullPath:pts.map(([time,x])=>({time,x,y:0,segment:0}))});

const source={...Stats.metricForTrack(track([[0,0],[0.5,3.5],[1,7],[1.5,10.5],[2,14],[2.5,17.5],[3,21],[3.5,24.5]]),projectors),defendableScore:.95,quality:'FIABLE'};
assert.strictEqual(source.sprintCount,1);
assert.strictEqual(source.sprintQualifiedSeconds,3.5);
assert.strictEqual(source.minSprintDurationSeconds,1);

const apply=overrides=>Guard.applyPublicationPolicy({...source,...overrides},{identityQuality:'FIABLE'});

let result=apply({});
assert.strictEqual(result.publication.fieldStatus.sprintCount.status,'FIABLE','consistent runtime sprint evidence must remain publishable');
assert.strictEqual(result.sprintCount,1);
assert.strictEqual(result.sprintQualifiedSeconds,3.5);

result=apply({sprintCount:0,sprintQualifiedSeconds:1});
assert.strictEqual(result.publication.fieldStatus.sprintCount.status,'INDISPONIBLE','positive qualified time with zero sprint must fail closed');
assert.strictEqual(result.sprintCount,null);
assert.strictEqual(result.sprintQualifiedSeconds,null);
assert.match(result.publication.fieldStatus.sprintCount.reason,/sans sprint/);
assert.strictEqual(result.publication.fieldStatus.distanceM.status,'FIABLE','sprint inconsistency must remain field-scoped');
assert.strictEqual(result.publication.fieldStatus.avgSpeedKmh.status,'FIABLE','sprint inconsistency must not hide valid speed');

result=apply({sprintCount:2,sprintQualifiedSeconds:1.5});
assert.strictEqual(result.publication.fieldStatus.sprintCount.status,'INDISPONIBLE','qualified duration shorter than count x minimum sprint duration must fail closed');
assert.match(result.publication.fieldStatus.sprintCount.reason,/insuffisante/);

result=apply({sprintCount:1,sprintQualifiedSeconds:source.metricCoveredSeconds+0.5});
assert.strictEqual(result.publication.fieldStatus.sprintQualifiedSeconds.status,'INDISPONIBLE','qualified sprint time cannot exceed validated metric coverage');
assert.match(result.publication.fieldStatus.sprintQualifiedSeconds.reason,/supérieure au temps métrique couvert/);

result=apply({sprintCount:2,sprintQualifiedSeconds:2,metricCoveredSeconds:3.5});
assert.strictEqual(result.publication.fieldStatus.sprintCount.status,'FIABLE','exact count x minimum-duration evidence remains structurally consistent');

assert.strictEqual(Guard.SPRINT_EVIDENCE_TOLERANCE_SECONDS,0.001,'rounding tolerance must be explicit and auditable');

console.log('sprint publication consistency non-regression: PASS');
