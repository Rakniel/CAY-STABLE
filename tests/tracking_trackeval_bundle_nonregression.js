const assert=require('assert');
const api=require('../tracking_trackeval_bundle_v1.js');

const tracker='1,7,10,20,30,40,0.9,-1,-1,-1\n2,7,12,20,30,40,0.8,-1,-1,-1\n';
const gt='1,7,10,20,30,40,1,-1,-1,-1\n2,7,12,20,30,40,1,-1,-1,-1\n';

{
  const ini=api.createSeqInfo({sequenceName:'CAY_TEST_01',width:1920,height:1080,frameRate:25,frameCount:250});
  assert(ini.includes('name=CAY_TEST_01'));
  assert(ini.includes('frameRate=25'));
  assert(ini.includes('seqLength=250'));
}
{
  const valid=api.validateMotRows(tracker);
  assert.strictEqual(valid.valid,true);
  assert.strictEqual(valid.rows,2);
  const invalid=api.validateMotRows('1,2,3\n');
  assert.strictEqual(invalid.valid,false);
  assert.strictEqual(invalid.errors[0].reason,'column_count');
}
{
  const invalidGt=api.validateMotRows('1,7,10,20,30,40,0.5,-1,-1,-1\n',{requireGroundTruth:true});
  assert.strictEqual(invalidGt.valid,false);
  assert.strictEqual(invalidGt.errors[0].reason,'ground_truth_confidence_must_be_1');
}
{
  const bundle=api.createBundle({benchmark:'CAY',split:'validation',sequenceName:'SARCELLES_AUBERVILLIERS',trackerName:'CAY-STABLE',width:1920,height:1080,frameRate:25,frameCount:1000,trackerText:tracker,groundTruthText:gt});
  assert.strictEqual(bundle.format,'TRACKEVAL_MOTCHALLENGE_BUNDLE_V1');
  assert.strictEqual(bundle.recommendedArgs.DO_PREPROC,false);
  assert.deepStrictEqual(bundle.recommendedMetrics,['HOTA','Identity','CLEAR']);
  assert(bundle.files['data/gt/mot_challenge/CAY-validation/SARCELLES_AUBERVILLIERS/seqinfo.ini']);
  assert.strictEqual(bundle.files['data/gt/mot_challenge/CAY-validation/SARCELLES_AUBERVILLIERS/gt/gt.txt'],gt);
  assert.strictEqual(bundle.files['data/trackers/mot_challenge/CAY-validation/CAY-STABLE/data/SARCELLES_AUBERVILLIERS.txt'],tracker);
}
{
  assert.throws(()=>api.createBundle({benchmark:'CAY',split:'validation',sequenceName:'bad/name',width:1,height:1,frameRate:1,frameCount:1,trackerText:tracker,groundTruthText:gt}),/INVALID_SEQUENCE_NAME/);
  assert.throws(()=>api.createBundle({benchmark:'CAY',split:'validation',sequenceName:'TEST',width:1,height:1,frameRate:1,frameCount:1,trackerText:'1,2,3\n',groundTruthText:gt}),/INVALID_TRACKER_MOT_ROWS/);
}
console.log('tracking_trackeval_bundle_nonregression: OK');