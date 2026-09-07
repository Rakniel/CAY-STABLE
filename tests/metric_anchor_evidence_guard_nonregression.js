const assert=require('assert');
const Guard=require('../metric_anchor_evidence_guard_v1.js');
const Quality=require('../metric_quality_guard_v1.js');
const Heatmap=require('../metric_pitch_heatmap_v1.js');

const projector={validated:true,confidence:.95,project:p=>({x:Number(p.x)*105,y:Number(p.y)*68})};
const projectors={0:projector};
const point=(time,x,anchorKind,sourceTrackId)=>({time,segment:0,x,y:.5,anchorKind,sourceTrackId});

const good={cat:'team',fullPath:[point(0,.2,'bbox_bottom_center',7),point(1,.25,'bbox_bottom_center',7)]};
const bad={cat:'team',fullPath:[point(0,.2,'bbox_center',7),point(1,.25,'bbox_center',7)]};
const missing={cat:'team',fullPath:[point(0,.2,null,7),point(1,.25,null,7)]};
const legacy={cat:'team',fullPath:[point(0,.2,null,null),point(1,.25,null,null)]};

assert.strictEqual(Guard.evaluatePoint(good.fullPath[0],'person').eligible,true);
assert.strictEqual(Guard.evaluatePoint(bad.fullPath[0],'person').eligible,false);
assert.strictEqual(Guard.evaluatePoint(missing.fullPath[0],'person').reason,'EXTERNAL_ANCHOR_KIND_REQUIRED');
assert.strictEqual(Guard.evaluatePoint(legacy.fullPath[0],'person').eligible,true);

const goodMetric=Quality.robustMetricForTrack(good,projectors);
assert.strictEqual(goodMetric.metricCoverage,1);
assert.ok(goodMetric.distanceM>0);
assert.strictEqual(goodMetric.anchorEvidence.acceptedExplicitObservations,2);

const badMetric=Quality.robustMetricForTrack(bad,projectors);
assert.strictEqual(badMetric.metricCoverage,0);
assert.strictEqual(badMetric.distanceM,null);
assert.strictEqual(badMetric.anchorEvidence.rejectedExplicitObservations,2);

const missingMetric=Quality.robustMetricForTrack(missing,projectors);
assert.strictEqual(missingMetric.metricCoverage,0);
assert.strictEqual(missingMetric.anchorEvidence.rejectedMissingExternalAnchorObservations,2);

const legacyMetric=Quality.robustMetricForTrack(legacy,projectors);
assert.strictEqual(legacyMetric.metricCoverage,1);
assert.strictEqual(legacyMetric.anchorEvidence.legacyUnspecifiedObservations,2);

const goodHeatmap=Heatmap.build(good,projectors,{minMetricCoverage:.1,minTemporalCoverage:.1,minCalibrationConfidence:.5});
assert.strictEqual(goodHeatmap.status,'DISPONIBLE');
assert.strictEqual(goodHeatmap.anchorEvidence.acceptedExplicitObservations,2);
const badHeatmap=Heatmap.build(bad,projectors,{minMetricCoverage:.1,minTemporalCoverage:.1,minCalibrationConfidence:.5});
assert.strictEqual(badHeatmap.status,'INDISPONIBLE');
assert.strictEqual(badHeatmap.anchorEvidence.rejectedExplicitObservations,2);

console.log('metric_anchor_evidence_guard_nonregression: PASS');
