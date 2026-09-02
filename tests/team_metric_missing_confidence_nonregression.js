'use strict';
const assert=require('assert');
const Guard=require('../metric_quality_guard_v1.js');

const report={
  teamTimeline:[
    {valid:true,presentCount:3,metricProjectionValidated:true,metricCalibrationConfidence:null},
    {valid:true,presentCount:2,metricProjectionValidated:true,metricCalibrationConfidence:.8},
    {valid:true,presentCount:1,metricProjectionValidated:false,metricCalibrationConfidence:1}
  ],
  teamCoverage:{},
  team:{}
};
Guard.patchTeamCalibrationEvidence(report);

assert.strictEqual(report.teamTimeline[0].metricEvidenceScore,0,'validated geometry without explicit confidence must not create team metric evidence');
assert.strictEqual(report.teamTimeline[0].metricQuality,'INDISPONIBLE','missing confidence must stay unavailable at frame/team level');
assert.strictEqual(report.teamTimeline[1].metricEvidenceScore,.8,'explicit confidence remains measurable');
assert.strictEqual(report.teamTimeline[1].metricQuality,'FIABLE');
assert.strictEqual(report.teamTimeline[2].metricEvidenceScore,0,'unvalidated projection remains unavailable');
assert.strictEqual(report.teamCoverage.metricEvidenceScore,+((2*.8)/6).toFixed(4),'team evidence score must include missing-confidence player slots as zero evidence');
assert.strictEqual(report.teamCoverage.metricAverageCalibrationConfidence,+((2*.8)/5).toFixed(4),'average calibration confidence must not assume 1 for missing values');
assert.strictEqual(report.teamCoverage.metricQuality,'PARTIEL');
assert.strictEqual(report.team.metricAverageCalibrationConfidence,+((2*.8)/5).toFixed(4));

console.log('team metric missing confidence non-regression: PASS');
