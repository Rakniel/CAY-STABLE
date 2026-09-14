const assert=require('assert');
const Pipeline=require('../roster_metric_pipeline_v1.js');
const Publication=require('../metric_publication_guard_v1.js');

// Continuous speed evidence must come from the same participation windows that
// carry positive metric coverage. A diagnostic/uncovered window must never
// unlock avg speed, sprints or max-speed publication for another window.
const rows=[
  {
    eligibleSeconds:4,
    metricCoveredSeconds:4,
    distanceM:4,
    maxSpeedKmh:10,
    sprintCount:0,
    sprintQualifiedSeconds:0,
    avgCalibrationConfidence:.95,
    speedSamples:[{time:0,segment:0,kmh:3.6}]
  },
  {
    eligibleSeconds:0,
    metricCoveredSeconds:0,
    distanceM:0,
    maxSpeedKmh:99,
    sprintCount:null,
    sprintQualifiedSeconds:null,
    avgCalibrationConfidence:null,
    speedSamples:[
      {time:0,segment:0,kmh:3.6},
      {time:1,segment:0,kmh:3.6},
      {time:2,segment:0,kmh:3.6},
      {time:3,segment:0,kmh:3.6},
      {time:4,segment:0,kmh:3.6}
    ]
  }
];

const aggregate=Pipeline.aggregateMetrics(rows);
assert.strictEqual(aggregate.speedSamples.length,1,'uncovered-window speed samples must not enter aggregate evidence');
assert.ok(String(aggregate.speedSamples[0].segment).startsWith('window:0:'),'covered sample keeps its original participation-window namespace');
assert.ok(String(aggregate.speedSamplePolicy||'').includes('COUVERTURE_METRIQUE_POSITIVE'));

const safe=Publication.applyPublicationPolicy(aggregate,{identityQuality:'FIABLE'});
assert.strictEqual(safe.avgSpeedKmh,null,'one covered speed sample is insufficient continuous evidence, so avg speed must stay unavailable');
assert.strictEqual(safe.sprintCount,null,'sprints must stay unavailable when speed continuity is not defended by a covered window');
assert.strictEqual(safe.maxSpeedKmh,null,'max speed must stay unavailable when sustained speed evidence is not defended by a covered window');

// Recreate the previous aggregation behavior to prove the regression impact:
// adding the five samples from the uncovered window supplied four seconds of
// artificial continuity and unlocked physical fields.
const legacySpeedSamples=rows.flatMap((row,windowIndex)=>(Array.isArray(row.speedSamples)?row.speedSamples:[]).map(sample=>({...sample,segment:`window:${windowIndex}:${String(sample.segment)}`})));
const legacy=Publication.applyPublicationPolicy({...aggregate,speedSamples:legacySpeedSamples},{identityQuality:'FIABLE'});
assert.strictEqual(legacy.avgSpeedKmh,3.6,'legacy contamination reproduces the falsely publishable average speed');
assert.strictEqual(legacy.sprintCount,0,'legacy contamination reproduces falsely publishable sprint evidence');
assert.ok(legacy.maxSpeedKmh!==null,'legacy contamination reproduces a falsely publishable sustained max speed');

console.log('aggregate_speed_sample_evidence_coupling_nonregression: ok');